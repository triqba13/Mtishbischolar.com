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
          if (user?.id) authenticatedUserId = user.id;
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
        if (user?.id) authenticatedUserId = user.id;
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

    const { data: profile } = await adminClient
      .from("profiles")
      .select("id, role")
      .eq("id", authenticatedUserId)
      .maybeSingle();

    const normalizedRole = (profile?.role || "").trim().toLowerCase();
    if (!["admission_officer", "super_admin"].includes(normalizedRole)) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Access restricted to Admission Officers and Super Admins." },
        { status: 403 }
      );
    }

    // 3. Find students who have a valid, completed passport:
    // A. Students with has_passport = 'Yes' and valid passport_number
    const { data: profilesWithPassport } = await adminClient
      .from("profiles")
      .select("id, passport_number")
      .eq("role", "student")
      .eq("has_passport", "Yes")
      .not("passport_number", "is", null)
      .neq("passport_number", "");

    // B. Students whose passport_assistance is 'completed'
    const { data: completedAssistance } = await adminClient
      .from("passport_assistance")
      .select("student_id")
      .eq("assistance_status", "completed");

    const validPassportStudentIds = Array.from(
      new Set([
        ...(profilesWithPassport || []).map((p) => p.id),
        ...(completedAssistance || []).map((a) => a.student_id),
      ].filter(Boolean))
    );

    if (validPassportStudentIds.length === 0) {
      return NextResponse.json({
        success: true,
        requests: [],
        counts: { All: 0, Pending: 0, Processing: 0, Completed: 0 },
      });
    }

    // 4. Fetch applications for students with completed passports
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
        notes,
        created_at,
        updated_at,
        profiles:student_id (
          id,
          first_name,
          last_name,
          email,
          phone,
          has_passport,
          passport_number,
          passport_issue_date,
          passport_expiry_date
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
      .in("student_id", validPassportStudentIds)
      .order("created_at", { ascending: false });

    if (appErr) {
      return NextResponse.json({ success: false, error: appErr.message }, { status: 500 });
    }

    const requests = (appData || []).map((app: any) => {
      const studentObj = Array.isArray(app.profiles) ? app.profiles[0] : app.profiles;
      const studentName = studentObj
        ? `${studentObj.first_name || ""} ${studentObj.last_name || ""}`.trim() || studentObj.email || "Student"
        : "Student";

      const universityName = app.universities?.name || (app.target_country ? `University (${app.target_country})` : "Partner University");
      const courseName = app.courses?.title || app.preferred_course || "Degree Programme";

      let tabStatus = "Pending";
      if (app.status === "Visa Approved") {
        tabStatus = "Completed";
      } else if (app.status === "Visa Processing") {
        tabStatus = "Processing";
      } else if (app.status === "Completed") {
        tabStatus = "Completed";
      }

      const requestedOn = app.created_at
        ? new Date(app.created_at).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })
        : "Recent";

      return {
        id: app.id,
        applicationId: app.id,
        appId: `APP-${app.id.slice(0, 6).toUpperCase()}`,
        studentId: app.student_id,
        student: studentName,
        studentEmail: studentObj?.email || "N/A",
        studentPhone: studentObj?.phone || "N/A",
        passportNumber: studentObj?.passport_number || "On File",
        passportIssueDate: studentObj?.passport_issue_date || null,
        passportExpiryDate: studentObj?.passport_expiry_date || null,
        university: universityName,
        course: courseName,
        targetCountry: app.target_country || app.universities?.country || "International",
        appStatus: app.status,
        status: tabStatus,
        notes: app.notes || "",
        requestedOn,
        createdAt: app.created_at,
        updatedAt: app.updated_at,
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
    console.error("[VisaAPI] GET error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ success: false, error: "Server configuration missing." }, { status: 500 });
    }

    const authHeader = req.headers.get("Authorization");
    let authenticatedUserId: string | null = null;
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "").trim();
      if (token && supabaseAnonKey) {
        const clientWithToken = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
          global: { headers: { Authorization: `Bearer ${token}` } },
        });
        const { data: { user } } = await clientWithToken.auth.getUser();
        if (user?.id) authenticatedUserId = user.id;
      }
    }

    if (!authenticatedUserId) {
      const serverClient = await createServerClient();
      const { data: { user } } = await serverClient.auth.getUser();
      if (user?.id) authenticatedUserId = user.id;
    }

    if (!authenticatedUserId) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
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
      return NextResponse.json({ success: false, error: "Forbidden." }, { status: 403 });
    }

    const body = await req.json();
    const { applicationId, newStatus, actionType, notes } = body;

    if (!applicationId) {
      return NextResponse.json({ success: false, error: "Missing applicationId." }, { status: 400 });
    }

    // 1. Fetch current application details
    const { data: application, error: appFetchErr } = await adminClient
      .from("applications")
      .select("*, universities(*), courses(*)")
      .eq("id", applicationId)
      .single();

    if (appFetchErr || !application) {
      return NextResponse.json({ success: false, error: "Application not found." }, { status: 404 });
    }

    const studentId = application.student_id;
    const uniName = application.universities?.name || application.target_country || "University";
    const courseName = application.courses?.title || application.preferred_course || "Degree Program";

    // 2. Handle Action Type: Send Comment/Instructions
    if (actionType === "send_comment" && notes) {
      const updatedNotes = application.notes ? `${application.notes}\n\n[Admission Note]: ${notes}` : notes;
      await adminClient
        .from("applications")
        .update({ notes: updatedNotes, updated_at: new Date().toISOString() })
        .eq("id", applicationId);

      // Insert notification for student
      await adminClient.from("notifications").insert([
        {
          user_id: studentId,
          title: "📌 Important Visa Instruction from Admission Desk",
          message: notes,
          type: "visa",
          is_read: false,
          created_at: new Date().toISOString(),
        },
      ]);

      return NextResponse.json({ success: true, message: "Visa instruction sent to student successfully." });
    }

    // 3. Handle Status Update (Visa Processing / Visa Approved)
    if (newStatus) {
      const { data: updatedApp, error: updateErr } = await adminClient
        .from("applications")
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", applicationId)
        .select()
        .single();

      if (updateErr) {
        return NextResponse.json({ success: false, error: updateErr.message }, { status: 500 });
      }

      // Send appropriate notification to student
      if (newStatus === "Visa Processing") {
        await adminClient.from("notifications").insert([
          {
            user_id: studentId,
            title: "🌐 Student Visa Application In Progress with Embassy",
            message: `Your student visa application for ${courseName} at ${uniName} is now in process with the Embassy. Please prepare all required biometric and original documents.`,
            type: "visa",
            is_read: false,
            created_at: new Date().toISOString(),
          },
        ]);
      } else if (newStatus === "Visa Approved") {
        await adminClient.from("notifications").insert([
          {
            user_id: studentId,
            title: "🎉 Congratulations! Student Visa Approved!",
            message: `Fantastic news! Your student visa for ${courseName} at ${uniName} has been officially approved. Please log in to your portal to review pre-departure details.`,
            type: "visa",
            is_read: false,
            created_at: new Date().toISOString(),
          },
        ]);
      }

      return NextResponse.json({ success: true, application: updatedApp });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[VisaAPI] PATCH error:", err);
    return NextResponse.json({ success: false, error: err.message || "Failed to update visa application." }, { status: 500 });
  }
}
