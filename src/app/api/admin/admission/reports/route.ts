import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ success: false, error: "Server config error" }, { status: 500 });
    }

    // 1. Authenticate user strictly from verified session
    let authenticatedUserId: string | null = null;

    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "").trim();
      if (token && supabaseAnonKey) {
        try {
          const clientWithToken = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
            global: { headers: { Authorization: `Bearer ${token}` } },
          });
          const {
            data: { user },
          } = await clientWithToken.auth.getUser();
          if (user?.id) {
            authenticatedUserId = user.id;
          }
        } catch (tokenErr) {
          console.warn("[ReportsAPI] Bearer auth error:", tokenErr);
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
      } catch {
        // Ignore cookie error
      }
    }

    if (!authenticatedUserId) {
      return NextResponse.json({ success: false, error: "Unauthorized: Session required." }, { status: 401 });
    }

    const adminClient = createSupabaseClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: profile } = await adminClient
      .from("profiles")
      .select("id, role")
      .eq("id", authenticatedUserId)
      .maybeSingle();

    const normalizedRole = (profile?.role || "").trim().toLowerCase();
    if (!["admission_officer", "super_admin"].includes(normalizedRole)) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    // 2. Fetch approved payment students
    const { data: approvedPayments } = await adminClient
      .from("payments")
      .select("student_id")
      .eq("status", "Approved");

    const approvedStudentIds = Array.from(
      new Set((approvedPayments || []).map((p) => p.student_id).filter(Boolean))
    );

    let totalApplications = 0;
    let totalApproved = 0;
    let totalUnderReview = 0;
    let totalUniversities = 0;
    let totalDocuments = 0;
    let verifiedDocuments = 0;
    let totalVisaApproved = 0;

    if (approvedStudentIds.length > 0) {
      const { data: apps } = await adminClient
        .from("applications")
        .select("id, status, university_id")
        .in("student_id", approvedStudentIds);

      totalApplications = (apps || []).length;
      totalApproved = (apps || []).filter((a) =>
        ["Submitted to University", "Visa Approved"].includes(a.status)
      ).length;
      totalUnderReview = (apps || []).filter((a) => a.status === "Under Review").length;
      totalVisaApproved = (apps || []).filter((a) => a.status === "Visa Approved").length;

      const { data: docs } = await adminClient
        .from("documents")
        .select("id, is_verified")
        .in("student_id", approvedStudentIds);

      totalDocuments = (docs || []).length;
      verifiedDocuments = (docs || []).filter((d) => d.is_verified).length;
    }

    const { data: unis } = await adminClient.from("universities").select("id");
    totalUniversities = (unis || []).length;

    return NextResponse.json({
      success: true,
      stats: {
        totalApplications,
        totalApproved,
        totalUnderReview,
        totalUniversities,
        totalDocuments,
        verifiedDocuments,
        totalVisaApproved,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
