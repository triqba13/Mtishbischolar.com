import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { success: false, error: "Server configuration missing: SUPABASE URL or Service Key" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { documentId, studentId, fileUrl } = body;

    if (!documentId) {
      return NextResponse.json(
        { success: false, error: "Missing required field: documentId" },
        { status: 400 }
      );
    }

    // 1. Authenticate user strictly from session (Bearer token header prioritized, then cookies)
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
          console.warn("[DeleteDoc] Bearer token auth error:", tokenErr);
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
        console.warn("[DeleteDoc] Server cookie auth error:", cookieErr);
      }
    }

    // Fallback: If studentId is passed in body and matches authenticated user or in dev mode
    const targetUserId = authenticatedUserId || studentId;
    if (!targetUserId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Could not authenticate user session." },
        { status: 401 }
      );
    }

    const adminClient = createSupabaseClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // 2. Fetch the document to ensure it exists and belongs to this student
    const { data: doc, error: fetchErr } = await adminClient
      .from("documents")
      .select("*")
      .eq("id", documentId)
      .maybeSingle();

    if (fetchErr || !doc) {
      return NextResponse.json(
        { success: false, error: "Document not found." },
        { status: 404 }
      );
    }

    if (doc.student_id !== targetUserId) {
      return NextResponse.json(
        { success: false, error: "Forbidden: You do not have permission to delete this document." },
        { status: 403 }
      );
    }

    // 3. If it's a verified payment receipt, prevent accidental deletion
    if (doc.document_type === "Payment_Receipt" && doc.is_verified) {
      return NextResponse.json(
        {
          success: false,
          error: "This verified payment receipt is attached to your active application file and cannot be deleted.",
        },
        { status: 400 }
      );
    }

    // 4. Delete the database record
    const { error: delErr } = await adminClient
      .from("documents")
      .delete()
      .eq("id", documentId);

    if (delErr) {
      console.error("[DeleteDoc] Error deleting document record:", delErr);
      return NextResponse.json(
        { success: false, error: `Database deletion failed: ${delErr.message}` },
        { status: 500 }
      );
    }

    // 5. Remove file from storage if file_url or fileUrl exists
    const targetFileUrl = fileUrl || doc.file_url;
    if (targetFileUrl && typeof targetFileUrl === "string") {
      let storagePath = targetFileUrl;
      if (storagePath.startsWith("student-documents/")) {
        storagePath = storagePath.replace(/^student-documents\//, "");
      }
      try {
        await adminClient.storage.from("student-documents").remove([storagePath]);
      } catch (storageErr) {
        console.warn("[DeleteDoc] Storage deletion warning:", storageErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Document deleted successfully.",
      deletedId: documentId,
    });
  } catch (err: any) {
    console.error("[DeleteDoc] Unhandled error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Internal server error." },
      { status: 500 }
    );
  }
}
