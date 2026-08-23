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
          console.warn("[PassportAPI] Bearer auth error:", tokenErr);
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
      return NextResponse.json(
        { success: false, error: "Unauthorized: Active session required." },
        { status: 401 }
      );
    }

    // 2. Privileged admin client
    const adminClient = createSupabaseClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: profile, error: profileErr } = await adminClient
      .from("profiles")
      .select("id, role")
      .eq("id", authenticatedUserId)
      .maybeSingle();

    if (profileErr || !profile) {
      return NextResponse.json(
        { success: false, error: "User profile not found." },
        { status: 401 }
      );
    }

    const normalizedRole = (profile.role || "").trim().toLowerCase();
    if (!["admission_officer", "super_admin"].includes(normalizedRole)) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Access restricted to Admission Officers and Super Admins." },
        { status: 403 }
      );
    }

    // 3. Visibility Rule: Only fetch passport requests for students with Approved payment
    const { data: approvedPayments } = await adminClient
      .from("payments")
      .select("student_id")
      .eq("status", "Approved");

    const approvedStudentIds = Array.from(
      new Set((approvedPayments || []).map((p) => p.student_id).filter(Boolean))
    );

    if (approvedStudentIds.length === 0) {
      return NextResponse.json({
        success: true,
        requests: [],
        counts: { All: 0, Pending: 0, Processing: 0, Completed: 0 },
      });
    }

    // 4. Fetch student profiles with passport status
    const { data: studentsData, error: stuErr } = await adminClient
      .from("profiles")
      .select("id, first_name, last_name, email, phone, has_passport, passport_number, created_at")
      .eq("role", "student")
      .in("id", approvedStudentIds);

    if (stuErr) {
      return NextResponse.json({ success: false, error: stuErr.message }, { status: 500 });
    }

    // Fetch student's latest application ID
    const { data: appData } = await adminClient
      .from("applications")
      .select("id, student_id")
      .in("student_id", approvedStudentIds)
      .order("created_at", { ascending: false });

    const requests = (studentsData || []).map((s: any) => {
      const studentName = `${s.first_name || ""} ${s.last_name || ""}`.trim() || s.email || "Student";
      const app = (appData || []).find((a: any) => a.student_id === s.id);
      const appId = app ? `APP-${app.id.slice(0, 6).toUpperCase()}` : "APP-GENERAL";

      const hasPassportBool = s.has_passport === "Yes" || s.has_passport === "true" || !!s.passport_number;
      let status = hasPassportBool ? "Completed" : "Pending";
      if (s.has_passport === "Assistance Requested") status = "Processing";

      const requestedOn = s.created_at
        ? new Date(s.created_at).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
        : "Recent";

      return {
        id: s.id,
        applicationId: app?.id,
        student: studentName,
        studentEmail: s.email,
        appId,
        hasPassport: hasPassportBool,
        status,
        requestedOn,
      };
    });

    const counts = {
      All: requests.length,
      Pending: requests.filter((r) => r.status === "Pending").length,
      Processing: requests.filter((r) => r.status === "Processing").length,
      Completed: requests.filter((r) => r.status === "Completed").length,
    };

    return NextResponse.json({
      success: true,
      requests,
      counts,
    });
  } catch (err: any) {
    console.error("[PassportAPI] Error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
