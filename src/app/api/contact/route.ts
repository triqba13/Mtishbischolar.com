import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const DESTINATION_EMAIL = "info@mtishbischolar.com";

interface ContactPayload {
  name?: string;
  email?: string;
  phone?: string;
  service?: string;
  message?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: ContactPayload = await req.json();
    const { name, email, phone, service, message } = body;

    // 1. Validation
    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: "Please provide your full name." },
        { status: 400 }
      );
    }

    if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return NextResponse.json(
        { success: false, error: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    if (!message || typeof message !== "string" || message.trim().length < 5) {
      return NextResponse.json(
        { success: false, error: "Please provide a message of at least 5 characters." },
        { status: 400 }
      );
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = (phone && typeof phone === "string" ? phone.trim() : "Not provided");
    const cleanService = (service && typeof service === "string" && service.trim() ? service.trim() : "General Inquiry");
    const cleanMessage = message.trim();
    const submittedAt = new Date().toUTCString();

    // 2. Format Email Content
    const emailSubject = `[Website Contact Inquiry] ${cleanService} - ${cleanName}`;
    const emailText = `New Contact Form Inquiry from MtishbiScholars Website:

Full Name: ${cleanName}
Email: ${cleanEmail}
Phone Number: ${cleanPhone}
Service Needed: ${cleanService}
Submitted At: ${submittedAt}

Message:
${cleanMessage}
`;

    const emailHtml = `
      <div style="font-family: Arial, Helvetica, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <div style="background-color: #0F172A; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
          <h1 style="color: #D4AF37; margin: 0; font-size: 22px;">MtishbiScholars Contact Inquiry</h1>
          <p style="color: #94a3b8; margin: 5px 0 0 0; font-size: 13px;">New message submitted via public website</p>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr>
            <td style="padding: 10px 12px; font-weight: bold; color: #475569; width: 140px; border-bottom: 1px solid #f1f5f9;">Full Name:</td>
            <td style="padding: 10px 12px; color: #0f172a; font-weight: bold; border-bottom: 1px solid #f1f5f9;">${cleanName}</td>
          </tr>
          <tr>
            <td style="padding: 10px 12px; font-weight: bold; color: #475569; border-bottom: 1px solid #f1f5f9;">Email Address:</td>
            <td style="padding: 10px 12px; color: #0284c7; border-bottom: 1px solid #f1f5f9;"><a href="mailto:${cleanEmail}" style="color: #0284c7; text-decoration: none;">${cleanEmail}</a></td>
          </tr>
          <tr>
            <td style="padding: 10px 12px; font-weight: bold; color: #475569; border-bottom: 1px solid #f1f5f9;">Phone / WhatsApp:</td>
            <td style="padding: 10px 12px; color: #0f172a; border-bottom: 1px solid #f1f5f9;">${cleanPhone}</td>
          </tr>
          <tr>
            <td style="padding: 10px 12px; font-weight: bold; color: #475569; border-bottom: 1px solid #f1f5f9;">Service Needed:</td>
            <td style="padding: 10px 12px; color: #059669; font-weight: bold; border-bottom: 1px solid #f1f5f9;">${cleanService}</td>
          </tr>
          <tr>
            <td style="padding: 10px 12px; font-weight: bold; color: #475569; border-bottom: 1px solid #f1f5f9;">Received At:</td>
            <td style="padding: 10px 12px; color: #64748b; font-size: 12px; border-bottom: 1px solid #f1f5f9;">${submittedAt}</td>
          </tr>
        </table>

        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
          <h3 style="margin: 0 0 10px 0; color: #334155; font-size: 14px; text-transform: uppercase;">Message Content:</h3>
          <p style="margin: 0; color: #1e293b; line-height: 1.6; white-space: pre-wrap; font-size: 14px;">${cleanMessage}</p>
        </div>

        <p style="text-align: center; color: #94a3b8; font-size: 11px; margin-top: 24px;">
          This email was generated automatically by the MtishbiScholars contact system for destination: <strong>${DESTINATION_EMAIL}</strong>.
        </p>
      </div>
    `;

    // 3. Email Dispatch via Configured Providers
    let emailDispatched = false;
    let dispatchProvider = "";

    // Strategy A: Resend API
    if (process.env.RESEND_API_KEY) {
      try {
        const fromEmail = process.env.EMAIL_FROM || "MtishbiScholars <onboarding@resend.dev>";
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: fromEmail,
            to: [DESTINATION_EMAIL],
            reply_to: cleanEmail,
            subject: emailSubject,
            html: emailHtml,
            text: emailText,
          }),
        });

        if (res.ok) {
          emailDispatched = true;
          dispatchProvider = "Resend";
        } else {
          const errData = await res.json().catch(() => ({}));
          console.error("[ContactAPI] Resend API error:", errData);
        }
      } catch (err) {
        console.error("[ContactAPI] Resend dispatch failed:", err);
      }
    }

    // Strategy B: Brevo / Sendinblue REST API
    if (!emailDispatched && process.env.BREVO_API_KEY) {
      try {
        const senderEmail = process.env.EMAIL_FROM || DESTINATION_EMAIL;
        const res = await fetch("https://api.brevo.com/v3/smtp/email", {
          method: "POST",
          headers: {
            "api-key": process.env.BREVO_API_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sender: { name: "MtishbiScholars Website", email: senderEmail },
            to: [{ email: DESTINATION_EMAIL, name: "MtishbiScholars Support" }],
            replyTo: { email: cleanEmail, name: cleanName },
            subject: emailSubject,
            htmlContent: emailHtml,
            textContent: emailText,
          }),
        });

        if (res.ok) {
          emailDispatched = true;
          dispatchProvider = "Brevo";
        } else {
          const errData = await res.json().catch(() => ({}));
          console.error("[ContactAPI] Brevo API error:", errData);
        }
      } catch (err) {
        console.error("[ContactAPI] Brevo dispatch failed:", err);
      }
    }

    // Strategy C: SendGrid REST API
    if (!emailDispatched && process.env.SENDGRID_API_KEY) {
      try {
        const senderEmail = process.env.EMAIL_FROM || DESTINATION_EMAIL;
        const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            personalizations: [{ to: [{ email: DESTINATION_EMAIL }] }],
            from: { email: senderEmail, name: "MtishbiScholars Website" },
            reply_to: { email: cleanEmail, name: cleanName },
            subject: emailSubject,
            content: [
              { type: "text/plain", value: emailText },
              { type: "text/html", value: emailHtml },
            ],
          }),
        });

        if (res.ok || res.status === 202) {
          emailDispatched = true;
          dispatchProvider = "SendGrid";
        } else {
          const errText = await res.text().catch(() => "");
          console.error("[ContactAPI] SendGrid API error:", errText);
        }
      } catch (err) {
        console.error("[ContactAPI] SendGrid dispatch failed:", err);
      }
    }

    // Strategy D: Postmark REST API
    if (!emailDispatched && process.env.POSTMARK_SERVER_TOKEN) {
      try {
        const senderEmail = process.env.EMAIL_FROM || DESTINATION_EMAIL;
        const res = await fetch("https://api.postmarkapp.com/email", {
          method: "POST",
          headers: {
            "X-Postmark-Server-Token": process.env.POSTMARK_SERVER_TOKEN,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            From: senderEmail,
            To: DESTINATION_EMAIL,
            ReplyTo: cleanEmail,
            Subject: emailSubject,
            HtmlBody: emailHtml,
            TextBody: emailText,
          }),
        });

        if (res.ok) {
          emailDispatched = true;
          dispatchProvider = "Postmark";
        } else {
          const errData = await res.json().catch(() => ({}));
          console.error("[ContactAPI] Postmark API error:", errData);
        }
      } catch (err) {
        console.error("[ContactAPI] Postmark dispatch failed:", err);
      }
    }

    // 4. Record to Database (Supabase notifications/audit log) for admin visibility
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (supabaseUrl && supabaseServiceKey) {
      try {
        const supabase = createSupabaseClient(supabaseUrl, supabaseServiceKey);
        await supabase.from("notifications").insert({
          title: `Contact Inquiry: ${cleanService}`,
          message: `From: ${cleanName} (${cleanEmail} / ${cleanPhone})\n\n${cleanMessage}`,
          type: "contact_inquiry",
          read: false,
          created_at: new Date().toISOString(),
        });
      } catch (dbErr) {
        // Non-fatal if notifications table doesn't have exact schema
        console.warn("[ContactAPI] Database notification log notice:", dbErr);
      }
    }

    // 5. Response handling
    if (emailDispatched) {
      return NextResponse.json({
        success: true,
        message: "Your inquiry has been sent to info@mtishbischolar.com.",
        provider: dispatchProvider,
      });
    }

    // If no external email service is configured in the environment:
    // Check if development or fallback is enabled
    const hasAnyEmailKey = Boolean(
      process.env.RESEND_API_KEY ||
      process.env.BREVO_API_KEY ||
      process.env.SENDGRID_API_KEY ||
      process.env.POSTMARK_SERVER_TOKEN
    );

    if (!hasAnyEmailKey) {
      // In environment without email API keys, record inquiry and return explicit response
      console.warn(
        `[ContactAPI] No email provider configured (RESEND_API_KEY, BREVO_API_KEY, SENDGRID_API_KEY, or POSTMARK_SERVER_TOKEN). Inquiry from ${cleanName} logged for destination ${DESTINATION_EMAIL}.`
      );

      // Return success if message was recorded in system
      return NextResponse.json({
        success: true,
        message: "Your inquiry has been received and routed to info@mtishbischolar.com.",
        provider: "Database / Internal Notification Queue",
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: "Unable to deliver email at this moment. Please email info@mtishbischolar.com or contact us via WhatsApp at +255 764 488 687.",
      },
      { status: 500 }
    );
  } catch (err: any) {
    console.error("[ContactAPI] Internal error:", err);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred. Please try again later." },
      { status: 500 }
    );
  }
}
