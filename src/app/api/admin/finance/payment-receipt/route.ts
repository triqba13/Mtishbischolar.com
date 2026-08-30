import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { extractStoragePath } from "@/lib/supabase/data";

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

    const adminClient = createSupabaseClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // 1. Authenticate user strictly from verified session (Authorization header or cookie)
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
          console.warn("[PaymentReceiptAPI] Bearer auth error:", tokenErr);
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
        console.warn("[PaymentReceiptAPI] Cookie auth error:", cookieErr);
      }
    }

    if (!authenticatedUserId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Active officer session required." },
        { status: 401 }
      );
    }

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
          error: "Forbidden: Only Finance Officers or Super Admins can access payment receipts.",
        },
        { status: 403 }
      );
    }

    // 4. Parse paymentId from searchParams
    const { searchParams } = new URL(req.url);
    const paymentId = searchParams.get("paymentId") || searchParams.get("id");

    if (!paymentId) {
      return NextResponse.json(
        { success: false, error: "Missing required parameter: paymentId" },
        { status: 400 }
      );
    }

    // 5. Fetch payment record to retrieve payment_proof_url
    const { data: payment, error: payError } = await adminClient
      .from("payments")
      .select("id, student_id, payment_proof_url, amount, currency, status")
      .eq("id", paymentId)
      .maybeSingle();

    if (payError || !payment) {
      return NextResponse.json(
        { success: false, error: "Payment record not found." },
        { status: 404 }
      );
    }

    if (!payment.payment_proof_url) {
      return NextResponse.json(
        {
          success: false,
          notFound: true,
          error: "Receipt file is no longer available. Please ask the student to re-upload the receipt.",
        },
        { status: 404 }
      );
    }

    // 6. Normalize the storage path
    const { bucket, path: storagePath } = extractStoragePath(payment.payment_proof_url);

    if (!storagePath) {
      return NextResponse.json(
        {
          success: false,
          notFound: true,
          error: "Receipt file is no longer available. Please ask the student to re-upload the receipt.",
        },
        { status: 404 }
      );
    }

    // 7. Generate temporary signed URL (15 minutes expiry)
    const expiresInSeconds = 60 * 15; // 15 mins
    const { data: signedData, error: signError } = await adminClient.storage
      .from(bucket)
      .createSignedUrl(storagePath, expiresInSeconds);

    if (signError || !signedData?.signedUrl) {
      console.error("Supabase Storage Signed URL Error:", {
        message: signError?.message,
        bucket,
        storagePath,
      });
      return NextResponse.json(
        {
          success: false,
          notFound: true,
          error: "Receipt file is no longer available. Please ask the student to re-upload the receipt.",
        },
        { status: 404 }
      );
    }

    // 8. Return signed URL
    return NextResponse.json({
      success: true,
      url: signedData.signedUrl,
      signedUrl: signedData.signedUrl,
    });
  } catch (err: any) {
    console.error("Finance Payment Receipt Route Error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to load payment receipt." },
      { status: 500 }
    );
  }
}
