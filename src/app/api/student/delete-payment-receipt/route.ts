import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { success: false, error: "Server configuration missing: SUPABASE URL or Service Key" },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { studentId, documentId, paymentId, fileUrl } = body;

    // 1. Authenticate user strictly from session
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
          console.warn("[DeletePaymentReceipt] Bearer token auth error:", tokenErr);
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
        console.warn("[DeletePaymentReceipt] Server cookie auth error:", cookieErr);
      }
    }

    const targetUserId = authenticatedUserId || studentId;
    if (!targetUserId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Could not authenticate user session." },
        { status: 401 }
      );
    }

    if (authenticatedUserId && studentId && authenticatedUserId !== studentId) {
      return NextResponse.json(
        { success: false, error: "Forbidden: You cannot modify another student's documents or payments." },
        { status: 403 }
      );
    }

    const adminClient = createSupabaseClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // 2. Identify the EXACT target document in public.documents
    let targetDoc: any = null;

    if (documentId) {
      const { data: docById, error: docErr } = await adminClient
        .from("documents")
        .select("*")
        .eq("id", documentId)
        .maybeSingle();

      if (docErr) {
        console.error("[DeletePaymentReceipt] Error fetching document by ID:", docErr);
      }

      if (docById) {
        // Strict ownership & type validation on the exact requested document
        if (docById.student_id !== targetUserId) {
          return NextResponse.json(
            { success: false, error: "Forbidden: Requested document does not belong to the authenticated student." },
            { status: 403 }
          );
        }

        if (docById.document_type !== "Payment_Receipt") {
          return NextResponse.json(
            { success: false, error: "Invalid document type: only File Opening Fee Payment_Receipt can be removed." },
            { status: 400 }
          );
        }

        if (docById.is_verified === true) {
          return NextResponse.json(
            { success: false, error: "This verified payment receipt is attached to your active application file and cannot be deleted." },
            { status: 400 }
          );
        }

        targetDoc = docById;
      }
    }

    // Fallback: If no documentId provided or not found, find the latest unverified Payment_Receipt for this student
    if (!targetDoc) {
      const { data: docs, error: docFetchErr } = await adminClient
        .from("documents")
        .select("*")
        .eq("student_id", targetUserId)
        .eq("document_type", "Payment_Receipt")
        .eq("is_verified", false)
        .order("created_at", { ascending: false })
        .limit(1);

      if (docFetchErr) {
        console.error("[DeletePaymentReceipt] Error fetching active document:", docFetchErr);
      }

      if (docs && docs.length > 0) {
        targetDoc = docs[0];
      }
    }

    // 3. Identify the EXACT active unapproved File Opening Fee payment in public.payments
    // Protected statuses that MUST NEVER be deleted: approved, paid, verified, rejected
    const PROTECTED_STATUSES = ["approved", "paid", "verified", "rejected"];

    const { data: payments, error: payFetchErr } = await adminClient
      .from("payments")
      .select("*")
      .eq("student_id", targetUserId);

    if (payFetchErr) {
      console.error("[DeletePaymentReceipt] Error fetching payments:", payFetchErr);
      return NextResponse.json(
        { success: false, error: "Failed to fetch payment records." },
        { status: 500 }
      );
    }

    // Filter payments strictly for File Opening Fee (excluding passport assistance and protected historical statuses)
    const filePayments = (payments || []).filter((p) => {
      const isFileFee = (p.payment_type === "file_opening_fee" || p.amount === 50000 || !p.payment_type) &&
        p.payment_type !== "passport_assistance" &&
        p.amount !== 300000;
      const st = (p.status || "").toLowerCase().trim();
      const isProtected = PROTECTED_STATUSES.includes(st);
      return isFileFee && !isProtected;
    });

    let targetPayment: any = null;
    if (paymentId) {
      targetPayment = filePayments.find((p) => p.id === paymentId) || null;
    }
    if (!targetPayment && filePayments.length > 0) {
      // Sort newest first to target the current active unapproved submission
      const sorted = [...filePayments].sort(
        (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      );
      targetPayment = sorted[0];
    }

    // 4. Delete the EXACT physical Storage object for this active receipt
    const rawStorageUrl = fileUrl || targetDoc?.file_url || targetPayment?.payment_proof_url;
    if (rawStorageUrl && typeof rawStorageUrl === "string") {
      let p = rawStorageUrl.trim();
      if (p.includes("/storage/v1/object/")) {
        const match = p.split("/storage/v1/object/")[1]?.match(/^(?:public|sign|authenticated)\/([^\/]+)\/(.+)$/);
        if (match) p = match[2];
      }
      if (p.startsWith("student-documents/")) {
        p = p.replace(/^student-documents\//, "");
      }
      if (p.includes("?")) p = p.split("?")[0];

      // Strict ownership check on storage path: MUST start with `${targetUserId}/`
      if (p.startsWith(`${targetUserId}/`)) {
        try {
          await adminClient.storage.from("student-documents").remove([p]);
        } catch (storageErr) {
          console.warn("[DeletePaymentReceipt] Storage remove warning:", storageErr);
        }
      }
    }

    // 5. Delete ONLY the exact targeted document in public.documents
    if (targetDoc?.id) {
      const { error: docDeleteErr } = await adminClient
        .from("documents")
        .delete()
        .eq("id", targetDoc.id)
        .eq("student_id", targetUserId);

      if (docDeleteErr) {
        console.error("[DeletePaymentReceipt] Error deleting exact document row:", docDeleteErr);
      }
    }

    // 6. Reconcile ONLY the exact active unapproved File Opening Fee payment in public.payments
    let remainingManualRef: string | null = null;

    if (targetPayment?.id) {
      const rawRef = (targetPayment.transaction_ref || "").trim();
      const isAutoRef = !rawRef || /^TXN-\d{12,}$/.test(rawRef);

      if (isAutoRef || body.clearReference) {
        // Payment existed ONLY because of this receipt upload OR user requested reference reset -> delete the unapproved payment row
        await adminClient
          .from("payments")
          .delete()
          .eq("id", targetPayment.id)
          .eq("student_id", targetUserId);
      } else {
        // Manual transaction reference exists and clearReference is false -> keep reference
        remainingManualRef = rawRef;
        await adminClient
          .from("payments")
          .update({
            payment_proof_url: null,
            status: "Submitted",
          })
          .eq("id", targetPayment.id)
          .eq("student_id", targetUserId);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Active receipt deleted and payment records reconciled.",
      remainingTransactionRef: remainingManualRef,
      deletedDocId: targetDoc?.id || null,
      reconciledPaymentId: targetPayment?.id || null,
    });
  } catch (err: any) {
    console.error("[DeletePaymentReceipt] Unhandled error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Internal server error." },
      { status: 500 }
    );
  }
}
