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
      // Ignore cookie parsing error and check Authorization header fallback
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
          error: "Forbidden: Only Finance Officers or Super Admins can access financial records.",
        },
        { status: 403 }
      );
    }

    // 4. Parse query parameters for server-side pagination, search, and filtering
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") || "10", 10) || 10));
    const status = (searchParams.get("status") || "all").trim();
    const paymentMethod = (searchParams.get("paymentMethod") || "all").trim();
    const search = (searchParams.get("search") || "").trim().slice(0, 100);
    const dateRange = (searchParams.get("dateRange") || "all").trim().toLowerCase();
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // 5. Execute parallel database head count & aggregation queries
    const [
      { count: allCount },
      { count: pendingCount },
      { count: approvedCount },
      { count: rejectedCount },
      { count: passportCount },
      { data: approvedRows },
    ] = await Promise.all([
      adminClient.from("payments").select("*", { count: "exact", head: true }),
      adminClient
        .from("payments")
        .select("*", { count: "exact", head: true })
        .in("status", ["Pending", "Submitted", "Under Review"]),
      adminClient
        .from("payments")
        .select("*", { count: "exact", head: true })
        .eq("status", "Approved"),
      adminClient
        .from("payments")
        .select("*", { count: "exact", head: true })
        .eq("status", "Rejected"),
      adminClient
        .from("payments")
        .select("*", { count: "exact", head: true })
        .eq("payment_type", "passport_assistance"),
      adminClient
        .from("payments")
        .select("amount")
        .eq("status", "Approved"),
    ]);

    const approvedAmount = (approvedRows || []).reduce(
      (sum, p) => sum + (Number(p.amount) || 0),
      0
    );

    // 6. Build the paginated and filtered payments query
    let query = adminClient
      .from("payments")
      .select(
        "id, student_id, application_id, amount, currency, payment_method, transaction_ref, payment_proof_url, payment_type, status, verified_by, verified_at, rejection_reason, created_at, student:profiles!payments_student_id_fkey(id, first_name, last_name, email, phone)",
        { count: "exact" }
      );

    // 6A. Search Filter (Database-side search across profiles and transaction_ref)
    if (search) {
      const { data: matchedProfiles } = await adminClient
        .from("profiles")
        .select("id")
        .or(
          `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`
        )
        .limit(100);

      const matchedStudentIds = (matchedProfiles || []).map((p) => p.id).filter(Boolean);

      if (matchedStudentIds.length > 0) {
        query = query.or(
          `transaction_ref.ilike.%${search}%,student_id.in.(${matchedStudentIds.join(",")})`
        );
      } else {
        query = query.ilike("transaction_ref", `%${search}%`);
      }
    }

    // 6B. Status Filter
    if (status && status.toLowerCase() !== "all") {
      const lowerStatus = status.toLowerCase();
      if (lowerStatus === "pending") {
        query = query.in("status", ["Pending", "Submitted", "Under Review"]);
      } else if (lowerStatus === "approved") {
        query = query.eq("status", "Approved");
      } else if (lowerStatus === "rejected") {
        query = query.eq("status", "Rejected");
      } else {
        query = query.eq("status", status);
      }
    }

    // 6C. Payment Method Filter
    if (paymentMethod && paymentMethod.toLowerCase() !== "all") {
      query = query.eq("payment_method", paymentMethod);
    }

    // 6D. Date Range Filter
    if (dateRange && dateRange !== "all") {
      const now = new Date();
      if (dateRange === "today") {
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        query = query.gte("created_at", startOfDay);
      } else if (dateRange === "week") {
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
        query = query.gte("created_at", oneWeekAgo);
      } else if (dateRange === "month") {
        const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
        query = query.gte("created_at", oneMonthAgo);
      }
    } else if (dateFrom || dateTo) {
      if (dateFrom) query = query.gte("created_at", dateFrom);
      if (dateTo) query = query.lte("created_at", dateTo);
    }

    // 6E. Sorting and Range Pagination
    query = query.order("created_at", { ascending: false }).range(from, to);

    const { data: payments, count: totalCount, error: payError } = await query;

    if (payError) {
      console.error("Finance Payments Supabase Error:", {
        message: payError.message,
        details: payError.details,
        hint: payError.hint,
        code: payError.code,
      });
      return NextResponse.json(
        {
          success: false,
          error: payError.message || "Database error retrieving payments.",
          details: payError.details,
          hint: payError.hint,
          code: payError.code,
        },
        { status: 500 }
      );
    }

    const verifiedByIds = Array.from(
      new Set(
        (payments || [])
          .map((p: any) => p.verified_by)
          .filter(Boolean)
      )
    );

    const officerMap = new Map<string, string>();
    if (verifiedByIds.length > 0) {
      try {
        const { data: officers } = await adminClient
          .from("profiles")
          .select("id, first_name, last_name, email")
          .in("id", verifiedByIds);

        (officers || []).forEach((off: any) => {
          const name = [off.first_name, off.last_name].filter(Boolean).join(" ");
          officerMap.set(off.id, name || off.email || "Finance Officer");
        });
      } catch (officerErr) {
        console.warn("[FinancePayments] Officer profile fetch warning:", officerErr);
      }
    }

    const mappedPayments = (payments || []).map((p: any) => ({
      ...p,
      verified_by_name: p.verified_by ? officerMap.get(p.verified_by) || "Finance Officer" : null,
      payment_type: p.payment_type || (Number(p.amount) === 300000 ? "passport_assistance" : "file_opening_fee"),
      purpose_display:
        p.payment_type === "passport_assistance" || Number(p.amount) === 300000
          ? "Passport Assistance Fee"
          : "MtishbiScholar File Opening Fee",
    }));

    const total = totalCount || 0;
    const totalPages = Math.ceil(total / pageSize) || 1;

    return NextResponse.json({
      success: true,
      data: mappedPayments,
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      counts: {
        all: allCount || 0,
        pending: pendingCount || 0,
        approved: approvedCount || 0,
        rejected: rejectedCount || 0,
        passport: passportCount || 0,
        approvedAmount: approvedAmount || 0,
      },
      metrics: {
        approvedAmount: approvedAmount || 0,
      },
    });
  } catch (err: any) {
    console.error("Finance Payments Route Error:", {
      message: err?.message,
      details: err?.details,
      hint: err?.hint,
      code: err?.code,
    });
    return NextResponse.json(
      {
        success: false,
        error: err.message || "Failed to load payments.",
        details: err?.details || null,
      },
      { status: 500 }
    );
  }
}
