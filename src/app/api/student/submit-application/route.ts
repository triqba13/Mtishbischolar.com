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
      targetCountry,
      universityId,
      courseId,
      targetIntake = "September 2026",
      preferredCourse,
      notes,
      isUnlisted = false,
    } = body;

    // 1. Authenticate user from Bearer token or server session cookie
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
          console.warn("[SubmitApplicationAPI] Bearer auth error:", tokenErr);
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
        console.warn("[SubmitApplicationAPI] Server cookie auth error:", cookieErr);
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
      const { data: staffProf } = await adminClient
        .from("profiles")
        .select("role")
        .eq("id", authenticatedUserId)
        .maybeSingle();

      const isStaff = ["admission_officer", "super_admin", "finance_officer"].includes(
        staffProf?.role || ""
      );
      if (!isStaff) {
        return NextResponse.json(
          { success: false, error: "Forbidden: You cannot apply on behalf of another student." },
          { status: 403 }
        );
      }
    }

    // 2. Security check: Student must have an approved File Opening Fee payment
    const { data: payments, error: payError } = await adminClient
      .from("payments")
      .select("status, amount, payment_type")
      .eq("student_id", targetUserId);

    if (payError) {
      console.error("[SubmitApplicationAPI] Error checking payment:", payError);
      return NextResponse.json(
        { success: false, error: "Unable to verify payment status." },
        { status: 500 }
      );
    }

    const hasApprovedPayment = (payments || []).some((p) => {
      const isFileFee =
        (p.payment_type === "file_opening_fee" || p.amount === 50000 || !p.payment_type) &&
        p.payment_type !== "passport_assistance" &&
        p.amount !== 300000;
      const st = (p.status || "").toLowerCase().trim();
      return isFileFee && (st === "approved" || st === "paid" || st === "verified");
    });

    if (!hasApprovedPayment) {
      return NextResponse.json(
        {
          success: false,
          paymentRequired: true,
          error:
            "To apply to partner universities, your one-time MtishbiScholars Application File Opening Fee (TSh 50,000) must be approved first.",
        },
        { status: 400 }
      );
    }

    // 3. Prevent duplicate active applications to the exact same university & course
    if (!isUnlisted && universityId && courseId) {
      const { data: existingApps } = await adminClient
        .from("applications")
        .select("id, status")
        .eq("student_id", targetUserId)
        .eq("university_id", universityId)
        .eq("course_id", courseId);

      const hasActive = (existingApps || []).some((a) => {
        const st = (a.status || "").toLowerCase();
        return !st.includes("rejected") && !st.includes("withdrawn") && !st.includes("cancelled");
      });

      if (hasActive) {
        return NextResponse.json(
          {
            success: false,
            error: "You have already submitted an active application for this course.",
          },
          { status: 400 }
        );
      }
    }

    // 4. Insert application record
    let courseRequestNote = notes || null;
    if (isUnlisted && preferredCourse) {
      courseRequestNote = `[UNLISTED COURSE REQUEST]: Student requested "${preferredCourse}" for ${targetCountry} (${targetIntake})${
        notes ? `. Notes: ${notes}` : ""
      }`;
    }

    const { data: newApp, error: appInsertErr } = await adminClient
      .from("applications")
      .insert([
        {
          student_id: targetUserId,
          target_country: targetCountry || "India",
          university_id: isUnlisted ? null : universityId || null,
          course_id: isUnlisted ? null : courseId || null,
          target_intake: targetIntake,
          preferred_course: preferredCourse || null,
          status: "Under Review",
          notes: courseRequestNote,
        },
      ])
      .select("*, universities(*), courses(*)")
      .single();

    if (appInsertErr) {
      console.error("[SubmitApplicationAPI] Insert error:", appInsertErr);
      return NextResponse.json(
        { success: false, error: appInsertErr.message },
        { status: 500 }
      );
    }

    // 5. Send notifications
    try {
      const { data: studentProf } = await adminClient
        .from("profiles")
        .select("first_name, last_name, email")
        .eq("id", targetUserId)
        .maybeSingle();

      const studentName = studentProf
        ? `${studentProf.first_name} ${studentProf.last_name}`
        : "A student";
      const courseTitle =
        newApp.courses?.name || preferredCourse || "University Degree Program";
      const uniTitle = newApp.universities?.name || targetCountry || "Partner Institution";

      // 5a. Outgoing confirmation to student
      await adminClient.from("notifications").insert([
        {
          user_id: targetUserId,
          title: "Application Submitted Successfully",
          message: `Your application for ${courseTitle} at ${uniTitle} has been received and is currently under review by the Admission team.`,
          type: "application",
          is_read: false,
        },
      ]);

      // 5b. Incoming notification to Admission Officers & Super Admins
      const { data: admissionStaff } = await adminClient
        .from("profiles")
        .select("id")
        .in("role", ["admission_officer", "super_admin"]);

      for (const staff of admissionStaff || []) {
        await adminClient.from("notifications").insert([
          {
            user_id: staff.id,
            title: `New Application Submitted: ${studentName}`,
            message: `${studentName} submitted an application for ${courseTitle} (${uniTitle}, ${targetCountry}).`,
            type: "application",
            is_read: false,
          },
        ]);
      }
    } catch (notifErr) {
      console.warn("[SubmitApplicationAPI] Notification warning:", notifErr);
    }

    return NextResponse.json({
      success: true,
      data: newApp,
      message: "Application submitted successfully.",
    });
  } catch (err: any) {
    console.error("[SubmitApplicationAPI] Unhandled error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Internal server error." },
      { status: 500 }
    );
  }
}
