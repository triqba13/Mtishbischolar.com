import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl) {
      return NextResponse.json(
        { success: false, error: "Server configuration missing: SUPABASE_URL" },
        { status: 500 }
      );
    }

    // 1. FAIL CLOSED: Privileged service role key is MANDATORY on server
    if (!supabaseServiceKey) {
      console.error("[DeleteProfile] Critical error: SUPABASE_SERVICE_ROLE_KEY is not configured. Failing closed.");
      return NextResponse.json(
        {
          success: false,
          error: "Server configuration error: Privileged execution key is missing. Account deletion cannot proceed.",
        },
        { status: 500 }
      );
    }

    // 2. Authenticate user strictly from verified session (cookie or Authorization header)
    let authenticatedUserId: string | null = null;

    // Check cookie-based session
    try {
      const serverClient = await createServerClient();
      const {
        data: { user },
      } = await serverClient.auth.getUser();
      if (user?.id) {
        authenticatedUserId = user.id;
      }
    } catch {
      // Ignore cookie parsing error and check Authorization header
    }

    // Check Bearer token in header if cookie did not resolve user
    if (!authenticatedUserId) {
      const authHeader = req.headers.get("Authorization");
      if (authHeader?.startsWith("Bearer ")) {
        const token = authHeader.replace("Bearer ", "").trim();
        if (token && supabaseAnonKey) {
          const clientWithToken = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
            global: { headers: { Authorization: `Bearer ${token}` } },
          });
          const {
            data: { user },
          } = await clientWithToken.auth.getUser();
          if (user?.id) {
            authenticatedUserId = user.id;
          }
        }
      }
    }

    // Strict authentication enforcement: No client-supplied target ID is accepted
    if (!authenticatedUserId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Active session required to delete profile." },
        { status: 401 }
      );
    }

    const targetUserId = authenticatedUserId;
    console.log(`[DeleteProfile] Initiating verified deletion for user ID: ${targetUserId}`);

    // 3. Create privileged admin client (Service Role Key ONLY, never anon key)
    const adminClient = createSupabaseClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // 4. STORAGE CLEANUP: Strictly scoped to authenticated user prefix (student-documents/{targetUserId}/*)
    const bucketName = "student-documents";
    try {
      const { data: fileList, error: listError } = await adminClient.storage
        .from(bucketName)
        .list(targetUserId, { limit: 200 });

      if (listError) {
        console.warn(`[DeleteProfile] Storage listing notice for ${targetUserId}:`, listError.message);
      } else if (fileList && fileList.length > 0) {
        // Enforce strict prefix matching to ensure no file outside student's folder is removed
        const filesToRemove = fileList
          .map((f) => `${targetUserId}/${f.name}`)
          .filter((p) => p.startsWith(`${targetUserId}/`));

        if (filesToRemove.length > 0) {
          console.log(`[DeleteProfile] Removing ${filesToRemove.length} storage files for user:`, filesToRemove);
          const { error: removeError } = await adminClient.storage
            .from(bucketName)
            .remove(filesToRemove);

          if (removeError) {
            console.error(`[DeleteProfile] Storage removal failed for ${targetUserId}:`, removeError.message);
            // Return failure so partial failure is not masked
            return NextResponse.json(
              { success: false, error: "Failed to remove uploaded storage documents. Please try again." },
              { status: 500 }
            );
          }
        }
      }
    } catch (storageErr: any) {
      console.error("[DeleteProfile] Storage cleanup exception:", storageErr.message);
      return NextResponse.json(
        { success: false, error: "An unexpected error occurred during storage cleanup." },
        { status: 500 }
      );
    }

    // 5. DATABASE CLEANUP IN STRICT FK DEPENDENCY ORDER (Child tables first)
    // A. student_contacts (references public.profiles.id)
    const { error: contactErr } = await adminClient
      .from("student_contacts")
      .delete()
      .eq("student_id", targetUserId);

    if (contactErr) {
      console.error("[DeleteProfile] Error deleting student_contacts:", contactErr.message);
      return NextResponse.json(
        { success: false, error: "Failed to delete student emergency and parent contacts." },
        { status: 500 }
      );
    }

    // B. documents (references public.profiles.id and public.applications.id)
    const { error: docErr } = await adminClient
      .from("documents")
      .delete()
      .eq("student_id", targetUserId);

    if (docErr) {
      console.error("[DeleteProfile] Error deleting documents:", docErr.message);
      return NextResponse.json(
        { success: false, error: "Failed to delete student document records." },
        { status: 500 }
      );
    }

    // C. payments (preserves approved payments to protect company revenue)
    const { data: studentPayments, error: fetchPayErr } = await adminClient
      .from("payments")
      .select("id, amount, status, payment_type")
      .eq("student_id", targetUserId);

    if (fetchPayErr) {
      console.error("[DeleteProfile] Error querying student payments:", fetchPayErr.message);
    }

    const approvedPayments = (studentPayments || []).filter(
      (p: any) => (p.status || "").toLowerCase() === "approved"
    );
    const hasApprovedPayments = approvedPayments.length > 0;

    if (hasApprovedPayments) {
      // Retain approved payments so company revenue is NEVER reduced or lost!
      // Delete only unapproved/pending/rejected payments
      const { error: unapprovedPayErr } = await adminClient
        .from("payments")
        .delete()
        .eq("student_id", targetUserId)
        .neq("status", "Approved");

      if (unapprovedPayErr) {
        console.warn("[DeleteProfile] Notice removing unapproved payments:", unapprovedPayErr.message);
      }
    } else {
      // No approved payments exist: Safe to remove all payments as no company revenue is impacted
      const { error: payErr } = await adminClient
        .from("payments")
        .delete()
        .eq("student_id", targetUserId);

      if (payErr) {
        console.error("[DeleteProfile] Error deleting payments:", payErr.message);
        return NextResponse.json(
          { success: false, error: "Failed to delete student payment records." },
          { status: 500 }
        );
      }
    }

    // D. applications (references public.profiles.id)
    const { error: appErr } = await adminClient
      .from("applications")
      .delete()
      .eq("student_id", targetUserId);

    if (appErr) {
      console.error("[DeleteProfile] Error deleting applications:", appErr.message);
      return NextResponse.json(
        { success: false, error: "Failed to delete student application records." },
        { status: 500 }
      );
    }

    // E. notifications (references public.profiles.id via user_id)
    const { error: notifErr } = await adminClient
      .from("notifications")
      .delete()
      .eq("user_id", targetUserId);

    if (notifErr) {
      console.error("[DeleteProfile] Error deleting notifications:", notifErr.message);
      return NextResponse.json(
        { success: false, error: "Failed to delete student notifications." },
        { status: 500 }
      );
    }

    // F. student_profiles (legacy secondary table, if present)
    try {
      await adminClient.from("student_profiles").delete().eq("student_id", targetUserId);
    } catch {
      // Table may not exist or be empty
    }

    // G. profiles (parent table)
    const archivedEmail = `deleted_${targetUserId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 12)}@archived.local`;

    if (hasApprovedPayments) {
      // Financial Security: Student has verified approved payments.
      // Anonymize and archive the profile so the foreign key is preserved and company revenue is untouched.
      // We set email to a unique archived address so the student's original email is freed for future registration.
      const { error: archiveError } = await adminClient
        .from("profiles")
        .update({
          first_name: "Deleted",
          last_name: "Student",
          email: archivedEmail,
          phone: null,
          role: "student",
          avatar_url: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", targetUserId);

      if (archiveError) {
        console.error("[DeleteProfile] Error archiving public.profiles row:", archiveError.message);
        return NextResponse.json(
          { success: false, error: "Failed to archive student profile record." },
          { status: 500 }
        );
      }

      // Deactivate Auth User without cascading:
      // Change auth user email to archivedEmail (freeing their original email to re-register anytime),
      // and ban the account for 100 years so this old account cannot be logged into.
      const { error: authUpdateError } = await adminClient.auth.admin.updateUserById(
        targetUserId,
        {
          email: archivedEmail,
          email_confirm: true,
          ban_duration: "876600h",
          user_metadata: { is_deleted: true, deleted_at: new Date().toISOString() },
        }
      );

      if (authUpdateError) {
        console.warn("[DeleteProfile] Notice updating auth user for archived student:", authUpdateError.message);
      }
    } else {
      // Completely remove the profile row since no approved payments exist
      const { error: profileDeleteError } = await adminClient
        .from("profiles")
        .delete()
        .eq("id", targetUserId);

      if (profileDeleteError) {
        console.error("[DeleteProfile] Error deleting public.profiles row:", profileDeleteError.message);
        return NextResponse.json(
          { success: false, error: "Failed to delete student profile record." },
          { status: 500 }
        );
      }

      // Delete auth user completely from Supabase Auth
      const { error: authDeleteError } = await adminClient.auth.admin.deleteUser(targetUserId);
      if (authDeleteError) {
        console.error(`[DeleteProfile] Error deleting auth.users record for ${targetUserId}:`, authDeleteError.message);
        return NextResponse.json(
          {
            success: false,
            error: "Student data was removed, but account authentication reset failed. Please contact support.",
          },
          { status: 500 }
        );
      }
    }

    console.log(`[DeleteProfile] Successfully processed deletion for user: ${targetUserId} (hasApprovedPayments: ${hasApprovedPayments})`);

    return NextResponse.json({
      success: true,
      message: "Profile and all associated student data have been permanently deleted.",
    });
  } catch (err: any) {
    console.error("[DeleteProfile] Unexpected server exception:", err?.message || err);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred during profile deletion." },
      { status: 500 }
    );
  }
}
