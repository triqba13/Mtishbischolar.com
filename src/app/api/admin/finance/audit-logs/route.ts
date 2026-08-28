import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { success: false, error: "Server configuration missing." },
        { status: 500 }
      );
    }

    // 1. Authenticate user from session (cookie or Authorization header)
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
      .maybeSingle();

    if (profileErr || !profile) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Profile record not found." },
        { status: 403 }
      );
    }

    const normalizedRole = (profile.role || "").trim().toLowerCase();
    const isFinanceOrSuperAdmin =
      normalizedRole === "finance_officer" || normalizedRole === "super_admin";

    if (!isFinanceOrSuperAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden: Only Finance Officers or Super Admins can access financial audit logs.",
        },
        { status: 403 }
      );
    }

    // 4. Query audit logs strictly for Finance actions
    // Finance actions are PAYMENT_APPROVED and PAYMENT_REJECTED (and lowercase variants)
    const { data: logs, error: logsErr } = await adminClient
      .from("audit_logs")
      .select(`
        id,
        user_id,
        action,
        target_type,
        target_id,
        details,
        created_at,
        officer:profiles!audit_logs_user_id_fkey(id, first_name, last_name, email, role)
      `)
      .in("action", [
        "payment_approved",
        "payment_rejected",
        "PAYMENT_APPROVED",
        "PAYMENT_REJECTED",
      ])
      .order("created_at", { ascending: false });

    if (logsErr) {
      console.error("[FinanceAuditLogsAPI] Query error:", logsErr);
      return NextResponse.json(
        { success: false, error: "Failed to fetch financial audit logs." },
        { status: 500 }
      );
    }

    // 5. Collect student IDs and payment IDs to enrich audit records
    const studentIds = new Set<string>();
    const paymentIds = new Set<string>();

    (logs || []).forEach((l: any) => {
      if (l.details?.student_id) studentIds.add(l.details.student_id);
      if (l.target_id && (l.target_type || "").toLowerCase() === "payment") {
        paymentIds.add(l.target_id);
      }
    });

    // Fetch student profiles for human-readable names
    let profileMap = new Map<string, any>();
    if (studentIds.size > 0) {
      const { data: profiles } = await adminClient
        .from("profiles")
        .select("id, first_name, last_name, email")
        .in("id", Array.from(studentIds));

      profileMap = new Map((profiles || []).map((p) => [p.id, p]));
    }

    // Fetch payments to ensure payment_type, amount, currency are always accurate
    let paymentMap = new Map<string, any>();
    if (paymentIds.size > 0) {
      const { data: payments } = await adminClient
        .from("payments")
        .select("id, student_id, payment_type, amount, currency, transaction_ref, status, payment_method")
        .in("id", Array.from(paymentIds));

      paymentMap = new Map((payments || []).map((p) => [p.id, p]));
    }

    // 6. Enrich logs with resolved student name, payment type, amounts, etc.
    const enrichedLogs = (logs || []).map((l: any) => {
      const payment = l.target_id ? paymentMap.get(l.target_id) : null;
      const studentId = l.details?.student_id || payment?.student_id;
      const student = studentId ? profileMap.get(studentId) : null;

      const paymentType =
        l.details?.payment_type || payment?.payment_type || "file_opening_fee";
      const amount =
        Number(l.details?.amount) || Number(payment?.amount) || (paymentType === "passport_assistance" ? 300000 : 50000);
      const currency = l.details?.currency || payment?.currency || "TZS";
      const transactionRef =
        l.details?.transaction_ref !== undefined
          ? l.details.transaction_ref
          : payment?.transaction_ref || null;
      const paymentMethod =
        l.details?.payment_method || payment?.payment_method || "Mobile Money";

      const previousStatus =
        l.details?.previous_status || "Pending";
      const newStatus =
        l.details?.new_status ||
        (l.action.toLowerCase().includes("approve") ? "Approved" : "Rejected");

      const reason = l.details?.reason || null;

      return {
        ...l,
        student: student
          ? {
              id: student.id,
              first_name: student.first_name,
              last_name: student.last_name,
              email: student.email,
              full_name:
                [student.first_name, student.last_name].filter(Boolean).join(" ") ||
                student.email ||
                "Student",
            }
          : null,
        resolved_payment_type: paymentType,
        resolved_amount: amount,
        resolved_currency: currency,
        resolved_transaction_ref: transactionRef,
        resolved_payment_method: paymentMethod,
        resolved_previous_status: previousStatus,
        resolved_new_status: newStatus,
        resolved_reason: reason,
      };
    });

    return NextResponse.json({
      success: true,
      data: enrichedLogs,
      total: enrichedLogs.length,
    });
  } catch (err: any) {
    console.error("[FinanceAuditLogsAPI] Unexpected error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
