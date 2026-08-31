import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ success: false, error: "Server configuration missing." }, { status: 500 });
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
      .select("id, role")
      .eq("id", authenticatedUserId)
      .maybeSingle();

    const normalizedRole = (profile?.role || "").trim().toLowerCase();
    if (!["admission_officer", "super_admin"].includes(normalizedRole)) {
      return NextResponse.json({ success: false, error: "Forbidden." }, { status: 403 });
    }

    // 1. Incoming Notifications: Exclude payment / finance receipts; include applications, documents, passports, visas
    const { data: incomingNotifs, error: inErr } = await adminClient
      .from("notifications")
      .select("*")
      .neq("type", "payment")
      .not("title", "ilike", "%payment%")
      .not("title", "ilike", "%fee%")
      .order("created_at", { ascending: false })
      .limit(50);

    if (inErr) {
      console.error("[AdmissionNotifs] Fetch error:", inErr);
    }

    // 2. Outgoing Notifications: Sent to students regarding applications or admission
    const { data: outgoingNotifs, error: outErr } = await adminClient
      .from("notifications")
      .select(`
        *,
        recipient:user_id (
          id,
          first_name,
          last_name,
          email,
          role
        )
      `)
      .in("type", ["application", "document", "visa", "general"])
      .order("created_at", { ascending: false })
      .limit(50);

    if (outErr) {
      console.error("[AdmissionNotifs] Outgoing fetch error:", outErr);
    }

    const unreadCount = (incomingNotifs || []).filter((n) => !n.is_read).length;

    return NextResponse.json({
      success: true,
      unreadCount,
      incoming: incomingNotifs || [],
      outgoing: outgoingNotifs || [],
    });
  } catch (err: any) {
    console.error("[AdmissionNotifs] Unhandled error:", err);
    return NextResponse.json({ success: false, error: err.message || "Failed to load notifications." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ success: false, error: "Server config missing." }, { status: 500 });
    }

    const adminClient = createSupabaseClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const body = await req.json();
    const { notificationId, markAllRead } = body;

    if (markAllRead) {
      await adminClient
        .from("notifications")
        .update({ is_read: true })
        .neq("type", "payment")
        .eq("is_read", false);

      return NextResponse.json({ success: true, message: "All marked as read." });
    }

    if (notificationId) {
      await adminClient
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notificationId);

      return NextResponse.json({ success: true, message: "Notification marked as read." });
    }

    return NextResponse.json({ success: false, error: "Missing parameters." }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
