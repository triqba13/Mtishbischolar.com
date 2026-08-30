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
        { success: false, error: "Server configuration missing." },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { studentId, paymentMethod, transactionRef, fileUrl, amount } = body;

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
          console.warn("[SubmitPassportPayment] Bearer token auth error:", tokenErr);
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
        console.warn("[SubmitPassportPayment] Server cookie auth error:", cookieErr);
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
        { success: false, error: "Forbidden: You cannot modify another student's payments." },
        { status: 403 }
      );
    }

    const adminClient = createSupabaseClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const cleanRef = transactionRef && typeof transactionRef === "string" ? transactionRef.trim() : null;
    const paymentAmount = Number(amount) || 300000;

    // Normalize payment method
    const rawMethod = (paymentMethod || "").toLowerCase();
    let normalizedMethod: "Mobile Money" | "Bank Transfer" | "Cash Office" | "Selcom Gateway" = "Mobile Money";
    if (rawMethod.includes("bank") || rawMethod.includes("transfer") || rawMethod.includes("crdb") || rawMethod.includes("nmb")) {
      normalizedMethod = "Bank Transfer";
    } else if (rawMethod.includes("cash") || rawMethod.includes("office")) {
      normalizedMethod = "Cash Office";
    } else if (rawMethod.includes("selcom")) {
      normalizedMethod = "Selcom Gateway";
    }

    // 2. If a cleanRef is provided, check for strict uniqueness against other payments
    if (cleanRef) {
      const { data: duplicatePay } = await adminClient
        .from("payments")
        .select("id, student_id, payment_type")
        .eq("transaction_ref", cleanRef)
        .maybeSingle();

      if (duplicatePay) {
        // If the ref belongs to a different payment (e.g. File Opening Fee or another student)
        const isSamePassportPayment =
          duplicatePay.student_id === targetUserId &&
          duplicatePay.payment_type === "passport_assistance";

        if (!isSamePassportPayment) {
          return NextResponse.json(
            {
              success: false,
              error: "This Transaction Reference Number has already been used for another payment. Each payment must have its own unique transaction reference number.",
            },
            { status: 400 }
          );
        }
      }
    }

    // 3. Atomically update/insert in public.passport_assistance
    const { data: existingPassport } = await adminClient
      .from("passport_assistance")
      .select("id")
      .eq("student_id", targetUserId)
      .maybeSingle();

    const passportUpdateData: any = {
      payment_status: "pending_verification",
      payment_method: normalizedMethod,
      payment_ref: cleanRef,
      payment_amount: paymentAmount,
      payment_currency: "TZS",
      updated_at: new Date().toISOString(),
    };

    if (fileUrl) {
      passportUpdateData.payment_proof_url = fileUrl;
    }

    let updatedPassportRecord: any = null;
    if (existingPassport?.id) {
      const { data, error: passUpdErr } = await adminClient
        .from("passport_assistance")
        .update(passportUpdateData)
        .eq("id", existingPassport.id)
        .select()
        .single();

      if (passUpdErr) {
        console.error("[SubmitPassportPayment] Passport update error:", passUpdErr);
        return NextResponse.json({ success: false, error: passUpdErr.message }, { status: 500 });
      }
      updatedPassportRecord = data;
    } else {
      const { data, error: passInsErr } = await adminClient
        .from("passport_assistance")
        .insert([{ ...passportUpdateData, student_id: targetUserId }])
        .select()
        .single();

      if (passInsErr) {
        console.error("[SubmitPassportPayment] Passport insert error:", passInsErr);
        return NextResponse.json({ success: false, error: passInsErr.message }, { status: 500 });
      }
      updatedPassportRecord = data;
    }

    // 4. Atomically insert/update in public.payments table for Finance Desk visibility
    const { data: existingPayment } = await adminClient
      .from("payments")
      .select("id, status")
      .eq("student_id", targetUserId)
      .or("payment_type.eq.passport_assistance,amount.eq.300000")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (
      existingPayment?.id &&
      !["approved", "paid", "verified", "rejected"].includes((existingPayment.status || "").toLowerCase().trim())
    ) {
      const { error: payUpdErr } = await adminClient
        .from("payments")
        .update({
          amount: paymentAmount,
          currency: "TZS",
          payment_type: "passport_assistance",
          payment_method: normalizedMethod,
          transaction_ref: cleanRef,
          payment_proof_url: fileUrl || undefined,
          status: "Submitted",
        })
        .eq("id", existingPayment.id);

      if (payUpdErr) {
        console.error("[SubmitPassportPayment] Payment update error:", payUpdErr);
      }
    } else {
      const { error: payInsErr } = await adminClient.from("payments").insert([
        {
          student_id: targetUserId,
          amount: paymentAmount,
          currency: "TZS",
          payment_type: "passport_assistance",
          payment_method: normalizedMethod,
          transaction_ref: cleanRef,
          payment_proof_url: fileUrl || null,
          status: "Submitted",
        },
      ]);

      if (payInsErr) {
        console.error("[SubmitPassportPayment] Payment insert error:", payInsErr);
      }
    }

    // 5. Send notification to student & Finance Officers
    try {
      const { data: studentProf } = await adminClient
        .from("profiles")
        .select("first_name, last_name, email")
        .eq("id", targetUserId)
        .maybeSingle();

      const studentName = studentProf ? `${studentProf.first_name} ${studentProf.last_name}` : "A student";

      // 5a. Outgoing notification to student
      await adminClient.from("notifications").insert([
        {
          user_id: targetUserId,
          title: "Passport Fee Submitted",
          message:
            "Your Passport Assistance Fee (TSh 300,000) payment proof has been submitted and is currently under review by our Finance team.",
          type: "payment",
          is_read: false,
        },
      ]);

      // 5b. Incoming notifications to Finance Officers & Super Admin
      const { data: financeOfficers } = await adminClient
        .from("profiles")
        .select("id")
        .in("role", ["finance_officer", "super_admin"]);

      for (const officer of financeOfficers || []) {
        await adminClient.from("notifications").insert([
          {
            user_id: officer.id,
            title: `New Passport Fee Submission: ${studentName}`,
            message: `${studentName} (${studentProf?.email || ""}) submitted a payment proof for Passport Assistance (TSh 300,000). Transaction Ref: ${cleanRef || "Receipt Attached"}.`,
            type: "payment",
            is_read: false,
          },
        ]);
      }
    } catch (notifErr) {
      console.warn("[SubmitPassportPayment] Notification error:", notifErr);
    }

    return NextResponse.json({
      success: true,
      data: updatedPassportRecord,
      message: "Passport payment submitted and synced successfully.",
    });
  } catch (err: any) {
    console.error("[SubmitPassportPayment] Unhandled error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Internal server error." },
      { status: 500 }
    );
  }
}
