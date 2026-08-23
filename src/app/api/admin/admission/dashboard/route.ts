import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

function calcPercentageChange(curr: number, prev: number, periodLabel = "last 7 days"): { change: string; changeUp: boolean } {
  if (prev === 0 && curr === 0) {
    return { change: "No change", changeUp: true };
  }
  if (prev === 0 && curr > 0) {
    return { change: `+${curr} New`, changeUp: true };
  }
  const diff = curr - prev;
  const pct = Math.round((diff / prev) * 100);
  const sign = pct > 0 ? "+" : "";
  return {
    change: `${sign}${pct}% from ${periodLabel}`,
    changeUp: pct >= 0,
  };
}

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

    // 1. Authenticate user strictly from verified session (Bearer header prioritized, fallback to cookies)
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
          console.warn("[AdmissionDashboardAPI] Bearer token auth error:", tokenErr);
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

    // 2. Create privileged admin client to verify role & query data
    const adminClient = createSupabaseClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: profile, error: profileErr } = await adminClient
      .from("profiles")
      .select("id, role, first_name, last_name, email")
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

    // 3. Visibility Rule: Only fetch applications from students with Approved file-opening payment
    const { data: approvedPayments } = await adminClient
      .from("payments")
      .select("student_id")
      .eq("status", "Approved");

    const approvedStudentIds = Array.from(
      new Set((approvedPayments || []).map((p) => p.student_id).filter(Boolean))
    );

    // 4. Fetch all applications belonging to approved students
    let applications: any[] = [];
    if (approvedStudentIds.length > 0) {
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
          offer_letter_url,
          notes,
          profiles:student_id (
            id,
            first_name,
            last_name,
            email,
            phone,
            nationality,
            has_passport,
            passport_number,
            highest_education,
            is_profile_completed
          ),
          universities:university_id (
            id,
            name,
            country
          )
        `
        )
        .in("student_id", approvedStudentIds)
        .order("created_at", { ascending: false });

      if (appErr) {
        console.error("[AdmissionDashboardAPI] Application fetch error:", appErr);
      } else {
        applications = appData || [];
      }
    }

    // ── DATE CALCULATIONS FOR PERCENTAGE CHANGES ──
    const now = new Date();
    const nowMs = now.getTime();
    const ms7d = 7 * 24 * 60 * 60 * 1000;
    const ms14d = 14 * 24 * 60 * 60 * 1000;
    const ms30d = 30 * 24 * 60 * 60 * 1000;
    const ms60d = 60 * 24 * 60 * 60 * 1000;

    const tCurrent7d = new Date(nowMs - ms7d);
    const tPrevious7d = new Date(nowMs - ms14d);

    const tCurrent30d = new Date(nowMs - ms30d);
    const tPrevious30d = new Date(nowMs - ms60d);

    // 5. Database-side aggregation for pending unverified academic documents (0-byte payload head queries)
    let docsPendingTotal = 0;
    let docsPendingCurr = 0;
    let docsPendingPrev = 0;

    if (approvedStudentIds.length > 0) {
      const [
        { count: totalUnverified },
        { count: currUnverified },
        { count: prevUnverified },
      ] = await Promise.all([
        // Total unverified academic documents for approved applicants (excludes payment receipts)
        adminClient
          .from("documents")
          .select("*", { count: "exact", head: true })
          .in("student_id", approvedStudentIds)
          .eq("is_verified", false)
          .neq("document_type", "Payment_Receipt"),

        // Unverified academic documents created in current 7-day period
        adminClient
          .from("documents")
          .select("*", { count: "exact", head: true })
          .in("student_id", approvedStudentIds)
          .eq("is_verified", false)
          .neq("document_type", "Payment_Receipt")
          .gte("created_at", tCurrent7d.toISOString())
          .lte("created_at", now.toISOString()),

        // Unverified academic documents created in previous 7-day period (7d to 14d ago)
        adminClient
          .from("documents")
          .select("*", { count: "exact", head: true })
          .in("student_id", approvedStudentIds)
          .eq("is_verified", false)
          .neq("document_type", "Payment_Receipt")
          .gte("created_at", tPrevious7d.toISOString())
          .lte("created_at", tCurrent7d.toISOString()),
      ]);

      docsPendingTotal = totalUnverified || 0;
      docsPendingCurr = currUnverified || 0;
      docsPendingPrev = prevUnverified || 0;
    }

    const docsPendingChange = calcPercentageChange(docsPendingCurr, docsPendingPrev, "last 7 days");

    // 6. Database-side count for passport assistance requests (0-byte payload head query)
    const { count: passportAssistanceCount } = await adminClient
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .in("has_passport", ["No", "Assistance Requested", "assistance_requested"]);

    const passportRequestsCount = passportAssistanceCount || 0;

    // 7. Fetch unread notifications
    const { data: notifs } = await adminClient
      .from("notifications")
      .select("id, title, message, type, is_read, created_at")
      .order("created_at", { ascending: false })
      .limit(10);

    // Helper: is application in date range
    const isAppInRange = (a: any, start: Date, end: Date) => {
      if (!a.created_at) return false;
      const t = new Date(a.created_at);
      return t >= start && t <= end;
    };

    // 8. Calculate KPI Counts & Real Percentage Changes
    // A. New Applications (Profile Completed / New / Submitted)
    const newAppsTotal = applications.filter((a) =>
      ["Profile Completed", "New", "Submitted"].includes(a.status)
    );
    const newAppsCurr = newAppsTotal.filter((a) => isAppInRange(a, tCurrent7d, now)).length;
    const newAppsPrev = newAppsTotal.filter((a) => isAppInRange(a, tPrevious7d, tCurrent7d)).length;
    const newAppsChange = calcPercentageChange(newAppsCurr, newAppsPrev, "last 7 days");

    // B. Ready for Review (Under Review / Ready for Review)
    const readyForReviewTotal = applications.filter((a) =>
      ["Ready for Review", "Under Review"].includes(a.status)
    );
    const readyCurr = readyForReviewTotal.filter((a) => isAppInRange(a, tCurrent7d, now)).length;
    const readyPrev = readyForReviewTotal.filter((a) => isAppInRange(a, tPrevious7d, tCurrent7d)).length;
    const readyChange = calcPercentageChange(readyCurr, readyPrev, "last 7 days");

    // C. Documents Pending
    // (Calculated above via database count aggregation)

    // D. University Processing (Submitted to University / University Processing)
    const uniProcessingApps = applications.filter((a) =>
      ["Submitted to University", "University Processing", "University Submitted"].includes(a.status)
    );
    const uniProcessingCurr = uniProcessingApps.filter((a) => isAppInRange(a, tCurrent7d, now)).length;
    const uniProcessingPrev = uniProcessingApps.filter((a) => isAppInRange(a, tPrevious7d, tCurrent7d)).length;
    const uniProcessingChange = calcPercentageChange(uniProcessingCurr, uniProcessingPrev, "last 7 days");

    // Breakdown by University for University Processing KPI Card
    const uniBreakdownMap: Record<string, number> = {};
    uniProcessingApps.forEach((a) => {
      const uniName = a.universities?.name || a.target_country || "Partner Universities";
      uniBreakdownMap[uniName] = (uniBreakdownMap[uniName] || 0) + 1;
    });

    const uniBreakdown = Object.entries(uniBreakdownMap).map(([label, value]) => ({
      label,
      value,
    }));

    // E. Visa Processing
    const visaAppsTotal = applications.filter((a) =>
      ["Visa Processing", "Visa Approved"].includes(a.status)
    );
    const visaCurr = visaAppsTotal.filter((a) => isAppInRange(a, tCurrent7d, now)).length;
    const visaPrev = visaAppsTotal.filter((a) => isAppInRange(a, tPrevious7d, tCurrent7d)).length;
    const visaChange = calcPercentageChange(visaCurr, visaPrev, "last 7 days");

    // 9. Format Recent Applications List (1 row = 1 application)
    const recentApplications = applications.slice(0, 10).map((app) => {
      const studentName = app.profiles
        ? `${app.profiles.first_name || ""} ${app.profiles.last_name || ""}`.trim() || app.profiles.email || "Student"
        : "Student";

      const uniName =
        app.universities?.name || (app.target_country ? `University (${app.target_country})` : "Partner University");

      const courseName = app.preferred_course || "Undergraduate Degree";

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
        university: uniName,
        course: courseName,
        status: app.status || "Ready for Review",
        submitted: dateStr,
        created_at: app.created_at,
      };
    });

    // 10. Pending Tasks
    const pendingTasks = [
      {
        label: "Review Applications",
        count: readyForReviewTotal.length,
        href: "/admin/admission/applications?tab=ready",
      },
      {
        label: "Review Pending Documents",
        count: docsPendingTotal,
        href: "/admin/admission/documents?tab=pending",
      },
      {
        label: "Follow up University Cases",
        count: uniProcessingApps.length,
        href: "/admin/admission/applications?tab=university",
      },
      {
        label: "Passport Requests",
        count: passportRequestsCount,
        href: "/admin/admission/passport",
      },
      {
        label: "Student Replies / Comments",
        count: (notifs || []).filter((n) => !n.is_read).length,
        href: "/admin/admission/notifications",
      },
    ];

    // 11. Admission Performance with 30-Day Comparisons
    const calcPerformanceStat = (filterFn: (a: any) => boolean) => {
      const matching = applications.filter(filterFn);
      const curr = matching.filter((a) => isAppInRange(a, tCurrent30d, now)).length;
      const prev = matching.filter((a) => isAppInRange(a, tPrevious30d, tCurrent30d)).length;
      let change = "0%";
      if (prev === 0 && curr === 0) {
        change = "0%";
      } else if (prev === 0 && curr > 0) {
        change = `+${curr} New`;
      } else {
        const diff = curr - prev;
        const pct = Math.round((diff / prev) * 100);
        change = `${pct > 0 ? "+" : ""}${pct}%`;
      }
      return { total: matching.length, change };
    };

    const perfReceived = calcPerformanceStat(() => true);
    const perfReviewed = calcPerformanceStat((a) => !["Profile Completed", "New", "Submitted"].includes(a.status));
    const perfApproved = calcPerformanceStat((a) =>
      ["Under Review", "Approved", "Submitted to University", "University Processing", "University Approved", "Offer Received", "Visa Processing", "Completed", "Visa Approved"].includes(a.status)
    );
    const perfUniSubmitted = calcPerformanceStat((a) =>
      ["Submitted to University", "University Processing", "University Approved", "Offer Received", "Visa Processing", "Completed", "Visa Approved"].includes(a.status)
    );
    const perfCompleted = calcPerformanceStat((a) =>
      ["Completed", "Offer Received", "Visa Approved"].includes(a.status)
    );

    // 12. Dynamic Chart Aggregation for 7d, 30d, 3m
    const generateChartDataForDays = (numDays: number) => {
      const result: any[] = [];
      const interval = numDays > 30 ? 7 : 1; // Weekly grouping for 3 months
      const steps = Math.ceil(numDays / interval);

      for (let i = steps - 1; i >= 0; i--) {
        const dEnd = new Date(nowMs - i * interval * 24 * 60 * 60 * 1000);
        const dStart = new Date(dEnd.getTime() - interval * 24 * 60 * 60 * 1000);
        const dayLabel = dEnd.toLocaleDateString("en-GB", { day: "numeric", month: "short" });

        const bucketApps = applications.filter((a) => isAppInRange(a, dStart, dEnd));

        result.push({
          day: dayLabel,
          New: bucketApps.filter((a) => ["Profile Completed", "New", "Submitted"].includes(a.status)).length,
          "Ready for Review": bucketApps.filter((a) => ["Ready for Review", "Under Review"].includes(a.status)).length,
          "Documents Pending": bucketApps.filter((a) => ["Documents Pending", "Replacement Requested"].includes(a.status)).length,
          "University Processing": bucketApps.filter((a) => ["Submitted to University", "University Processing"].includes(a.status)).length,
          "Visa Processing": bucketApps.filter((a) => ["Visa Processing", "Visa Approved"].includes(a.status)).length,
        });
      }
      return result;
    };

    const chartDataByRange = {
      "Last 7 Days": generateChartDataForDays(7),
      "Last 30 Days": generateChartDataForDays(30),
      "Last 3 Months": generateChartDataForDays(90),
      "Custom": generateChartDataForDays(7),
    };

    return NextResponse.json({
      success: true,
      officer: {
        id: profile.id,
        firstName: profile.first_name || "Admission Officer",
        fullName: `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "Admission Officer",
        email: profile.email,
        role: profile.role,
      },
      kpi: {
        newApplications: newAppsTotal.length,
        newApplicationsChange: newAppsChange.change,
        newApplicationsChangeUp: newAppsChange.changeUp,

        readyForReview: readyForReviewTotal.length,
        readyForReviewChange: readyChange.change,
        readyForReviewChangeUp: readyChange.changeUp,

        documentsPending: docsPendingTotal,
        documentsPendingChange: docsPendingChange.change,
        documentsPendingChangeUp: docsPendingChange.changeUp,

        universityProcessing: uniProcessingApps.length,
        universityProcessingChange: uniProcessingChange.change,
        universityProcessingChangeUp: uniProcessingChange.changeUp,
        uniBreakdown: uniBreakdown.length > 0 ? uniBreakdown : [{ label: "No Active Submissions", value: 0 }],

        visaProcessing: visaAppsTotal.length,
        visaProcessingChange: visaChange.change,
        visaProcessingChangeUp: visaChange.changeUp,
      },
      recentApplications,
      pendingTasks,
      performance: {
        applicationsReceived: perfReceived.total,
        applicationsReceivedChange: perfReceived.change,

        applicationsReviewed: perfReviewed.total,
        applicationsReviewedChange: perfReviewed.change,

        applicationsApproved: perfApproved.total,
        applicationsApprovedChange: perfApproved.change,

        universitySubmissions: perfUniSubmitted.total,
        universitySubmissionsChange: perfUniSubmitted.change,

        completedCases: perfCompleted.total,
        completedCasesChange: perfCompleted.change,
      },
      notifications: notifs || [],
      chartData: chartDataByRange["Last 7 Days"],
      chartDataByRange,
    });
  } catch (err: any) {
    console.error("[AdmissionDashboardAPI] Unexpected error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
