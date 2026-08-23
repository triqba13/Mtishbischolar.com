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
          console.warn("[DocumentsAPI] Bearer auth error:", tokenErr);
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

    // 3. Parse and sanitize query parameters for pagination & filters
    const { searchParams } = new URL(req.url);

    // Page: default 1, min 1
    const rawPage = parseInt(searchParams.get("page") || "1", 10);
    const page = isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;

    // PageSize: default 10, min 1, max 100
    const rawPageSize = parseInt(searchParams.get("pageSize") || "10", 10);
    const pageSize = isNaN(rawPageSize) || rawPageSize < 1 ? 10 : Math.min(rawPageSize, 100);

    // Tab filter: "All", "Pending", "Verified"
    const tab = (searchParams.get("tab") || "All").trim();

    // Search query: max 100 characters, sanitize wildcards
    const rawSearch = (searchParams.get("search") || "").trim().slice(0, 100);
    const search = rawSearch.replace(/[%_\\]/g, "");

    // 4. Visibility Rule: Only fetch academic/admission documents belonging to students with Approved payment
    const { data: approvedPayments } = await adminClient
      .from("payments")
      .select("student_id")
      .eq("status", "Approved");

    const approvedStudentIds = Array.from(
      new Set((approvedPayments || []).map((p) => p.student_id).filter(Boolean))
    );

    if (approvedStudentIds.length === 0) {
      const emptyCounts = { All: 0, Pending: 0, Verified: 0 };
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
          tabCounts: emptyCounts,
        },
        documents: [],
        counts: emptyCounts,
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
      { count: countPending },
      { count: countVerified },
    ] = await Promise.all([
      adminClient
        .from("documents")
        .select("*", { count: "exact", head: true })
        .in("student_id", approvedStudentIds)
        .neq("document_type", "Payment_Receipt"),
      adminClient
        .from("documents")
        .select("*", { count: "exact", head: true })
        .in("student_id", approvedStudentIds)
        .neq("document_type", "Payment_Receipt")
        .eq("is_verified", false),
      adminClient
        .from("documents")
        .select("*", { count: "exact", head: true })
        .in("student_id", approvedStudentIds)
        .neq("document_type", "Payment_Receipt")
        .eq("is_verified", true),
    ]);

    const tabCounts = {
      All: countAll || 0,
      Pending: countPending || 0,
      Verified: countVerified || 0,
    };

    // 6. Handle Search filtering at database level
    let targetStudentIds = approvedStudentIds;
    let isSearchEmptyResult = false;

    if (search) {
      const { data: matchedProfiles } = await adminClient
        .from("profiles")
        .select("id")
        .in("id", approvedStudentIds)
        .or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);

      const profileMatchedIds = (matchedProfiles || []).map((p) => p.id);

      if (profileMatchedIds.length > 0) {
        targetStudentIds = profileMatchedIds;
      }
    }

    // 7. Build Paginated Database Query EXCLUDING Payment_Receipt (strictly for Finance Officers)
    let query = adminClient
      .from("documents")
      .select(
        `
        id,
        student_id,
        application_id,
        document_type,
        file_url,
        file_name,
        file_size,
        is_verified,
        verified_by,
        created_at,
        profiles:student_id (
          id,
          first_name,
          last_name,
          email
        ),
        applications:application_id (
          id,
          preferred_course,
          status,
          universities:university_id (
            id,
            name
          )
        )
      `,
        { count: "exact" }
      )
      .in("student_id", targetStudentIds)
      .neq("document_type", "Payment_Receipt");

    // Apply Verification Tab Filter
    if (tab === "Pending") {
      query = query.eq("is_verified", false);
    } else if (tab === "Verified") {
      query = query.eq("is_verified", true);
    }

    // Apply file name / doc type search if user searched for specific document names
    if (search && targetStudentIds === approvedStudentIds) {
      query = query.or(`file_name.ilike.%${search}%,document_type.ilike.%${search}%`);
    }

    // Server-Side Range Calculation
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data: docsData, count: totalRecordsCount, error: docErr } = await query
      .order("created_at", { ascending: false })
      .range(from, to);

    if (docErr) {
      return NextResponse.json({ success: false, error: docErr.message }, { status: 500 });
    }

    // Filter out any other receipt/payment types defensively
    const filteredDocs = (docsData || []).filter((d: any) => {
      const typeLower = (d.document_type || "").toLowerCase();
      return !typeLower.includes("receipt") && !typeLower.includes("payment");
    });

    const totalRecords = totalRecordsCount || 0;
    const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    const documents = filteredDocs.map((d: any) => {
      const studentObj = Array.isArray(d.profiles) ? d.profiles[0] : d.profiles;
      const appObj = Array.isArray(d.applications) ? d.applications[0] : d.applications;
      const uniObj = appObj?.universities
        ? Array.isArray(appObj.universities)
          ? appObj.universities[0]
          : appObj.universities
        : null;

      const studentName = studentObj
        ? `${studentObj.first_name || ""} ${studentObj.last_name || ""}`.trim() || studentObj.email || "Student"
        : "Student";

      const appId = d.application_id
        ? `APP-${d.application_id.slice(0, 6).toUpperCase()}`
        : "APP-GENERAL";

      const uniName = uniObj?.name || "Partner University";
      const isVerified = Boolean(d.is_verified);
      const status = isVerified ? "Verified" : "Pending";

      // Direct preview route URL
      const signedUrl = `/api/admin/admission/documents/${d.id}/preview`;

      const dateStr = d.created_at
        ? new Date(d.created_at).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "Recently";

      // Pretty document label
      const rawDocType = d.document_type || "Document";
      let prettyDocType = rawDocType.replace(/_/g, " ");
      if (rawDocType === "Master_Cert") prettyDocType = "Master's Degree Certificate";
      else if (rawDocType === "Bachelor_Cert") prettyDocType = "Bachelor's Degree Certificate";
      else if (rawDocType === "Master_Transcript") prettyDocType = "Master's Academic Transcript";
      else if (rawDocType === "Bachelor_Transcript") prettyDocType = "Bachelor's Academic Transcript";
      else if (rawDocType === "Passport") prettyDocType = "Passport / Travel Document";
      else if (rawDocType === "Photo") prettyDocType = "Passport Size Photo";

      return {
        id: d.id,
        studentId: d.student_id,
        applicationId: d.application_id,
        appId,
        student: studentName,
        studentEmail: studentObj?.email,
        document: prettyDocType,
        rawType: rawDocType,
        fileName: d.file_name || "document.pdf",
        fileSize: d.file_size ? `${Math.round(d.file_size / 1024)} KB` : "Document",
        status,
        isVerified,
        university: uniName,
        uploaded: dateStr,
        signedUrl,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        items: documents,
        pagination: {
          page,
          pageSize,
          totalRecords,
          totalPages,
          hasNextPage,
          hasPrevPage,
        },
        tabCounts,
      },
      // Backward-compatible keys for current frontend
      documents,
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
    console.error("[DocumentsAPI] Error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
