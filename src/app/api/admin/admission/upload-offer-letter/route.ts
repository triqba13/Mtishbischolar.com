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
    const documentType = (formData.get("documentType") as string | null) || "Offer_Letter";
    const newStatus = (formData.get("newStatus") as string | null) || "KEEP_CURRENT";
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

    // Determine readable label for document
    const docLabels: Record<string, string> = {
      Offer_Letter: "Official Offer Letter / Acceptance",
      PAL: "Provincial Attestation Letter (PAL)",
      Visa_Support_Letter: "Visa Support Letter",
      Scholarship_Award: "Scholarship Award Letter",
    };
    const documentLabel = docLabels[documentType] || documentType.replace(/_/g, " ");

    // 3. Update application record
    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (documentType === "Offer_Letter") {
      updatePayload.offer_letter_url = storagePath;
    }

    if (newStatus && newStatus !== "KEEP_CURRENT") {
      const validStatus =
        newStatus === "Offer Letter Received" || newStatus === "Offer Letter"
          ? "Submitted to University"
          : newStatus;
      updatePayload.status = validStatus;
    }

    if (notes) {
      const existingNotes = application.notes ? `${application.notes}\n` : "";
      const dateHeader = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
      updatePayload.notes = `${existingNotes}[${dateHeader}] [${documentLabel} Uploaded] ${notes}`.trim();
    }

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
        document_type: documentLabel,
        file_name: file.name,
        file_url: storagePath,
        file_size: file.size,
        is_verified: true,
        created_at: new Date().toISOString(),
      },
    ]);

    // 5. Send notification to the student (NO EMOJIS)
    const uniName = application.universities?.name || application.target_country || "University";
    const courseName = application.courses?.title || application.preferred_course || "Degree Program";

    let notifTitle = `${documentLabel} Uploaded`;
    let notifMessage = `Your ${documentLabel} for ${courseName} at ${uniName} has been uploaded by the Admission Desk. You can view and download it in your portal now.`;

    if (documentType === "Offer_Letter") {
      notifTitle = "Official Offer Letter / Acceptance Received";
      notifMessage = `Your official Offer Letter for ${courseName} at ${uniName} has been uploaded by the Admission Desk. Please review and take next steps.`;
    } else if (documentType === "PAL") {
      notifTitle = "Provincial Attestation Letter (PAL) Available";
      notifMessage = `Your Provincial Attestation Letter (PAL) for ${courseName} at ${uniName} has been issued and uploaded.`;
    } else if (documentType === "Visa_Support_Letter") {
      notifTitle = "Visa Support Letter Uploaded";
      notifMessage = `Your Visa Support Letter for ${courseName} at ${uniName} is now available in your documents.`;
    } else if (documentType === "Scholarship_Award") {
      notifTitle = "Scholarship Award Letter Uploaded";
      notifMessage = `Your Scholarship Award Letter for ${courseName} at ${uniName} has been issued and uploaded.`;
    }

    await adminClient.from("notifications").insert([
      {
        user_id: studentId,
        title: notifTitle,
        message: notifMessage,
        type: "application",
        is_read: false,
        created_at: new Date().toISOString(),
      },
    ]);

    // Audit log entry
    await adminClient.from("audit_logs").insert({
      user_id: authenticatedUserId,
      action: "university_decision_document_uploaded",
      target_type: "application",
      target_id: applicationId,
      details: {
        document_type: documentType,
        document_label: documentLabel,
        file_name: file.name,
        status_updated_to: updatePayload.status || "unchanged",
        student_id: studentId,
      },
    });

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
    return NextResponse.json({ success: false, error: err.message || "Failed to upload decision document." }, { status: 500 });
  }
}
