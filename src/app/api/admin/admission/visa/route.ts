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
          console.warn("[VisaAPI] Bearer auth error:", tokenErr);
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

    // 3. Visibility Rule: Only fetch applications from students with Approved payment
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

    // 4. Fetch all applications
    const { data: appData, error: appErr } = await adminClient
      .from("applications")
      .select(
        `
        id,
        student_id,
        university_id,
        course_id,
        target_country,
        preferred_course,
        status,
        created_at,
        profiles:student_id (
          id,
          first_name,
          last_name,
          email,
          has_passport,
          passport_number
        )
      `
      )
      .in("student_id", approvedStudentIds)
      .order("created_at", { ascending: false });

    if (appErr) {
      return NextResponse.json({ success: false, error: appErr.message }, { status: 500 });
    }

    const requests = (appData || []).map((app: any) => {
      const studentObj = Array.isArray(app.profiles) ? app.profiles[0] : app.profiles;
      const studentName = studentObj
        ? `${studentObj.first_name || ""} ${studentObj.last_name || ""}`.trim() || studentObj.email || "Student"
        : "Student";

      const hasPassport = studentObj?.has_passport === "Yes" || !!studentObj?.passport_number;
      const prerequisite = hasPassport ? "complete" : "incomplete";

      let status = "Pending";
      if (app.status === "Visa Approved" || app.status === "Completed") {
        status = "Completed";
      } else if (app.status === "Visa Processing" || app.status === "Submitted to University") {
        status = "Processing";
      }

      const dateStr = app.created_at
        ? new Date(app.created_at).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })
        : "Recent";

      return {
        id: app.id,
        appId: `APP-${app.id.slice(0, 6).toUpperCase()}`,
        student: studentName,
        studentEmail: studentObj?.email,
        prerequisite,
        status,
        requestedOn: dateStr,
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
    console.error("[VisaAPI] Error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
