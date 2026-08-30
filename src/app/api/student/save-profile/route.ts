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
    const { studentId, profileData = {}, primaryContact = null, markCompleted = false } = body;

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
          console.warn("[SaveProfileAPI] Bearer auth error:", tokenErr);
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
        console.warn("[SaveProfileAPI] Server cookie auth error:", cookieErr);
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
          { success: false, error: "Forbidden: You cannot modify another student's profile." },
          { status: 403 }
        );
      }
    }

    // 2. Update profiles table
    if (Object.keys(profileData).length > 0 || markCompleted) {
      const allowedCols = new Set([
        "first_name",
        "middle_name",
        "last_name",
        "email",
        "phone",
        "avatar_url",
        "dob",
        "gender",
        "nationality",
        "highest_education",
        "o_level_school",
        "o_level_year",
        "a_level_school",
        "a_level_year",
        "a_level_combination",
        "has_passport",
        "passport_number",
        "passport_issue_date",
        "passport_expiry_date",
        "applied_abroad_before",
        "how_did_you_hear",
        "need_financial_guidance",
        "is_profile_completed",
        "certificate_institution",
        "certificate_course",
        "certificate_year",
        "diploma_institution",
        "diploma_course",
        "diploma_year",
        "bachelor_institution",
        "bachelor_course",
        "bachelor_year",
        "master_institution",
        "master_course",
        "master_year",
        "phd_institution",
        "phd_course",
        "phd_year",
      ]);

      const sanitizedProfile: Record<string, any> = {};
      for (const [key, val] of Object.entries(profileData)) {
        if (key === "phone_number" && !profileData.phone) {
          sanitizedProfile.phone = val;
        } else if (allowedCols.has(key)) {
          sanitizedProfile[key] = val;
        }
      }

      sanitizedProfile.updated_at = new Date().toISOString();
      if (markCompleted) {
        sanitizedProfile.is_profile_completed = true;
      }

      if (Object.keys(sanitizedProfile).length > 1) {
        const { error: profErr } = await adminClient
          .from("profiles")
          .update(sanitizedProfile)
          .eq("id", targetUserId);

        if (profErr) {
          console.error("[SaveProfileAPI] Profile update error:", profErr);
          return NextResponse.json({ success: false, error: profErr.message }, { status: 500 });
        }
      }
    }

    // 3. Upsert primary contact if provided
    let savedContact: any = null;
    if (primaryContact && typeof primaryContact === "object") {
      const { data: existingContact } = await adminClient
        .from("student_contacts")
        .select("id")
        .eq("student_id", targetUserId)
        .eq("is_primary", true)
        .maybeSingle();

      const contactPayload: Record<string, any> = {
        student_id: targetUserId,
        relationship_type: primaryContact.relationship_type || "Parent",
        first_name: primaryContact.first_name || "",
        middle_name: primaryContact.middle_name || null,
        last_name: primaryContact.last_name || "",
        email: primaryContact.email || null,
        phone: primaryContact.phone || "",
        is_primary: true,
        updated_at: new Date().toISOString(),
      };

      if (existingContact?.id) {
        const { data, error: cUpdErr } = await adminClient
          .from("student_contacts")
          .update(contactPayload)
          .eq("id", existingContact.id)
          .select("*")
          .single();

        if (cUpdErr) {
          console.error("[SaveProfileAPI] Contact update error:", cUpdErr);
        } else {
          savedContact = data;
        }
      } else {
        const { data, error: cInsErr } = await adminClient
          .from("student_contacts")
          .insert([contactPayload])
          .select("*")
          .single();

        if (cInsErr) {
          console.error("[SaveProfileAPI] Contact insert error:", cInsErr);
        } else {
          savedContact = data;
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        profileUpdated: true,
        contact: savedContact,
      },
      message: "Student profile details saved successfully.",
    });
  } catch (err: any) {
    console.error("[SaveProfileAPI] Unhandled error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Internal server error." },
      { status: 500 }
    );
  }
}
