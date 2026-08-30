import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { success: false, error: "Server configuration missing." },
        { status: 500 }
      );
    }

    const adminClient = createSupabaseClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const body = await req.json().catch(() => ({}));
    const { studentId, formData = {} } = body;

    // 1. Authenticate user from Bearer token or server session cookie
    let authenticatedUserId: string | null = null;

    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "").trim();
      if (token) {
        try {
          const {
            data: { user },
            error: tokenErr,
          } = await adminClient.auth.getUser(token);
          if (user?.id && !tokenErr) {
            authenticatedUserId = user.id;
          }
        } catch (tokenErr) {
          console.warn("[SavePassportFormAPI] Bearer auth error:", tokenErr);
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
        console.warn("[SavePassportFormAPI] Server cookie auth error:", cookieErr);
      }
    }

    const targetUserId = authenticatedUserId || studentId;
    if (!targetUserId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Active session required." },
        { status: 401 }
      );
    }

    if (authenticatedUserId && studentId && authenticatedUserId !== studentId) {
      const { data: staffProf } = await adminClient
        .from("profiles")
        .select("role")
        .eq("id", authenticatedUserId)
        .maybeSingle();

      const isStaff = ["admission_officer", "super_admin", "finance_officer"].includes(
        staffProf?.role || ""
      );
      if (!isStaff) {
        return NextResponse.json(
          { success: false, error: "Forbidden: You cannot modify another student's passport record." },
          { status: 403 }
        );
      }
    }

    // 2. Prepare payload
    const updatePayload: Record<string, any> = {
      ...formData,
      student_id: targetUserId,
      updated_at: new Date().toISOString(),
    };

    // Check if record exists in passport_assistance
    const { data: existing } = await adminClient
      .from("passport_assistance")
      .select("id, assistance_status, payment_status")
      .eq("student_id", targetUserId)
      .maybeSingle();

    let resData: any = null;

    if (existing?.id) {
      const { data, error: updErr } = await adminClient
        .from("passport_assistance")
        .update(updatePayload)
        .eq("id", existing.id)
        .select("*")
        .single();

      if (updErr) {
        console.error("[SavePassportFormAPI] Update error:", updErr);
        return NextResponse.json({ success: false, error: updErr.message }, { status: 500 });
      }
      resData = data;
    } else {
      const { data, error: insErr } = await adminClient
        .from("passport_assistance")
        .insert([
          {
            ...updatePayload,
            assistance_status: updatePayload.assistance_status || "form_pending",
            status: "pending",
            payment_status: "not_paid",
          },
        ])
        .select("*")
        .single();

      if (insErr) {
        console.error("[SavePassportFormAPI] Insert error:", insErr);
        return NextResponse.json({ success: false, error: insErr.message }, { status: 500 });
      }
      resData = data;
    }

    return NextResponse.json({
      success: true,
      data: resData,
      message: "Passport assistance details saved successfully.",
    });
  } catch (err: any) {
    console.error("[SavePassportFormAPI] Unhandled error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Internal server error." },
      { status: 500 }
    );
  }
}
