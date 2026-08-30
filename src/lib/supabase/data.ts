import { createClient } from "@/lib/supabase/client";

export interface DbUniversity {
  id: string; // e.g. "parul-india", "rku-india"
  name: string;
  country: string;
  city: string;
  flag?: string;
  scholarship?: string;
  featured?: boolean;
  image?: string;
  description?: string;
  logo_url?: string;
  created_at?: string;
}

export interface DbCourse {
  id: string; // UUID
  university_id: string; // TEXT FK -> universities.id
  title: string;
  level: string; // 'Bachelor', 'Master', 'Diploma', 'PhD', etc.
  duration: string;
  tuition_fee: number;
  currency: string;
  scholarship_percentage?: number;
  intake_months?: string;
  created_at?: string;
  universities?: DbUniversity;
}

export interface DbApplication {
  id: string;
  student_id: string;
  university_id?: string;
  course_id?: string;
  target_country: string;
  target_intake?: string;
  preferred_course?: string;
  status: string;
  admission_officer_id?: string | null;
  offer_letter_url?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  universities?: DbUniversity;
  courses?: DbCourse;
  admission_officer?: DbProfile | null;
}

export interface DbDocument {
  id?: string;
  student_id: string;
  application_id?: string;
  document_type: string;
  file_name: string;
  file_url: string;
  is_verified?: boolean;
  verified_by?: string;
  file_size?: number;
  created_at?: string;
}

/**
 * Fetch all universities from Supabase
 */
export async function fetchUniversities(): Promise<DbUniversity[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("universities")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching universities from Supabase:", error);
      return [];
    }

    return (data as DbUniversity[]) || [];
  } catch (err) {
    console.error("Failed to fetch universities:", err);
    return [];
  }
}

/**
 * Fetch universities filtered by country from Supabase
 */
export async function fetchUniversitiesByCountry(countryName: string): Promise<DbUniversity[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("universities")
      .select("*")
      .ilike("country", `%${countryName.trim()}%`)
      .order("name", { ascending: true });

    if (error) {
      console.error(`Error fetching universities for country ${countryName}:`, error);
      return [];
    }

    return (data as DbUniversity[]) || [];
  } catch (err) {
    console.error(`Failed to fetch universities for ${countryName}:`, err);
    return [];
  }
}

/**
 * Fetch all courses for a specific university from Supabase
 */
export async function fetchCoursesByUniversity(universityId: string): Promise<DbCourse[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("courses")
      .select("*, universities(*)")
      .eq("university_id", universityId)
      .order("title", { ascending: true });

    if (error) {
      console.error(`Error fetching courses for university ${universityId}:`, error);
      return [];
    }

    return (data as DbCourse[]) || [];
  } catch (err) {
    console.error(`Failed to fetch courses for university ${universityId}:`, err);
    return [];
  }
}

/**
 * Fetch all available courses joined with their respective partner universities.
 * Essential for Course-First application search and discovery.
 */
export async function fetchAllCoursesWithUniversities(): Promise<DbCourse[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("courses")
      .select("*, universities(*)")
      .order("title", { ascending: true });

    if (error) {
      console.error("Error fetching all courses with universities:", error);
      return [];
    }

    return (data as DbCourse[]) || [];
  } catch (err) {
    console.error("Failed to fetch all courses:", err);
    return [];
  }
}

/**
 * Submit student application to Supabase applications table
 */
