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

    const normalizedRole = (profile.role || "").trim().toLowerCase();
    const isFinanceOrSuperAdmin =
      normalizedRole === "finance_officer" || normalizedRole === "super_admin";

    if (!isFinanceOrSuperAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden: Only Finance Officers or Super Admins can access financial records.",
        },
        { status: 403 }
      );
    }

    // 4. Query public.payments with joined student profile data
    // This strictly ensures ONLY students with actual payment records are retrieved
    const { data: paymentsData, error: paymentsErr } = await adminClient
      .from("payments")
      .select(`
        id,
        student_id,
        amount,
        currency,
        payment_type,
        payment_method,
        transaction_ref,
        status,
        created_at,
        verified_at,
        rejection_reason,
        student:profiles!payments_student_id_fkey(id, first_name, last_name, email, phone, role, created_at)
      `)
      .order("created_at", { ascending: false });

    if (paymentsErr) {
      console.error("[FinanceStudentsAPI] Query error:", paymentsErr);
      return NextResponse.json(
        { success: false, error: "Failed to fetch student financial records." },
        { status: 500 }
      );
    }

    // 5. Group payments by student_id to ensure exactly ONE row per student
    const studentMap = new Map<string, any>();

    (paymentsData || []).forEach((p: any) => {
      if (!p.student_id) return;

      const studentProfile = p.student || {
        id: p.student_id,
        first_name: "Student",
        last_name: "",
        email: null,
        phone: null,
        role: "student",
        created_at: p.created_at,
      };

      // Exclude archived/deleted students from active directory while preserving their revenue
      if (
        studentProfile.role === "archived_student" ||
        studentProfile.first_name === "Deleted" ||
        (studentProfile.email || "").endsWith("@archived.local")
      ) {
        return;
      }

      if (!studentMap.has(p.student_id)) {
        studentMap.set(p.student_id, {
          id: studentProfile.id,
          first_name: studentProfile.first_name,
          last_name: studentProfile.last_name,
          email: studentProfile.email,
          phone: studentProfile.phone,
          created_at: studentProfile.created_at,
          payments: [],
        });
      }

      const existingStudent = studentMap.get(p.student_id);
      existingStudent.payments.push({
        id: p.id,
        amount: Number(p.amount) || 0,
        currency: p.currency || "TZS",
        payment_type: p.payment_type || "file_opening_fee",
        payment_method: p.payment_method || "Mobile Money",
        transaction_ref: p.transaction_ref || null,
        status: p.status || "Pending",
        created_at: p.created_at,
        verified_at: p.verified_at || null,
        rejection_reason: p.rejection_reason || null,
      });
    });

    const students = Array.from(studentMap.values());

    return NextResponse.json({
      success: true,
      data: students,
      total: students.length,
    });
  } catch (err: any) {
    console.error("[FinanceStudentsAPI] Unexpected error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
