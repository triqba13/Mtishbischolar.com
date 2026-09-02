import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

    // 3. Only fetch documents belonging to students with Approved payment
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
        counts: { All: 0, Pending: 0, Verified: 0, totalDocs: 0, pendingDocs: 0, verifiedDocs: 0 },
      });
    }

    // 4. Fetch all documents for approved students (excluding Payment_Receipt)
    const { data: docsData, error: docErr } = await adminClient
      .from("documents")
      .select(`
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
          email,
          phone,
          avatar_url
        )
      `)
      .in("student_id", approvedStudentIds)
      .order("created_at", { ascending: false });

    if (docErr) {
      return NextResponse.json({ success: false, error: docErr.message }, { status: 500 });
    }

    // Filter out payment receipts
    const filteredDocs = (docsData || []).filter((d: any) => {
      const typeLower = (d.document_type || "").toLowerCase();
      return !typeLower.includes("receipt") && !typeLower.includes("payment");
    });

    // 5. Group by Student
    const studentMap: Record<string, any> = {};

    filteredDocs.forEach((d: any) => {
      const sId = d.student_id;
      if (!sId) return;

      const profileObj = Array.isArray(d.profiles) ? d.profiles[0] : d.profiles;
      const studentName = profileObj
        ? `${profileObj.first_name || ""} ${profileObj.last_name || ""}`.trim() || profileObj.email || "Student"
        : "Student";

      if (!studentMap[sId]) {
        studentMap[sId] = {
          id: sId,
          studentId: sId,
          studentName,
          studentEmail: profileObj?.email || "N/A",
          studentPhone: profileObj?.phone || "N/A",
          avatarUrl: profileObj?.avatar_url || null,
          documents: [],
          totalDocs: 0,
          pendingDocs: 0,
          verifiedDocs: 0,
          lastUploaded: d.created_at,
        };
      }

      // Pretty document label
      const rawDocType = d.document_type || "Document";
      let prettyDocType = rawDocType.replace(/_/g, " ");
      if (rawDocType === "Master_Cert") prettyDocType = "Master's Degree Certificate";
      else if (rawDocType === "Bachelor_Cert") prettyDocType = "Bachelor's Degree Certificate";
      else if (rawDocType === "Master_Transcript") prettyDocType = "Master's Academic Transcript";
      else if (rawDocType === "Bachelor_Transcript") prettyDocType = "Bachelor's Academic Transcript";
      else if (rawDocType === "Passport") prettyDocType = "Passport / Travel Document";
      else if (rawDocType === "Photo") prettyDocType = "Passport Size Photo";

      const docItem = {
        id: d.id,
        studentId: d.student_id,
        applicationId: d.application_id,
        documentType: prettyDocType,
        rawType: rawDocType,
        fileName: d.file_name || "document.pdf",
        fileSize: d.file_size ? `${Math.round(d.file_size / 1024)} KB` : "Document",
        fileUrl: d.file_url,
        previewUrl: `/api/admin/admission/documents/${d.id}/preview`,
        isVerified: Boolean(d.is_verified),
        status: d.is_verified ? "Verified" : "Pending",
        uploadedAt: d.created_at
          ? new Date(d.created_at).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })
          : "Recently",
      };

      studentMap[sId].documents.push(docItem);
      studentMap[sId].totalDocs += 1;
      if (docItem.isVerified) {
        studentMap[sId].verifiedDocs += 1;
      } else {
        studentMap[sId].pendingDocs += 1;
      }

      if (new Date(d.created_at) > new Date(studentMap[sId].lastUploaded)) {
        studentMap[sId].lastUploaded = d.created_at;
      }
    });

    // Generate signed avatar URLs for students
    await Promise.all(
      Object.values(studentMap).map(async (s: any) => {
        if (s.avatarUrl && !s.avatarUrl.startsWith("http")) {
          try {
            let cleanPath = s.avatarUrl.replace(/^student-documents\//, "");
            const { data } = await adminClient.storage
              .from("student-documents")
              .createSignedUrl(cleanPath, 60 * 60 * 24 * 7);
            if (data?.signedUrl) {
              s.avatarUrl = data.signedUrl;
            }
          } catch (avatarErr) {
            console.warn("[DocumentsAPI] Avatar signed URL error:", avatarErr);
          }
        }
      })
    );

    const students = Object.values(studentMap).map((s: any) => {
      let status = "Pending Review";
      if (s.totalDocs > 0 && s.pendingDocs === 0) {
        status = "Fully Verified";
      } else if (s.verifiedDocs > 0) {
        status = "Partially Verified";
      }

      return {
        ...s,
        status,
        lastUploadedFormatted: s.lastUploaded
          ? new Date(s.lastUploaded).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })
          : "N/A",
      };
    });

    // Counts
    const counts = {
      All: students.length,
      Pending: students.filter((s) => s.pendingDocs > 0).length,
      Verified: students.filter((s) => s.totalDocs > 0 && s.pendingDocs === 0).length,
      totalDocs: filteredDocs.length,
      pendingDocs: filteredDocs.filter((d: any) => !d.is_verified).length,
      verifiedDocs: filteredDocs.filter((d: any) => d.is_verified).length,
    };

    return NextResponse.json({
      success: true,
      students,
      counts,
    });
  } catch (err: any) {
    console.error("[DocumentsAPI] GET error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
