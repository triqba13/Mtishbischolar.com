import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await params;
    const applicationId = resolvedParams.id;

    if (!applicationId) {
      return NextResponse.json(
        { success: false, error: "Application ID is required." },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { success: false, error: "Server configuration missing." },
        { status: 500 }
      );
    }

    // 1. Authenticate user strictly from verified session (Bearer header prioritized, fallback to cookies)
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
          console.warn("[AppDetailAPI] Bearer auth error:", tokenErr);
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
      } catch {
        // Ignore cookie error
      }
    }

    if (!authenticatedUserId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Active session required." },
        { status: 401 }
      );
    }

    // 2. Privileged admin client to verify role and query application
    const adminClient = createSupabaseClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: profile, error: profileErr } = await adminClient
      .from("profiles")
      .select("id, role, first_name, last_name, email")
      .eq("id", authenticatedUserId)
      .maybeSingle();

    if (profileErr || !profile) {
      return NextResponse.json(
        { success: false, error: "User profile not found." },
        { status: 401 }
      );
    }

    const normalizedRole = (profile.role || "").trim().toLowerCase();
    if (!["admission_officer", "super_admin"].includes(normalizedRole)) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Access restricted to Admission Officers and Super Admins." },
        { status: 403 }
      );
    }

    // 3. Fetch Application by ID with full Profile, University, and Course
    const { data: application, error: appErr } = await adminClient
      .from("applications")
      .select(
        `
        id,
        student_id,
        university_id,
        course_id,
        target_country,
        preferred_course,
        target_intake,
        status,
        admission_officer_id,
        offer_letter_url,
        notes,
        created_at,
        updated_at,
        profiles:student_id (
          *
        ),
        universities:university_id (
          id,
          name,
          country,
          city,
          scholarship
        ),
        courses:course_id (
          id,
          title,
          level,
          duration,
          tuition_fee,
          currency
        )
      `
      )
      .eq("id", applicationId)
      .maybeSingle();

    if (appErr || !application) {
      return NextResponse.json(
        { success: false, error: "Application not found." },
        { status: 404 }
      );
    }

    // 4. File-Opening Fee Verification: Fetch approved file-opening payment (TSh 50,000)
    const { data: approvedFilePayments } = await adminClient
      .from("payments")
      .select("id, status, amount, currency, created_at, verified_at, payment_type, transaction_ref")
      .eq("student_id", application.student_id)
      .eq("payment_type", "file_opening_fee")
      .eq("status", "Approved")
      .order("created_at", { ascending: false })
      .limit(1);

    let approvedPayment = approvedFilePayments?.[0] || null;

    if (!approvedPayment) {
      const { data: anyApprovedPayment } = await adminClient
        .from("payments")
        .select("id, status, amount, currency, created_at, verified_at, payment_type, transaction_ref")
        .eq("student_id", application.student_id)
        .eq("status", "Approved")
        .order("created_at", { ascending: false })
        .limit(1);
      approvedPayment = anyApprovedPayment?.[0] || null;
    }

    // 5. Fetch all documents, contacts, passport assistance, and all applications for this student
    const [docsRes, contactsRes, passportRes, allAppsRes] = await Promise.all([
      adminClient
        .from("documents")
        .select("id, student_id, application_id, document_type, file_url, file_name, file_size, is_verified, verified_by, created_at")
        .eq("student_id", application.student_id)
        .order("created_at", { ascending: true }),
      adminClient
        .from("student_contacts")
        .select("*")
        .eq("student_id", application.student_id)
        .order("is_primary", { ascending: false }),
      adminClient
        .from("passport_assistance")
        .select("*")
        .eq("student_id", application.student_id)
        .maybeSingle(),
      adminClient
        .from("applications")
        .select("id, status, target_country, preferred_course, target_intake, created_at, universities(name, country), courses(title, level)")
        .eq("student_id", application.student_id)
        .order("created_at", { ascending: false }),
    ]);

    const documents = docsRes.data || [];
    const contacts = contactsRes.data || [];
    const passportAssistance = passportRes.data || null;
    const allStudentApps = allAppsRes.data || [];

    // Generate signed URLs for private storage files
    const docsWithSignedUrls = await Promise.all(
      documents.map(async (doc) => {
        let signedUrl = doc.file_url;
        if (doc.file_url && !doc.file_url.startsWith("http")) {
          const cleanPath = doc.file_url.replace(/^student-documents\//, "").replace(/^\/+/, "");
          const { data: sData } = await adminClient.storage
            .from("student-documents")
            .createSignedUrl(cleanPath, 60 * 60);
          if (sData?.signedUrl) {
            signedUrl = sData.signedUrl;
          }
        }
        return {
          ...doc,
          previewUrl: `/api/admin/admission/documents/${doc.id}/preview`,
          signedUrl,
        };
      })
    );

    // 6. Fetch relevant Audit Logs for this application/student
    const { data: auditLogs } = await adminClient
      .from("audit_logs")
      .select("id, user_id, action, target_type, target_id, details, created_at")
      .or(`target_id.eq.${applicationId},details->student_id.eq.${application.student_id}`)
      .order("created_at", { ascending: true });

    // 7. Format Student & Application Details for the UI
    const student: any = Array.isArray(application.profiles)
      ? application.profiles[0] || {}
      : (application.profiles as any) || {};
    const university: any = Array.isArray(application.universities)
      ? application.universities[0] || {}
      : (application.universities as any) || {};
    const course: any = Array.isArray(application.courses)
      ? application.courses[0] || {}
      : (application.courses as any) || {};

    const fullName = `${student.first_name || ""} ${student.middle_name || ""} ${student.last_name || ""}`.trim() || student.email || "Student";
    const uniName = university.name || (application.target_country ? `University in ${application.target_country}` : "Partner University");
    const courseName = course.title || application.preferred_course || "Undergraduate Programme";

    // Format Academic Background string
    let previousEducation = "No previous education details provided.";
    if (student.highest_education === "A-Level / High School" || student.a_level_school) {
      previousEducation = `Completed A-Level at ${student.a_level_school || "Secondary School"}${student.a_level_year ? ` (${student.a_level_year})` : ""}. Combination: ${student.a_level_combination || "General"}.`;
    } else if (student.bachelor_institution) {
      previousEducation = `Graduated with ${student.bachelor_course || "Degree"} from ${student.bachelor_institution}${student.bachelor_year ? ` (${student.bachelor_year})` : ""}.`;
    } else if (student.highest_education) {
      previousEducation = `Highest Qualification: ${student.highest_education}.`;
    }

    const primaryContact = contacts.find((c: any) => c.is_primary) || contacts[0] || null;

    return NextResponse.json({
      success: true,
      application: {
        id: application.id,
        displayId: `APP-${application.id.slice(0, 6).toUpperCase()}`,
        status: application.status || "Under Review",
        studentId: application.student_id,
        universityId: application.university_id,
        university: uniName,
        course: courseName,
        intake: application.target_intake || "September 2026",
        studyLevel: course.level || (student.highest_education?.includes("Master") ? "Postgraduate" : "Undergraduate"),
        targetCountry: application.target_country || "International",
        applicationDate: application.created_at
          ? new Date(application.created_at).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })
          : "Recently Submitted",
        rawCreatedAt: application.created_at,
        notes: application.notes,
        offerLetterUrl: application.offer_letter_url,
      },
      student: {
        fullName,
        firstName: student.first_name || "",
        middleName: student.middle_name || "",
        lastName: student.last_name || "",
        email: student.email,
        phone: student.phone || "Not provided",
        dob: student.dob
          ? new Date(student.dob).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })
          : "Not provided",
        gender: student.gender || "Not specified",
        nationality: student.nationality || "Tanzanian",
        region: student.region || student.location || "Not specified",
        district: student.district || "",
        nidaNumber: student.nida_number || student.id_number || "Not on file",
        appliedAbroadBefore: student.applied_abroad_before || "No",
        howDidYouHear: student.how_did_you_hear || "Not specified",
        needFinancialGuidance: student.need_financial_guidance === true ? "Yes" : "No",
        sponsorType: student.sponsor_type || "Self / Parent Sponsored",
      },
      academic: {
        qualification: student.highest_education || "A-Level",
        oLevelSchool: student.o_level_school || "Secondary School",
        oLevelYear: student.o_level_year || "",
        oLevelIndexNumber: student.o_level_index_number || "",
        aLevelSchool: student.a_level_school || "",
        aLevelYear: student.a_level_year || "",
        aLevelCombination: student.a_level_combination || "",
        aLevelIndexNumber: student.a_level_index_number || "",
        bachelorInstitution: student.bachelor_institution || "",
        bachelorCourse: student.bachelor_course || "",
        bachelorYear: student.bachelor_year || "",
        bachelorGpa: student.bachelor_gpa || "",
        masterInstitution: student.master_institution || "",
        masterCourse: student.master_course || "",
        masterYear: student.master_year || "",
        school: student.a_level_school || student.o_level_school || student.bachelor_institution || "Secondary School",
        completionYear: student.a_level_year || student.o_level_year || student.bachelor_year || "2024",
        grades: student.a_level_combination ? `Combination: ${student.a_level_combination}` : "Good Academic Standing",
        westernEquivalent: student.highest_education || "Ordinary level / A-level",
      },
      contacts: contacts || [],
      primaryContact,
      previousEducation,
      passport: {
        hasPassport: student.has_passport === "Yes" || student.has_passport === "true" || !!student.passport_number,
        status: student.has_passport === "Yes" ? "Has Passport" : (student.has_passport === "Assistance Requested" ? "Passport Assistance Requested" : "No Passport"),
        number: student.passport_number || "Not on file",
        issueDate: student.passport_issue_date
          ? new Date(student.passport_issue_date).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })
          : null,
        expiryDate: student.passport_expiry_date
          ? new Date(student.passport_expiry_date).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })
          : null,
        passportAssistance,
      },
      allStudentApplications: allStudentApps,
      documents: docsWithSignedUrls,
      auditLogs: auditLogs || [],
      payment: approvedPayment,
    });
  } catch (err: any) {
    console.error("[AppDetailAPI] Unexpected error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
