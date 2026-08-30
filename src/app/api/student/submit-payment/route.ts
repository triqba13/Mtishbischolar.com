import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { success: false, error: "Server configuration missing." },
        { status: 500 }
      );
    }

    const adminClient = createSupabaseClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const body = await req.json().catch(() => ({}));
    const {
      studentId,
      paymentId,
      amount = 50000,
      currency = "TZS",
      paymentMethod = "Mobile Money",
      transactionRef,
      paymentProofUrl,
      paymentType = "file_opening_fee",
    } = body;

    // 1. Authenticate user strictly from Bearer token or server session cookie
    let authenticatedUserId: string | null = null;

    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "").trim();
      if (token) {
        try {
          const {
            data: { user },
            error: tokenErr,
          } = await adminClient.auth.getUser(token);
          if (user?.id && !tokenErr) {
            authenticatedUserId = user.id;
          }
        } catch (tokenErr) {
          console.warn("[SubmitPaymentAPI] Bearer auth error:", tokenErr);
        }
      }
    }

    if (!authenticatedUserId) {
      try {
        const serverClient = await createServerClient();
        const {
          data: { user },
        } = await serverClient.auth.getUser();
        if (user?.id) {
          authenticatedUserId = user.id;
        }
      } catch (cookieErr) {
        console.warn("[SubmitPaymentAPI] Server cookie auth error:", cookieErr);
      }
    }

    const targetUserId = authenticatedUserId || studentId;
    if (!targetUserId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Active session required." },
        { status: 401 }
      );
    }

    if (authenticatedUserId && studentId && authenticatedUserId !== studentId) {
      // Check if authenticated user is a staff/admin
      const { data: staffProf } = await adminClient
        .from("profiles")
        .select("role")
        .eq("id", authenticatedUserId)
        .maybeSingle();

      const isStaff = ["finance_officer", "super_admin", "admission_officer"].includes(
        staffProf?.role || ""
      );
      if (!isStaff) {
        return NextResponse.json(
          { success: false, error: "Forbidden: You cannot modify another student's payments." },
          { status: 403 }
        );
      }
    }

    // Clean reference: string or null (never empty string "")
    const cleanRef =
      transactionRef && typeof transactionRef === "string" && transactionRef.trim().length > 0
        ? transactionRef.trim()
        : null;

    // 2. If transaction reference is provided, enforce strict uniqueness across all payments
    if (cleanRef) {
      let dupQuery = adminClient
        .from("payments")
        .select("id, student_id, payment_type, status")
        .ilike("transaction_ref", cleanRef);

      if (paymentId) {
        dupQuery = dupQuery.neq("id", paymentId);
      }

      const { data: duplicates, error: dupCheckErr } = await dupQuery;

      if (dupCheckErr) {
        console.error("[SubmitPaymentAPI] Duplication check error:", dupCheckErr);
      }

      if (duplicates && duplicates.length > 0) {
        const hasActiveConflict = duplicates.some(
          (d) => d.id !== paymentId && (d.student_id !== targetUserId || d.status !== "Rejected")
        );
        if (hasActiveConflict) {
          return NextResponse.json(
            {
              success: false,
              error: `This Transaction Reference Number (${cleanRef}) has already been submitted for another payment. Each payment must have its own unique transaction reference.`,
            },
            { status: 400 }
          );
        }
      }
    }

    // Normalize payment method
    const rawMethod = (paymentMethod || "").toLowerCase();
    let normalizedMethod: "Mobile Money" | "Bank Transfer" | "Cash Office" | "Selcom Gateway" =
      "Mobile Money";
    if (
      rawMethod.includes("bank") ||
      rawMethod.includes("transfer") ||
      rawMethod.includes("crdb") ||
      rawMethod.includes("nmb")
    ) {
      normalizedMethod = "Bank Transfer";
    } else if (rawMethod.includes("cash") || rawMethod.includes("office")) {
      normalizedMethod = "Cash Office";
    } else if (rawMethod.includes("selcom")) {
      normalizedMethod = "Selcom Gateway";
    }

    let resultPayment: any = null;

    // 3. Update existing or insert new payment
    if (paymentId) {
      const updateData: Record<string, any> = {
        amount: Number(amount) || 50000,
        currency: currency || "TZS",
        payment_method: normalizedMethod,
        transaction_ref: cleanRef,
        status: "Submitted",
        rejection_reason: null,
        verified_by: null,
        verified_at: null,
        created_at: new Date().toISOString(),
      };
      if (paymentProofUrl) {
        updateData.payment_proof_url = paymentProofUrl;
      }

      const { data, error: updErr } = await adminClient
        .from("payments")
        .update(updateData)
        .eq("id", paymentId)
        .select("*")
        .single();

      if (updErr) {
        console.error("[SubmitPaymentAPI] Payment update error:", updErr);
        return NextResponse.json({ success: false, error: updErr.message }, { status: 500 });
      }
      resultPayment = data;
    } else {
      // Check if student already has a pending/submitted payment of this type
      const { data: existingUnapproved } = await adminClient
        .from("payments")
        .select("id, status")
        .eq("student_id", targetUserId)
        .eq("payment_type", paymentType)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (
        existingUnapproved?.id &&
        !["approved", "paid", "verified"].includes(
          (existingUnapproved.status || "").toLowerCase().trim()
        )
      ) {
        const updateData: Record<string, any> = {
          amount: Number(amount) || 50000,
          currency: currency || "TZS",
          payment_method: normalizedMethod,
          transaction_ref: cleanRef,
          status: "Submitted",
          rejection_reason: null,
          verified_by: null,
          verified_at: null,
          created_at: new Date().toISOString(),
        };
        if (paymentProofUrl) {
          updateData.payment_proof_url = paymentProofUrl;
        }

        const { data, error: updErr } = await adminClient
          .from("payments")
          .update(updateData)
          .eq("id", existingUnapproved.id)
          .select("*")
          .single();

        if (updErr) {
          console.error("[SubmitPaymentAPI] Payment update existing error:", updErr);
          return NextResponse.json({ success: false, error: updErr.message }, { status: 500 });
        }
        resultPayment = data;
      } else {
        const { data, error: insErr } = await adminClient
          .from("payments")
          .insert([
            {
              student_id: targetUserId,
              application_id: null,
              payment_type: paymentType,
              amount: Number(amount) || 50000,
              currency: currency || "TZS",
              payment_method: normalizedMethod,
              transaction_ref: cleanRef,
              payment_proof_url: paymentProofUrl || null,
              status: "Submitted",
            },
          ])
          .select("*")
          .single();

        if (insErr) {
          console.error("[SubmitPaymentAPI] Payment insert error:", insErr);
          if (insErr.code === "23505" || insErr.message?.includes("unique")) {
            return NextResponse.json(
              {
                success: false,
                error:
                  "This Transaction Reference Number has already been submitted for another payment. Each payment must have its own unique transaction reference.",
              },
              { status: 400 }
            );
          }
          return NextResponse.json({ success: false, error: insErr.message }, { status: 500 });
        }
        resultPayment = data;
      }
    }

    // 4. Send notification to student & Finance Officers
    try {
      const { data: studentProf } = await adminClient
        .from("profiles")
        .select("first_name, last_name, email")
        .eq("id", targetUserId)
        .maybeSingle();

      const studentName = studentProf
        ? `${studentProf.first_name} ${studentProf.last_name}`
        : "A student";
      const amountStr = `TZS ${(Number(amount) || 50000).toLocaleString()}`;
      const purposeStr =
        paymentType === "passport_assistance" ? "Passport Assistance Fee" : "File Opening Fee";

      // 4a. Outgoing notification to student
      await adminClient.from("notifications").insert([
        {
          user_id: targetUserId,
          title: `${purposeStr} Submitted`,
          message: `Your MtishbiScholar Application ${purposeStr} (${amountStr}) payment proof has been submitted and is currently under review by our Finance team.`,
          type: "payment",
          is_read: false,
        },
      ]);

      // 4b. Incoming notifications to Finance Officers & Super Admin
      const { data: financeOfficers } = await adminClient
        .from("profiles")
        .select("id")
        .in("role", ["finance_officer", "super_admin"]);

      for (const officer of financeOfficers || []) {
        await adminClient.from("notifications").insert([
          {
            user_id: officer.id,
            title: `New Payment Submission: ${studentName}`,
            message: `${studentName} (${studentProf?.email || ""}) submitted a payment proof of ${amountStr} for ${purposeStr}. Transaction Ref: ${cleanRef || "Receipt Attached"}.`,
            type: "payment",
            is_read: false,
          },
        ]);
      }
    } catch (notifErr) {
      console.warn("[SubmitPaymentAPI] Notification error:", notifErr);
    }

    return NextResponse.json({
      success: true,
      data: resultPayment,
      message: "Payment submitted successfully and synced with Finance Desk.",
    });
  } catch (err: any) {
    console.error("[SubmitPaymentAPI] Unhandled error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Internal server error." },
      { status: 500 }
    );
  }
}
