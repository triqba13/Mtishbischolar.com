import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl) {
      return NextResponse.json(
        { success: false, error: "Server configuration missing: NEXT_PUBLIC_SUPABASE_URL" },
        { status: 500 }
      );
    }

    if (!supabaseServiceKey) {
      return NextResponse.json(
        { success: false, error: "Server configuration missing: SUPABASE_SERVICE_ROLE_KEY" },
        { status: 500 }
      );
    }

    // 1. Authenticate user strictly from verified session (cookie or Authorization header)
    let authenticatedUserId: string | null = null;

    try {
      const serverClient = await createServerClient();
      const {
        data: { user },
      } = await serverClient.auth.getUser();
      if (user?.id) {
        authenticatedUserId = user.id;
      }
    } catch {
      // Ignore cookie parsing error and check Authorization header
    }

    if (!authenticatedUserId) {
      const authHeader = req.headers.get("Authorization");
      if (authHeader?.startsWith("Bearer ")) {
        const token = authHeader.replace("Bearer ", "").trim();
        if (token && supabaseAnonKey) {
          const clientWithToken = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
            global: { headers: { Authorization: `Bearer ${token}` } },
          });
          const {
            data: { user },
          } = await clientWithToken.auth.getUser();
          if (user?.id) {
            authenticatedUserId = user.id;
          }
        }
      }
    }

    if (!authenticatedUserId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Active officer session required." },
        { status: 401 }
      );
    }

    // 2. Create privileged service-role admin client
    const adminClient = createSupabaseClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // 3. Verify user's role in public.profiles (Must be finance_officer or super_admin)
    const { data: profile, error: profileErr } = await adminClient
      .from("profiles")
      .select("id, role, first_name, last_name, email")
      .eq("id", authenticatedUserId)
      .single();

    if (profileErr || !profile) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Profile record not found." },
        { status: 403 }
      );
    }

    const normalizedRole = (profile.role || "").trim().toLowerCase();

    if (normalizedRole !== "finance_officer") {
      if (normalizedRole === "super_admin") {
        return NextResponse.json(
          {
            success: false,
            error:
              "Forbidden: Only Finance Officers are authorized to approve or reject payments. Super Admins have read-only audit access.",
          },
          { status: 403 }
        );
      }
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden: Only authorized Finance Officers can approve or reject payments.",
        },
        { status: 403 }
      );
    }

    // 4. Parse request body
    const body = await req.json().catch(() => ({}));
    const { paymentId, action, rejectionReason } = body;

    if (!paymentId || typeof paymentId !== "string") {
      return NextResponse.json(
        { success: false, error: "Invalid or missing paymentId." },
        { status: 400 }
      );
    }

    if (action !== "approve" && action !== "reject") {
      return NextResponse.json(
        { success: false, error: "Invalid action. Must be 'approve' or 'reject'." },
        { status: 400 }
      );
    }

    if (action === "reject" && (!rejectionReason || !rejectionReason.trim())) {
      return NextResponse.json(
        { success: false, error: "Rejection reason is required when rejecting a payment." },
        { status: 400 }
      );
    }

    // 5. Fetch target payment
    const { data: targetPayment, error: fetchPayErr } = await adminClient
      .from("payments")
      .select("*")
      .eq("id", paymentId)
      .single();

    if (fetchPayErr || !targetPayment) {
      return NextResponse.json(
        { success: false, error: "Payment record not found." },
        { status: 404 }
      );
    }

    const now = new Date().toISOString();
    const officerName =
      [profile.first_name, profile.last_name].filter(Boolean).join(" ") ||
      profile.email;

    if (action === "approve") {
      // 6a. Update payment status to Approved
      const { data: updatedPayment, error: updateErr } = await adminClient
        .from("payments")
        .update({
          status: "Approved",
          verified_by: authenticatedUserId,
          verified_at: now,
          rejection_reason: null,
        })
        .eq("id", paymentId)
        .select()
        .single();

      if (updateErr) {
        console.error("[FinancePaymentAction] Update error:", updateErr);
        return NextResponse.json(
          { success: false, error: updateErr.message },
          { status: 500 }
        );
      }

      // 6b. Record audit log
      try {
        await adminClient.from("audit_logs").insert({
          user_id: authenticatedUserId,
          action: "payment_approved",
          target_type: "payment",
          target_id: paymentId,
          details: {
            amount: targetPayment.amount,
            currency: targetPayment.currency,
            student_id: targetPayment.student_id,
            payment_method: targetPayment.payment_method,
            transaction_ref: targetPayment.transaction_ref,
            verified_by_name: officerName,
          },
        });
      } catch (auditErr) {
        console.error("[FinancePaymentAction] Audit log warning:", auditErr);
      }

      // 6c. Send notification to student
      try {
        await adminClient.from("notifications").insert({
          user_id: targetPayment.student_id,
          title: "Payment Approved",
          message:
            "Your MtishbiScholar Application File Opening Fee (TSh 50,000) has been approved. You may now apply to partner universities.",
          type: "payment",
          is_read: false,
        });
      } catch (notifErr) {
        console.error("[FinancePaymentAction] Notification warning:", notifErr);
      }

      return NextResponse.json({
        success: true,
        message: "Payment successfully approved.",
        payment: updatedPayment,
      });
    } else {
      // 7a. Update payment status to Rejected
      const cleanReason = rejectionReason.trim();
      const { data: updatedPayment, error: updateErr } = await adminClient
        .from("payments")
        .update({
          status: "Rejected",
          rejection_reason: cleanReason,
          verified_by: authenticatedUserId,
          verified_at: now,
        })
        .eq("id", paymentId)
        .select()
        .single();

      if (updateErr) {
        console.error("[FinancePaymentAction] Rejection error:", updateErr);
        return NextResponse.json(
          { success: false, error: updateErr.message },
          { status: 500 }
        );
      }

      // 7b. Record audit log
      try {
        await adminClient.from("audit_logs").insert({
          user_id: authenticatedUserId,
          action: "payment_rejected",
          target_type: "payment",
          target_id: paymentId,
          details: {
            reason: cleanReason,
            student_id: targetPayment.student_id,
            payment_method: targetPayment.payment_method,
            transaction_ref: targetPayment.transaction_ref,
            verified_by_name: officerName,
          },
        });
      } catch (auditErr) {
        console.error("[FinancePaymentAction] Audit log warning:", auditErr);
      }

      // 7c. Send notification to student
      try {
        await adminClient.from("notifications").insert({
          user_id: targetPayment.student_id,
          title: "Payment Verification Rejected",
          message: `Your payment verification was rejected: ${cleanReason}. Please re-submit your receipt or contact support.`,
          type: "payment",
          is_read: false,
        });
      } catch (notifErr) {
        console.error("[FinancePaymentAction] Notification warning:", notifErr);
      }

      return NextResponse.json({
        success: true,
        message: "Payment rejected.",
        payment: updatedPayment,
      });
    }
  } catch (err: any) {
    console.error("[FinancePaymentAction] Unexpected error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
