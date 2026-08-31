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
          console.warn("[AdminNotificationsAPI] Bearer auth error:", tokenErr);
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
      .select("id, role, first_name, last_name")
      .eq("id", authenticatedUserId)
      .maybeSingle();

    if (profileErr || !profile) {
      return NextResponse.json(
        { success: false, error: "User profile not found." },
        { status: 401 }
      );
    }

    const normalizedRole = (profile.role || "").trim().toLowerCase();
    if (!["finance_officer", "admission_officer", "super_admin"].includes(normalizedRole)) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Access restricted to Staff and Admins." },
        { status: 403 }
      );
    }

    // 3. Query notifications tailored to the officer's role
    let query = adminClient
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (normalizedRole === "finance_officer") {
      // Finance officer sees notifications addressed to them or payment-related
      query = query.or(`user_id.eq.${authenticatedUserId},and(type.eq.payment,user_id.is.null)`);
    } else if (normalizedRole === "admission_officer") {
      // Admission officer sees notifications addressed to them or application/document-related (strictly excluding payment/finance)
      query = query
        .or(`user_id.eq.${authenticatedUserId},and(type.in.(application,document,passport,student),user_id.is.null)`)
        .neq("type", "payment")
        .not("title", "ilike", "%payment%")
        .not("title", "ilike", "%fee%");
    } else {
      // Super admin sees all notifications or notifications addressed to them
      query = query.or(`user_id.eq.${authenticatedUserId},user_id.is.null,type.in.(payment,application,document,passport,student,system)`);
    }

    const { data: rawNotifs, error: notifErr } = await query;

    if (notifErr) {
      console.error("[AdminNotificationsAPI] Fetch error:", notifErr);
      return NextResponse.json({ success: false, error: notifErr.message }, { status: 500 });
    }

    const notifications = (rawNotifs || []).map((n: any) => {
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

      // Resolve destination link
      let resolvedLink: string = "/admin/finance/dashboard";
      if (n.type === "payment") {
        resolvedLink = "/admin/finance/payments";
      } else if (n.type === "application") {
        resolvedLink = "/admin/admission/applications";
      } else if (n.type === "document") {
        resolvedLink = "/admin/admission/documents";
      } else if (n.type === "passport") {
        resolvedLink = "/admin/admission/passport";
      } else if (normalizedRole === "finance_officer") {
        resolvedLink = "/admin/finance/dashboard";
      } else {
        resolvedLink = "/admin/admission/dashboard";
      }

      return {
        id: n.id,
        user_id: n.user_id,
        title: n.title || "Notification",
        message: n.message || "",
        type: n.type || "system",
        time: timeAgo,
        is_read: Boolean(n.is_read),
        read: Boolean(n.is_read),
        link: resolvedLink,
        created_at: n.created_at,
      };
    });

    const unreadCount = notifications.filter((n: any) => !n.is_read).length;

    return NextResponse.json({
      success: true,
      notifications,
      unreadCount,
    });
  } catch (err: any) {
    console.error("[AdminNotificationsAPI] Error:", err);
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
    const { action, id, userId } = body;

    if (action === "mark_all_read") {
      let q = adminClient.from("notifications").update({ is_read: true }).eq("is_read", false);
      if (userId) {
        q = q.eq("user_id", userId);
      }
      const { error } = await q;
      if (error) throw error;
      return NextResponse.json({ success: true, message: "All notifications marked as read." });
    } else if (action === "mark_read" && id) {
      const { error } = await adminClient
        .from("notifications")
        .update({ is_read: true })
        .eq("id", id);
      if (error) throw error;
      return NextResponse.json({ success: true, message: "Notification marked as read." });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
