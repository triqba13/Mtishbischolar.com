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
          console.warn("[StudentsAPI] Bearer auth error:", tokenErr);
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

    // 3. Visibility Rule: Only fetch students with Approved file-opening payment
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
        students: [],
      });
    }

    // 4. Fetch student profiles
    const { data: studentProfiles, error: profErr } = await adminClient
      .from("profiles")
      .select("id, first_name, middle_name, last_name, email, phone, created_at, is_profile_completed")
      .eq("role", "student")
      .in("id", approvedStudentIds)
      .order("created_at", { ascending: false });

    if (profErr) {
      return NextResponse.json({ success: false, error: profErr.message }, { status: 500 });
    }

    // 5. Fetch application counts for these students
    const { data: allApplications } = await adminClient
      .from("applications")
      .select("id, student_id")
      .in("student_id", approvedStudentIds);

    const students = (studentProfiles || []).map((sp) => {
      const fullName = `${sp.first_name || ""} ${sp.middle_name || ""} ${sp.last_name || ""}`.trim() || sp.email || "Student";
      const appCount = (allApplications || []).filter((a) => a.student_id === sp.id).length;
      const joinedDate = sp.created_at
        ? new Date(sp.created_at).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })
        : "Recently";

      return {
        id: sp.id,
        name: fullName,
        email: sp.email,
        phone: sp.phone || "Not provided",
        applications: appCount,
        joined: joinedDate,
        initial: (fullName.charAt(0) || "S").toUpperCase(),
      };
    });

    return NextResponse.json({
      success: true,
      students,
    });
  } catch (err: any) {
    console.error("[StudentsAPI] Error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
