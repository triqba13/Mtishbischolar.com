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
          console.warn("[ApplicationsAPI] Bearer auth error:", tokenErr);
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

    // 2. Privileged admin client to verify role
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
        applications: [],
        universities: ["All Universities"],
        counts: {
          "All Applications": 0,
          "New": 0,
          "Ready for Review": 0,
          "Documents Pending": 0,
          "University Processing": 0,
          "University Approved": 0,
          "Visa Processing": 0,
          "Completed": 0,
        },
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
        target_intake,
        status,
        created_at,
        updated_at,
        profiles:student_id (
          id,
          first_name,
          last_name,
          email,
          phone
        ),
        universities:university_id (
          id,
          name,
          country
        ),
        courses:course_id (
          id,
          title
        )
      `
      )
      .in("student_id", approvedStudentIds)
      .order("created_at", { ascending: false });

    if (appErr) {
      return NextResponse.json({ success: false, error: appErr.message }, { status: 500 });
    }

    const applications = (appData || []).map((app: any) => {
      const studentObj = Array.isArray(app.profiles) ? app.profiles[0] : app.profiles;
      const uniObj = Array.isArray(app.universities) ? app.universities[0] : app.universities;
      const courseObj = Array.isArray(app.courses) ? app.courses[0] : app.courses;

      const studentName = studentObj
        ? `${studentObj.first_name || ""} ${studentObj.last_name || ""}`.trim() || studentObj.email || "Student"
        : "Student";
      const studentEmail = studentObj?.email || "";

      const uniName = uniObj?.name || (app.target_country ? `University (${app.target_country})` : "Partner University");
      const courseName = courseObj?.title || app.preferred_course || "Undergraduate Degree";

      const dateStr = app.created_at
        ? new Date(app.created_at).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })
        : "Recent";

      return {
        id: app.id,
        displayId: `APP-${app.id.slice(0, 6).toUpperCase()}`,
        student: studentName,
        studentEmail,
        university: uniName,
        course: courseName,
        status: app.status || "Under Review",
        submitted: dateStr,
        created_at: app.created_at,
      };
    });

    const uniSet = new Set<string>();
    applications.forEach((a) => {
      if (a.university) uniSet.add(a.university);
    });

    // Counts per tab
    const counts = {
      "All Applications": applications.length,
      "New": applications.filter((a) => ["Profile Completed", "New", "Submitted"].includes(a.status)).length,
      "Ready for Review": applications.filter((a) => ["Ready for Review", "Under Review"].includes(a.status)).length,
      "Documents Pending": applications.filter((a) => ["Documents Pending", "Replacement Requested"].includes(a.status)).length,
      "University Processing": applications.filter((a) => ["Submitted to University", "University Processing"].includes(a.status)).length,
      "University Approved": applications.filter((a) => ["University Approved", "Offer Received"].includes(a.status)).length,
      "Visa Processing": applications.filter((a) => ["Visa Processing", "Visa Approved"].includes(a.status)).length,
      "Completed": applications.filter((a) => ["Completed", "Visa Approved"].includes(a.status)).length,
    };

    return NextResponse.json({
      success: true,
      applications,
      universities: ["All Universities", ...Array.from(uniSet)],
      counts,
    });
  } catch (err: any) {
    console.error("[ApplicationsAPI] Error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
