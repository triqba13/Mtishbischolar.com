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
        { success: false, error: "Server configuration missing." },
        { status: 500 }
      );
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
      .select("id, role, first_name, last_name")
      .eq("id", authenticatedUserId)
      .maybeSingle();

    const normalizedRole = (profile?.role || "").trim().toLowerCase();
    if (!["admission_officer", "super_admin"].includes(normalizedRole)) {
      return NextResponse.json({ success: false, error: "Forbidden." }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const applicationId = formData.get("applicationId") as string | null;
    const documentType = (formData.get("documentType") as string | null) || "Offer_Letter"; // Offer_Letter, PAL, Acceptance_Letter
    const newStatus = (formData.get("newStatus") as string | null) || "Offer Letter Received";
    const notes = (formData.get("notes") as string | null) || null;

    if (!file || !applicationId) {
      return NextResponse.json({ success: false, error: "Missing required fields: file and applicationId." }, { status: 400 });
    }

    // 1. Fetch application to get student_id
    const { data: application, error: appErr } = await adminClient
      .from("applications")
      .select("*, universities(*), courses(*)")
      .eq("id", applicationId)
      .single();

    if (appErr || !application) {
      return NextResponse.json({ success: false, error: "Application not found." }, { status: 404 });
    }

    const studentId = application.student_id;
    const fileExt = file.name.split(".").pop() || "pdf";
    const timestamp = Date.now();
    const storageObjectKey = `${studentId}/${documentType.toLowerCase()}_${timestamp}.${fileExt}`;
    const storagePath = `student-documents/${storageObjectKey}`;
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // 2. Upload file to storage
    const { error: uploadError } = await adminClient.storage
      .from("student-documents")
      .upload(storageObjectKey, fileBuffer, {
        contentType: file.type || "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      return NextResponse.json({ success: false, error: `Upload failed: ${uploadError.message}` }, { status: 500 });
    }

    const validStatus =
      newStatus === "Offer Letter Received" || newStatus === "Offer Letter" || !newStatus
        ? "Submitted to University"
        : newStatus;

    // 3. Update application record
    const updatePayload: any = {
      offer_letter_url: storagePath,
      status: validStatus,
      updated_at: new Date().toISOString(),
    };
    if (notes) updatePayload.notes = notes;

    const { data: updatedApp, error: updateAppErr } = await adminClient
      .from("applications")
      .update(updatePayload)
      .eq("id", applicationId)
      .select()
      .single();

    if (updateAppErr) {
      return NextResponse.json({ success: false, error: updateAppErr.message }, { status: 500 });
    }

    // 4. Save record in documents table
    await adminClient.from("documents").insert([
      {
        student_id: studentId,
        application_id: applicationId,
        document_type: documentType,
        file_name: file.name,
        file_url: storagePath,
        file_size: file.size,
        is_verified: true,
        created_at: new Date().toISOString(),
      },
    ]);

    // 5. Send notification to the student
    const uniName = application.universities?.name || application.target_country || "University";
    const courseName = application.courses?.title || application.preferred_course || "Degree Program";

    await adminClient.from("notifications").insert([
      {
        user_id: studentId,
        title: `🎉 Official ${documentType.replace("_", " ")} Received!`,
        message: `Congratulations! Your official ${documentType.replace("_", " ")} for ${courseName} at ${uniName} has been uploaded by the Admission Desk. You can view and download it now.`,
        type: "application",
        is_read: false,
        created_at: new Date().toISOString(),
      },
    ]);

    // 6. Generate signed URL for immediate preview
    let signedUrl = storagePath;
    const { data: signedData } = await adminClient.storage
      .from("student-documents")
      .createSignedUrl(storageObjectKey, 60 * 60 * 24 * 7);

    if (signedData?.signedUrl) signedUrl = signedData.signedUrl;

    return NextResponse.json({
      success: true,
      fileUrl: storagePath,
      signedUrl,
      application: updatedApp,
    });
  } catch (err: any) {
    console.error("[UploadOfferLetter] Error:", err);
    return NextResponse.json({ success: false, error: err.message || "Failed to upload offer letter." }, { status: 500 });
  }
}
