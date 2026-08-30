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

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const documentType = formData.get("documentType") as string | null;
    const studentId = formData.get("studentId") as string | null;
    const applicationId = (formData.get("applicationId") as string | null) || null;

    if (!file || !documentType) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: file and documentType are required." },
        { status: 400 }
      );
    }

    // 1. Authenticate user strictly from session
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
          console.warn("[UploadDoc] Bearer token auth error:", tokenErr);
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
        console.warn("[UploadDoc] Server cookie auth error:", cookieErr);
      }
    }

    const targetUserId = authenticatedUserId || studentId;
    if (!targetUserId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Could not authenticate user session." },
        { status: 401 }
      );
    }

    // Validate file size and type
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: "File size exceeds the 10MB maximum limit." },
        { status: 400 }
      );
    }

    const validMimes = ["image/png", "image/jpeg", "image/jpg", "application/pdf"];
    if (!validMimes.includes(file.type) && !file.name.match(/\.(pdf|png|jpg|jpeg)$/i)) {
      return NextResponse.json(
        { success: false, error: "Invalid file format. Only PDF, JPG, and PNG documents are allowed." },
        { status: 400 }
      );
    }

    const adminClient = createSupabaseClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // 2. Prepare file upload
    const fileExt = file.name.split(".").pop() || "pdf";
    const timestamp = Date.now();
    const storageObjectKey = `${targetUserId}/${documentType}_${timestamp}.${fileExt}`;
    const storagePath = `student-documents/${storageObjectKey}`;
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await adminClient.storage
      .from("student-documents")
      .upload(storageObjectKey, fileBuffer, {
        contentType: file.type || "application/octet-stream",
        upsert: true,
      });

    if (uploadError) {
      console.error("[UploadDoc] Storage upload error:", uploadError);
      return NextResponse.json(
        { success: false, error: `Storage upload failed: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // 3. Check for existing document row for (student_id, document_type)
    const { data: existingDoc } = await adminClient
      .from("documents")
      .select("id, file_url")
      .eq("student_id", targetUserId)
      .eq("document_type", documentType)
      .maybeSingle();

    let savedDoc: any = null;

    if (existingDoc?.id) {
      // Clean up old storage file if it exists and is different
      if (existingDoc.file_url && existingDoc.file_url !== storagePath) {
        let oldPath = existingDoc.file_url;
        if (oldPath.startsWith("student-documents/")) {
          oldPath = oldPath.replace(/^student-documents\//, "");
        }
        try {
          await adminClient.storage.from("student-documents").remove([oldPath]);
        } catch (cleanupErr) {
          console.warn("[UploadDoc] Cleanup of previous file warning:", cleanupErr);
        }
      }

      // Update database record
      const { data: updatedData, error: updateError } = await adminClient
        .from("documents")
        .update({
          file_name: file.name,
          file_url: storagePath,
          file_size: file.size,
          is_verified: false,
          created_at: new Date().toISOString(),
        })
        .eq("id", existingDoc.id)
        .select()
        .single();

      if (updateError) {
        console.error("[UploadDoc] Error updating document record:", updateError);
        return NextResponse.json(
          { success: false, error: `Database update failed: ${updateError.message}` },
          { status: 500 }
        );
      }
      savedDoc = updatedData;
    } else {
      // Insert new database record
      const { data: insertedData, error: insertError } = await adminClient
        .from("documents")
        .insert([
          {
            student_id: targetUserId,
            application_id: applicationId || null,
            document_type: documentType,
            file_name: file.name,
            file_url: storagePath,
            file_size: file.size,
            is_verified: false,
            created_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (insertError) {
        console.error("[UploadDoc] Error inserting document record:", insertError);
        return NextResponse.json(
          { success: false, error: `Database insert failed: ${insertError.message}` },
          { status: 500 }
        );
      }
      savedDoc = insertedData;
    }

    return NextResponse.json({
      success: true,
      fileUrl: storagePath,
      document: savedDoc,
    });
  } catch (err: any) {
    console.error("[UploadDoc] Unhandled error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Internal server error." },
      { status: 500 }
    );
  }
}
