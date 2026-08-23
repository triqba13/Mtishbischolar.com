import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ success: false, error: "Server config missing" }, { status: 500 });
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
          console.warn("[DocAction] Bearer auth error:", tokenErr);
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
      return NextResponse.json(
        { success: false, error: "Forbidden: Admission Officer permissions required." },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { action, documentId, reason, comment } = body;

    if (!documentId) {
      return NextResponse.json({ success: false, error: "Missing documentId" }, { status: 400 });
    }

    // Fetch document
    const { data: doc, error: docErr } = await adminClient
      .from("documents")
      .select("id, student_id, document_type, file_name, is_verified")
      .eq("id", documentId)
      .maybeSingle();

    if (docErr || !doc) {
      return NextResponse.json({ success: false, error: "Document not found" }, { status: 404 });
    }

    const docTypeClean = (doc.document_type || "Document").replace(/_/g, " ");

    if (action === "verify" || action === "verify_document") {
      // 1. Mark verified in DB
      const { error: updateErr } = await adminClient
        .from("documents")
        .update({
          is_verified: true,
          verified_by: authenticatedUserId,
        })
        .eq("id", documentId);

      if (updateErr) {
        return NextResponse.json({ success: false, error: updateErr.message }, { status: 500 });
      }

      // 2. Insert audit log
      try {
        await adminClient.from("audit_logs").insert({
          user_id: authenticatedUserId,
          action: "VERIFY_DOCUMENT",
          entity_type: "document",
          entity_id: documentId,
          details: {
            document_type: doc.document_type,
            file_name: doc.file_name,
            student_id: doc.student_id,
          },
        });
      } catch (logErr) {
        console.warn("[DocAction] Audit log warning:", logErr);
      }

      // 3. Notify student
      if (doc.student_id) {
        try {
          await adminClient.from("notifications").insert({
            user_id: doc.student_id,
            title: "Document Verified",
            message: `Your ${docTypeClean} has been reviewed and verified by the Admission Officer.`,
            type: "document",
            is_read: false,
          });
        } catch (notifErr) {
          console.warn("[DocAction] Notification warning:", notifErr);
        }
      }

      return NextResponse.json({
        success: true,
        message: "Document successfully verified.",
      });
    } else if (action === "request_replacement" || action === "request_document_replacement") {
      // 1. Mark unverified
      const { error: updateErr } = await adminClient
        .from("documents")
        .update({
          is_verified: false,
          verified_by: null,
        })
        .eq("id", documentId);

      if (updateErr) {
        return NextResponse.json({ success: false, error: updateErr.message }, { status: 500 });
      }

      // 2. Insert audit log
      try {
        await adminClient.from("audit_logs").insert({
          user_id: authenticatedUserId,
          action: "REQUEST_DOCUMENT_REPLACEMENT",
          entity_type: "document",
          entity_id: documentId,
          details: {
            document_type: doc.document_type,
            file_name: doc.file_name,
            reason: reason || "Unclear",
            comment: comment || "",
            student_id: doc.student_id,
          },
        });
      } catch (logErr) {
        console.warn("[DocAction] Audit log warning:", logErr);
      }

      // 3. Notify student with high priority replacement alert
      if (doc.student_id) {
        try {
          const detailMsg = comment
            ? `Admission Officer requested replacement for ${docTypeClean} (Reason: ${reason}). Note: "${comment}". Please upload a new copy.`
            : `Admission Officer requested replacement for ${docTypeClean} (Reason: ${reason}). Please upload a new copy.`;

          await adminClient.from("notifications").insert({
            user_id: doc.student_id,
            title: "Document Replacement Requested",
            message: detailMsg,
            type: "document",
            is_read: false,
          });
        } catch (notifErr) {
          console.warn("[DocAction] Notification warning:", notifErr);
        }
      }

      return NextResponse.json({
        success: true,
        message: "Replacement request sent to student successfully.",
      });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    console.error("[DocAction] Uncaught error:", err);
    return NextResponse.json({ success: false, error: err.message || "Internal server error" }, { status: 500 });
  }
}