export async function submitApplicationToSupabase(payload: {
  student_id: string;
  target_country: string;
  university_id: string;
  course_id: string;
  target_intake?: string;
  preferred_course?: string;
  status?: string;
}): Promise<{ success: boolean; data?: DbApplication; error?: string; paymentRequired?: boolean }> {
  try {
    const supabase = createClient();

    // Security check: Student must have an Approved payment
    const { data: payments, error: payError } = await supabase
      .from("payments")
      .select("status")
      .eq("student_id", payload.student_id);

    if (payError) {
      console.error("Error verifying payment status:", payError);
      return { success: false, error: "Unable to verify payment status. Please try again." };
    }

    const hasApprovedPayment = (payments || []).some(
      (p) => (p.status || "").toLowerCase() === "approved"
    );

    if (!hasApprovedPayment) {
      return {
        success: false,
        paymentRequired: true,
        error: "To apply to partner universities, your one-time MtishbiScholars Application File Opening Fee (TSh 50,000) must be approved first.",
      };
    }

    const { data, error } = await supabase
      .from("applications")
      .insert([
        {
          student_id: payload.student_id,
          target_country: payload.target_country,
          university_id: payload.university_id,
          course_id: payload.course_id,
          target_intake: payload.target_intake,
          preferred_course: payload.preferred_course,
          status: payload.status || "Submitted to University",
        },
      ])
      .select("*, universities(*), courses(*)")
      .single();

    if (error) {
      console.error("Error submitting application to Supabase:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data as DbApplication };
  } catch (err: any) {
    console.error("Failed to submit application:", err);
    return { success: false, error: err.message || "Submission failed" };
  }
}

/**
 * Request an unlisted course. Creates an application record in 'Profile Completed' state
 * with preferred_course, notes, and target country/intake, without an official course_id.
 */
export async function requestUnlistedCourseApplication(payload: {
  student_id: string;
  target_country: string;
  preferred_course: string;
  target_intake?: string;
  notes?: string;
}): Promise<{ success: boolean; data?: DbApplication; error?: string; paymentRequired?: boolean }> {
  try {
    const supabase = createClient();

    // Security check: Student must have an Approved payment
    const { data: payments, error: payError } = await supabase
      .from("payments")
      .select("status")
      .eq("student_id", payload.student_id);

    if (payError) {
      console.error("Error verifying payment status:", payError);
      return { success: false, error: "Unable to verify payment status. Please try again." };
    }

    const hasApprovedPayment = (payments || []).some(
      (p) => (p.status || "").toLowerCase() === "approved"
    );

    if (!hasApprovedPayment) {
      return {
        success: false,
        paymentRequired: true,
        error: "To apply to partner universities, your one-time MtishbiScholars Application File Opening Fee (TSh 50,000) must be approved first.",
      };
    }

    const courseRequestNote = `[UNLISTED COURSE REQUEST]: Student requested "${payload.preferred_course}" for ${payload.target_country
      } (${payload.target_intake || "Upcoming Intake"})${payload.notes ? `. Notes: ${payload.notes}` : ""
      }`;

    const { data, error } = await supabase
      .from("applications")
      .insert([
        {
          student_id: payload.student_id,
          target_country: payload.target_country,
          university_id: null,
          course_id: null,
          target_intake: payload.target_intake || "September 2026",
          preferred_course: payload.preferred_course,
          status: "Under Review",
          notes: courseRequestNote,
        },
      ])
      .select("*, universities(*), courses(*)")
      .single();

    if (error) {
      console.error("Error submitting unlisted course request:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data as DbApplication };
  } catch (err: any) {
    console.error("Failed to request unlisted course:", err);
    return { success: false, error: err.message || "Failed to submit course request" };
  }
}

/**
 * Helper to identify if an application record is an unlisted course request.
 * Requires: course_id IS NULL, university_id IS NULL, and notes starts with '[UNLISTED COURSE REQUEST]'
 */
export function isUnlistedCourseRequest(app: Partial<DbApplication> | null | undefined): boolean {
  if (!app) return false;
  return (
    app.course_id == null &&
    app.university_id == null &&
    Boolean(app.notes && app.notes.startsWith("[UNLISTED COURSE REQUEST]"))
  );
}

/**
 * Exact statuses allowed for student immediate deletion/withdrawal:
 * - 'Profile Completed'
 * - 'Under Review'
 * - 'Submitted to University'
 * Protected stages ('University Offer Issued', 'Visa Approved') cannot be deleted by students.
 */
export const ALLOWED_DELETE_STATUSES = [
  "Profile Completed",
  "Under Review",
  "Submitted to University",
];

export function isApplicationDeletable(status?: string | null): boolean {
  if (!status) return true;
  return ALLOWED_DELETE_STATUSES.includes(status);
}

/**
 * Purely presentation/UI helper for Application Center badges:
 * Formats 'Submitted to University' as 'Submitted', and 'Profile Completed' as 'Draft / In Preparation'.
 */
export function getApplicationStatusDisplay(status?: string | null): string {
  if (!status) return "Submitted";
  const lower = status.toLowerCase();
  if (lower === "submitted to university" || lower === "submitted") {
    return "Submitted";
  }
  if (lower === "profile completed" || lower === "draft") {
    return "Draft / In Preparation";
  }
  return status;
}

/**
 * Permanently delete / withdraw an application owned by the authenticated student.
 * Supports: 'Profile Completed', 'Under Review', 'Submitted to University'.
 */
export async function deleteStudentApplication(
  applicationId: string,
  studentId: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();

    // 1. First attempt via secure server API endpoint with verified session token
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      const response = await fetch("/api/student/withdraw-application", {
        method: "POST",
        headers,
        body: JSON.stringify({ applicationId, reason }),
      });

      const resData = await response.json();
      if (response.ok && resData.success) {
        return { success: true };
      }
      if (!response.ok && resData.error) {
        return { success: false, error: resData.error };
      }
    } catch (apiErr) {
      console.warn("[deleteStudentApplication] API route fallback to client SDK:", apiErr);
    }

    // 2. Direct client SDK execution as fallback
    // Verify ownership and deletable status
    const { data: existingApp, error: fetchErr } = await supabase
      .from("applications")
      .select("id, status, student_id")
      .eq("id", applicationId)
      .eq("student_id", studentId)
      .single();

    if (fetchErr || !existingApp) {
      return { success: false, error: "Application not found or unauthorized." };
    }

    if (!isApplicationDeletable(existingApp.status)) {
      return {
        success: false,
        error:
          "This application has reached an official admission stage and cannot be deleted. Please contact your Admission Officer for assistance.",
      };
    }

    // Safely unlink documents attached specifically to this application without deleting student academic files
    await supabase
      .from("documents")
      .update({ application_id: null })
      .eq("application_id", applicationId)
      .eq("student_id", studentId);

    // Safely unlink any payments referencing this specific application
    await supabase
      .from("payments")
      .update({ application_id: null })
      .eq("application_id", applicationId)
      .eq("student_id", studentId);

    const { error: deleteErr } = await supabase
      .from("applications")
      .delete()
      .eq("id", applicationId)
      .eq("student_id", studentId);

    if (deleteErr) {
      console.error("Error deleting application:", deleteErr);
      return { success: false, error: deleteErr.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error("Failed to delete application:", err);
    return { success: false, error: err.message || "Failed to delete application" };
  }
}

/**
 * Backward compatibility alias: directly forwards to permanent deletion.
 */
export const requestApplicationWithdrawal = deleteStudentApplication;

/**
 * Fetch student applications joined with university and course details
 */
export async function fetchStudentApplications(studentId: string): Promise<DbApplication[]> {
  try {
    if (!studentId) return [];
    const supabase = createClient();
    const { data, error } = await supabase
      .from("applications")
      .select("*, universities(*), courses(*)")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching student applications:", error);
      return [];
    }

    return (data as DbApplication[]) || [];
  } catch (err) {
    console.error("Failed to fetch student applications:", err);
    return [];
  }
}


export interface DbProfile {
  id: string;
  email: string;
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  phone?: string;
  avatar_url?: string;
  role?: string;
  dob?: string;
  gender?: string;
  nationality?: string;
  highest_education?: string;
  o_level_school?: string;
  o_level_year?: string;
  a_level_school?: string;
  a_level_year?: string;
  a_level_combination?: string;
  // Certificate Fields
  certificate_institution?: string;
  certificate_course?: string;
  certificate_year?: string;
  // Diploma Fields
  diploma_institution?: string;
  diploma_course?: string;
  diploma_year?: string;
  // Bachelor's Degree Fields
  bachelor_institution?: string;
  bachelor_course?: string;
  bachelor_year?: string;
  // Master's Degree Fields
  master_institution?: string;
  master_course?: string;
  master_year?: string;
  // PhD Fields
  phd_institution?: string;
  phd_course?: string;
  phd_year?: string;
  has_passport?: string;
  passport_number?: string;
  passport_issue_date?: string;
  passport_expiry_date?: string;
  applied_abroad_before?: string;
  how_did_you_hear?: string;
  need_financial_guidance?: string;
  is_profile_completed?: boolean;
  last_seen_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface DbNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type?: string;
  is_read?: boolean;
  read?: boolean;
  created_at?: string;
}


export interface DbPayment {
  id: string;
  student_id: string;
  application_id?: string | null;
  payment_type?: "file_opening_fee" | "passport_assistance" | string;
  status?: string;
  amount?: number;
  currency?: string;
  payment_method?: string;
  transaction_ref?: string;
  payment_proof_url?: string | null;
  verified_by?: string | null;
  verified_at?: string | null;
  rejection_reason?: string | null;
  created_at?: string;
}

/**
 * Submit student-level application file opening fee payment (e.g. TSh 50,000)
 * application_id is explicitly NULL because this one-time fee unlocks the student's entire file for multiple universities.
 */
export async function submitPaymentToSupabase(payload: {
  student_id: string;
  amount: number;
  currency?: string;
  payment_method: string;
  transaction_ref?: string | null;
  payment_proof_url?: string | null;
}): Promise<{ success: boolean; data?: DbPayment; error?: string }> {
  try {
    const supabase = createClient();
    const cleanRef = payload.transaction_ref ? payload.transaction_ref.trim() : "";

    const { data, error } = await supabase
      .from("payments")
      .insert([
        {
          student_id: payload.student_id,
          application_id: null,
          payment_type: "file_opening_fee",
          amount: payload.amount,
          currency: payload.currency || "TZS",
          payment_method: payload.payment_method,
          transaction_ref: cleanRef,
          payment_proof_url: payload.payment_proof_url || null,
          status: "Submitted",
        },
      ])
      .select("*");

    if (error) {
      console.error("Error submitting payment to Supabase:", error);
      if (error.code === "23505" || error.message?.includes("unique") || error.message?.includes("transaction_ref")) {
        return {
          success: false,
          error: "This Transaction Reference Number has already been submitted for another payment. Each payment must have its own unique transaction reference.",
        };
      }
      return { success: false, error: error.message };
    }

    // Record student notification for submission under review
    try {
      await supabase.from("notifications").insert([
        {
          user_id: payload.student_id,
          title: "File Opening Fee Submitted",
          message: `Your MtishbiScholar Application File Opening Fee (${payload.currency || "TZS"} ${Number(payload.amount).toLocaleString()}) payment proof has been submitted and is currently under review by our Finance team.`,
          type: "payment",
          is_read: false,
        },
      ]);
    } catch (notifErr) {
      console.warn("Could not insert payment submission notification:", notifErr);
    }

    const insertedPayment = Array.isArray(data) ? data[0] : (data as DbPayment | null);
    return { success: true, data: (insertedPayment || undefined) as DbPayment | undefined };
  } catch (err: any) {
    console.error("Failed to submit payment:", err);
    return { success: false, error: err.message || "Payment submission failed" };
  }
}

/**
 * Re-upload payment proof / edit transaction reference for an existing unapproved payment.
 * Uploads new receipt to storage, updates payment record, resets status to 'Submitted',
 * clears any rejection reason, and keeps the record in the Finance queue.
 */
export async function updateOrResubmitPaymentProof(payload: {
  payment_id: string;
  student_id: string;
  payment_method?: string;
  transaction_ref?: string | null;
  payment_proof_url?: string | null;
  file?: File | null;
}): Promise<{ success: boolean; data?: DbPayment; error?: string }> {
  try {
    const supabase = createClient();
    let paymentProofUrl: string | undefined = payload.payment_proof_url || undefined;

    if (payload.file && !paymentProofUrl) {
      const fileExt = payload.file.name.split(".").pop();
      const filePath = `${payload.student_id}/payment_proof_${Date.now()}.${fileExt}`;
      const bucketName = "student-documents";

      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, payload.file, { upsert: true });

      if (uploadError) {
        console.error("Storage upload error for payment proof:", uploadError.message);
        return {
          success: false,
          error: `Storage upload failed: ${uploadError.message}. Please ensure file is under 10MB.`,
        };
      }

      paymentProofUrl = `student-documents/${filePath}`;
    }

    const updatePayload: Record<string, any> = {
      status: "Submitted",
      rejection_reason: null,
      verified_by: null,
      verified_at: null,
      created_at: new Date().toISOString(),
    };

    if (payload.payment_method) {
      updatePayload.payment_method = payload.payment_method;
    }
    if (payload.transaction_ref !== undefined) {
      updatePayload.transaction_ref = payload.transaction_ref ? payload.transaction_ref.trim() : "";
    }
    if (paymentProofUrl) {
      updatePayload.payment_proof_url = paymentProofUrl;
    }

    const { data, error } = await supabase
      .from("payments")
      .update(updatePayload)
      .eq("id", payload.payment_id)
      .eq("student_id", payload.student_id)
      .select("*");

    if (error) {
      console.error("Error updating payment in database:", error);
      return { success: false, error: error.message };
    }

    const updatedPayment = Array.isArray(data) ? data[0] : (data as DbPayment | null);
    return { success: true, data: (updatedPayment || undefined) as DbPayment | undefined };
  } catch (err: any) {
    console.error("Failed to update payment proof:", err);
    return { success: false, error: err.message || "Failed to update payment details" };
  }
}

export interface DbStudentContact {
  id?: string;
  student_id: string;
  relationship_type: "Father" | "Mother" | "Sponsor" | "Guardian" | "Other" | string;
  first_name: string;
  middle_name?: string | null;
  last_name: string;
  email?: string | null;
  phone: string;
  is_primary?: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Fetch all contacts (Parent / Guardian / Sponsor) for a given student
 */
export async function fetchStudentContacts(studentId: string): Promise<DbStudentContact[]> {
  try {
    if (!studentId) return [];
    const supabase = createClient();
    const { data, error } = await supabase
      .from("student_contacts")
      .select("*")
      .eq("student_id", studentId)
      .order("is_primary", { ascending: false });

    if (error) {
      console.warn("Could not fetch student contacts:", error.message);
      return [];
    }

    return (data as DbStudentContact[]) || [];
  } catch (err) {
    console.error("Failed to fetch student contacts:", err);
    return [];
  }
}

/**
 * Save or update student's primary contact (Parent / Guardian / Sponsor).
 * If a primary contact already exists, it updates it. Otherwise, it inserts a new record.
 */
export async function saveStudentContact(
  studentId: string,
  payload: {
    relationship_type: string;
    first_name: string;
    middle_name?: string;
    last_name: string;
    email?: string;
    phone: string;
    is_primary?: boolean;
  }
): Promise<{ success: boolean; data?: DbStudentContact; error?: string }> {
  try {
    if (!studentId) return { success: false, error: "Missing student ID" };
    const supabase = createClient();

    // Check if an existing primary contact exists for this student
    const { data: existingContacts } = await supabase
      .from("student_contacts")
      .select("id")
      .eq("student_id", studentId)
      .eq("is_primary", true)
      .maybeSingle();

    if (existingContacts?.id) {
      // UPDATE existing primary contact
      const { data, error } = await supabase
        .from("student_contacts")
        .update({
          relationship_type: payload.relationship_type,
          first_name: payload.first_name,
          middle_name: payload.middle_name || null,
          last_name: payload.last_name,
          email: payload.email || null,
          phone: payload.phone,
          is_primary: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingContacts.id)
        .select("*")
        .single();

      if (error) {
        console.error("Error updating student contact:", error);
        return { success: false, error: error.message };
      }
      return { success: true, data: data as DbStudentContact };
    } else {
      // INSERT new primary contact
      const { data, error } = await supabase
        .from("student_contacts")
        .insert([
          {
            student_id: studentId,
            relationship_type: payload.relationship_type,
            first_name: payload.first_name,
            middle_name: payload.middle_name || null,
            last_name: payload.last_name,
            email: payload.email || null,
            phone: payload.phone,
            is_primary: true,
          },
        ])
        .select("*")
        .single();

      if (error) {
        console.error("Error inserting student contact:", error);
        return { success: false, error: error.message };
      }
      return { success: true, data: data as DbStudentContact };
    }
  } catch (err: any) {
    console.error("Failed to save student contact:", err);
    return { success: false, error: err.message || "Failed to save contact" };
  }
}

/**
 * Save complete student profile wizard data into profiles table
 */
export async function saveStudentFullProfile(
  studentId: string,
  profilePayload: Partial<DbProfile>
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({
        ...profilePayload,
        is_profile_completed: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", studentId);

    if (error) {
      console.error("Error updating student profile in Supabase:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error("Failed to save student profile:", err);
    return { success: false, error: err.message || "Failed to save profile" };
  }
}

/**
 * Save student study preference application draft record.
 * Protects official/submitted applications from being overwritten by profile wizard updates.
 */
export async function saveApplicationPreference(
  studentId: string,
  preferencePayload: {
    target_country: string;
    target_intake?: string;
    preferred_course?: string;
  }
): Promise<{ success: boolean; data?: DbApplication; error?: string }> {
  try {
    const supabase = createClient();

    // Statuses representing official/submitted applications that MUST NOT be overwritten
    const protectedStatuses = [
      "submitted",
      "under review",
      "application submitted",
      "offer issued",
      "university offer issued",
      "visa processing",
      "visa approved",
      "ready to fly",
      "enrolled",
    ];

    // Find existing preparation / draft application record for this student
    const { data: userApps, error: fetchErr } = await supabase
      .from("applications")
      .select("*")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false });

    if (fetchErr) {
      console.error("Error fetching applications for preference update:", fetchErr);
      return { success: false, error: fetchErr.message };
    }

    // Filter for draft/preparation application
    const draftApp = (userApps as DbApplication[] || []).find((app) => {
      const statusLower = (app.status || "").toLowerCase().trim();
      return !protectedStatuses.some((p) => statusLower.includes(p));
    });

    if (draftApp?.id) {
      // Update existing draft / preparation record
      const { data, error } = await supabase
        .from("applications")
        .update({
          target_country: preferencePayload.target_country,
          target_intake: preferencePayload.target_intake || "",
          preferred_course: preferencePayload.preferred_course || "",
          updated_at: new Date().toISOString(),
        })
        .eq("id", draftApp.id)
        .select("*")
        .single();

      if (error) {
        console.error("Error updating application preference:", error);
        return { success: false, error: error.message };
      }
      return { success: true, data: data as DbApplication };
    } else {
      // Create new preparation / draft application record
      const { data, error } = await supabase
        .from("applications")
        .insert([
          {
            student_id: studentId,
            target_country: preferencePayload.target_country,
            target_intake: preferencePayload.target_intake || "",
            preferred_course: preferencePayload.preferred_course || "",
            status: "Profile Completed",
          },
        ])
        .select("*")
        .single();

      if (error) {
        console.error("Error inserting application preference:", error);
        return { success: false, error: error.message };
      }
      return { success: true, data: data as DbApplication };
    }
  } catch (err: any) {
    console.error("Failed to save application preference:", err);
    return { success: false, error: err.message || "Failed to save application" };
  }
}

/**
 * Extract clean storage path from a file_url (handles full public URLs, signed URLs, or raw paths)
 */
export function extractStoragePath(rawUrl: string): { bucket: string; path: string } {
  const bucket = "student-documents";
  if (!rawUrl) return { bucket, path: "" };

  let clean = rawUrl.trim();

  // If it's a full Supabase storage URL (e.g. https://.../storage/v1/object/public/student-documents/xxx/yyy)
  if (clean.includes("/storage/v1/object/")) {
    const afterObject = clean.split("/storage/v1/object/")[1];
    const match = afterObject.match(/^(?:public|sign|authenticated)\/([^\/]+)\/(.+)$/);
    if (match) {
      const b = match[1];
      let p = match[2];
      if (p.includes("?")) p = p.split("?")[0];
      return { bucket: b, path: decodeURIComponent(p) };
    }
  }

  // If it starts with "student-documents/" or "{bucket}/"
  if (clean.startsWith("student-documents/")) {
    let relativePath = clean.replace(/^student-documents\//, "");
    if (relativePath.includes("?")) relativePath = relativePath.split("?")[0];
    return { bucket: "student-documents", path: decodeURIComponent(relativePath) };
  }

  // If it contains "student-documents/" anywhere
  if (clean.includes("student-documents/")) {
    const parts = clean.split("student-documents/");
    let relativePath = parts.slice(1).join("student-documents/");
    if (relativePath.includes("?")) relativePath = relativePath.split("?")[0];
    return { bucket: "student-documents", path: decodeURIComponent(relativePath) };
  }

  // If it's already just the relative path e.g. "{student_id}/{filename}"
  if (clean.startsWith("/")) clean = clean.slice(1);
  if (clean.includes("?")) clean = clean.split("?")[0];

  return { bucket, path: decodeURIComponent(clean) };
}

/**
 * Generate a temporary signed URL (default 15 minutes) for viewing a private student document.
 * Scoped securely to the authenticated session via Supabase Storage RLS.
 */
export async function getStudentDocumentSignedUrl(
  fileUrlOrPath: string,
  expiresInSeconds: number = 900 // 15 minutes
): Promise<{ success: boolean; signedUrl?: string; error?: string; notFound?: boolean }> {
  try {
    const supabase = createClient();
    const { bucket, path } = extractStoragePath(fileUrlOrPath);

    if (!path) {
      return { success: false, notFound: true, error: "Invalid document storage path." };
    }

    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresInSeconds);

    if (error || !data?.signedUrl) {
      const isNotFound =
        error?.message?.toLowerCase().includes("not found") ||
        error?.message?.toLowerCase().includes("object not found");

      return {
        success: false,
        notFound: isNotFound,
        error: isNotFound
          ? "Document file is no longer available in storage. Please re-upload your document."
          : error?.message || "Failed to generate document view URL.",
      };
    }

    return { success: true, signedUrl: data.signedUrl };
  } catch (err: any) {
    console.error("Signed URL generation failed:", err);
    return { success: false, error: err.message || "Failed to load document." };
  }
}

/**
 * Upload student document via secure server API & save metadata to documents table.
 */
export async function uploadStudentDocument(
  studentId: string,
  file: File,
  documentType: string,
  applicationId?: string
): Promise<{ success: boolean; fileUrl?: string; error?: string; document?: DbDocument }> {
  if (file && file.size > 10 * 1024 * 1024) {
    return {
      success: false,
      error: "File size exceeds the 10MB maximum limit. Please upload a smaller file.",
    };
  }
  try {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const headers: Record<string, string> = {};
    if (session?.access_token) {
      headers["Authorization"] = `Bearer ${session.access_token}`;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("documentType", documentType);
    formData.append("studentId", studentId);
    if (applicationId) {
      formData.append("applicationId", applicationId);
    }

    const response = await fetch("/api/student/upload-document", {
      method: "POST",
      headers,
      body: formData,
    });

    const resData = await response.json();
    if (!response.ok || !resData.success) {
      return {
        success: false,
        error: resData.error || "Failed to upload document. Please try again.",
      };
    }

    return {
      success: true,
      fileUrl: resData.fileUrl,
      document: resData.document,
    };
  } catch (err: any) {
    console.error("Failed to upload document:", err);
    return { success: false, error: err.message || "Upload failed" };
  }
}

/**
 * Fetch list of uploaded documents for a student
 */
export async function fetchStudentDocuments(studentId: string): Promise<DbDocument[]> {
  try {
    if (!studentId) return [];
    const supabase = createClient();
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("student_id", studentId);

    if (error) {
      console.error("Error fetching student documents:", error);
      return [];
    }

    return (data as DbDocument[]) || [];
  } catch (err) {
    console.error("Failed to fetch student documents:", err);
    return [];
  }
}

/**
 * Delete a student document from database and storage bucket
 */
export async function deleteStudentDocument(
  studentId: string,
  docId: string,
  fileUrl?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (session?.access_token) {
      headers["Authorization"] = `Bearer ${session.access_token}`;
    }

    const response = await fetch("/api/student/delete-document", {
      method: "POST",
      headers,
      body: JSON.stringify({
        documentId: docId,
        studentId: studentId,
        fileUrl: fileUrl,
      }),
    });

    const resData = await response.json();
    if (!response.ok || !resData.success) {
      return {
        success: false,
        error: resData.error || "Failed to delete document.",
      };
    }

    return { success: true };
  } catch (err: any) {
    console.error("Error in deleteStudentDocument:", err);
    return { success: false, error: err.message || "Failed to delete document." };
  }
}

/**
 * Delete unapproved File Opening Fee payment receipt and reconcile database & storage.
 * Strictly scoped to authenticated student.
 */
export async function deleteStudentPaymentReceipt(
  studentId: string,
  targetDetails?: {
    documentId?: string;
    paymentId?: string;
    fileUrl?: string;
    clearReference?: boolean;
  }
): Promise<{ success: boolean; error?: string; remainingTransactionRef?: string | null }> {
  try {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (session?.access_token) {
      headers["Authorization"] = `Bearer ${session.access_token}`;
    }

    const response = await fetch("/api/student/delete-payment-receipt", {
      method: "POST",
      headers,
      body: JSON.stringify({
        studentId,
        documentId: targetDetails?.documentId,
        paymentId: targetDetails?.paymentId,
        fileUrl: targetDetails?.fileUrl,
        clearReference: targetDetails?.clearReference,
      }),
    });

    const resData = await response.json();
    if (!response.ok || !resData.success) {
      return {
        success: false,
        error: resData.error || "Failed to remove payment receipt.",
      };
    }

    return {
      success: true,
      remainingTransactionRef: resData.remainingTransactionRef || null,
    };
  } catch (err: any) {
    console.error("Error in deleteStudentPaymentReceipt:", err);
    return { success: false, error: err.message || "Failed to remove payment receipt." };
  }
}

/**
 * Delete unapproved Passport Assistance payment receipt and reconcile database & storage.
 * Strictly scoped to authenticated student.
 */
export async function deleteStudentPassportReceipt(
  studentId: string,
  targetDetails?: {
    documentId?: string;
    paymentId?: string;
    fileUrl?: string;
    clearReference?: boolean;
  }
): Promise<{ success: boolean; error?: string; remainingTransactionRef?: string | null }> {
  try {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (session?.access_token) {
      headers["Authorization"] = `Bearer ${session.access_token}`;
    }

    const response = await fetch("/api/student/delete-passport-receipt", {
      method: "POST",
      headers,
      body: JSON.stringify({
        studentId,
        documentId: targetDetails?.documentId,
        paymentId: targetDetails?.paymentId,
        fileUrl: targetDetails?.fileUrl,
        clearReference: targetDetails?.clearReference,
      }),
    });

    const resData = await response.json();
    if (!response.ok || !resData.success) {
      return {
        success: false,
        error: resData.error || "Failed to remove passport payment receipt.",
      };
    }

    return {
      success: true,
      remainingTransactionRef: resData.remainingTransactionRef || null,
    };
  } catch (err: any) {
    console.error("Error in deleteStudentPassportReceipt:", err);
    return { success: false, error: err.message || "Failed to remove passport payment receipt." };
  }
}

/**
 * Fetch all notifications for a specific student, ordered newest first
 */
export async function fetchStudentNotifications(userId: string): Promise<DbNotification[]> {
  try {
    if (!userId) return [];
    const supabase = createClient();
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching student notifications:", error);
      return [];
    }

    return (data as DbNotification[]) || [];
  } catch (err) {
    console.error("Failed to fetch notifications:", err);
    return [];
  }
}

/**
 * Mark a specific notification as read (strictly scoped to user_id)
 */
export async function markNotificationAsRead(
  notificationId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId)
      .eq("user_id", userId);

    if (error) {
      console.error("Error marking notification as read:", error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    console.error("Failed to mark notification as read:", err);
    return { success: false, error: err.message || "Failed to update notification" };
  }
}

/**
 * Mark all unread notifications as read for a specific student
 */
export async function markAllNotificationsAsRead(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false);

    if (error) {
      console.error("Error marking all notifications as read:", error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    console.error("Failed to mark all notifications as read:", err);
    return { success: false, error: err.message || "Failed to update notifications" };
  }
}

/**
 * Delete a specific notification (strictly scoped to user_id)
 */
export async function deleteNotificationFromSupabase(
  notificationId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", notificationId)
      .eq("user_id", userId);

    if (error) {
      console.error("Error deleting notification:", error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    console.error("Failed to delete notification:", err);
    return { success: false, error: err.message || "Failed to delete notification" };
  }
}

/**
 * Create a new notification for a student (e.g. application submission, payment status)
 */
export async function createStudentNotification(payload: {
  user_id: string;
  title: string;
  message: string;
  type?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();
    const { error } = await supabase.from("notifications").insert([
      {
        user_id: payload.user_id,
        title: payload.title,
        message: payload.message,
        type: payload.type || "info",
        is_read: false,
      },
    ]);

    if (error) {
      console.error("Error creating student notification:", error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    console.error("Failed to create notification:", err);
    return { success: false, error: err.message || "Failed to create notification" };
  }
}

export interface StudentJourneyStep {
  stageKey: string;
  badge: string;
  badgeColor: string;
  title: string;
  description: string;
  estimatedTimeline: string;
  appliedToSummary?: string;
  actionLabel: string;
  actionNav: "profile" | "payments" | "application" | "documents" | "universities" | "connect";
  iconType: "user" | "credit-card" | "clock" | "file-text" | "award" | "plane" | "check";
  primaryApp?: DbApplication | null;
}

export interface DbPassportAssistance {
  id?: string;
  student_id: string;
  // Section 1: Applicant Information
  first_name?: string | null;
  middle_name?: string | null;
  last_name?: string | null;
  date_of_birth?: string | null;
  birth_country?: string | null;
  birth_region?: string | null;
  birth_district?: string | null;
  birth_ward?: string | null;
  birth_village_street?: string | null;
  sex?: string | null;
  marital_status?: string | null;
  student_postal_address?: string | null;
  email?: string | null;
  phone_number?: string | null;

  // Section 2: Current Residence
  residence_country?: string | null;
  residence_region?: string | null;
  residence_district?: string | null;
  residence_ward?: string | null;
  residence_street_village?: string | null;
  residence_house_number?: string | null;

  // Section 3: Father's Information
  father_full_name?: string | null;
  father_occupation?: string | null;
  father_dob?: string | null;
  father_birth_country?: string | null;
  father_birth_region?: string | null;
  father_birth_district?: string | null;
  father_birth_ward_shehia?: string | null;
  father_birth_street_village?: string | null;

  // Section 4: Mother's Information
  mother_full_name?: string | null;
  mother_occupation?: string | null;
  mother_dob?: string | null;
  mother_birth_country?: string | null;
  mother_birth_region?: string | null;
  mother_birth_district?: string | null;
  mother_birth_ward_shehia?: string | null;
  mother_birth_street_village?: string | null;

  // Workflow & Status
  assistance_status?: string; // 'form_pending', 'form_completed', 'documents_pending', 'in_progress', 'ready_for_submission', 'submitted_to_immigration', 'passport_issued'
  status?: string;
  payment_status?: string; // 'unpaid', 'pending_verification', 'paid'
  payment_amount?: number;
  payment_currency?: string;
  payment_method?: string | null;
  payment_ref?: string | null;
  payment_proof_url?: string | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface StudentDashboardData {
  profile: DbProfile | null;
  applications: DbApplication[];
  payments: DbPayment[];
  notifications: DbNotification[];
  contacts?: DbStudentContact[];
  primaryContact?: DbStudentContact | null;
  assignedOfficer?: DbProfile | null;
  passportAssistance?: DbPassportAssistance | null;
  hasApprovedPayment: boolean;
  isOnboardingCompleted: boolean;
  progressPercentage: number;
  currentMilestoneStage: string;
  journeyStep: StudentJourneyStep;
}

/**
 * Helper to determine if an officer is currently online based on last_seen_at timestamp
 */
export function isOfficerOnline(lastSeenAt: string | null | undefined, thresholdSeconds: number = 90): boolean {
  if (!lastSeenAt) return false;
  const lastActiveTime = new Date(lastSeenAt).getTime();
  if (isNaN(lastActiveTime)) return false;
  const diffSeconds = (Date.now() - lastActiveTime) / 1000;
  return diffSeconds >= 0 && diffSeconds <= thresholdSeconds;
}

/**
 * Touch officer presence timestamp (heartbeat)
 */
export async function updateOfficerHeartbeat(officerId: string): Promise<boolean> {
  if (!officerId) return false;
  try {
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ last_seen_at: new Date().toISOString() })
      .eq("id", officerId);
    return !error;
  } catch {
    return false;
  }
}

/**
 * Centralized Progress & Stage Calculation Helper for Multi-University Architecture
 * Evaluates real live database state across profile, payments, and applications.
 */
export function calculateStudentProgress(
  profile: DbProfile | null,
  applications: DbApplication[] = [],
  payments: DbPayment[] = []
): {
  progressPercentage: number;
  currentMilestoneStage: string;
  isOnboardingCompleted: boolean;
  journeyStep: StudentJourneyStep;
} {
  const isProfileDone = profile?.is_profile_completed === true;

  // 1. Profile Incomplete
  if (!isProfileDone) {
    return {
      progressPercentage: 0,
      currentMilestoneStage: "Profile Pending",
      isOnboardingCompleted: false,
      journeyStep: {
        stageKey: "profile_pending",
        badge: "ACTION REQUIRED",
        badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
        title: "Complete Your Profile Wizard",
        description: "Fill in your personal information, academic qualifications, parent/sponsor contact, and upload required academic documents.",
        estimatedTimeline: "10 – 15 Minutes",
        appliedToSummary: "Profile Completion Step",
        actionLabel: "Complete Profile Wizard →",
        actionNav: "profile",
        iconType: "user",
      },
    };
  }

  // Sorted latest payments
  const sortedPayments = [...payments].sort(
    (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
  );
  const latestPayment = sortedPayments[0] || null;
  const hasApprovedPayment = payments.some(
    (p) => (p.status || "").toLowerCase() === "approved"
  );
  const isPaymentPendingReview =
    !hasApprovedPayment &&
    sortedPayments.some((p) =>
      ["pending", "submitted", "under review"].includes((p.status || "").toLowerCase())
    );
  const isPaymentRejected =
    !hasApprovedPayment &&
    latestPayment &&
    (latestPayment.status || "").toLowerCase() === "rejected";

  // Primary active application
  const sortedApps = [...applications].sort(
    (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
  );
  const primaryApp = sortedApps[0] || null;

  // 2. Profile Complete, No Payment Submitted
  if (!hasApprovedPayment && !isPaymentPendingReview && !isPaymentRejected) {
    return {
      progressPercentage: 25,
      currentMilestoneStage: "Payment Required",
      isOnboardingCompleted: true,
      journeyStep: {
        stageKey: "payment_required",
        badge: "PAYMENT REQUIRED",
        badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
        title: "Pay Application Processing Fee (TSh 50,000)",
        description: "Your profile is complete! Pay the official TSh 50,000 Application File Opening Fee to activate your study abroad application.",
        estimatedTimeline: "1 – 2 Business Hours after payment",
        appliedToSummary: "Application Activation Fee",
        actionLabel: "Pay TSh 50,000 Now →",
        actionNav: "payments",
        iconType: "credit-card",
      },
    };
  }

  // 3. Payment Submitted / Under Finance Review
  if (isPaymentPendingReview) {
    return {
      progressPercentage: 30,
      currentMilestoneStage: "Payment Under Review",
      isOnboardingCompleted: true,
      journeyStep: {
        stageKey: "payment_under_review",
        badge: "FINANCE VERIFICATION",
        badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
        title: "Payment Under Finance Verification",
        description: "Your payment receipt and transaction reference are being verified by the Mtishbi Finance Department. Your file will be activated shortly.",
        estimatedTimeline: "1 – 2 Business Hours",
        appliedToSummary: latestPayment?.transaction_ref ? `Ref: ${latestPayment.transaction_ref}` : "Under Review",
        actionLabel: "View Payment Status →",
        actionNav: "payments",
        iconType: "clock",
      },
    };
  }

  // 4. Payment Rejected
  if (isPaymentRejected) {
    return {
      progressPercentage: 25,
      currentMilestoneStage: "Payment Issue",
      isOnboardingCompleted: true,
      journeyStep: {
        stageKey: "payment_rejected",
        badge: "PAYMENT ACTION REQUIRED",
        badgeColor: "bg-red-100 text-red-800 border-red-200",
        title: "Payment Verification Issue",
        description: `Your payment verification could not be confirmed: ${latestPayment?.rejection_reason || "Invalid receipt or reference"}. Please resubmit your payment proof.`,
        estimatedTimeline: "Immediate Action Required",
        appliedToSummary: "Payment Resubmission Required",
        actionLabel: "Resubmit Payment Proof →",
        actionNav: "payments",
        iconType: "credit-card",
      },
    };
  }

  // 5. Payment Approved, No University Application Selected Yet
  if (!primaryApp || (!primaryApp.university_id && !primaryApp.preferred_course && !primaryApp.target_country)) {
    return {
      progressPercentage: 35,
      currentMilestoneStage: "Application File Activated",
      isOnboardingCompleted: true,
      journeyStep: {
        stageKey: "select_university",
        badge: "READY TO APPLY",
        badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
        title: "Choose Your University & Program",
        description: "Your MtishbiScholars file is active! Select your preferred partner university, program of study, and intake to start your application.",
        estimatedTimeline: "Immediate",
        appliedToSummary: "Select from 15+ Partner Universities",
        actionLabel: "Start University Application →",
        actionNav: "application",
        iconType: "file-text",
      },
    };
  }

  // Evaluate status of primary application
  const appStatus = (primaryApp.status || "").toLowerCase().trim();
  const appTarget = primaryApp.universities?.name
    ? `${primaryApp.universities.name}${primaryApp.universities.country ? `, ${primaryApp.universities.country}` : ""}`
    : primaryApp.target_country || "Partner University";

  // 6. Ready to Fly / Enrolled
  if (appStatus.includes("ready to fly") || appStatus.includes("enrolled")) {
    return {
      progressPercentage: 100,
      currentMilestoneStage: "Ready to Fly",
      isOnboardingCompleted: true,
      journeyStep: {
        stageKey: "ready_to_fly",
        badge: "JOURNEY READY",
        badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
        title: "Pre-Departure & Campus Arrival",
        description: `All admission and immigration milestones are complete for ${appTarget}. Welcome to your international university journey!`,
        estimatedTimeline: "Enrolled & Ready",
        appliedToSummary: appTarget,
        actionLabel: "Connect with Students Abroad →",
        actionNav: "connect",
        iconType: "check",
        primaryApp,
      },
    };
  }

  // 7. Visa Approved
  if (appStatus.includes("visa approved")) {
    return {
      progressPercentage: 95,
      currentMilestoneStage: "Visa Approved",
      isOnboardingCompleted: true,
      journeyStep: {
        stageKey: "visa_approved",
        badge: "VISA APPROVED!",
        badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
        title: "Student Visa Approved & Issued!",
        description: `Your visa for ${primaryApp.target_country || "abroad"} has been approved! Prepare your flight tickets, accommodation, and travel checklist.`,
        estimatedTimeline: "Completed",
        appliedToSummary: appTarget,
        actionLabel: "View Travel Checklist →",
        actionNav: "application",
        iconType: "plane",
        primaryApp,
      },
    };
  }

  // 8. Visa Processing
  if (appStatus.includes("visa")) {
    return {
      progressPercentage: 90,
      currentMilestoneStage: "Visa Processing",
      isOnboardingCompleted: true,
      journeyStep: {
        stageKey: "visa_processing",
        badge: "VISA STAGE",
        badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
        title: "Student Visa Application Active",
        description: `Your student visa file and embassy appointment documents for ${primaryApp.target_country || "study destination"} are in progress with your advisor.`,
        estimatedTimeline: "2 – 3 Weeks",
        appliedToSummary: appTarget,
        actionLabel: "View Visa Details →",
        actionNav: "application",
        iconType: "clock",
        primaryApp,
      },
    };
  }

  // 9. University Offer Issued
  if (appStatus.includes("offer") || appStatus.includes("university offer issued")) {
    return {
      progressPercentage: 80,
      currentMilestoneStage: "Offer Letter Issued",
      isOnboardingCompleted: true,
      journeyStep: {
        stageKey: "offer_issued",
        badge: "CONGRATULATIONS!",
        badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
        title: "Official University Offer Letter Issued!",
        description: `Congratulations! ${appTarget} has issued your official letter of acceptance / scholarship offer for ${primaryApp.courses?.title || primaryApp.preferred_course || "your degree"}.`,
        estimatedTimeline: "Ready to Download",
        appliedToSummary: appTarget,
        actionLabel: "View & Download Offer Letter →",
        actionNav: "application",
        iconType: "award",
        primaryApp,
      },
    };
  }

  // 10. Admission Review in Progress
  if (appStatus.includes("review") || appStatus.includes("under review") || appStatus.includes("processing")) {
    return {
      progressPercentage: 65,
      currentMilestoneStage: "Admission Review in Progress",
      isOnboardingCompleted: true,
      journeyStep: {
        stageKey: "under_review",
        badge: "IN REVIEW",
        badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
        title: "Admission Officer Evaluating Documents",
        description: `Your application documents for ${primaryApp.courses?.title || primaryApp.preferred_course || "your course"} at ${appTarget} are being verified by your assigned officer.`,
        estimatedTimeline: "3 – 5 Business Days",
        appliedToSummary: appTarget,
        actionLabel: "View Application Progress →",
        actionNav: "application",
        iconType: "clock",
        primaryApp,
      },
    };
  }

  // 11. Submitted to University
  if (appStatus.includes("submitted to university")) {
    return {
      progressPercentage: 50,
      currentMilestoneStage: "Submitted to University",
      isOnboardingCompleted: true,
      journeyStep: {
        stageKey: "submitted_to_university",
        badge: "UNIVERSITY PROCESSING",
        badgeColor: "bg-purple-100 text-purple-800 border-purple-200",
        title: "Application Transmitted to University",
        description: `Your file has been submitted to ${appTarget} International Admissions Office. The university admission board is reviewing your profile.`,
        estimatedTimeline: "2 – 4 Weeks",
        appliedToSummary: appTarget,
        actionLabel: "View My Application →",
        actionNav: "application",
        iconType: "clock",
        primaryApp,
      },
    };
  }

  // 12. Application Prepared / Ready for Officer Review
  return {
    progressPercentage: 40,
    currentMilestoneStage: "Application Ready",
    isOnboardingCompleted: true,
    journeyStep: {
      stageKey: "application_ready",
      badge: "APPLICATION READY",
      badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
      title: "Application Queued for Review",
      description: `Your application for ${primaryApp.courses?.title || primaryApp.preferred_course || "your course"} at ${appTarget} is prepared and queued for officer assignment.`,
      estimatedTimeline: "1 – 3 Business Days",
      appliedToSummary: appTarget,
      actionLabel: "View My Application →",
      actionNav: "application",
      iconType: "file-text",
      primaryApp,
    },
  };
}

/**
 * Clean data-fetching helper to retrieve student-specific dashboard data including assigned officer
 */
export async function fetchStudentDashboardData(userId: string): Promise<StudentDashboardData> {
  const fallbackJourney: StudentJourneyStep = {
    stageKey: "profile_pending",
    badge: "ACTION REQUIRED",
    badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
    title: "Complete Your Profile Wizard",
    description: "Fill in your personal information, academic qualifications, parent/sponsor contact, and upload required documents.",
    estimatedTimeline: "10 – 15 Minutes",
    appliedToSummary: "Profile Pending",
    actionLabel: "Complete Profile Wizard →",
    actionNav: "profile",
    iconType: "user",
  };

  if (!userId) {
    return {
      profile: null,
      applications: [],
      payments: [],
      notifications: [],
      contacts: [],
      primaryContact: null,
      assignedOfficer: null,
      hasApprovedPayment: false,
      isOnboardingCompleted: false,
      progressPercentage: 0,
      currentMilestoneStage: "Profile Pending",
      journeyStep: fallbackJourney,
    };
  }

  const supabase = createClient();

  // Safe parallel queries scoped strictly to userId
  const [profileRes, appRes, payRes, notifRes, contactRes, passportRes] = await Promise.allSettled([
    supabase.from("profiles").select("*").eq("id", userId).single(),
    supabase.from("applications").select("*, universities(*), courses(*)").eq("student_id", userId).order("created_at", { ascending: false }),
    supabase.from("payments").select("*").eq("student_id", userId).order("created_at", { ascending: false }),
    supabase.from("notifications").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(5),
    supabase.from("student_contacts").select("*").eq("student_id", userId).order("is_primary", { ascending: false }),
    supabase.from("passport_assistance").select("*").eq("student_id", userId).maybeSingle(),
  ]);

  const profile: DbProfile | null = profileRes.status === "fulfilled" && !profileRes.value.error ? (profileRes.value.data as DbProfile) : null;
  const rawApplications: DbApplication[] = appRes.status === "fulfilled" && !appRes.value.error ? ((appRes.value.data as DbApplication[]) || []) : [];
  const payments: DbPayment[] = payRes.status === "fulfilled" && !payRes.value.error ? ((payRes.value.data as DbPayment[]) || []) : [];
  const notifications: DbNotification[] = notifRes.status === "fulfilled" && !notifRes.value.error ? ((notifRes.value.data as DbNotification[]) || []) : [];
  const contacts: DbStudentContact[] = contactRes.status === "fulfilled" && !contactRes.value.error ? ((contactRes.value.data as DbStudentContact[]) || []) : [];
  const primaryContact: DbStudentContact | null = contacts.find((c) => c.is_primary) || contacts[0] || null;
  const passportAssistance: DbPassportAssistance | null = passportRes.status === "fulfilled" && !passportRes.value.error ? (passportRes.value.data as DbPassportAssistance) : null;

  // Fetch assigned admission officers for applications
  const officerIds = Array.from(
    new Set(rawApplications.map((a) => a.admission_officer_id).filter(Boolean))
  ) as string[];

  let officersMap = new Map<string, DbProfile>();
  if (officerIds.length > 0) {
    try {
      const { data: officersData } = await supabase
        .from("profiles")
        .select("id, email, first_name, last_name, phone, role, avatar_url, last_seen_at")
        .in("id", officerIds);

      if (officersData) {
        officersData.forEach((off) => {
          officersMap.set(off.id, off as DbProfile);
        });
      }
    } catch (err) {
      console.warn("Could not load officer profiles:", err);
    }
  }

  const applications: DbApplication[] = rawApplications.map((app) => ({
    ...app,
    admission_officer: app.admission_officer_id ? officersMap.get(app.admission_officer_id) || null : null,
  }));

  const assignedOfficer: DbProfile | null = applications[0]?.admission_officer || null;

  const hasApprovedPayment = payments.some((p) => {
    const isFileFee =
      (p.payment_type === "file_opening_fee" || p.amount === 50000 || !p.payment_type) &&
      p.payment_type !== "passport_assistance" &&
      p.amount !== 300000;
    const st = (p.status || "").toLowerCase().trim();
    return isFileFee && (st === "approved" || st === "paid" || st === "verified");
  });

  const { progressPercentage, currentMilestoneStage, isOnboardingCompleted, journeyStep } = calculateStudentProgress(profile, applications, payments);

  return {
    profile,
    applications,
    payments,
    notifications,
    contacts,
    primaryContact,
    assignedOfficer,
    passportAssistance,
    hasApprovedPayment,
    isOnboardingCompleted,
    progressPercentage,
    currentMilestoneStage,
    journeyStep,
  };
}

/**
 * Fetch passport assistance record for a student
 */
export async function fetchPassportAssistance(studentId: string): Promise<DbPassportAssistance | null> {
  try {
    if (!studentId) return null;
    const supabase = createClient();
    const { data, error } = await supabase
      .from("passport_assistance")
      .select("*")
      .eq("student_id", studentId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching passport assistance:", error);
      return null;
    }
    return (data as DbPassportAssistance) || null;
  } catch (err) {
    console.error("Failed to fetch passport assistance:", err);
    return null;
  }
}

/**
 * Save or update passport assistance details (upsert by student_id)
 */
export async function savePassportAssistance(
  studentId: string,
  payload: Partial<DbPassportAssistance>
): Promise<{ success: boolean; data?: DbPassportAssistance; error?: string }> {
  try {
    if (!studentId) return { success: false, error: "Missing student ID" };
    const supabase = createClient();

    const updatePayload = {
      ...payload,
      student_id: studentId,
      updated_at: new Date().toISOString(),
    };

    const { data: existing } = await supabase
      .from("passport_assistance")
      .select("id")
      .eq("student_id", studentId)
      .maybeSingle();

    let resData: any = null;
    if (existing?.id) {
      const { data, error } = await supabase
        .from("passport_assistance")
        .update(updatePayload)
        .eq("id", existing.id)
        .select()
        .single();

      if (error) {
        console.error("Error updating passport assistance:", error);
        return { success: false, error: error.message };
      }
      resData = data;
    } else {
      const { data, error } = await supabase
        .from("passport_assistance")
        .insert([updatePayload])
        .select()
        .single();

      if (error) {
        console.error("Error inserting passport assistance:", error);
        return { success: false, error: error.message };
      }
      resData = data;
    }

    return { success: true, data: resData as DbPassportAssistance };
  } catch (err: any) {
    console.error("Failed to save passport assistance:", err);
    return { success: false, error: err.message || "Failed to save passport information" };
  }
}

/**
 * Submit passport assistance fee payment proof (receipt or transaction reference)
 */
export async function submitPassportPaymentProof(
  studentId: string,
  payload: {
    paymentMethod: string;
    transactionRef?: string | null;
    receiptFile?: File | null;
    amount?: number;
  }
): Promise<{ success: boolean; data?: DbPassportAssistance; error?: string }> {
  try {
    if (!studentId) return { success: false, error: "Missing student ID" };
    let fileUrl: string | null = null;

    if (payload.receiptFile) {
      const docRes = await uploadStudentDocument(
        studentId,
        payload.receiptFile,
        "Passport_Payment_Receipt"
      );
      if (docRes.success && docRes.fileUrl) {
        fileUrl = docRes.fileUrl;
      } else if (!docRes.success) {
        return { success: false, error: docRes.error || "Failed to upload payment receipt" };
      }
    }

    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (session?.access_token) {
      headers["Authorization"] = `Bearer ${session.access_token}`;
    }

    const response = await fetch("/api/student/submit-passport-payment", {
      method: "POST",
      headers,
      body: JSON.stringify({
        studentId,
        paymentMethod: payload.paymentMethod,
        transactionRef: payload.transactionRef || null,
        fileUrl,
        amount: payload.amount || 300000,
      }),
    });

    const resData = await response.json();
    if (!response.ok || !resData.success) {
      return {
        success: false,
        error: resData.error || "Failed to submit passport payment proof.",
      };
    }

    return { success: true, data: resData.data };
  } catch (err: any) {
    console.error("Failed to submit passport payment:", err);
    return { success: false, error: err.message || "Failed to submit payment proof" };
  }
}

/**
 * Single source of truth helper for student payment approval status (File Opening Fee)
 */
export function checkHasApprovedPayment(
  dashData: StudentDashboardData | null | undefined
): boolean {
  if (!dashData) return false;
  if (dashData.hasApprovedPayment) return true;
  return Boolean(
    dashData.payments &&
    dashData.payments.some(
      (p) =>
        (p.status || "").toLowerCase() === "approved" &&
        (p.payment_type === "file_opening_fee" ||
         !p.payment_type ||
         Number(p.amount) === 50000)
    )
  );
}

/**
 * Request permanent profile and account deletion through secure server API
 */
export async function deleteStudentProfileAndAccount(): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (session?.access_token) {
      headers["Authorization"] = `Bearer ${session.access_token}`;
    }

    const res = await fetch("/api/student/delete-profile", {
      method: "POST",
      headers,
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || "Failed to delete profile" };
    }

    return { success: true };
  } catch (err: any) {
    console.error("deleteStudentProfileAndAccount error:", err);
    return { success: false, error: err.message || "Failed to communicate with server" };
  }
}


