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

    // 1. Authenticate user strictly from verified session (cookie or Authorization header)
    let authenticatedUserId: string | null = null;

    try {
      const serverClient = await createServerClient();
      const {
        data: { user },
      } = await serverClient.auth.getUser();
      if (user?.id) {
        authenticatedUserId = user.id;
      }
    } catch {
      // Ignore cookie parsing error and check Authorization header fallback
    }

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

    if (!authenticatedUserId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Active officer session required." },
        { status: 401 }
      );
    }

    // 2. Create privileged service-role admin client
    const adminClient = createSupabaseClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // 3. Verify user's role in public.profiles (Must be finance_officer or super_admin)
    const { data: profile, error: profileErr } = await adminClient
      .from("profiles")
      .select("id, role, first_name, last_name, email")
      .eq("id", authenticatedUserId)
      .maybeSingle();

    if (profileErr || !profile) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Profile record not found." },
        { status: 403 }
      );
    }

    const isFinanceOrSuperAdmin =
      profile.role === "finance_officer" || profile.role === "super_admin";

    if (!isFinanceOrSuperAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden: Only Finance Officers or Super Admins can access financial records.",
        },
        { status: 403 }
      );
    }

    // 4. Fetch all payments with student profile join
    const { data: payments, error: payError } = await adminClient
      .from("payments")
      .select(
        "*, student:profiles!payments_student_id_fkey(id, first_name, last_name, email, phone)"
      )
      .order("created_at", { ascending: false });

    if (payError) {
      console.error("Finance Payments Supabase Error:", {
        message: payError.message,
        details: payError.details,
        hint: payError.hint,
        code: payError.code,
      });
      return NextResponse.json(
        { success: false, error: "Database error retrieving payments." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: payments || [],
    });
  } catch (err: any) {
    console.error("Finance Payments Route Error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to load payments." },
      { status: 500 }
    );
  }
}
