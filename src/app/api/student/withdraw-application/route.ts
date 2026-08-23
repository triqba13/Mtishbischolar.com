import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

export const ALLOWED_DELETE_STATUSES = [
  "Profile Completed",
  "Under Review",
  "Submitted to University",
];

export async function POST(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl) {
      return NextResponse.json(
        { success: false, error: "Server configuration missing: NEXT_PUBLIC_SUPABASE_URL" },
        { status: 500 }
      );
    }

    if (!supabaseServiceKey) {
      return NextResponse.json(
        { success: false, error: "Server configuration missing: SUPABASE_SERVICE_ROLE_KEY" },
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
          console.warn("[WithdrawApp] Bearer token auth error:", tokenErr);
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
        // Ignore cookie parsing error
      }
    }

    if (!authenticatedUserId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Active user session required." },
        { status: 401 }
      );
    }

    // 2. Parse request body
    const body = await req.json().catch(() => ({}));
    const { applicationId } = body;
    const reason = (body.reason || body.withdrawalReason || "").trim();

    if (!applicationId || typeof applicationId !== "string") {
      return NextResponse.json(
        { success: false, error: "Invalid or missing applicationId." },
        { status: 400 }
      );
    }

    // 3. Create privileged admin client
    const adminClient = createSupabaseClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // 4. Resolve authenticated user's profile
    const { data: profile, error: profileErr } = await adminClient
      .from("profiles")
      .select("id, role, first_name, last_name, email")
      .eq("id", authenticatedUserId)
      .maybeSingle();

    if (profileErr || !profile) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: User profile not found." },
        { status: 401 }
      );
    }

    // 5. Fetch existing application to verify ownership & stage
    const { data: existingApp, error: fetchErr } = await adminClient
      .from("applications")
      .select("id, status, student_id, preferred_course, target_country")
      .eq("id", applicationId)
      .maybeSingle();

    if (fetchErr || !existingApp) {
      return NextResponse.json(
        { success: false, error: "Application not found." },
        { status: 404 }
      );
    }

    // 6. Verify ownership (application.student_id === authenticatedUserId or profile.id)
    const isOwner =
      existingApp.student_id === authenticatedUserId ||
      existingApp.student_id === profile.id;

    console.log("[WithdrawApp] Diagnostics:", {
      authenticatedUserId,
      profileId: profile.id,
      applicationId,
      applicationOwnerId: existingApp.student_id,
      isOwner,
    });

    if (!isOwner) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: You do not own this application." },
        { status: 403 }
      );
    }

    // 7. Verify deletable status
    if (!ALLOWED_DELETE_STATUSES.includes(existingApp.status)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "This application has reached an official admission stage and cannot be deleted. Please contact your Admission Officer for assistance.",
        },
        { status: 400 }
      );
    }

    // 8. Record audit log if reason was provided
    try {
      await adminClient.from("audit_logs").insert({
        user_id: authenticatedUserId,
        action: "application_withdrawn",
        target_type: "application",
        target_id: applicationId,
        details: {
          preferred_course: existingApp.preferred_course,
          target_country: existingApp.target_country,
          status_at_withdrawal: existingApp.status,
          reason: reason || null,
        },
      });
    } catch (auditErr) {
      console.warn("[WithdrawApp] Audit log warning:", auditErr);
    }

    // 9. Safely unlink child records (set application_id = NULL) without deleting student academic files or payment history
    await adminClient
      .from("documents")
      .update({ application_id: null })
      .eq("application_id", applicationId)
      .eq("student_id", authenticatedUserId);

    await adminClient
      .from("payments")
      .update({ application_id: null })
      .eq("application_id", applicationId)
      .eq("student_id", authenticatedUserId);

    // 10. Permanently delete the application from public.applications
    const { error: deleteErr, count } = await adminClient
      .from("applications")
      .delete({ count: "exact" })
      .eq("id", applicationId)
      .eq("student_id", authenticatedUserId);

    if (deleteErr) {
      console.error("[WithdrawApp] Error deleting application:", deleteErr);
      return NextResponse.json(
        { success: false, error: deleteErr.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Application permanently deleted.",
      deletedCount: count,
    });
  } catch (err: any) {
    console.error("[WithdrawApp] Unexpected error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
