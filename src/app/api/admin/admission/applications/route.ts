import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

const TAB_STATUS_GROUPS: Record<string, string[]> = {
  "New": ["Profile Completed", "New", "Submitted"],
  "Ready for Review": ["Ready for Review", "Under Review"],
  "Documents Pending": ["Documents Pending", "Replacement Requested"],
  "University Processing": ["Submitted to University", "University Processing"],
  "University Approved": ["University Approved", "Offer Received"],
  "Visa Processing": ["Visa Processing", "Visa Approved"],
  "Completed": ["Completed", "Visa Approved"],
};

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

    // 3. Parse and sanitize query parameters for pagination & filters
    const { searchParams } = new URL(req.url);

    // Page: default 1, min 1
    const rawPage = parseInt(searchParams.get("page") || "1", 10);
    const page = isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;

    // PageSize: default 10, min 1, max 100
    const rawPageSize = parseInt(searchParams.get("pageSize") || "10", 10);
    const pageSize = isNaN(rawPageSize) || rawPageSize < 1 ? 10 : Math.min(rawPageSize, 100);

    // Tab filter
    const tab = (searchParams.get("tab") || "All Applications").trim();

    // Search query: max 100 characters, sanitize special characters for ilike
    const rawSearch = (searchParams.get("search") || "").trim().slice(0, 100);
    const search = rawSearch.replace(/[%_\\]/g, ""); // strip wildcard chars to prevent query manipulation

    // University filter
    const university = (searchParams.get("university") || "All Universities").trim();

    // Status filter
    const status = (searchParams.get("status") || "All Status").trim();

    // 4. Visibility Rule: Only fetch applications from students with Approved payment
    const { data: approvedPayments } = await adminClient
      .from("payments")
      .select("student_id")
      .eq("status", "Approved");

    const approvedStudentIds = Array.from(
      new Set((approvedPayments || []).map((p) => p.student_id).filter(Boolean))
    );

    if (approvedStudentIds.length === 0) {
      const emptyTabCounts = {
        "All Applications": 0,
        "New": 0,
        "Ready for Review": 0,
        "Documents Pending": 0,
        "University Processing": 0,
        "University Approved": 0,
        "Visa Processing": 0,
        "Completed": 0,
      };
      return NextResponse.json({
        success: true,
        data: {
          items: [],
          pagination: {
            page: 1,
            pageSize,
            totalRecords: 0,
            totalPages: 1,
            hasNextPage: false,
            hasPrevPage: false,
          },
          tabCounts: emptyTabCounts,
          filterOptions: {
            universities: ["All Universities"],
          },
        },
        // Backward-compatible keys for current frontend
        applications: [],
        universities: ["All Universities"],
        counts: emptyTabCounts,
        pagination: {
          page: 1,
          pageSize,
          totalRecords: 0,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        },
      });
    }

    // 5. Parallel count aggregations for each tab (Head count queries, 0-byte payload)
    const [
      { count: countAll },
      { count: countNew },
      { count: countReady },
      { count: countDocsPending },
      { count: countUniProcessing },
      { count: countUniApproved },
      { count: countVisaProcessing },
      { count: countCompleted },
      { data: uniList },
    ] = await Promise.all([
      adminClient.from("applications").select("*", { count: "exact", head: true }).in("student_id", approvedStudentIds),
      adminClient.from("applications").select("*", { count: "exact", head: true }).in("student_id", approvedStudentIds).in("status", TAB_STATUS_GROUPS["New"]),
      adminClient.from("applications").select("*", { count: "exact", head: true }).in("student_id", approvedStudentIds).in("status", TAB_STATUS_GROUPS["Ready for Review"]),
      adminClient.from("applications").select("*", { count: "exact", head: true }).in("student_id", approvedStudentIds).in("status", TAB_STATUS_GROUPS["Documents Pending"]),
      adminClient.from("applications").select("*", { count: "exact", head: true }).in("student_id", approvedStudentIds).in("status", TAB_STATUS_GROUPS["University Processing"]),
      adminClient.from("applications").select("*", { count: "exact", head: true }).in("student_id", approvedStudentIds).in("status", TAB_STATUS_GROUPS["University Approved"]),
      adminClient.from("applications").select("*", { count: "exact", head: true }).in("student_id", approvedStudentIds).in("status", TAB_STATUS_GROUPS["Visa Processing"]),
      adminClient.from("applications").select("*", { count: "exact", head: true }).in("student_id", approvedStudentIds).in("status", TAB_STATUS_GROUPS["Completed"]),
      adminClient.from("universities").select("name").order("name", { ascending: true }),
    ]);

    const tabCounts = {
      "All Applications": countAll || 0,
      "New": countNew || 0,
      "Ready for Review": countReady || 0,
      "Documents Pending": countDocsPending || 0,
      "University Processing": countUniProcessing || 0,
      "University Approved": countUniApproved || 0,
      "Visa Processing": countVisaProcessing || 0,
      "Completed": countCompleted || 0,
    };

    const universities = [
      "All Universities",
      ...Array.from(new Set((uniList || []).map((u) => u.name).filter(Boolean))),
    ];

    // 6. Handle Search filtering at database level
    let targetStudentIds = approvedStudentIds;
    let isSearchEmptyResult = false;

    if (search) {
      // Find matching profiles by name or email
      const { data: matchedProfiles } = await adminClient
        .from("profiles")
        .select("id")
        .in("id", approvedStudentIds)
        .or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);

      const profileMatchedIds = (matchedProfiles || []).map((p) => p.id);

      // Check if search matches an application display ID or UUID pattern
      const rawAppId = search.toUpperCase().replace(/^APP-/, "");

      if (profileMatchedIds.length > 0) {
        targetStudentIds = profileMatchedIds;
      } else if (!rawAppId) {
        isSearchEmptyResult = true;
      }
    }

    if (isSearchEmptyResult || targetStudentIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          items: [],
          pagination: {
            page,
            pageSize,
            totalRecords: 0,
            totalPages: 1,
            hasNextPage: false,
            hasPrevPage: false,
          },
          tabCounts,
          filterOptions: { universities },
        },
        applications: [],
        universities,
        counts: tabCounts,
        pagination: {
          page,
          pageSize,
          totalRecords: 0,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        },
      });
    }

    // 7. Build Paginated Database Query
    let query = adminClient
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
      `,
        { count: "exact" }
      )
      .in("student_id", targetStudentIds);

    // Apply Tab Status Group filter
    if (tab !== "All Applications" && TAB_STATUS_GROUPS[tab]) {
      query = query.in("status", TAB_STATUS_GROUPS[tab]);
    }

    // Apply Specific Status filter if selected
    if (status !== "All Status") {
      query = query.eq("status", status);
    }

    // Apply University filter if selected
    if (university !== "All Universities") {
      const selectedUni = (uniList || []).find((u) => u.name === university);
      if (selectedUni) {
        // Query by university name via join or foreign key
        const { data: uniRecords } = await adminClient
          .from("universities")
          .select("id")
          .eq("name", university);
        const uniIds = (uniRecords || []).map((u) => u.id);
        if (uniIds.length > 0) {
          query = query.in("university_id", uniIds);
        }
      }
    }

    // Server-Side Range Calculation
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data: appData, count: totalRecordsCount, error: appErr } = await query
      .order("created_at", { ascending: false })
      .range(from, to);

    if (appErr) {
      return NextResponse.json({ success: false, error: appErr.message }, { status: 500 });
    }

    const totalRecords = totalRecordsCount || 0;
    const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

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

    return NextResponse.json({
      success: true,
      data: {
        items: applications,
        pagination: {
          page,
          pageSize,
          totalRecords,
          totalPages,
          hasNextPage,
          hasPrevPage,
        },
        tabCounts,
        filterOptions: {
          universities,
        },
      },
      // Backward-compatible keys for current frontend
      applications,
      universities,
      counts: tabCounts,
      pagination: {
        page,
        pageSize,
        totalRecords,
        totalPages,
        hasNextPage,
        hasPrevPage,
      },
    });
  } catch (err: any) {
    console.error("[ApplicationsAPI] Error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
