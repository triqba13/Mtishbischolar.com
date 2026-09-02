import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await params;
    const applicationId = resolvedParams.id;

    if (!applicationId) {
      return NextResponse.json(
        { success: false, error: "Application ID is required." },
        { status: 400 }
      );
    }

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
          console.warn("[AppActionAPI] Bearer auth error:", tokenErr);
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

    // 2. Privileged admin client to verify role and perform action
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

    // 3. Fetch Application
    const { data: application, error: fetchErr } = await adminClient
      .from("applications")
      .select("id, student_id, status, preferred_course, notes")
      .eq("id", applicationId)
      .maybeSingle();

    if (fetchErr || !application) {
      return NextResponse.json(
        { success: false, error: "Application not found." },
        { status: 404 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { action } = body;

    const officerName = `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "Admission Officer";

    // ── ACTION 1: APPROVE APPLICATION ──
    if (action === "approve_application") {
      const nextStatus =
        application.status === "Profile Completed" || application.status === "Rejected" || !application.status
          ? "Under Review"
          : application.status;

      const { error: updateErr } = await adminClient
        .from("applications")
        .update({
          status: nextStatus,
          admission_officer_id: authenticatedUserId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", applicationId);

      if (updateErr) {
        return NextResponse.json({ success: false, error: updateErr.message }, { status: 500 });
      }

      // Record audit log
      await adminClient.from("audit_logs").insert({
        user_id: authenticatedUserId,
        action: "application_approved_by_officer",
        target_type: "application",
        target_id: applicationId,
        details: {
          officer_name: officerName,
          previous_status: application.status,
          new_status: nextStatus,
          student_id: application.student_id,
        },
      });

      // Send notification to student
      await adminClient.from("notifications").insert({
        user_id: application.student_id,
        title: "Application Reviewed & Approved",
        message: `Your application for ${application.preferred_course || "programme"} has been reviewed and approved by Admission Officer ${officerName}.`,
        type: "application",
        is_read: false,
      });

      return NextResponse.json({
        success: true,
        message: "Application reviewed and approved successfully.",
        newStatus: nextStatus,
      });
    }

    // ── ACTION 1B: REJECT APPLICATION ──
    if (action === "reject_application") {
      const { reason, comment } = body;
      const rejectReason = reason || "Qualifications not met";
      const rejectNote = comment ? `Reason: ${rejectReason}. Note: ${comment}` : `Reason: ${rejectReason}`;

      const existingNotes = application.notes ? `${application.notes}\n` : "";
      const dateHeader = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
      const newNote = `[${dateHeader}] [Application Rejected by ${officerName}] ${rejectNote}`;

      const { error: updateErr } = await adminClient
        .from("applications")
        .update({
          status: "Rejected",
          notes: `${existingNotes}${newNote}`.trim(),
          admission_officer_id: authenticatedUserId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", applicationId);

      if (updateErr) {
        return NextResponse.json({ success: false, error: updateErr.message }, { status: 500 });
      }

      // Record audit log
      await adminClient.from("audit_logs").insert({
        user_id: authenticatedUserId,
        action: "application_rejected_by_officer",
        target_type: "application",
        target_id: applicationId,
        details: {
          officer_name: officerName,
          previous_status: application.status,
          new_status: "Rejected",
          reason: rejectReason,
          comment: comment || "",
          student_id: application.student_id,
        },
      });

      // Notify student
      await adminClient.from("notifications").insert({
        user_id: application.student_id,
        title: "Application Status Update: Application Rejected",
        message: `Your application for ${application.preferred_course || "programme"} was reviewed: ${rejectNote}. Please contact your advisor for assistance.`,
        type: "application",
        is_read: false,
      });

      return NextResponse.json({
        success: true,
        message: "Application has been marked as Rejected.",
        newStatus: "Rejected",
      });
    }

    // ── ACTION 2: UPDATE UNIVERSITY STATUS ──
    if (action === "update_university_status") {
      let { status } = body;
      
      // Map any non-enum or legacy values to valid Postgres enum values
      if (status === "Offer Letter Received" || status === "Offer Letter") {
        status = "Submitted to University";
      }

      const validPostgresStatuses = [
        "Profile Completed",
        "Under Review",
        "Submitted to University",
        "Visa Approved",
        "Rejected",
      ];

      if (!status || !validPostgresStatuses.includes(status)) {
        return NextResponse.json(
          {
            success: false,
            error: `Invalid status "${status}". Allowed database statuses: ${validPostgresStatuses.join(", ")}.`,
          },
          { status: 400 }
        );
      }

      const { error: updateErr } = await adminClient
        .from("applications")
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", applicationId);

      if (updateErr) {
        return NextResponse.json({ success: false, error: updateErr.message }, { status: 500 });
      }

      // Record audit log
      await adminClient.from("audit_logs").insert({
        user_id: authenticatedUserId,
        action: "university_status_updated",
        target_type: "application",
        target_id: applicationId,
        details: {
          officer_name: officerName,
          previous_status: application.status,
          new_status: status,
          student_id: application.student_id,
        },
      });

      // Notify student
      await adminClient.from("notifications").insert({
        user_id: application.student_id,
        title: "Application Status Updated",
        message: `Your application status for ${application.preferred_course || "programme"} has been updated to "${status}".`,
        type: "application",
        is_read: false,
      });

      return NextResponse.json({
        success: true,
        message: `Application stage successfully updated to "${status}".`,
        newStatus: status,
      });
    }

    // ── ACTION 3: VERIFY DOCUMENT ──
    if (action === "verify_document") {
      const { documentId } = body;
      if (!documentId) {
        return NextResponse.json({ success: false, error: "Document ID is required." }, { status: 400 });
      }

      const { error: docErr } = await adminClient
        .from("documents")
        .update({
          is_verified: true,
          verified_by: authenticatedUserId,
        })
        .eq("id", documentId)
        .eq("student_id", application.student_id);

      if (docErr) {
        return NextResponse.json({ success: false, error: docErr.message }, { status: 500 });
      }

      // Audit log
      await adminClient.from("audit_logs").insert({
        user_id: authenticatedUserId,
        action: "document_verified",
        target_type: "document",
        target_id: documentId,
        details: {
          officer_name: officerName,
          application_id: applicationId,
          student_id: application.student_id,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Document marked as verified.",
      });
    }

    // ── ACTION 4: REQUEST DOCUMENT REPLACEMENT ──
    if (action === "request_document_replacement") {
      const { documentId, documentType, reason, comment } = body;
      const selectedReason = reason || "Unclear";
      const officerComment = comment || "Please upload a clearer copy of your document.";

      if (documentId) {
        await adminClient
          .from("documents")
          .update({
            is_verified: false,
            verified_by: null,
          })
          .eq("id", documentId);
      }

      // Update application notes
      const existingNotes = application.notes ? `${application.notes}\n` : "";
      const newNote = `[Doc Replacement Requested] ${documentType || "Document"}: ${selectedReason} - ${officerComment}`;

      await adminClient
        .from("applications")
        .update({
          notes: `${existingNotes}${newNote}`.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", applicationId);

      // Notify student
      await adminClient.from("notifications").insert({
        user_id: application.student_id,
        title: `Action Required: Document Replacement Requested`,
        message: `Your Admission Officer requested a replacement for ${documentType || "document"}. Reason: ${selectedReason}. Note: "${officerComment}".`,
        type: "document",
        is_read: false,
      });

      // Audit log
      await adminClient.from("audit_logs").insert({
        user_id: authenticatedUserId,
        action: "document_replacement_requested",
        target_type: "document",
        target_id: documentId || applicationId,
        details: {
          officer_name: officerName,
          document_type: documentType,
          reason: selectedReason,
          comment: officerComment,
          student_id: application.student_id,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Replacement request sent to student successfully.",
      });
    }

    // ── ACTION 5: ADD COMMENT ──
    if (action === "add_comment") {
      const { message, notifyStudent } = body;
      if (!message || typeof message !== "string" || !message.trim()) {
        return NextResponse.json({ success: false, error: "Comment message is required." }, { status: 400 });
      }

      const trimmedMessage = message.trim();
      const existingNotes = application.notes ? `${application.notes}\n` : "";
      const dateHeader = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
      const newNote = `[${dateHeader}] ${officerName}: ${trimmedMessage}`;

      await adminClient
        .from("applications")
        .update({
          notes: `${existingNotes}${newNote}`.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", applicationId);

      if (notifyStudent !== false) {
        await adminClient.from("notifications").insert({
          user_id: application.student_id,
          title: "New Note from Admission Officer",
          message: `Officer ${officerName} left a comment on your application: "${trimmedMessage}"`,
          type: "application",
          is_read: false,
        });
      }

      // Audit log
      await adminClient.from("audit_logs").insert({
        user_id: authenticatedUserId,
        action: "admission_comment_added",
        target_type: "application",
        target_id: applicationId,
        details: {
          officer_name: officerName,
          comment: trimmedMessage,
          student_id: application.student_id,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Comment saved successfully.",
        note: newNote,
      });
    }

    return NextResponse.json({ success: false, error: `Unknown action: "${action}"` }, { status: 400 });
  } catch (err: any) {
    console.error("[AppActionAPI] Unexpected error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
