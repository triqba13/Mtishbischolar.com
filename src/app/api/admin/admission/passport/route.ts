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
          if (user?.id) authenticatedUserId = user.id;
        } catch (tokenErr) {
          console.warn("[PassportAPI] Token auth error:", tokenErr);
        }
      }
    }

    if (!authenticatedUserId) {
      try {
        const serverClient = await createServerClient();
        const {
          data: { user },
        } = await serverClient.auth.getUser();
        if (user?.id) authenticatedUserId = user.id;
      } catch {
        // Ignore cookie fallback error
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

    const { data: profile } = await adminClient
      .from("profiles")
      .select("id, role")
      .eq("id", authenticatedUserId)
      .maybeSingle();

    const normalizedRole = (profile?.role || "").trim().toLowerCase();
    if (!["admission_officer", "super_admin"].includes(normalizedRole)) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Access restricted to Admission Officers and Super Admins." },
        { status: 403 }
      );
    }

    // 3. Section A: Passport Assistance Requests (ONLY students whose payment is VERIFIED by Finance)
    const { data: assistanceRows, error: assistErr } = await adminClient
      .from("passport_assistance")
      .select(`
        *,
        student:student_id (
          id,
          first_name,
          last_name,
          email,
          phone,
          nationality,
          is_profile_completed,
          avatar_url
        )
      `)
      .eq("payment_status", "verified")
      .order("created_at", { ascending: false });

    if (assistErr) {
      console.error("[PassportAPI] Assistance fetch error:", assistErr);
    }

    // Also fetch any attached documents (like birth certificate, NIDA, etc.) for each student
    const studentIds = Array.from(new Set((assistanceRows || []).map((r) => r.student_id).filter(Boolean)));
    let studentDocsMap: Record<string, any[]> = {};

    if (studentIds.length > 0) {
      const { data: docsData } = await adminClient
        .from("documents")
        .select("id, student_id, document_type, file_name, file_url, is_verified")
        .in("student_id", studentIds);

      (docsData || []).forEach((d) => {
        if (!studentDocsMap[d.student_id]) studentDocsMap[d.student_id] = [];
        studentDocsMap[d.student_id].push(d);
      });
    }

    const assistanceRequests = (assistanceRows || []).map((row: any) => {
      const stu = row.student || {};
      const studentName = `${row.first_name || stu.first_name || ""} ${row.last_name || stu.last_name || ""}`.trim() || stu.email || "Student";
      
      return {
        id: row.id,
        studentId: row.student_id,
        studentName,
        studentEmail: row.email || stu.email || "N/A",
        studentPhone: row.phone_number || stu.phone || "N/A",
        nationality: row.birth_country || stu.nationality || "Tanzania",
        // Personal Details
        firstName: row.first_name || stu.first_name,
        middleName: row.middle_name,
        lastName: row.last_name || stu.last_name,
        dateOfBirth: row.date_of_birth,
        sex: row.sex,
        maritalStatus: row.marital_status,
        postalAddress: row.student_postal_address,
        birthCountry: row.birth_country,
        birthRegion: row.birth_region,
        birthDistrict: row.birth_district,
        birthWard: row.birth_ward,
        birthVillageStreet: row.birth_village_street,
        // Residence Details
        residenceCountry: row.residence_country,
        residenceRegion: row.residence_region,
        residenceDistrict: row.residence_district,
        residenceWard: row.residence_ward,
        residenceStreetVillage: row.residence_street_village,
        residenceHouseNumber: row.residence_house_number,
        // Father's Details
        fatherFullName: row.father_full_name,
        fatherOccupation: row.father_occupation,
        fatherDob: row.father_dob,
        fatherBirthCountry: row.father_birth_country,
        fatherBirthRegion: row.father_birth_region,
        fatherBirthDistrict: row.father_birth_district,
        fatherBirthWard: row.father_birth_ward_shehia,
        fatherBirthVillage: row.father_birth_street_village,
        // Mother's Details
        motherFullName: row.mother_full_name,
        motherOccupation: row.mother_occupation,
        motherDob: row.mother_dob,
        motherBirthCountry: row.mother_birth_country,
        motherBirthRegion: row.mother_birth_region,
        motherBirthDistrict: row.mother_birth_district,
        motherBirthWard: row.mother_birth_ward_shehia,
        motherBirthVillage: row.mother_birth_street_village,
        // Status
        assistanceStatus: row.assistance_status || "form_pending",
        status: row.status || "submitted",
        paymentStatus: row.payment_status || "verified",
        notes: row.notes,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        documents: studentDocsMap[row.student_id] || [],
      };
    });

    // 4. Section B: Existing Passports (STRICTLY students who selected has_passport = 'Yes' and have a valid passport_number)
    const { data: existingProfiles, error: existErr } = await adminClient
      .from("profiles")
      .select("id, first_name, middle_name, last_name, email, phone, nationality, has_passport, passport_number, passport_issue_date, passport_expiry_date, created_at, avatar_url")
      .eq("role", "student")
      .eq("has_passport", "Yes")
      .not("passport_number", "is", null)
      .neq("passport_number", "")
      .order("created_at", { ascending: false });

    if (existErr) {
      console.error("[PassportAPI] Existing passports fetch error:", existErr);
    }

    const existingStudentIds = (existingProfiles || []).map((p) => p.id);
    let passportDocsMap: Record<string, any> = {};

    if (existingStudentIds.length > 0) {
      const { data: passportDocs } = await adminClient
        .from("documents")
        .select("id, student_id, file_name, file_url, is_verified, created_at")
        .in("student_id", existingStudentIds)
        .in("document_type", ["Passport", "Passport_Copy", "passport", "passport_copy"]);

      (passportDocs || []).forEach((d) => {
        passportDocsMap[d.student_id] = d;
      });
    }

    const existingPassports = (existingProfiles || []).map((p: any) => {
      const studentName = `${p.first_name || ""} ${p.last_name || ""}`.trim() || p.email || "Student";
      const doc = passportDocsMap[p.id] || null;

      return {
        id: p.id,
        studentName,
        studentEmail: p.email,
        studentPhone: p.phone || "N/A",
        nationality: p.nationality || "Tanzania",
        passportNumber: p.passport_number || "On File",
        issueDate: p.passport_issue_date || "N/A",
        expiryDate: p.passport_expiry_date || "N/A",
        hasUploadedCopy: !!doc,
        documentId: doc?.id,
        documentUrl: doc?.file_url || null,
        documentVerified: doc?.is_verified || false,
        createdAt: p.created_at,
      };
    });

    const counts = {
      assistanceTotal: assistanceRequests.length,
      assistancePending: assistanceRequests.filter((r) => r.assistanceStatus === "form_pending" || r.status === "pending").length,
      assistanceProcessing: assistanceRequests.filter((r) => r.assistanceStatus === "processing" || r.assistanceStatus === "form_completed").length,
      assistanceCompleted: assistanceRequests.filter((r) => r.assistanceStatus === "completed").length,
      existingTotal: existingPassports.length,
      total: assistanceRequests.length + existingPassports.length,
    };

    return NextResponse.json({
      success: true,
      assistanceRequests,
      existingPassports,
      counts,
    });
  } catch (err: any) {
    console.error("[PassportAPI] Unhandled GET error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
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

    const body = await req.json();
    const { assistanceId, assistanceStatus, notes, passportNumber, issueDate, expiryDate, studentId, actionType } = body;

    if (!assistanceId && !studentId) {
      return NextResponse.json({ success: false, error: "Missing assistanceId or studentId." }, { status: 400 });
    }

    // 1. Fetch current assistance request
    const { data: currentReq } = await adminClient
      .from("passport_assistance")
      .select("*, student:student_id(id, first_name, last_name, email)")
      .eq("id", assistanceId)
      .single();

    const targetStudentId = studentId || currentReq?.student_id;

    // 2. Handle Action Types
    if (actionType === "send_comment" && notes && targetStudentId) {
      // Save notes to passport_assistance
      await adminClient
        .from("passport_assistance")
        .update({ notes, updated_at: new Date().toISOString() })
        .eq("id", assistanceId);

      // Insert notification for student
      await adminClient.from("notifications").insert([
        {
          user_id: targetStudentId,
          title: "📌 Important Note from Admission Desk (Passport)",
          message: notes,
          type: "passport",
          is_read: false,
          created_at: new Date().toISOString(),
        },
      ]);

      return NextResponse.json({ success: true, message: "Comment sent to student successfully." });
    }

    // Update assistance status
    if (assistanceId) {
      const updates: any = { updated_at: new Date().toISOString() };
      if (assistanceStatus) updates.assistance_status = assistanceStatus;
      if (notes !== undefined) updates.notes = notes;

      const { data: updated, error: updateErr } = await adminClient
        .from("passport_assistance")
        .update(updates)
        .eq("id", assistanceId)
        .select()
        .single();

      if (updateErr) {
        return NextResponse.json({ success: false, error: updateErr.message }, { status: 500 });
      }

      // 3. Send automatic notifications to student based on new status
      if (targetStudentId) {
        if (assistanceStatus === "processing") {
          await adminClient.from("notifications").insert([
            {
              user_id: targetStudentId,
              title: "📘 Passport Application In Progress with Immigration",
              message: "Your passport assistance application has been submitted and is currently being processed with the Immigration Department by the MtishbiScholar Admission Desk.",
              type: "passport",
              is_read: false,
              created_at: new Date().toISOString(),
            },
          ]);
        } else if (assistanceStatus === "completed") {
          // If completed, update student profile
          if (passportNumber) {
            await adminClient
              .from("profiles")
              .update({
                has_passport: "Yes",
                passport_number: passportNumber,
                passport_issue_date: issueDate || null,
                passport_expiry_date: expiryDate || null,
                updated_at: new Date().toISOString(),
              })
              .eq("id", targetStudentId);
          }

          await adminClient.from("notifications").insert([
            {
              user_id: targetStudentId,
              title: "🎉 Official Passport Issued & Ready!",
              message: `Congratulations! Your passport processing is complete${passportNumber ? ` (Passport No: ${passportNumber})` : ""}. Your profile has been updated and you are now ready for university admissions and visa processing.`,
              type: "passport",
              is_read: false,
              created_at: new Date().toISOString(),
            },
          ]);
        }
      }

      return NextResponse.json({ success: true, updated });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[PassportAPI] PATCH error:", err);
    return NextResponse.json({ success: false, error: err.message || "Failed to update passport request." }, { status: 500 });
  }
}
