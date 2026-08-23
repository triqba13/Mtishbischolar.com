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
          console.warn("[NotificationsAPI] Bearer auth error:", tokenErr);
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

    // 3. Fetch notifications for user (or broadcast admission notifications)
    const { data: notifData, error: notifErr } = await adminClient
      .from("notifications")
      .select("id, user_id, title, message, type, is_read, created_at")
      .or(`user_id.eq.${authenticatedUserId},user_id.is.null`)
      .order("created_at", { ascending: false })
      .limit(50);

    if (notifErr) {
      return NextResponse.json({ success: false, error: notifErr.message }, { status: 500 });
    }

    const notifications = (notifData || []).map((n) => {
      let timeAgo = "Just now";
      if (n.created_at) {
        const diffMs = Date.now() - new Date(n.created_at).getTime();
        const diffMin = Math.floor(diffMs / (1000 * 60));
        const diffHr = Math.floor(diffMin / 60);
        const diffDays = Math.floor(diffHr / 24);

        if (diffDays > 0) timeAgo = `${diffDays}d ago`;
        else if (diffHr > 0) timeAgo = `${diffHr}h ago`;
        else if (diffMin > 0) timeAgo = `${diffMin}m ago`;
        else timeAgo = "Just now";
      }

      // Dynamically resolve target link from notification type
      let resolvedLink: string | null = null;
      if (n.type === "application") resolvedLink = "/admin/admission/applications";
      else if (n.type === "document") resolvedLink = "/admin/admission/documents";
      else if (n.type === "passport") resolvedLink = "/admin/admission/passport";
      else if (n.type === "payment") resolvedLink = "/admin/finance/payments";

      return {
        id: n.id,
        title: n.title || "Notification",
        message: n.message || "",
        type: n.type || "system",
        time: timeAgo,
        read: !!n.is_read,
        link: resolvedLink,
        created_at: n.created_at,
      };
    });

    return NextResponse.json({
      success: true,
      notifications,
    });
  } catch (err: any) {
    console.error("[NotificationsAPI] Error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ success: false, error: "Server config error" }, { status: 500 });
    }

    const adminClient = createSupabaseClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const body = await req.json().catch(() => ({}));
    const { action, id } = body;

    if (action === "mark_all_read") {
      await adminClient.from("notifications").update({ is_read: true }).eq("is_read", false);
      return NextResponse.json({ success: true });
    } else if (action === "mark_read" && id) {
      await adminClient.from("notifications").update({ is_read: true }).eq("id", id);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
