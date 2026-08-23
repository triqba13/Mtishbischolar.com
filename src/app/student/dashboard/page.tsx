"use client";

import { useState, Suspense, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { INITIAL_UNIVERSITIES, getUniversitiesFromDB, University } from "@/lib/data/universities";
import {
  submitApplicationToSupabase,
  submitPaymentToSupabase,
  updateOrResubmitPaymentProof,
  fetchStudentDashboardData,
  checkHasApprovedPayment,
  fetchCoursesByUniversity,
  fetchAllCoursesWithUniversities,
  requestUnlistedCourseApplication,
  deleteStudentApplication,
  calculateStudentProgress,
  saveStudentFullProfile,
  saveApplicationPreference,
  saveStudentContact,
  fetchStudentContacts,
  uploadStudentDocument,
  deleteStudentDocument,
  fetchStudentDocuments,
  getStudentDocumentSignedUrl,
  deleteStudentProfileAndAccount,
  fetchStudentNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotificationFromSupabase,
  isOfficerOnline,
  isUnlistedCourseRequest,
  getApplicationStatusDisplay,
  isApplicationDeletable,
  StudentJourneyStep,
  StudentDashboardData,
  DbCourse,
  DbApplication,
  DbUniversity,
  DbNotification,
  DbPayment,
  DbProfile,
  DbDocument,
  DbStudentContact,
} from "@/lib/supabase/data";
import { NationalitySelect } from "@/components/NationalitySelect";
import { PhoneInput } from "@/components/PhoneInput";
import { createClient } from "@/lib/supabase/client";
import { DEV_UNLOCK_STUDENT_PANEL } from "@/lib/config/access";
import {
  GraduationCap,
  User,
  CheckCircle2,
  Clock,
  FileText,
  Upload,
  AlertTriangle,
  LogOut,
  Bell,
  Search,
  ChevronRight,
  ShieldCheck,
  Building2,
  BookOpen,
  LayoutDashboard,
  UserCheck,
  Award,
  CreditCard,
  MessageSquare,
  Settings,
  Menu,
  X,
  Phone,
  MapPin,
  Users,
  Calendar,
  Check,
  Info,
  Globe,
  HelpCircle,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  Lock,
  Unlock,
  Download,
  QrCode,
  Trash2,
  Star,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Smartphone,
  Copy,
  Plus,
  Eye,
  ExternalLink,
  FolderCheck,
  RefreshCw,
  MessageCircle,
  EyeOff,
  Sun,
  Moon,
  Monitor,
  KeyRound,
  ShieldAlert,
  Send,
  Compass,
} from "lucide-react";

type Stage =
  | "profile_pending"
  | "profile_submitted"
  | "payment_pending"
  | "payment_approved"
  | "application_submitted"
  | "offer_letter_uploaded";

function DashboardContent() {
  const searchParams = useSearchParams();
  
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authChecking, setAuthChecking] = useState<boolean>(true);

  const [dashData, setDashData] = useState<StudentDashboardData | null>(null);
  const [showTargetDashboard, setShowTargetDashboard] = useState<boolean>(false);
  const [dataLoading, setDataLoading] = useState<boolean>(true);

  const [stage, setStage] = useState<Stage>("profile_pending");
  const [profileStep, setProfileStep] = useState<number>(1);
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});
  const [profileErrorBanner, setProfileErrorBanner] = useState<string>("");
  const [showPaymentLockModal, setShowPaymentLockModal] = useState<boolean>(false);
  const [paymentLockMessage, setPaymentLockMessage] = useState<string>(
    "Your TSh 50,000 MtishbiScholar Application File Opening Fee must be approved by a Finance Officer before you can access university applications."
  );
  const [activeNav, setActiveNav] = useState<string>("dashboard");
  const [prevNav, setPrevNav] = useState<string>("dashboard");
  const activeNavRef = useRef<string>(activeNav);

  useEffect(() => {
    if (activeNavRef.current !== activeNav) {
      setPrevNav(activeNavRef.current);
      activeNavRef.current = activeNav;
    }
  }, [activeNav]);

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const clearProfileError = (field: string) => {
    if (profileErrors[field]) {
      setProfileErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        if (Object.keys(next).length === 0) setProfileErrorBanner("");
        return next;
      });
    }
  };

  // Identity Resolution: Strictly rely on public.profiles (by auth.users.id) first, then auth metadata.
  // NEVER infer user's name from email address prefix.
  const rawFirstName = dashData?.profile?.first_name?.trim();
  const validProfileFirstName = rawFirstName && rawFirstName.toLowerCase() !== "student" ? rawFirstName : null;

  const metadataFirstName = (
    currentUser?.user_metadata?.first_name ||
    currentUser?.user_metadata?.given_name ||
    currentUser?.user_metadata?.full_name?.split(/\s+/)[0] ||
    currentUser?.user_metadata?.name?.split(/\s+/)[0]
  )?.trim();

  const studentFirstName =
    validProfileFirstName ||
    (metadataFirstName && metadataFirstName.toLowerCase() !== "student" ? metadataFirstName : null) ||
    "Student";

  const rawLastName = dashData?.profile?.last_name?.trim();
  const metadataLastName = (
    currentUser?.user_metadata?.last_name ||
    currentUser?.user_metadata?.family_name ||
    currentUser?.user_metadata?.full_name?.split(/\s+/).slice(1).join(" ") ||
    currentUser?.user_metadata?.name?.split(/\s+/).slice(1).join(" ")
  )?.trim();

  const studentLastName = rawLastName || metadataLastName || "";

  const studentFullName =
    [studentFirstName, studentLastName].filter((n) => n && n !== "Student").join(" ") ||
    (studentFirstName !== "Student" ? studentFirstName : "") ||
    currentUser?.user_metadata?.full_name ||
    currentUser?.user_metadata?.name ||
    "Student";

  const studentInitials =
    studentFullName !== "Student"
      ? studentFullName
          .split(" ")
          .filter(Boolean)
          .map((n: string) => n[0])
          .slice(0, 2)
          .join("")
          .toUpperCase()
      : studentFirstName.slice(0, 2).toUpperCase() || "ST";

  const [savingProfile, setSavingProfile] = useState<boolean>(false);
  const [profileSubmitError, setProfileSubmitError] = useState<string>("");
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);
  const [, setPresenceTick] = useState<number>(0);
  const hasApprovedPayment = checkHasApprovedPayment(dashData);

  // ── RECEIPT PREVIEW MODAL STATE & HANDLER ──
  const [previewReceiptModal, setPreviewReceiptModal] = useState<{
    isOpen: boolean;
    url: string;
    title: string;
    isPdf: boolean;
    loading: boolean;
  }>({
    isOpen: false,
    url: "",
    title: "Payment Receipt Proof",
    isPdf: false,
    loading: false,
  });

  const handleViewReceipt = async (fileUrlOrPath: string, refTitle?: string) => {
    if (!fileUrlOrPath) {
      alert("No receipt file attached to this payment record.");
      return;
    }

    try {
      setPreviewReceiptModal({
        isOpen: true,
        url: "",
        title: refTitle ? `Payment Receipt (${refTitle})` : "Payment Receipt Proof",
        isPdf: fileUrlOrPath.toLowerCase().includes(".pdf"),
        loading: true,
      });

      const res = await getStudentDocumentSignedUrl(fileUrlOrPath, 60 * 15);
      if (res.success && res.signedUrl) {
        const signedUrl = res.signedUrl;
        setPreviewReceiptModal((prev) => ({
          ...prev,
          url: signedUrl,
          isPdf: signedUrl.toLowerCase().includes(".pdf") || fileUrlOrPath.toLowerCase().includes(".pdf"),
          loading: false,
        }));
      } else {
        setPreviewReceiptModal((prev) => ({ ...prev, isOpen: false, loading: false }));
        if (res.notFound) {
          alert("Receipt file is no longer available. Please re-upload your receipt.");
        } else {
          alert(res.error || "Unable to generate secure preview link for this receipt.");
        }
      }
    } catch (err: any) {
      console.error("Error loading receipt preview:", err);
      setPreviewReceiptModal((prev) => ({ ...prev, isOpen: false, loading: false }));
      alert("Receipt file is no longer available. Please re-upload your receipt.");
    }
  };

  // ── RE-UPLOAD RECEIPT STATE ──
  const [isReuploadingPayment, setIsReuploadingPayment] = useState<boolean>(false);

  // Profile Header Dropdown State & Listener
  const [profileDropdownOpen, setProfileDropdownOpen] = useState<boolean>(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setProfileDropdownOpen(false);
      }
    };

    if (profileDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [profileDropdownOpen]);

  useEffect(() => {
    async function verifyAuth() {
      try {
        const supabase = createClient();
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          window.location.href = "/auth/login?error=session_expired";
          return;
        }

        setCurrentUser(user);

        // Fetch live student-specific dashboard data
        setDataLoading(true);
        try {
          const liveData = await fetchStudentDashboardData(user.id);

          // Defense-in-depth: Verify that profile role is 'student'
          const role = liveData.profile?.role;
          if (role && role !== "student") {
            if (role === "admission_officer") {
              window.location.href = "/admin/admission/dashboard?error=unauthorized_student_portal";
            } else if (role === "finance_officer") {
              window.location.href = "/admin/finance/dashboard?error=unauthorized_student_portal";
            } else if (role === "super_admin") {
              window.location.href = "/admin/super/dashboard?error=unauthorized_student_portal";
            } else {
              await supabase.auth.signOut();
              window.location.href = "/auth/login?error=invalid_role";
            }
            return;
          }

          setDashData(liveData);

          // Hydrate profile state from Supabase database
          if (liveData.profile) {
            const p = liveData.profile;
            const draftApp = liveData.applications.find((a) => !a.university_id) || liveData.applications[0];

            setProfileData((prev) => ({
              ...prev,
              firstName: p.first_name || prev.firstName,
              middleName: p.middle_name || "",
              lastName: p.last_name || prev.lastName,
              dob: p.dob || "",
              gender: p.gender || "",
              nationality: p.nationality || "",
              // Restore full E.164 phone — PhoneInput will parse it into code + local
              phone: p.phone || "+255",
              highestEducation: p.highest_education || "",
              oLevelSchool: p.o_level_school || "",
              oLevelYear: p.o_level_year || "",
              aLevelSchool: p.a_level_school || "",
              aLevelYear: p.a_level_year || "",
              aLevelCombination: p.a_level_combination || "",
              certificateInstitution: p.certificate_institution || "",
              certificateCourse: p.certificate_course || "",
              certificateYear: p.certificate_year || "",
              diplomaInstitution: p.diploma_institution || "",
              diplomaCourse: p.diploma_course || "",
              diplomaYear: p.diploma_year || "",
              bachelorInstitution: p.bachelor_institution || "",
              bachelorCourse: p.bachelor_course || "",
              bachelorYear: p.bachelor_year || "",
              masterInstitution: p.master_institution || "",
              masterCourse: p.master_course || "",
              masterYear: p.master_year || "",
              phdInstitution: p.phd_institution || "",
              phdCourse: p.phd_course || "",
              phdYear: p.phd_year || "",
              hasPassport: p.has_passport === "Yes" ? "Yes" : p.has_passport === "No" ? "No" : "",
              passportNumber: p.passport_number || "",
              passportIssueDate: p.passport_issue_date || "",
              passportExpiryDate: p.passport_expiry_date || "",
              appliedAbroadBefore: p.applied_abroad_before === "Yes" ? "Yes" : p.applied_abroad_before === "No" ? "No" : "",
              howDidYouHear: p.how_did_you_hear || "",
              needFinancialGuidance: p.need_financial_guidance === "Yes" ? "Yes" : p.need_financial_guidance === "No" ? "No" : "",
              isProfileCompleted: p.is_profile_completed || false,
              preferredCountry: draftApp?.target_country || "",
              preferredCourse: draftApp?.preferred_course || "",
              intake: draftApp?.target_intake || "",
            }));
          }

          // Hydrate primary contact if available
          if (liveData.primaryContact) {
            const c = liveData.primaryContact;
            setProfileData((prev) => ({
              ...prev,
              parentRelationship: c.relationship_type || prev.parentRelationship || "Father",
              parentFirstName: c.first_name || "",
              parentMiddleName: c.middle_name || "",
              parentLastName: c.last_name || "",
              parentPhone: c.phone || "+255",
              parentEmail: c.email || "",
            }));
          }

          // Fetch student uploaded documents & notifications
          const [docs, notifs] = await Promise.all([
            fetchStudentDocuments(user.id),
            fetchStudentNotifications(user.id),
          ]);
          setStudentDocs(docs || []);
          setNotificationsList(notifs || []);

          // Calculate current student stage
          if (!liveData.profile?.is_profile_completed) {
            setStage("profile_pending");
          } else {
            const officialApps = liveData.applications;
            const hasOfferOrVisa = officialApps.some((a) => {
              const st = (a.status || "").toLowerCase();
              return st.includes("offer") || st.includes("visa") || st.includes("ready to fly") || st.includes("enrolled");
            });
            const hasSubmittedApp = officialApps.some((a) => {
              const st = (a.status || "").toLowerCase();
              return st.includes("submitted") || st.includes("review") || st.includes("processing");
            });
            const hasPendingPayment = liveData.payments.some((p) => {
              const st = (p.status || "").toLowerCase();
              return st === "submitted" || st === "under review" || st === "pending";
            });

            if (hasOfferOrVisa) {
              setStage("offer_letter_uploaded");
            } else if (hasSubmittedApp) {
              setStage("application_submitted");
            } else if (liveData.hasApprovedPayment) {
              setStage("payment_approved");
            } else if (hasPendingPayment) {
              setStage("payment_pending");
            } else {
              setStage("profile_submitted");
            }
          }
        } catch (fetchErr) {
          console.error("Dashboard data load notice:", fetchErr);
        } finally {
          setDataLoading(false);
        }
      } catch (err) {
        window.location.href = "/auth/login?error=unauthorized";
      } finally {
        setAuthChecking(false);
      }
    }

    verifyAuth();
  }, []);

  // Real-time Supabase subscriptions & presence tick
  useEffect(() => {
    if (!currentUser?.id) return;
    const supabase = createClient();

    const refreshDashboard = async () => {
      try {
        const liveData = await fetchStudentDashboardData(currentUser.id);
        setDashData(liveData);
      } catch (err) {
        console.warn("Realtime sync warning:", err);
      }
    };

    const channel = supabase
      .channel(`student_sync_${currentUser.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "applications",
          filter: `student_id=eq.${currentUser.id}`,
        },
        () => refreshDashboard()
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "payments",
          filter: `student_id=eq.${currentUser.id}`,
        },
        () => refreshDashboard()
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${currentUser.id}`,
        },
        async () => {
          refreshDashboard();
          if (currentUser?.id) {
            const notifs = await fetchStudentNotifications(currentUser.id);
            setNotificationsList(notifs || []);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "documents",
          filter: `student_id=eq.${currentUser.id}`,
        },
        async () => {
          if (currentUser?.id) {
            const docs = await fetchStudentDocuments(currentUser.id);
            setStudentDocs(docs || []);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
        },
        (payload) => {
          if (dashData?.assignedOfficer?.id && payload.new?.id === dashData.assignedOfficer.id) {
            refreshDashboard();
          }
        }
      )
      .subscribe();

    // 30-second presence pulse timer to re-evaluate isOfficerOnline
    const presenceTimer = setInterval(() => {
      setPresenceTick((prev) => prev + 1);
    }, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(presenceTimer);
    };
  }, [currentUser?.id, dashData?.assignedOfficer?.id]);

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Signout error:", err);
    } finally {
      window.location.href = "/auth/login";
    }
  };

  // Dynamic Universities Array
  const [dbUniversities, setDbUniversities] = useState<University[]>(INITIAL_UNIVERSITIES);
  const [loadingUniversities, setLoadingUniversities] = useState<boolean>(true);

  // Universities Directory Search & Filter State
  const [uniSearchQuery, setUniSearchQuery] = useState<string>("");
  const [uniCountryFilter, setUniCountryFilter] = useState<string>("All");
  const [uniScholarshipFilter, setUniScholarshipFilter] = useState<string>("All");
  const [uniTuitionFilter, setUniTuitionFilter] = useState<string>("All");

  // University Detail Modal State
  const [selectedUniForDetail, setSelectedUniForDetail] = useState<University | null>(null);
  const [uniDetailCourses, setUniDetailCourses] = useState<DbCourse[]>([]);
  const [loadingUniDetailCourses, setLoadingUniDetailCourses] = useState<boolean>(false);
  const [uniDetailCourseSearch, setUniDetailCourseSearch] = useState<string>("");
  const [uniDetailCourseLevelFilter, setUniDetailCourseLevelFilter] = useState<string>("All");

  const [liveCoursesList, setLiveCoursesList] = useState<DbCourse[]>([]);
  const [loadingLiveCourses, setLoadingLiveCourses] = useState<boolean>(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [submittingApp, setSubmittingApp] = useState<boolean>(false);

  const loadUniversities = async () => {
    try {
      setLoadingUniversities(true);
      const unis = await getUniversitiesFromDB();
      if (unis && unis.length > 0) {
        setDbUniversities(unis);
      }
    } catch (err) {
      console.error("Error loading universities from DB:", err);
    } finally {
      setLoadingUniversities(false);
    }
  };

  useEffect(() => {
    loadUniversities();
  }, []);

  const handleOpenUniDetails = async (uni: University) => {
    setSelectedUniForDetail(uni);
    setUniDetailCourseSearch("");
    setUniDetailCourseLevelFilter("All");
    try {
      setLoadingUniDetailCourses(true);
      const courses = await fetchCoursesByUniversity(uni.id);
      setUniDetailCourses(courses);
    } catch (err) {
      console.error("Failed to load courses for university details:", err);
      setUniDetailCourses([]);
    } finally {
      setLoadingUniDetailCourses(false);
    }
  };

  const handleApplyFromDirectory = async (uni: University, specificCourse?: DbCourse) => {
    if (!checkHasApprovedPayment(dashData)) {
      setPaymentLockMessage(
        "To apply to partner universities, your one-time MtishbiScholar Application File Opening Fee (TSh 50,000) must be approved first."
      );
      setShowPaymentLockModal(true);
      setSelectedUniForDetail(null);
      return;
    }

    setSelectedUniForDetail(null);

    if (specificCourse) {
      setSelectedOffering({
        ...specificCourse,
        universities: specificCourse.universities || (uni as any),
      });
      setSelectedCourseTitle(specificCourse.title);
      setNewAppStep(3); // Jump to intake & scholarship selection
    } else {
      setSelectedCourseTitle("");
      setSelectedOffering(null);
      setCourseSearchTerm(uni.name || "");
      setNewAppStep(1); // Course catalogue selection step
    }

    setShowNewAppModal(true);
  };

  useEffect(() => {
    async function loadCourses() {
      try {
        setLoadingLiveCourses(true);
        const supabase = createClient();
        const { data, error } = await supabase
          .from("courses")
          .select("*, universities(*)")
          .order("title", { ascending: true });

        if (!error && data) {
          setLiveCoursesList(data as DbCourse[]);
        }
      } catch (err) {
        console.error("Error loading courses:", err);
      } finally {
        setLoadingLiveCourses(false);
      }
    }

    loadCourses();
  }, []);

  // Selected Universities (Up to 3)
  const [selectedUniversities, setSelectedUniversities] = useState<string[]>([]);

  // Profile Wizard State
  const [profileData, setProfileData] = useState({
    // Step 1: Personal
    firstName: "",
    middleName: "",
    lastName: "",
    dob: "",
    gender: "",
    nationality: "",
    phone: "+255", // default Tanzania dial code; hydrated from DB on load
    altPhone: "",
    address: "",
    emergencyContact: "",
    // Parent / Guardian / Sponsor Details
    parentRelationship: "Father",
    parentFirstName: "",
    parentMiddleName: "",
    parentLastName: "",
    parentPhone: "+255",
    parentEmail: "",
    // Step 2: Academic
    highestEducation: "",
    oLevelSchool: "",
    oLevelYear: "",
    aLevelSchool: "",
    aLevelYear: "",
    aLevelCombination: "",
    // Dynamic Fields
    certificateInstitution: "",
    certificateCourse: "",
    certificateYear: "",
    diplomaInstitution: "",
    diplomaCourse: "",
    diplomaYear: "",
    bachelorInstitution: "",
    bachelorCourse: "",
    bachelorYear: "",
    masterInstitution: "",
    masterCourse: "",
    masterYear: "",
    phdInstitution: "",
    phdCourse: "",
    phdYear: "",
    // Step 3: Preference
    preferredCountry: "",
    intake: "",
    preferredUniversity: "",
    preferredCourse: "",
    // Step 4: Passport
    hasPassport: "Yes",
    passportNumber: "AB987654",
    passportIssue: "2022-01-10",
    passportExpiry: "2032-01-09",
    needPassportAssistance: "No",
    // Step 5: Mandatory Certificates (Must be uploaded!)
    form4CertificateUploaded: false,
    form6CertificateUploaded: false,
    transcriptUploaded: false,
    cvUploaded: false,
    recommendationUploaded: false,
    // Step 6: Additional
    appliedAbroadBefore: "",
    howDidYouHear: "",
    needFinancialGuidance: "",
  });

  // Step 3 Available Countries derived from Supabase/DB Universities
  const step3AvailableCountries = Array.from(
    new Set(dbUniversities.map((u) => u.country).filter(Boolean))
  ).sort();

  // Payment State (Official Mtishbi Company Limited Accounts)
  const [paymentMethod, setPaymentMethod] = useState<"LipaNamba" | "BankTransfer">("LipaNamba");
  const [transactionRef, setTransactionRef] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptFileName, setReceiptFileName] = useState("");
  const [submittingPayment, setSubmittingPayment] = useState<boolean>(false);
  const [copiedField, setCopiedField] = useState<string>("");

  const handleCopy = (text: string, label: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedField(label);
      setTimeout(() => setCopiedField(""), 2500);
    }
  };

  // 10-Step Guided Application Wizard State
  const [appWizardStep, setAppWizardStep] = useState<number>(1);
  const [appCountry, setAppCountry] = useState<string>("India");
  const [appIntake, setAppIntake] = useState<string>("September Intake");
  const [appDegree, setAppDegree] = useState<string>("Bachelor's Degree");
  const [appCourse, setAppCourse] = useState<string>("Computer Science & AI");
  const [appScholarship, setAppScholarship] = useState<"Yes" | "No">("Yes");
  const [appSelectedUnis, setAppSelectedUnis] = useState<string[]>([]);
  const [appCourseSearch, setAppCourseSearch] = useState<string>("");

  // My Application Detail & Course-First Application Modal State
  const [selectedAppDetail, setSelectedAppDetail] = useState<DbApplication | null>(null);
  const [showNewAppModal, setShowNewAppModal] = useState<boolean>(false);
  const [newAppStep, setNewAppStep] = useState<number>(1);
  const [allCatalogueCourses, setAllCatalogueCourses] = useState<DbCourse[]>([]);
  const [loadingCatalogueCourses, setLoadingCatalogueCourses] = useState<boolean>(false);
  const [courseSearchTerm, setCourseSearchTerm] = useState<string>("");
  const [courseLevelFilter, setCourseLevelFilter] = useState<string>("All");
  const [selectedCourseTitle, setSelectedCourseTitle] = useState<string>("");
  const [selectedOffering, setSelectedOffering] = useState<DbCourse | null>(null);
  const [newAppIntake, setNewAppIntake] = useState<string>("September 2026");
  const [newAppScholarship, setNewAppScholarship] = useState<string>("Yes");
  const [newAppSubmitting, setNewAppSubmitting] = useState<boolean>(false);

  // Unlisted Course Request State
  const [isRequestingUnlistedCourse, setIsRequestingUnlistedCourse] = useState<boolean>(false);
  const [unlistedCourseName, setUnlistedCourseName] = useState<string>("");
  const [unlistedTargetCountry, setUnlistedTargetCountry] = useState<string>("India");
  const [unlistedTargetIntake, setUnlistedTargetIntake] = useState<string>("September 2026");
  const [unlistedNotes, setUnlistedNotes] = useState<string>("");
  const [submittingUnlisted, setSubmittingUnlisted] = useState<boolean>(false);

  // Application Delete & Withdraw Actions State
  const [appToDelete, setAppToDelete] = useState<DbApplication | null>(null);
  const [isDeletingApp, setIsDeletingApp] = useState<boolean>(false);
  const [appToWithdraw, setAppToWithdraw] = useState<DbApplication | null>(null);
  const [withdrawalReason, setWithdrawalReason] = useState<string>("");
  const [isWithdrawingApp, setIsWithdrawingApp] = useState<boolean>(false);

  // Delete Profile & Start Over Modal State
  const [showDeleteProfileModal, setShowDeleteProfileModal] = useState<boolean>(false);
  const [deleteConfirmationInput, setDeleteConfirmationInput] = useState<string>("");
  const [isDeletingProfile, setIsDeletingProfile] = useState<boolean>(false);
  const [deleteProfileError, setDeleteProfileError] = useState<string>("");

  const handleDeleteProfilePermanently = async () => {
    if (deleteConfirmationInput.trim() !== "DELETE") {
      setDeleteProfileError("Please type DELETE in all uppercase to confirm.");
      return;
    }

    setIsDeletingProfile(true);
    setDeleteProfileError("");

    try {
      const res = await deleteStudentProfileAndAccount();
      if (!res.success) {
        throw new Error(res.error || "Failed to delete profile.");
      }

      // Sign out on client to clear session tokens
      const supabase = createClient();
      await supabase.auth.signOut();

      // Redirect to registration page with success flag
      window.location.href = "/auth/register?deleted=true";
    } catch (err: any) {
      console.error("Delete profile error:", err);
      setDeleteProfileError(err.message || "Failed to delete profile. Please try again.");
      setIsDeletingProfile(false);
    }
  };

  const handleOpenNewAppModal = async () => {
    if (!checkHasApprovedPayment(dashData)) {
      setPaymentLockMessage(
        "To apply to partner universities, your one-time MtishbiScholar Application File Opening Fee (TSh 50,000) must be approved first."
      );
      setShowPaymentLockModal(true);
      return;
    }

    setNewAppStep(1);
    setSelectedCourseTitle("");
    setSelectedOffering(null);
    setCourseSearchTerm("");
    setCourseLevelFilter("All");
    setNewAppIntake("September 2026");
    setIsRequestingUnlistedCourse(false);
    setShowNewAppModal(true);

    if (allCatalogueCourses.length === 0) {
      setLoadingCatalogueCourses(true);
      try {
        const courses = await fetchAllCoursesWithUniversities();
        setAllCatalogueCourses(courses);
      } catch (err) {
        console.error("Error loading catalogue courses:", err);
      } finally {
        setLoadingCatalogueCourses(false);
      }
    }
  };

  const handleSelectCourseGroup = (title: string) => {
    setSelectedCourseTitle(title);
    setSelectedOffering(null);
    setNewAppStep(2);
  };

  const handleSelectUniversityOffering = (courseOffer: DbCourse) => {
    setSelectedOffering(courseOffer);
    setNewAppStep(3);
  };

  const handleSubmitNewUniversityApp = async () => {
    if (!currentUser?.id || !selectedOffering || !selectedOffering.universities) {
      alert("Please select a university and program before submitting.");
      return;
    }

    try {
      setNewAppSubmitting(true);
      const res = await submitApplicationToSupabase({
        student_id: currentUser.id,
        target_country: selectedOffering.universities.country,
        university_id: selectedOffering.universities.id,
        course_id: selectedOffering.id,
        target_intake: newAppIntake,
        preferred_course: selectedOffering.title,
        status: "Submitted to University",
      });

      if (!res.success) {
        if (res.paymentRequired) {
          alert("To apply to partner universities, your one-time MtishbiScholar Application File Opening Fee (TSh 50,000) must be approved first. Redirecting you to the Payments section.");
          setActiveNav("payments");
          setShowNewAppModal(false);
          return;
        }
        alert(`Application Submission Failed: ${res.error || "Please try again."}`);
        return;
      }

      const updatedDash = await fetchStudentDashboardData(currentUser.id);
      setDashData(updatedDash);
      setShowNewAppModal(false);
      setNewAppStep(1);
      setSelectedCourseTitle("");
      setSelectedOffering(null);
      alert(`🎉 Application to ${selectedOffering.universities.name} for "${selectedOffering.title}" submitted successfully!`);
    } catch (err: any) {
      console.error("Application submission error:", err);
      alert(`Submission error: ${err.message || "Failed to submit application."}`);
    } finally {
      setNewAppSubmitting(false);
    }
  };

  const handleSubmitUnlistedCourseRequest = async () => {
    if (!currentUser?.id || !unlistedCourseName.trim()) {
      alert("Please enter the course name you wish to request.");
      return;
    }

    try {
      setSubmittingUnlisted(true);
      const res = await requestUnlistedCourseApplication({
        student_id: currentUser.id,
        target_country: unlistedTargetCountry,
        preferred_course: unlistedCourseName.trim(),
        target_intake: unlistedTargetIntake,
        notes: unlistedNotes.trim() || undefined,
      });

      if (!res.success) {
        if (res.paymentRequired) {
          alert("To apply to partner universities, your one-time MtishbiScholar Application File Opening Fee (TSh 50,000) must be approved first. Redirecting you to the Payments section.");
          setActiveNav("payments");
          setShowNewAppModal(false);
          return;
        }
        alert(`Course Request Failed: ${res.error || "Please try again."}`);
        return;
      }

      const updatedDash = await fetchStudentDashboardData(currentUser.id);
      setDashData(updatedDash);
      setIsRequestingUnlistedCourse(false);
      setShowNewAppModal(false);
      setUnlistedCourseName("");
      setUnlistedNotes("");
      alert(`🎉 Course request for "${unlistedCourseName.trim()}" submitted! Our Admission Officer will review partner universities and match options for you.`);
    } catch (err: any) {
      console.error("Course request error:", err);
      alert(`Request error: ${err.message || "Failed to request course."}`);
    } finally {
      setSubmittingUnlisted(false);
    }
  };

  const handleConfirmDeleteApp = async () => {
    if (!currentUser?.id || !appToDelete) return;
    try {
      setIsDeletingApp(true);
      const res = await deleteStudentApplication(appToDelete.id, currentUser.id);
      if (!res.success) {
        alert(`Delete Failed: ${res.error}`);
        return;
      }

      const updatedDash = await fetchStudentDashboardData(currentUser.id);
      setDashData(updatedDash);
      setAppToDelete(null);
      alert("Application deleted successfully.");
    } catch (err: any) {
      console.error("Delete app error:", err);
      alert(`Error: ${err.message || "Failed to delete application."}`);
    } finally {
      setIsDeletingApp(false);
    }
  };

  const handleConfirmWithdrawApp = async () => {
    if (!currentUser?.id || !appToWithdraw) return;
    try {
      setIsWithdrawingApp(true);
      const res = await deleteStudentApplication(
        appToWithdraw.id,
        currentUser.id,
        withdrawalReason.trim() || undefined
      );

      if (!res.success) {
        alert(`Withdrawal Failed: ${res.error || "Failed to delete application."}`);
        return;
      }

      setAppToWithdraw(null);
      setWithdrawalReason("");

      const updatedDash = await fetchStudentDashboardData(currentUser.id);
      setDashData(updatedDash);
    } catch (err: any) {
      console.error("Withdraw app error:", err);
      alert(`Error: ${err.message || "Failed to withdraw application."}`);
    } finally {
      setIsWithdrawingApp(false);
    }
  };

  // ── MY DOCUMENTS STATE & HELPERS ──
  const [studentDocs, setStudentDocs] = useState<DbDocument[]>([]);
  const [loadingDocs, setLoadingDocs] = useState<boolean>(false);
  const [uploadingDoc, setUploadingDoc] = useState<string>("");
  const [viewingDoc, setViewingDoc] = useState<string>("");
  const [showUploadDocModal, setShowUploadDocModal] = useState<boolean>(false);
  const [selectedDocTypeForUpload, setSelectedDocTypeForUpload] = useState<string>("Form4_Cert");
  const [uploadDocFile, setUploadDocFile] = useState<File | null>(null);
  const [uploadingDocModal, setUploadingDocModal] = useState<boolean>(false);
  const [uploadDocModalError, setUploadDocModalError] = useState<string>("");
  const [deletingDocId, setDeletingDocId] = useState<string>("");

  useEffect(() => {
    async function loadDocs() {
      if (!currentUser?.id) return;
      try {
        setLoadingDocs(true);
        const docs = await fetchStudentDocuments(currentUser.id);
        setStudentDocs(docs || []);
      } catch (err) {
        console.error("Error loading student documents:", err);
      } finally {
        setLoadingDocs(false);
      }
    }
    loadDocs();
  }, [currentUser?.id]);

  const handleViewDocument = async (fileUrlOrPath: string, docLabel?: string) => {
    try {
      setViewingDoc(docLabel || fileUrlOrPath);
      const res = await getStudentDocumentSignedUrl(fileUrlOrPath);
      if (res.success && res.signedUrl) {
        window.open(res.signedUrl, "_blank");
      } else {
        alert(res.error || "Unable to generate preview link for this document.");
      }
    } catch (err: any) {
      console.error("View document error:", err);
      alert(err.message || "Failed to view document.");
    } finally {
      setViewingDoc("");
    }
  };

  const DOCUMENT_TYPE_CONFIG: Record<string, { label: string; description: string; required: boolean; category: string }> = {
    Form4_Cert: {
      label: "Form 4 Certificate (CSEE)",
      description: "Certificate of Secondary Education Examination (O-Level) official certificate or result slip.",
      required: true,
      category: "Academic Qualification",
    },
    Form6_Cert: {
      label: "Form 6 Certificate (ACSEE)",
      description: "Advanced Certificate of Secondary Education Examination official certificate or result slip.",
      required: true,
      category: "Academic Qualification",
    },
    Certificate_Cert: {
      label: "Certificate Award / Certificate",
      description: "Official Certificate graduation certificate from your college or vocational institute.",
      required: true,
      category: "Academic Qualification",
    },
    Certificate_Transcript: {
      label: "Certificate Academic Transcript",
      description: "Official statement of results or academic transcript for Certificate programme.",
      required: true,
      category: "Academic Qualification",
    },
    Diploma_Cert: {
      label: "Diploma Certificate",
      description: "Official NTA Level 6 or Ordinary Diploma graduation certificate.",
      required: true,
      category: "Academic Qualification",
    },
    Diploma_Transcript: {
      label: "Diploma Academic Transcript",
      description: "Official diploma transcript with full semester module marks and grades.",
      required: true,
      category: "Academic Qualification",
    },
    Bachelor_Cert: {
      label: "Bachelor's Degree Certificate",
      description: "Official Bachelor's degree graduation certificate issued by your University.",
      required: true,
      category: "Academic Qualification",
    },
    Bachelor_Transcript: {
      label: "Bachelor's Academic Transcript",
      description: "Complete undergraduate academic transcript showing all semester grades/GPA.",
      required: true,
      category: "Academic Qualification",
    },
    Master_Cert: {
      label: "Master's Degree Certificate",
      description: "Official Master's degree graduation certificate issued by your University.",
      required: true,
      category: "Academic Qualification",
    },
    Master_Transcript: {
      label: "Master's Academic Transcript",
      description: "Complete postgraduate academic transcript showing all course modules and grades.",
      required: true,
      category: "Academic Qualification",
    },
    PhD_Cert: {
      label: "PhD Degree Certificate / Proposal",
      description: "Doctoral degree certificate, research synopsis, or doctoral transcript.",
      required: false,
      category: "Academic Qualification",
    },
    Transcript: {
      label: "Official Academic Transcript",
      description: "Full statement of academic results or semester marksheets issued by your school or university.",
      required: false,
      category: "Academic Qualification",
    },
    Passport: {
      label: "Valid Passport / Travel Document",
      description: "Scanned copy of the biometric bio-data page of your valid international passport.",
      required: true,
      category: "Identity & Travel",
    },
    Payment_Receipt: {
      label: "MtishbiScholar File Fee Receipt",
      description: "Proof of payment for the one-time TSh 50,000 application file opening fee.",
      required: false,
      category: "Payment Proof",
    },
    National_ID: {
      label: "National ID (NIDA) / Birth Certificate",
      description: "Government-issued national identity card (NIDA) or certified birth certificate.",
      required: false,
      category: "Identity & Travel",
    },
    Recommendation_Letter: {
      label: "Letter of Recommendation",
      description: "Academic or professional recommendation letter from a teacher, principal, or employer.",
      required: false,
      category: "Supporting Documents",
    },
    English_Proficiency: {
      label: "English Proficiency / Medium of Instruction",
      description: "Letter of English medium of instruction from school or TOEFL / IELTS / Duolingo certificate.",
      required: false,
      category: "Language & Tests",
    },
    CV_Resume: {
      label: "Curriculum Vitae (CV) / Resume",
      description: "Updated CV or academic curriculum vitae highlighting education, skills, and activities.",
      required: false,
      category: "Supporting Documents",
    },
    Motivation_Letter: {
      label: "Statement of Purpose / Motivation Letter",
      description: "Personal statement or motivation letter explaining your academic goals and intent.",
      required: false,
      category: "Supporting Documents",
    },
    Police_Clearance: {
      label: "Police Clearance Certificate / Good Conduct",
      description: "Official certificate of good conduct or police clearance issued by national authorities.",
      required: false,
      category: "Identity & Travel",
    },
    Sponsorship_Letter: {
      label: "Financial Sponsorship / Bank Statement",
      description: "Proof of sponsorship, parent guarantee letter, or bank statement for financial support.",
      required: false,
      category: "Supporting Documents",
    },
    Medical_Report: {
      label: "Medical Examination / Health Certificate",
      description: "Official medical fitness certificate or health check report from an accredited clinic.",
      required: false,
      category: "Supporting Documents",
    },
    Other: {
      label: "Other Supporting Document",
      description: "Any other additional certificate, award, or document requested by the admissions office.",
      required: false,
      category: "Supporting Documents",
    },
  };

  const getRequiredAcademicDocs = (highestEd: string) => {
    const level = (highestEd || "").trim();
    if (level.includes("Bachelor")) {
      return [
        {
          type: "Form6_Cert",
          title: "Form 6 Certificate (ACSEE)",
          description: "Scanned copy of Advanced Level (Form 6) certificate.",
          required: true,
          note: "If you completed Form 6 in the current academic year and your certificate is not yet available, you may upload your Form 6 result slip instead.",
        },
        {
          type: "Bachelor_Cert",
          title: "Bachelor's Degree Certificate",
          description: "Official Bachelor's degree graduation certificate issued by your University.",
          required: true,
        },
        {
          type: "Bachelor_Transcript",
          title: "Bachelor's Academic Transcript",
          description: "Full undergraduate academic transcript with all semester marks/GPA.",
          required: true,
        },
      ];
    } else if (level.includes("Master")) {
      return [
        {
          type: "Bachelor_Cert",
          title: "Bachelor's Degree Certificate",
          description: "Official Bachelor's degree graduation certificate issued by your University.",
          required: true,
        },
        {
          type: "Master_Cert",
          title: "Master's Degree Certificate",
          description: "Official Master's degree graduation certificate issued by your University.",
          required: true,
        },
        {
          type: "Master_Transcript",
          title: "Master's Academic Transcript",
          description: "Complete postgraduate academic transcript showing all modules and grades.",
          required: true,
        },
      ];
    } else if (level.includes("PhD")) {
      return [
        {
          type: "Master_Cert",
          title: "Master's Degree Certificate",
          description: "Official Master's degree graduation certificate issued by your University.",
          required: true,
        },
        {
          type: "Master_Transcript",
          title: "Master's Academic Transcript",
          description: "Complete postgraduate academic transcript showing all modules and grades.",
          required: true,
        },
        {
          type: "PhD_Cert",
          title: "PhD Degree Certificate / Research Proposal",
          description: "Doctoral degree certificate, research proposal, or doctoral transcript.",
          required: false,
        },
      ];
    } else if (level.includes("Certificate")) {
      return [
        {
          type: "Form4_Cert",
          title: "Form 4 Certificate (CSEE)",
          description: "Scanned PDF or Image of Ordinary Level Certificate.",
          required: true,
        },
        {
          type: "Certificate_Cert",
          title: "Certificate Award / Certificate",
          description: "Official Certificate award certificate from your college or vocational institute.",
          required: true,
        },
        {
          type: "Certificate_Transcript",
          title: "Certificate Academic Transcript",
          description: "Official statement of results or academic transcript for Certificate programme.",
          required: true,
        },
      ];
    } else if (level.includes("Diploma")) {
      return [
        {
          type: "Form4_Cert",
          title: "Form 4 Certificate (CSEE)",
          description: "Scanned PDF or Image of Ordinary Level Certificate.",
          required: true,
        },
        {
          type: "Diploma_Cert",
          title: "Diploma Certificate",
          description: "Official NTA Level 6 or Ordinary Diploma graduation certificate.",
          required: true,
        },
        {
          type: "Diploma_Transcript",
          title: "Diploma Academic Transcript",
          description: "Official diploma transcript with full semester module marks and grades.",
          required: true,
        },
      ];
    } else if (level.includes("O-Level")) {
      return [
        {
          type: "Form4_Cert",
          title: "Form 4 Certificate (CSEE)",
          description: "Scanned PDF or Image of Ordinary Level Certificate.",
          required: true,
        },
        {
          type: "Transcript",
          title: "Official Academic Transcript",
          description: "Secondary school statement of results or report cards (Optional).",
          required: false,
        },
      ];
    } else {
      // Default: A-Level / High School & fallback
      return [
        {
          type: "Form4_Cert",
          title: "Form 4 Certificate (CSEE)",
          description: "Scanned PDF or Image of Ordinary Level Certificate.",
          required: true,
        },
        {
          type: "Form6_Cert",
          title: "Form 6 Certificate (ACSEE)",
          description: "Advanced Certificate of Secondary Education Examination official certificate.",
          required: true,
          note: "If you completed Form 6 in the current academic year and your certificate is not yet available, you may upload your Form 6 result slip instead.",
        },
        {
          type: "Transcript",
          title: "Official Academic Transcript",
          description: "Full statement of results or academic transcript (Optional).",
          required: false,
        },
      ];
    }
  };

  const formatDocFileSize = (bytes?: number) => {
    if (!bytes || bytes <= 0) return null;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const validateProfileStep = (stepToValidate: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (stepToValidate === 1) {
      if (!profileData.firstName?.trim()) {
        newErrors.firstName = "First name is required";
      }
      if (!profileData.lastName?.trim()) {
        newErrors.lastName = "Last name is required";
      }
      if (!profileData.dob?.trim()) {
        newErrors.dob = "Date of birth is required";
      }
      if (!profileData.gender?.trim()) {
        newErrors.gender = "Gender is required";
      }
      if (!profileData.nationality?.trim()) {
        newErrors.nationality = "Nationality is required";
      }
      const cleanPhone = (profileData.phone || "").replace(/[\s\-()]/g, "");
      if (!cleanPhone || cleanPhone === "+255" || cleanPhone.length < 8) {
        newErrors.phone = "Valid phone number is required";
      }
      if (!profileData.parentRelationship?.trim()) {
        newErrors.parentRelationship = "Relationship type is required";
      }
      if (!profileData.parentFirstName?.trim()) {
        newErrors.parentFirstName = "Parent / Sponsor first name is required";
      }
      if (!profileData.parentLastName?.trim()) {
        newErrors.parentLastName = "Parent / Sponsor last name is required";
      }
      const cleanParentPhone = (profileData.parentPhone || "").replace(/[\s\-()]/g, "");
      if (!cleanParentPhone || cleanParentPhone === "+255" || cleanParentPhone.length < 8) {
        newErrors.parentPhone = "Valid parent phone number is required";
      }
    } else if (stepToValidate === 2) {
      const ed = profileData.highestEducation?.trim();
      if (!ed) {
        newErrors.highestEducation = "Highest education level is required";
      } else if (ed === "O-Level / Secondary School") {
        if (!profileData.oLevelSchool?.trim()) newErrors.oLevelSchool = "O-Level school name is required";
        if (!profileData.oLevelYear?.trim()) newErrors.oLevelYear = "O-Level completion year is required";
      } else if (ed === "A-Level / High School") {
        if (!profileData.aLevelSchool?.trim()) newErrors.aLevelSchool = "A-Level high school name is required";
        if (!profileData.aLevelYear?.trim()) newErrors.aLevelYear = "A-Level completion year is required";
        if (!profileData.aLevelCombination?.trim()) newErrors.aLevelCombination = "A-Level subject combination is required (e.g. PCM, PCB)";
      } else if (ed === "Certificate") {
        if (!profileData.certificateInstitution?.trim()) newErrors.certificateInstitution = "Institution name is required";
        if (!profileData.certificateCourse?.trim()) newErrors.certificateCourse = "Course name is required";
        if (!profileData.certificateYear?.trim()) newErrors.certificateYear = "Completion year is required";
      } else if (ed === "Diploma") {
        if (!profileData.diplomaInstitution?.trim()) newErrors.diplomaInstitution = "College / Institution name is required";
        if (!profileData.diplomaCourse?.trim()) newErrors.diplomaCourse = "Diploma program is required";
        if (!profileData.diplomaYear?.trim()) newErrors.diplomaYear = "Completion year is required";
      } else if (ed.includes("Bachelor")) {
        if (!profileData.bachelorInstitution?.trim()) newErrors.bachelorInstitution = "University name is required";
        if (!profileData.bachelorCourse?.trim()) newErrors.bachelorCourse = "Bachelor's degree program is required";
        if (!profileData.bachelorYear?.trim()) newErrors.bachelorYear = "Completion year is required";
      } else if (ed.includes("Master")) {
        if (!profileData.masterInstitution?.trim()) newErrors.masterInstitution = "University name is required";
        if (!profileData.masterCourse?.trim()) newErrors.masterCourse = "Master's degree program is required";
        if (!profileData.masterYear?.trim()) newErrors.masterYear = "Completion year is required";
      } else if (ed === "PhD") {
        if (!profileData.phdInstitution?.trim()) newErrors.phdInstitution = "University name is required";
        if (!profileData.phdCourse?.trim()) newErrors.phdCourse = "PhD research field is required";
        if (!profileData.phdYear?.trim()) newErrors.phdYear = "Completion year is required";
      }
    } else if (stepToValidate === 3) {
      if (!profileData.preferredCountry?.trim()) {
        newErrors.preferredCountry = "Preferred study destination country is required";
      }
      if (!profileData.intake?.trim()) {
        newErrors.intake = "Target intake is required";
      }
      if (!profileData.preferredCourse?.trim()) {
        newErrors.preferredCourse = "Preferred course of study is required";
      }
    } else if (stepToValidate === 4) {
      if (!profileData.hasPassport?.trim()) {
        newErrors.hasPassport = "Please specify whether you hold a valid passport";
      } else if (profileData.hasPassport === "Yes") {
        if (!profileData.passportNumber?.trim()) newErrors.passportNumber = "Passport number is required";
        if (!profileData.passportIssue?.trim()) newErrors.passportIssue = "Passport issue date is required";
        if (!profileData.passportExpiry?.trim()) newErrors.passportExpiry = "Passport expiry date is required";
      }
    } else if (stepToValidate === 5) {
      const requiredDocs = getRequiredAcademicDocs(profileData.highestEducation || "").filter((d) => d.required);
      const missing = requiredDocs.filter((r) => !studentDocs.some((d) => d.document_type === r.type));
      if (missing.length > 0) {
        newErrors.documents = `Please upload all mandatory documents (${missing.map((m) => m.title).join(", ")}) before proceeding.`;
      }
    } else if (stepToValidate === 6) {
      if (!profileData.appliedAbroadBefore?.trim()) {
        newErrors.appliedAbroadBefore = "Please answer whether you have applied abroad before";
      }
      if (!profileData.howDidYouHear?.trim()) {
        newErrors.howDidYouHear = "Please select how you heard about MtishbiScholar";
      }
      if (!profileData.needFinancialGuidance?.trim()) {
        newErrors.needFinancialGuidance = "Please indicate if you need financial guidance";
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setProfileErrors(newErrors);
      setProfileErrorBanner(newErrors.documents || "Please complete all required fields in this step before proceeding.");
      return false;
    }

    setProfileErrors({});
    setProfileErrorBanner("");
    return true;
  };

  const handleDirectDocUpload = async (file: File, docType: string) => {
    if (!currentUser?.id || !file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("File size exceeds the 10MB maximum limit. Please upload a smaller file.");
      return;
    }

    const validMimes = ["image/png", "image/jpeg", "image/jpg", "application/pdf"];
    if (!validMimes.includes(file.type) && !file.name.match(/\.(pdf|png|jpg|jpeg)$/i)) {
      alert("Invalid file format. Only PDF, JPG, and PNG documents are allowed.");
      return;
    }

    try {
      setUploadingDoc(docType);
      const res = await uploadStudentDocument(currentUser.id, file, docType);
      if (res.success) {
        const updatedDocs = await fetchStudentDocuments(currentUser.id);
        setStudentDocs(updatedDocs);
        if (currentUser?.id) {
          const liveData = await fetchStudentDashboardData(currentUser.id);
          setDashData(liveData);
        }
        alert(`✓ Document "${file.name}" uploaded successfully!`);
      } else {
        alert(`Document upload failed: ${res.error || "Please try again."}`);
      }
    } catch (err: any) {
      console.error("Doc upload error:", err);
      alert(`Document upload failed: ${err.message || "An unexpected error occurred."}`);
    } finally {
      setUploadingDoc("");
    }
  };

  const handleModalDocUpload = async () => {
    if (!currentUser?.id || !uploadDocFile) {
      setUploadDocModalError("Please choose a file to upload.");
      return;
    }

    if (uploadDocFile.size > 10 * 1024 * 1024) {
      setUploadDocModalError("File size exceeds the 10MB maximum limit.");
      return;
    }

    const validMimes = ["image/png", "image/jpeg", "image/jpg", "application/pdf"];
    if (!validMimes.includes(uploadDocFile.type) && !uploadDocFile.name.match(/\.(pdf|png|jpg|jpeg)$/i)) {
      setUploadDocModalError("Invalid file format. Only PDF, JPG, and PNG documents are allowed.");
      return;
    }

    try {
      setUploadingDocModal(true);
      setUploadDocModalError("");
      const res = await uploadStudentDocument(currentUser.id, uploadDocFile, selectedDocTypeForUpload);
      if (res.success) {
        const updatedDocs = await fetchStudentDocuments(currentUser.id);
        setStudentDocs(updatedDocs);
        if (currentUser?.id) {
          const liveData = await fetchStudentDashboardData(currentUser.id);
          setDashData(liveData);
        }
        setShowUploadDocModal(false);
        setUploadDocFile(null);
        alert(`✓ Document uploaded successfully to your secure vault!`);
      } else {
        setUploadDocModalError(res.error || "Upload failed. Please try again.");
      }
    } catch (err: any) {
      console.error("Modal upload error:", err);
      setUploadDocModalError(err.message || "Upload failed.");
    } finally {
      setUploadingDocModal(false);
    }
  };

  const handleDeleteDoc = async (doc: DbDocument) => {
    if (!currentUser?.id || !doc.id) return;
    const docName = doc.file_name || DOCUMENT_TYPE_CONFIG[doc.document_type]?.label || doc.document_type;
    
    if (doc.document_type === "Payment_Receipt" && (hasApprovedPayment || dashData?.hasApprovedPayment)) {
      alert("This verified payment receipt is attached to your active application file and cannot be deleted.");
      return;
    }

    if (!window.confirm(`Are you sure you want to delete "${docName}" from your documents vault? This will permanently remove it from your records.`)) {
      return;
    }

    try {
      setDeletingDocId(doc.id);
      const res = await deleteStudentDocument(currentUser.id, doc.id, doc.file_url);
      if (res.success) {
        const updatedDocs = await fetchStudentDocuments(currentUser.id);
        setStudentDocs(updatedDocs || []);
        if (currentUser?.id) {
          const liveData = await fetchStudentDashboardData(currentUser.id);
          setDashData(liveData);
        }
        alert(`✓ Document "${docName}" deleted successfully.`);
      } else {
        alert(`Failed to delete document: ${res.error || "Please try again."}`);
      }
    } catch (err: any) {
      console.error("Error deleting doc:", err);
      alert(`Delete failed: ${err.message || "An unexpected error occurred."}`);
    } finally {
      setDeletingDocId("");
    }
  };

  // ── NOTIFICATIONS STATE & HELPERS ──
  const [notificationsList, setNotificationsList] = useState<DbNotification[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState<boolean>(false);
  const [notifFilter, setNotifFilter] = useState<"all" | "unread" | "read">("all");
  const [notifTypeFilter, setNotifTypeFilter] = useState<string>("all");
  const [markingAllRead, setMarkingAllRead] = useState<boolean>(false);

  const unreadNotifCount = notificationsList.filter((n) => !n.is_read).length;

  const handleMarkOneAsRead = async (notificationId: string) => {
    if (!currentUser?.id) return;
    setNotificationsList((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
    );
    await markNotificationAsRead(notificationId, currentUser.id);
  };

  const handleMarkAllAsRead = async () => {
    if (!currentUser?.id || unreadNotifCount === 0) return;
    try {
      setMarkingAllRead(true);
      setNotificationsList((prev) => prev.map((n) => ({ ...n, is_read: true })));
      await markAllNotificationsAsRead(currentUser.id);
    } catch (err) {
      console.error("Error marking all read:", err);
    } finally {
      setMarkingAllRead(false);
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    if (!currentUser?.id) return;
    setNotificationsList((prev) => prev.filter((n) => n.id !== notificationId));
    await deleteNotificationFromSupabase(notificationId, currentUser.id);
  };

  const getNotificationVisual = (type?: string) => {
    const t = (type || "").toLowerCase().trim();
    if (t.includes("payment") || t.includes("finance")) {
      return {
        icon: CreditCard,
        bgColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
        badgeColor: "bg-emerald-100 text-emerald-800",
        label: "Payment",
      };
    }
    if (t.includes("application") || t.includes("apply")) {
      return {
        icon: FileText,
        bgColor: "bg-blue-50 text-blue-700 border-blue-200",
        badgeColor: "bg-blue-100 text-blue-800",
        label: "Application",
      };
    }
    if (t.includes("admission") || t.includes("offer") || t.includes("acceptance")) {
      return {
        icon: Award,
        bgColor: "bg-purple-50 text-purple-700 border-purple-200",
        badgeColor: "bg-purple-100 text-purple-800",
        label: "Admission",
      };
    }
    if (t.includes("doc") || t.includes("verification")) {
      return {
        icon: ShieldCheck,
        bgColor: "bg-teal-50 text-teal-700 border-teal-200",
        badgeColor: "bg-teal-100 text-teal-800",
        label: "Documents",
      };
    }
    if (t.includes("system") || t.includes("alert")) {
      return {
        icon: AlertCircle,
        bgColor: "bg-amber-50 text-amber-700 border-amber-200",
        badgeColor: "bg-amber-100 text-amber-800",
        label: "System",
      };
    }
    return {
      icon: Bell,
      bgColor: "bg-slate-100 text-slate-700 border-slate-200",
      badgeColor: "bg-slate-200 text-slate-700",
      label: "General",
    };
  };

  // ── SETTINGS STATE & HANDLERS ──
  const [newPasswordInput, setNewPasswordInput] = useState<string>("");
  const [confirmPasswordInput, setConfirmPasswordInput] = useState<string>("");
  const [showPasswordText, setShowPasswordText] = useState<boolean>(false);
  const [passwordUpdating, setPasswordUpdating] = useState<boolean>(false);
  const [passwordSuccessMsg, setPasswordSuccessMsg] = useState<string>("");
  const [passwordErrorMsg, setPasswordErrorMsg] = useState<string>("");

  const [resendingVerification, setResendingVerification] = useState<boolean>(false);
  const [verificationFeedback, setVerificationFeedback] = useState<string>("");

  // Local UI Preferences (Theme & UI Notifications)
  const [selectedTheme, setSelectedTheme] = useState<"light" | "dark" | "system">("light");
  const [notifSoundPref, setNotifSoundPref] = useState<boolean>(true);
  const [notifAppPref, setNotifAppPref] = useState<boolean>(true);
  const [notifPayPref, setNotifPayPref] = useState<boolean>(true);
  const [notifAdmPref, setNotifAdmPref] = useState<boolean>(true);

  const applyTheme = (theme: "light" | "dark" | "system") => {
    if (typeof window === "undefined") return;
    let isDark = false;
    if (theme === "dark") {
      isDark = true;
    } else if (theme === "light") {
      isDark = false;
    } else if (theme === "system") {
      isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    }

    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedTheme = (localStorage.getItem("mtb_theme") as "light" | "dark" | "system") || "light";
      setSelectedTheme(savedTheme);
      applyTheme(savedTheme);

      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleMediaChange = () => {
        const current = (localStorage.getItem("mtb_theme") as "light" | "dark" | "system") || "light";
        if (current === "system") {
          applyTheme("system");
        }
      };

      mediaQuery.addEventListener("change", handleMediaChange);

      const savedPrefs = localStorage.getItem("mtb_ui_notif_prefs");
      if (savedPrefs) {
        try {
          const parsed = JSON.parse(savedPrefs);
          if (parsed.sound !== undefined) setNotifSoundPref(parsed.sound);
          if (parsed.app !== undefined) setNotifAppPref(parsed.app);
          if (parsed.pay !== undefined) setNotifPayPref(parsed.pay);
          if (parsed.adm !== undefined) setNotifAdmPref(parsed.adm);
        } catch (e) {}
      }

      return () => mediaQuery.removeEventListener("change", handleMediaChange);
    }
  }, []);

  const handleThemeChange = (theme: "light" | "dark" | "system") => {
    setSelectedTheme(theme);
    if (typeof window !== "undefined") {
      localStorage.setItem("mtb_theme", theme);
    }
    applyTheme(theme);
  };

  const handleSaveNotifPref = (key: "sound" | "app" | "pay" | "adm", val: boolean) => {
    const updated = { sound: notifSoundPref, app: notifAppPref, pay: notifPayPref, adm: notifAdmPref, [key]: val };
    if (key === "sound") setNotifSoundPref(val);
    if (key === "app") setNotifAppPref(val);
    if (key === "pay") setNotifPayPref(val);
    if (key === "adm") setNotifAdmPref(val);
    if (typeof window !== "undefined") {
      localStorage.setItem("mtb_ui_notif_prefs", JSON.stringify(updated));
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordErrorMsg("");
    setPasswordSuccessMsg("");

    if (!newPasswordInput || newPasswordInput.length < 6) {
      setPasswordErrorMsg("Password must be at least 6 characters long.");
      return;
    }

    if (newPasswordInput !== confirmPasswordInput) {
      setPasswordErrorMsg("New passwords do not match. Please re-type carefully.");
      return;
    }

    try {
      setPasswordUpdating(true);
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: newPasswordInput });

      if (error) {
        setPasswordErrorMsg(error.message || "Failed to update password.");
      } else {
        setPasswordSuccessMsg("✓ Your password has been updated successfully.");
        setNewPasswordInput("");
        setConfirmPasswordInput("");
      }
    } catch (err: any) {
      console.error("Password update error:", err);
      setPasswordErrorMsg(err.message || "Failed to update password. Please try again.");
    } finally {
      setPasswordUpdating(false);
    }
  };

  const handleResendEmailVerification = async () => {
    if (!currentUser?.email) return;
    try {
      setResendingVerification(true);
      setVerificationFeedback("");
      const supabase = createClient();
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: currentUser.email,
      });

      if (error) {
        setVerificationFeedback(`Error: ${error.message}`);
      } else {
        setVerificationFeedback("✓ Verification email sent! Please check your inbox and spam folder.");
      }
    } catch (err: any) {
      setVerificationFeedback(`Error: ${err.message || "Could not resend email"}`);
    } finally {
      setResendingVerification(false);
    }
  };



  // Student Connect (Campus Network) State
  const [connectSearch, setConnectSearch] = useState<string>("");
  const [connectCountryFilter, setConnectCountryFilter] = useState<string>("All");
  const [connectCourseFilter, setConnectCourseFilter] = useState<string>("All");
  const [connectYearFilter, setConnectYearFilter] = useState<string>("All");
  const [selectedStudentProfile, setSelectedStudentProfile] = useState<any | null>(null);

  const studentConnectList = [
    {
      id: "1",
      name: "Joel Michael Kilango",
      avatar: "JK",
      university: "Acharya Institutes",
      location: "India",
      country: "India",
      flag: "🇮🇳",
      from: "Tanzania",
      phone: "+255747219435",
      online: true,
      bio: "Hello! I am a Tanzanian scholar studying at Acharya in India. Feel free to connect to ask about campus life, accommodation, and studying abroad in India.",
      helpWith: ["Life in India", "Acharya Campus Guide", "Tanzanian Community India", "Student Living"],
    },
    {
      id: "2",
      name: "Elizabeth Pius Msekwa",
      avatar: "EM",
      university: "Parul University",
      location: "India",
      country: "India",
      flag: "🇮🇳",
      from: "Tanzania",
      phone: "+255686081719",
      online: true,
      bio: "Jambo! Studying at Parul University in India. Happy to answer questions about campus culture, hostel accommodation, food, and daily life in India for new Tanzanian students.",
      helpWith: ["Life in India", "Parul University Guide", "Hostel & Food Options", "Tanzanian Community India"],
    },
    {
      id: "3",
      name: "Rehema Ipyana",
      avatar: "RI",
      university: "Nest Academy",
      location: "Dubai, United Arab Emirates",
      country: "United Arab Emirates",
      flag: "🇦🇪",
      from: "Tanzania",
      phone: "+255767496410",
      online: true,
      bio: "Hello from Dubai! I am currently studying at Nest Academy in the UAE. Reach out if you want to know about student life, Dubai living expenses, and international education opportunities in UAE.",
      helpWith: ["Life in Dubai / UAE", "Nest Academy Campus", "Living Expenses in UAE", "Tanzanian Community UAE"],
    },
    {
      id: "4",
      name: "Khadija Abubakar",
      avatar: "KA",
      university: "China",
      location: "China",
      country: "China",
      flag: "🇨🇳",
      from: "Tanzania",
      phone: "+255741462341",
      online: true,
      bio: "Ni Hao & Jambo! Studying in China. Feel free to reach out to ask about life in China, student experience, and cultural adaptation.",
      helpWith: ["Life in China", "Chinese Student Life", "Language & Culture", "Tanzanian Community China"],
    },
    {
      id: "5",
      name: "Irene Minde",
      avatar: "IM",
      university: "European University of Lefke",
      location: "Cyprus",
      country: "Cyprus",
      flag: "🇨🇾",
      from: "Tanzania",
      phone: "+255767896702",
      online: true,
      bio: "Hello! I'm studying at the European University of Lefke in Cyprus. Glad to guide fellow Tanzanian scholars on student life, European education standards, and living in Cyprus.",
      helpWith: ["Life in Cyprus", "European University of Lefke", "Student Life Europe", "Accommodation Guidance"],
    },
    {
      id: "6",
      name: "Betty Daudi",
      avatar: "BD",
      university: "Marwadi University",
      location: "India",
      country: "India",
      flag: "🇮🇳",
      from: "Tanzania",
      phone: "+255747221532",
      online: true,
      bio: "Jambo! Studying at Marwadi University in India. Reach out for advice on campus orientation, settling in Rajkot, and our Tanzanian student community.",
      helpWith: ["Life in India", "Marwadi University Guide", "Campus Orientation", "Tanzanian Community India"],
    },
    {
      id: "7",
      name: "Rahma Hussein Juma",
      avatar: "RJ",
      university: "SRM University AP",
      location: "India",
      country: "India",
      flag: "🇮🇳",
      course: "Computer Science",
      courseDetail: "BTech Computer Science and Engineering",
      from: "Tanzania",
      phone: "+255784656216",
      online: true,
      bio: "Hey! I am studying BTech Computer Science and Engineering at SRM University AP in India. Reach out for tech curriculum, labs, and student life questions.",
      helpWith: ["SRM University AP Guide", "Computer Science Curriculum", "Tech Labs", "Tanzanian Community SRM AP"],
    },
    {
      id: "8",
      name: "Tariq Hamza Ahmad",
      avatar: "TA",
      university: "SRM University AP",
      location: "India",
      country: "India",
      flag: "🇮🇳",
      course: "Computer Science",
      courseDetail: "BSc Computer Science",
      from: "Tanzania",
      phone: "+255615324294",
      online: true,
      bio: "Hello! Pursuing BSc Computer Science at SRM University AP. Happy to help incoming students navigate computer science courses, hostel life, and university life in India.",
      helpWith: ["Life at SRM University AP", "BSc Computer Science", "Hostel & Living", "Tanzanian Scholars India"],
    },
    {
      id: "9",
      name: "Samson",
      avatar: "S",
      university: "SRM University AP",
      location: "India",
      country: "India",
      flag: "🇮🇳",
      course: "Computer Science",
      courseDetail: "BSc Computer Science",
      from: "Tanzania",
      phone: "+255775707792",
      online: true,
      bio: "Hi! Studying BSc Computer Science at SRM University AP. Always available to guide and welcome new Tanzanian scholars joining our university community.",
      helpWith: ["SRM AP Campus Life", "BSc Computer Science", "Student Settling Guidance", "Tanzanian Community"],
    },
  ];

  const filteredStudentConnect = studentConnectList.filter((s) => {
    const q = connectSearch.toLowerCase().trim();
    const matchesSearch =
      !q ||
      s.name.toLowerCase().includes(q) ||
      (s.university && s.university.toLowerCase().includes(q)) ||
      (s.course && s.course.toLowerCase().includes(q)) ||
      ((s as any).courseDetail && (s as any).courseDetail.toLowerCase().includes(q)) ||
      (s.country && s.country.toLowerCase().includes(q)) ||
      (s.location && s.location.toLowerCase().includes(q));

    const matchesCountry =
      connectCountryFilter === "All" ||
      s.country === connectCountryFilter ||
      (connectCountryFilter === "UAE" && s.country.includes("Emirates"));

    const matchesCourse =
      connectCourseFilter === "All" ||
      (s.course && s.course.toLowerCase().includes(connectCourseFilter.toLowerCase())) ||
      ((s as any).courseDetail && (s as any).courseDetail.toLowerCase().includes(connectCourseFilter.toLowerCase()));

    const matchesYear =
      connectYearFilter === "All" ||
      (s as any).year === connectYearFilter ||
      (connectYearFilter === "Active Scholar" && (!(s as any).year || (s as any).year === "Active Scholar"));

    return matchesSearch && matchesCountry && matchesCourse && matchesYear;
  });

  const progressPct = dashData?.progressPercentage ?? 0;
  const officialApps = dashData?.applications || [];
  const primaryApp = officialApps[0] || null;

  const journeySteps = [
    { label: "Profile Completed", status: progressPct >= 25 ? (progressPct === 25 ? "current" : "completed") : "upcoming" },
    { label: "Application Activated", status: progressPct >= 35 ? (progressPct === 35 ? "current" : "completed") : "upcoming" },
    { label: "Application Submitted", status: progressPct >= 50 ? (progressPct === 50 ? "current" : "completed") : "upcoming" },
    { label: "Admission Review", status: progressPct >= 65 ? (progressPct === 65 ? "current" : "completed") : "upcoming" },
    { label: "Offer Letter", status: progressPct >= 80 ? (progressPct === 80 ? "current" : "completed") : "upcoming" },
    { label: "Visa Processing", status: progressPct >= 90 ? (progressPct === 90 ? "current" : "completed") : "upcoming" },
    { label: "Ready to Fly", status: progressPct >= 100 ? "completed" : "upcoming" },
  ];

  const handleToggleUniversity = (name: string) => {
    if (selectedUniversities.includes(name)) {
      setSelectedUniversities(selectedUniversities.filter((u) => u !== name));
    } else {
      if (selectedUniversities.length >= 3) {
        alert("You can select up to 3 universities according to your priority!");
        return;
      }
      setSelectedUniversities([...selectedUniversities, name]);
    }
  };

  const getCoursesForCountry = (country: string): string[] => {
    const countryUnis = dbUniversities.filter((u) => {
      const c = u.country.toLowerCase();
      const target = country.toLowerCase();
      if (target === "india") return c === "india";
      if (target === "china") return c === "china";
      if (target === "poland") return c === "poland";
      if (target === "malaysia") return c === "malaysia";
      if (target === "united kingdom" || target === "uk") return c === "uk" || c === "united kingdom";
      if (target === "cyprus") return c === "cyprus";
      if (target === "spain") return c === "spain";
      if (target === "uae (dubai)" || target === "uae") return c === "uae" || c === "uae (dubai)";
      if (target === "canada") return c === "canada";
      if (target === "australia") return c === "australia";
      return c === target;
    });

    const uniCourses = countryUnis.flatMap((u) => u.courses || []);

    let countrySpecificFallback: string[] = [];
    const target = country.toLowerCase();

    if (target === "india") {
      countrySpecificFallback = [
        "B.Tech Computer Science & Artificial Intelligence",
        "B.Tech Information Technology & Cybersecurity",
        "B.Tech Mechanical Engineering",
        "B.Tech Civil & Structural Engineering",
        "Bachelor of Business Administration (BBA)",
        "Master of Business Administration (MBA)",
        "Bachelor of Pharmacy (B.Pharm)",
        "B.Sc Nursing & Health Sciences",
        "MBBS Clinical Medicine & Surgery",
        "B.Sc Biotechnology & Genetics",
        "B.Sc Hotel Management & Tourism",
      ];
    } else if (target === "china") {
      countrySpecificFallback = [
        "MBBS Clinical Medicine (English Medium)",
        "B.Eng Mechanical & Mechatronics Engineering",
        "B.Sc Computer Science & Software Systems",
        "B.Eng Civil Engineering & Construction",
        "Bachelor of International Economics & Trade",
        "M.Sc Environmental Science & Green Tech",
        "M.Sc Artificial Intelligence & Data Science",
        "Bachelor of Chinese Language & International Business",
      ];
    } else if (target === "poland") {
      countrySpecificFallback = [
        "BA Architecture & Urban Planning",
        "BA International Relations & Diplomacy",
        "B.Sc Computer Engineering & Cyber Systems",
        "MA Global Management & Leadership",
        "B.Sc Finance & Accounting",
        "B.Sc Logistics & Supply Chain Management",
        "MA Graphics & Digital Design",
      ];
    } else if (target === "malaysia") {
      countrySpecificFallback = [
        "B.Sc (Hons) Cybersecurity & Digital Forensics",
        "B.Sc (Hons) Data Analytics & Cloud Computing",
        "BBA Digital Transformation & Marketing",
        "M.Sc Artificial Intelligence & Robotics",
        "B.Sc Information Technology & Networking",
        "Bachelor of Hospitality & Event Management",
      ];
    } else if (target === "united kingdom" || target === "uk") {
      countrySpecificFallback = [
        "B.Sc (Hons) Computer Games Technology",
        "BA (Hons) Business Management & Enterprise",
        "M.Sc Ethical Hacking & Cybersecurity",
        "LL.B International Commercial Law",
        "M.Sc Artificial Intelligence & Machine Learning",
        "B.Sc Public Health & Healthcare Management",
      ];
    } else if (target === "cyprus") {
      countrySpecificFallback = [
        "B.Sc Software Engineering & Web Systems",
        "B.Sc Civil & Structural Engineering",
        "BA Tourism & Hospitality Management",
        "MBA Logistics & International Trade",
        "B.Sc Architecture & Interior Design",
      ];
    } else if (target === "spain") {
      countrySpecificFallback = [
        "Bachelor in Business Management & European Law",
        "Bachelor in International Trade & Logistics",
        "Master in Digital Marketing & FinTech",
        "Master in Hospitality & Luxury Management",
        "Bachelor in Sports Management & Event Logistics",
      ];
    } else if (target === "uae (dubai)" || target === "uae") {
      countrySpecificFallback = [
        "B.Tech Computer Science Engineering",
        "Bachelor of Design (B.Des Interior & Fashion)",
        "MBA Global Business & Innovation",
        "B.Sc Finance & Banking Technologies",
        "B.Sc Media & Artificial Communication",
      ];
    } else if (target === "canada") {
      countrySpecificFallback = [
        "B.Sc Computer Science & Software Engineering",
        "Diploma in Business Administration & Marketing",
        "Post-Graduate Certificate in Data Analytics",
        "B.Sc Health Information & Healthcare Systems",
      ];
    } else if (target === "australia") {
      countrySpecificFallback = [
        "Bachelor of Information Technology & AI",
        "Bachelor of Nursing & Public Health",
        "Master of Professional Accounting & Finance",
        "Bachelor of Engineering (Honours)",
      ];
    } else {
      countrySpecificFallback = [
        "Computer Science & Artificial Intelligence",
        "Software Engineering & Web Technologies",
        "Information Technology & Cybersecurity",
        "Medicine & Surgery (MBBS)",
        "Nursing & Public Health Sciences",
        "Business Administration (BBA/MBA)",
      ];
    }

    return Array.from(new Set([...uniCourses, ...countrySpecificFallback]));
  };

  if (authChecking) {
    return (
      <div className="min-h-screen bg-[#0B192C] flex flex-col items-center justify-center text-white space-y-4 font-sans">
        <div className="w-10 h-10 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-bold tracking-wider text-[#D4AF37] uppercase">
          Verifying Student Authentication...
        </p>
      </div>
    );
  }

  return (
    <div className="student-portal min-h-screen flex bg-[#F1F5F9] text-slate-800 font-sans selection:bg-blue-600 selection:text-white">

      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* ── LEFT SIDEBAR (Dark Navy #0B192C) ── */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-[#0B192C] text-white flex flex-col justify-between transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
      >
        <div className="p-5 space-y-6">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-600/30 shrink-0">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-white font-extrabold text-base tracking-tight leading-none">
                  MtishbiScholar
                </h1>
                <p className="text-[10px] text-blue-200/70 font-medium mt-1">
                  Your Pathway to Global Education
                </p>
              </div>
            </Link>

            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="space-y-1 pt-2">
            {[
              { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, locked: false },
              { id: "profile", label: "My Profile", icon: UserCheck, locked: false },
              { id: "payments", label: "Payments", icon: CreditCard, locked: false },
              { id: "application", label: "My Application", icon: FileText, locked: !hasApprovedPayment },
              { id: "documents", label: "My Documents", icon: FileText, locked: false },
              { id: "universities", label: "Universities", icon: Building2, locked: false },
              { id: "connect", label: "Student Connect", icon: Users, locked: false },
              { id: "notifications", label: "Notifications", icon: Bell, badge: unreadNotifCount > 0 ? unreadNotifCount : undefined },
              { id: "settings", label: "Settings", icon: Settings, locked: false },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.locked) {
                      setPaymentLockMessage(
                        "Your TSh 50,000 MtishbiScholar Application File Opening Fee must be approved by a Finance Officer before you can access university applications."
                      );
                      setShowPaymentLockModal(true);
                      return;
                    }
                    setActiveNav(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-semibold transition-all duration-200 ${isActive
                    ? "bg-blue-600 text-white font-bold shadow-md shadow-blue-600/30"
                    : item.locked
                      ? "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 cursor-pointer"
                      : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>

                  {item.locked ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-amber-300 bg-amber-400/15 px-2 py-0.5 rounded-md border border-amber-400/30">
                      <Lock className="w-3 h-3" />
                      <span>Locked</span>
                    </span>
                  ) : item.badge ? (
                    <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                      {item.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-5 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT AREA ── */}
      <div className="flex-1 min-w-0 flex flex-col">

        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200/80 px-6 lg:px-8 py-4 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg bg-slate-100 text-slate-600"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span>Good Afternoon, {studentFirstName}</span>
                <span className="text-xl">👋</span>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Welcome back to MtishbiScholar.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveNav("notifications")}
              className="relative p-2.5 rounded-full bg-slate-100 hover:bg-slate-200/80 text-slate-600 transition-colors cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                  {unreadNotifCount}
                </span>
              )}
            </button>


            {/* Profile Dropdown Area */}
            <div className="relative pl-3 border-l border-slate-200" ref={profileDropdownRef}>
              <button
                type="button"
                id="student-header-profile-menu-button"
                aria-haspopup="menu"
                aria-expanded={profileDropdownOpen}
                aria-label="User profile and account menu"
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-3 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <div className="w-9 h-9 rounded-full bg-blue-100 border border-blue-200 text-blue-700 font-bold text-xs flex items-center justify-center uppercase shrink-0">
                  {studentInitials}
                </div>
                <div className="hidden sm:flex items-center gap-1.5 text-left">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100 max-w-[150px] truncate">
                    {studentFullName}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                      profileDropdownOpen ? "rotate-180 text-blue-600" : ""
                    }`}
                  />
                </div>
              </button>

              {/* Dropdown Menu Card */}
              {profileDropdownOpen && (
                <div
                  role="menu"
                  aria-orientation="vertical"
                  aria-labelledby="student-header-profile-menu-button"
                  className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-900/10 p-2 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-1"
                >
                  {/* User Info Header */}
                  <div className="px-3 py-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl mb-1 border border-slate-100 dark:border-slate-800">
                    <p className="text-xs font-extrabold text-slate-900 dark:text-slate-100 truncate">
                      {studentFullName}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {currentUser?.email || dashData?.profile?.email || "Student"}
                    </p>
                  </div>

                  {/* Menu Items */}
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setActiveNav("profile");
                      setProfileDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400 rounded-xl transition-colors text-left cursor-pointer"
                  >
                    <UserCheck className="w-4 h-4 text-slate-400" />
                    <span>My Profile</span>
                  </button>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setActiveNav("settings");
                      setProfileDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400 rounded-xl transition-colors text-left cursor-pointer"
                  >
                    <Settings className="w-4 h-4 text-slate-400" />
                    <span>Settings</span>
                  </button>

                  <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors text-left cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-red-500" />
                    <span>Log Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Dashboard Main Body */}
        <main className="p-4 sm:p-5 lg:p-6 space-y-4 sm:space-y-5 max-w-[1600px] mx-auto w-full">

          {/* ── DASHBOARD OVERVIEW VIEW ── */}
          {activeNav === "dashboard" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-start">

              {/* ── LEFT COLUMN (8 COLS) ── */}
              <div className="lg:col-span-8 space-y-4 sm:space-y-5">

                {/* 1. Top Sub-Row: Study Abroad Progress + Journey Timeline */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 sm:gap-5">

                  {/* Study Abroad Progress Card */}
                  <div className="sm:col-span-4 p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3.5 flex flex-col justify-between">
                    <p className="text-xs font-bold text-slate-700">Study Abroad Progress</p>
                    {dataLoading || !dashData ? (
                      <div className="space-y-3 animate-pulse">
                        <div className="h-8 w-20 bg-slate-200 rounded-lg" />
                        <div className="h-3 w-16 bg-slate-100 rounded" />
                        <div className="w-full h-2.5 rounded-full bg-slate-100" />
                      </div>
                    ) : (
                      <>
                        <div>
                          <p className="text-3xl font-extrabold text-blue-600">{progressPct}%</p>
                          <p className="text-xs text-slate-500 font-medium mt-0.5">Complete</p>
                        </div>
                        <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full bg-blue-600 rounded-full transition-all duration-500"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </>
                    )}
                  </div>

                  {/* Journey Timeline Stepper */}
                  <div className="sm:col-span-8 p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3.5 flex flex-col justify-between">
                    <p className="text-xs font-bold text-slate-700">Journey Timeline</p>

                    <div className="flex items-center justify-between relative pt-2">
                      <div className="absolute top-5 left-4 right-4 h-0.5 bg-slate-200 z-0" />

                      {journeySteps.map((step, idx) => (
                        <div key={idx} className="relative z-10 flex flex-col items-center text-center group">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                              step.status === "completed"
                                ? "bg-emerald-500 text-white"
                                : step.status === "current"
                                ? "bg-blue-600 text-white ring-4 ring-blue-100"
                                : "bg-slate-100 text-slate-400 border border-slate-200"
                            }`}
                          >
                            {step.status === "completed" ? (
                              <Check className="w-4 h-4 stroke-[3]" />
                            ) : step.status === "current" ? (
                              <FileText className="w-3.5 h-3.5" />
                            ) : (
                              <span className="w-2 h-2 rounded-full bg-slate-300" />
                            )}
                          </div>
                          <p
                            className={`text-[10px] font-bold mt-2 max-w-[62px] leading-tight ${
                              step.status === "completed" || step.status === "current"
                                ? "text-slate-800"
                                : "text-slate-400"
                            }`}
                          >
                            {step.label}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Conditional Payment Banner when stage is profile_submitted */}
                {stage === "profile_submitted" && (
                  <div className="p-4 sm:p-5 rounded-2xl bg-blue-50 border-2 border-blue-200 text-blue-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-blue-600 shrink-0" />
                        <h4 className="font-extrabold text-sm text-blue-900">
                          Application Processing Fee (50,000 TSH)
                        </h4>
                      </div>
                      <p className="text-xs text-blue-800">
                        Your profile is saved! Proceed with payment to unlock application submissions.
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveNav("payments")}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all shrink-0 cursor-pointer"
                    >
                      Pay 50,000 TSH Now &rarr;
                    </button>
                  </div>
                )}

                {/* 2. Dynamic Next Step Hero Card */}
                {(() => {
                  const journey =
                    dashData?.journeyStep ||
                    calculateStudentProgress(
                      dashData?.profile || null,
                      dashData?.applications || [],
                      dashData?.payments || []
                    ).journeyStep;

                  const appliedProgram =
                    primaryApp?.courses?.title ||
                    primaryApp?.preferred_course ||
                    profileData.preferredCourse ||
                    null;

                  const appliedUni = primaryApp?.universities?.name
                    ? `${primaryApp.universities.name}${primaryApp.universities.country ? `, ${primaryApp.universities.country}` : ""}`
                    : primaryApp?.target_country || profileData.preferredCountry || null;

                  return (
                    <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between relative overflow-hidden space-y-4">
                      {/* Subtle Campus Building Graphic on Right */}
                      <div className="hidden md:block absolute right-3 bottom-0 w-72 h-44 opacity-85 pointer-events-none select-none">
                        <svg viewBox="0 0 320 180" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                          <path d="M0 160 Q160 145 320 160 L320 180 L0 180 Z" fill="#E2E8F0" />
                          <path d="M10 162 Q160 150 310 162 L310 180 L10 180 Z" fill="#CBD5E1" />
                          <circle cx="45" cy="130" r="24" fill="#6EE7B7" opacity="0.6" />
                          <circle cx="70" cy="135" r="18" fill="#34D399" opacity="0.7" />
                          <circle cx="250" cy="135" r="20" fill="#34D399" opacity="0.7" />
                          <circle cx="280" cy="128" r="26" fill="#6EE7B7" opacity="0.6" />
                          <rect x="80" y="70" width="160" height="90" rx="4" fill="#3B82F6" opacity="0.12" />
                          <rect x="90" y="80" width="140" height="80" rx="2" fill="#FFFFFF" stroke="#94A3B8" strokeWidth="1.5" />
                          <polygon points="160,35 75,75 245,75" fill="#1E40AF" opacity="0.9" />
                          <polygon points="160,42 85,75 235,75" fill="#3B82F6" opacity="0.85" />
                          <circle cx="160" cy="62" r="7" fill="#FFFFFF" stroke="#1E40AF" strokeWidth="1.5" />
                          <line x1="160" y1="58" x2="160" y2="62" stroke="#1E40AF" strokeWidth="1.5" />
                          <line x1="160" y1="62" x2="163" y2="62" stroke="#1E40AF" strokeWidth="1.5" />
                          <rect x="105" y="80" width="10" height="80" fill="#F1F5F9" stroke="#94A3B8" strokeWidth="1" />
                          <rect x="135" y="80" width="10" height="80" fill="#F1F5F9" stroke="#94A3B8" strokeWidth="1" />
                          <rect x="175" y="80" width="10" height="80" fill="#F1F5F9" stroke="#94A3B8" strokeWidth="1" />
                          <rect x="205" y="80" width="10" height="80" fill="#F1F5F9" stroke="#94A3B8" strokeWidth="1" />
                          <rect x="150" y="120" width="20" height="40" rx="3" fill="#1E3A8A" />
                          <rect x="70" y="160" width="180" height="4" rx="1" fill="#94A3B8" />
                          <rect x="60" y="164" width="200" height="4" rx="1" fill="#64748B" />
                        </svg>
                      </div>

                      <div className="space-y-2.5 max-w-md relative z-10">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-600/20">
                            <Clock className="w-4.5 h-4.5" />
                          </div>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider uppercase border ${journey.badgeColor}`}>
                            {journey.badge}
                          </span>
                        </div>

                        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                          {journey.title}
                        </h2>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {journey.description}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 pt-1 relative z-10">
                        <div className="px-3.5 py-2 rounded-xl bg-white/90 backdrop-blur-xs border border-slate-200 shadow-2xs space-y-0.5">
                          <p className="text-[10px] text-slate-400 uppercase font-bold">Estimated Timeline</p>
                          <p className="text-xs font-extrabold text-slate-800">
                            {journey.estimatedTimeline}
                          </p>
                        </div>

                        {appliedUni && (
                          <div className="px-3.5 py-2 rounded-xl bg-white/90 backdrop-blur-xs border border-slate-200 shadow-2xs space-y-0.5">
                            <p className="text-[10px] text-slate-400 uppercase font-bold">Applied Destination / Target</p>
                            <p className="text-xs font-extrabold text-slate-800 truncate max-w-[220px]">
                              {appliedUni}
                            </p>
                          </div>
                        )}

                        {appliedProgram && (
                          <div className="px-3.5 py-2 rounded-xl bg-white/90 backdrop-blur-xs border border-slate-200 shadow-2xs space-y-0.5">
                            <p className="text-[10px] text-slate-400 uppercase font-bold">Selected Program</p>
                            <p className="text-xs font-extrabold text-slate-800 truncate max-w-[200px]">
                              {appliedProgram}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="pt-2 relative z-10">
                        <button
                          onClick={() => setActiveNav(journey.actionNav)}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition-colors shadow-md shadow-blue-600/20 inline-flex items-center gap-2 cursor-pointer active:scale-95"
                        >
                          <span>{journey.actionLabel}</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })()}

                {/* 3. Quick Access */}
                <div className="space-y-2.5">
                  <p className="text-xs font-bold text-slate-700">Quick Access</p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div
                      onClick={() => setActiveNav("application")}
                      className="p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer shadow-xs text-center space-y-2"
                    >
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-xs">My Application</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">View Progress</p>
                      </div>
                    </div>

                    <div
                      onClick={() => setActiveNav("documents")}
                      className="p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer shadow-xs text-center space-y-2"
                    >
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-xs">My Documents</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">View &amp; Upload</p>
                      </div>
                    </div>

                    <div
                      onClick={() => setActiveNav("universities")}
                      className="p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-purple-400 hover:shadow-md transition-all cursor-pointer shadow-xs text-center space-y-2"
                    >
                      <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-xs">Universities</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">Explore Options</p>
                      </div>
                    </div>

                    <div
                      onClick={() => setActiveNav("connect")}
                      className="p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-amber-400 hover:shadow-md transition-all cursor-pointer shadow-xs text-center space-y-2"
                    >
                      <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-xs">Student Connect</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">Talk to Students</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Passport & Visa Status */}
                <div className="space-y-2.5">
                  <p className="text-xs font-bold text-slate-700">Passport &amp; Visa Status</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* Passport Card */}
                    <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-extrabold text-lg shrink-0">
                          📗
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-slate-800 text-xs">Passport</h4>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                profileData.passportNumber || studentDocs.some((d) => d.document_type === "Passport")
                                  ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                  : "bg-slate-100 text-slate-600 border border-slate-200"
                              }`}
                            >
                              {profileData.passportNumber || studentDocs.some((d) => d.document_type === "Passport")
                                ? "Provided"
                                : "Not Provided"}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {profileData.passportNumber || studentDocs.some((d) => d.document_type === "Passport")
                              ? "Passport details recorded."
                              : "Update in profile or upload in documents."}
                          </p>
                          <button
                            onClick={() => setActiveNav("profile")}
                            className="text-[11px] font-bold text-blue-600 hover:underline mt-0.5 block cursor-pointer"
                          >
                            View Details &rarr;
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Visa Card */}
                    <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-extrabold text-lg shrink-0">
                          🛂
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-slate-800 text-xs">Visa</h4>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                primaryApp?.status?.toLowerCase().includes("visa")
                                  ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                  : "bg-slate-100 text-slate-600 border border-slate-200"
                              }`}
                            >
                              {primaryApp?.status?.toLowerCase().includes("visa")
                                ? "In Progress"
                                : "Pending Admission"}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {primaryApp?.status?.toLowerCase().includes("visa")
                              ? "Visa processing is active."
                              : "Begins after university acceptance."}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── RIGHT COLUMN (4 COLS) ── */}
              <div className="lg:col-span-4 space-y-4 sm:space-y-5">

                {/* 1. Application Status Card */}
                {primaryApp ? (
                  <div className="p-4.5 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-700">Application Status</p>
                      <span
                        className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200"
                      >
                        {primaryApp.status
                          ? primaryApp.status
                              .replace(/_/g, " ")
                              .replace(/\b\w/g, (c) => c.toUpperCase())
                          : "Submitted"}
                      </span>
                    </div>

                    <div className="space-y-2.5 text-xs pt-1">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Application ID</span>
                        <span className="font-bold text-slate-800 font-mono">
                          {`MTB/2026/${primaryApp.id.slice(0, 6).toUpperCase()}`}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-slate-500">Intake</span>
                        <span className="font-bold text-slate-800">
                          {primaryApp.courses?.intake_months ||
                            (primaryApp as any)?.target_intake ||
                            profileData.intake ||
                            "Not specified"}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-slate-500">Program</span>
                        <span className="font-bold text-slate-800 truncate max-w-[150px]">
                          {primaryApp.courses?.title ||
                            primaryApp.preferred_course ||
                            profileData.preferredCourse ||
                            "Not specified"}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Country</span>
                        <span className="font-bold text-slate-800 flex items-center gap-1.5">
                          <span>
                            {primaryApp.universities?.country ||
                              primaryApp.target_country ||
                              profileData.preferredCountry ||
                              "Not specified"}
                          </span>
                          {primaryApp.universities?.flag && (
                            <span>{primaryApp.universities.flag}</span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4.5 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-700">Application Status</p>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                        No Active Application
                      </span>
                    </div>

                    <div className="py-2 text-center space-y-2">
                      <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                        <GraduationCap className="w-5 h-5" />
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Your profile is ready. Start an application by selecting your preferred university and course.
                      </p>
                      <button
                        onClick={() => setActiveNav("application")}
                        className="w-full mt-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded-xl text-xs transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Start Application</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* 2. Assigned Admission Officer Card */}
                {(() => {
                  const officer = primaryApp?.admission_officer || dashData?.assignedOfficer || null;
                  const isOnline = isOfficerOnline(officer?.last_seen_at);
                  const officerFullName = officer
                    ? [officer.first_name, officer.last_name].filter(Boolean).join(" ") || "Admission Counselor"
                    : null;
                  const officerPhone = officer?.phone || null;
                  const cleanPhone = officerPhone ? officerPhone.replace(/[^0-9]/g, "") : "";
                  const officerRoleLabel =
                    officer?.role === "super_admin"
                      ? "Senior Admissions Director"
                      : "Assigned Admission Officer";

                  const studentNameStr =
                    [profileData.firstName, profileData.lastName].filter(Boolean).join(" ") || "Student";
                  const appIdStr = primaryApp
                    ? `MTB/2026/${primaryApp.id.slice(0, 6).toUpperCase()}`
                    : "MtishbiScholar";
                  const whatsappMsg = encodeURIComponent(
                    `Hello ${officerFullName || "Admission Officer"}, I am ${studentNameStr} (Application: ${appIdStr}). I have a question regarding my study abroad application status.`
                  );

                  return (
                    <div className="p-4.5 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3.5">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-slate-700">Assigned Admission Officer</p>
                        {officer && (
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1.5 ${
                              isOnline
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                : "bg-slate-100 text-slate-600 border-slate-200"
                            }`}
                          >
                            <span
                              className={`w-2 h-2 rounded-full ${
                                isOnline ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                              }`}
                            />
                            <span>{isOnline ? "Online Now" : "Offline"}</span>
                          </span>
                        )}
                      </div>

                      {officer ? (
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            {officer.avatar_url ? (
                              <img
                                src={officer.avatar_url}
                                alt={officerFullName || "Officer"}
                                className="w-11 h-11 rounded-full object-cover border border-slate-200 shrink-0"
                              />
                            ) : (
                              <div className="w-11 h-11 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-extrabold text-sm shrink-0 border border-blue-200">
                                {officer.first_name ? officer.first_name[0].toUpperCase() : "A"}
                                {officer.last_name ? officer.last_name[0].toUpperCase() : "O"}
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <h4 className="font-bold text-slate-900 text-xs truncate">{officerFullName}</h4>
                              <p className="text-[11px] text-blue-700 font-semibold">{officerRoleLabel}</p>
                              {officerPhone && (
                                <p className="text-[11px] text-slate-500 font-mono mt-0.5 flex items-center gap-1">
                                  <Phone className="w-3 h-3 text-slate-400" />
                                  <span>{officerPhone}</span>
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                            {cleanPhone ? (
                              <a
                                href={`https://wa.me/${cleanPhone}?text=${whatsappMsg}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                                <span>WhatsApp</span>
                              </a>
                            ) : (
                              <button
                                onClick={() => setActiveNav("connect")}
                                className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                                <span>Message</span>
                              </button>
                            )}

                            {officerPhone ? (
                              <a
                                href={`tel:${officerPhone}`}
                                className="py-2 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                              >
                                <Phone className="w-3.5 h-3.5 text-slate-500" />
                                <span>Call</span>
                              </a>
                            ) : (
                              <button
                                onClick={() => setActiveNav("connect")}
                                className="py-2 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
                                <span>Help Desk</span>
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-sm shrink-0 border border-slate-200">
                              <User className="w-5 h-5 text-slate-400" />
                            </div>
                            <div>
                              <h4 className="font-bold text-slate-800 text-xs">No Officer Assigned Yet</h4>
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                Assigned once your application is queued for review
                              </p>
                            </div>
                          </div>

                          <div className="pt-1">
                            <button
                              onClick={() => setActiveNav("connect")}
                              className="w-full py-2 px-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold transition-colors text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                              <span>Student Support Desk</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* 3. Recent Notifications Card */}
                <div className="p-4.5 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-slate-700">Recent Notifications</p>
                      {unreadNotifCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-extrabold text-[10px]">
                          {unreadNotifCount} New
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => setActiveNav("notifications")}
                      className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                    >
                      View All
                    </button>
                  </div>

                  <div className="space-y-2.5 text-xs pt-1">
                    {notificationsList && notificationsList.length > 0 ? (
                      notificationsList.slice(0, 4).map((n) => {
                        const visual = getNotificationVisual(n.type);
                        const Icon = visual.icon;
                        return (
                          <div
                            key={n.id}
                            onClick={() => {
                              if (!n.is_read) handleMarkOneAsRead(n.id);
                            }}
                            className={`p-2.5 rounded-xl border transition-all flex items-start gap-2.5 cursor-pointer ${
                              !n.is_read
                                ? "bg-blue-50/40 border-blue-200/80"
                                : "bg-slate-50/50 border-slate-100 hover:bg-slate-50"
                            }`}
                          >
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${visual.bgColor}`}
                            >
                              <Icon className="w-3.5 h-3.5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <p
                                  className={`text-xs truncate ${
                                    !n.is_read ? "font-black text-slate-900" : "font-semibold text-slate-700"
                                  }`}
                                >
                                  {n.title}
                                </p>
                                {!n.is_read && (
                                  <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                                {n.message}
                              </p>
                              {n.created_at && (
                                <p className="text-[10px] text-slate-400 mt-1 font-mono">
                                  {new Date(n.created_at).toLocaleDateString("en-GB", {
                                    day: "numeric",
                                    month: "short",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-6 space-y-1.5 text-slate-400">
                        <Bell className="w-6 h-6 mx-auto text-slate-300" />
                        <p className="text-xs font-semibold text-slate-600">No new notifications</p>
                        <p className="text-[11px] text-slate-400">
                          Updates about your applications and payments will appear here.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ── OTHER SECTION VIEWS (Profile, Payments, Application, Connect, etc.) ── */}
          {activeNav !== "dashboard" && (
            <div className="space-y-5">

              {/* ── STAGE 1: COMPLETE PROFILE WIZARD & MY PROFILE SAVED VIEW (ONLY VISIBLE UNDER PROFILE TAB) ── */}
              {activeNav === "profile" && (
                (dashData?.profile?.is_profile_completed || dashData?.isOnboardingCompleted) && !isEditingProfile ? (
                <div className="space-y-6">
                  {/* Skeleton Loader during Initial Data Fetching */}
                  {dataLoading && !dashData ? (
                    <div className="p-7 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-6 animate-pulse">
                      <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                        <div className="w-16 h-16 rounded-full bg-slate-200" />
                        <div className="space-y-2">
                          <div className="h-5 w-48 bg-slate-200 rounded" />
                          <div className="h-3 w-36 bg-slate-100 rounded" />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="h-40 bg-slate-100 rounded-xl" />
                        <div className="h-40 bg-slate-100 rounded-xl" />
                        <div className="h-40 bg-slate-100 rounded-xl" />
                        <div className="h-40 bg-slate-100 rounded-xl" />
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* 1. Profile Header Card */}
                      <div className="p-6 sm:p-7 rounded-2xl bg-white border border-slate-200 shadow-sm shadow-slate-200/60 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                          {/* Student Avatar / Initials Fallback */}
                          {dashData?.profile?.avatar_url ? (
                            <img
                              src={dashData.profile.avatar_url}
                              alt="Student Avatar"
                              className="w-16 h-16 rounded-full object-cover border-2 border-blue-600 shadow-md shrink-0"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-full bg-blue-600 text-white font-extrabold text-xl flex items-center justify-center border-2 border-blue-200 shadow-md shrink-0 uppercase">
                              {[profileData.firstName, profileData.lastName]
                                .filter(Boolean)
                                .map((n) => n[0])
                                .join("") || "ST"}
                            </div>
                          )}

                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                                {[profileData.firstName, profileData.middleName, profileData.lastName]
                                  .filter(Boolean)
                                  .join(" ") || studentFullName || "Student Profile"}
                              </h2>
                              <span
                                className={`px-3 py-0.5 rounded-full text-[11px] font-extrabold tracking-wide ${
                                  dashData?.profile?.is_profile_completed
                                    ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                    : "bg-amber-100 text-amber-800 border border-amber-200"
                                }`}
                              >
                                {dashData?.profile?.is_profile_completed ? "Profile Complete ✓" : "Profile Incomplete"}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                              <span className="flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5 text-slate-400" />
                                {dashData?.profile?.email || currentUser?.email || "No email"}
                              </span>
                              <span className="flex items-center gap-1.5">
                                <Phone className="w-3.5 h-3.5 text-slate-400" />
                                {dashData?.profile?.phone || profileData.phone || "Not provided"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => setIsEditingProfile(true)}
                          className="px-4 py-2.5 bg-blue-50 text-blue-700 hover:bg-blue-100 font-extrabold text-xs rounded-xl transition-all border border-blue-200 flex items-center gap-2 cursor-pointer shadow-xs self-start md:self-auto"
                        >
                          <UserCheck className="w-4 h-4 text-blue-600" />
                          <span>Edit Profile</span>
                        </button>
                      </div>

                      {/* Prominent Application Fee CTA Banner at the Top */}
                      <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-blue-50 via-indigo-50/60 to-blue-50 border-2 border-blue-200 text-blue-950 shadow-xs">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="space-y-1 max-w-2xl">
                            <h3 className="font-extrabold text-sm sm:text-base flex items-center gap-2 text-blue-900">
                              <GraduationCap className="w-5 h-5 text-blue-600 shrink-0" />
                              <span>Ready to Start Your Application?</span>
                            </h3>
                            <p className="text-xs text-blue-800 leading-relaxed font-medium">
                              One-time fee to open and activate your application file with MtishbiScholar.
                            </p>
                            <p className="text-[11px] text-blue-700/80 font-normal leading-normal italic">
                              This fee does not cover university application fees or other university-specific charges. Those are separate.
                            </p>
                          </div>
                          <button
                            onClick={() => setActiveNav("payments")}
                            className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl transition-all shadow-md shadow-blue-600/20 shrink-0 flex items-center gap-2 cursor-pointer active:scale-95"
                          >
                            <CreditCard className="w-4 h-4" />
                            <span>Pay Application File Fee &mdash; TSh 50,000</span>
                          </button>
                        </div>
                      </div>

                      {/* 2 - 7 Detailed Profile Info Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                        
                        {/* Section 2: Personal Information */}
                        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm shadow-slate-200/60 space-y-3">
                          <h4 className="font-extrabold text-slate-900 border-b border-slate-100 pb-2 text-sm flex items-center gap-2">
                            <User className="w-4 h-4 text-blue-600" />
                            Personal Information
                          </h4>
                          <div className="space-y-2 text-slate-700 pt-1">
                            <div className="flex justify-between border-b border-slate-50 pb-1.5">
                              <span className="font-semibold text-slate-500">First Name:</span>
                              <span className="font-bold text-slate-900">{profileData.firstName || "Not provided"}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-50 pb-1.5">
                              <span className="font-semibold text-slate-500">Middle Name:</span>
                              <span className="font-bold text-slate-900">{profileData.middleName || "Not provided"}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-50 pb-1.5">
                              <span className="font-semibold text-slate-500">Last Name:</span>
                              <span className="font-bold text-slate-900">{profileData.lastName || "Not provided"}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-50 pb-1.5">
                              <span className="font-semibold text-slate-500">Date of Birth:</span>
                              <span className="font-bold text-slate-900">{profileData.dob || "Not provided"}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-50 pb-1.5">
                              <span className="font-semibold text-slate-500">Gender:</span>
                              <span className="font-bold text-slate-900">{profileData.gender || "Not provided"}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-50 pb-1.5">
                              <span className="font-semibold text-slate-500">Nationality:</span>
                              <span className="font-bold text-slate-900">{profileData.nationality || "Not provided"}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-50 pb-1.5">
                              <span className="font-semibold text-slate-500">Phone:</span>
                              <span className="font-bold text-slate-900">{dashData?.profile?.phone || profileData.phone || "Not provided"}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-semibold text-slate-500">Email:</span>
                              <span className="font-bold text-slate-900">{dashData?.profile?.email || currentUser?.email || "Not provided"}</span>
                            </div>
                          </div>
                        </div>

                        {/* Section: Parent / Guardian / Sponsor Information */}
                        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm shadow-slate-200/60 space-y-3">
                          <h4 className="font-extrabold text-slate-900 border-b border-slate-100 pb-2 text-sm flex items-center gap-2">
                            <Users className="w-4 h-4 text-blue-600" />
                            Parent / Guardian / Sponsor
                          </h4>
                          <div className="space-y-2 text-slate-700 pt-1">
                            <div className="flex justify-between border-b border-slate-50 pb-1.5">
                              <span className="font-semibold text-slate-500">Relationship:</span>
                              <span className="font-bold text-slate-900">
                                {dashData?.primaryContact?.relationship_type || profileData.parentRelationship || "Not provided"}
                              </span>
                            </div>
                            <div className="flex justify-between border-b border-slate-50 pb-1.5">
                              <span className="font-semibold text-slate-500">Full Name:</span>
                              <span className="font-bold text-slate-900">
                                {dashData?.primaryContact
                                  ? [dashData.primaryContact.first_name, dashData.primaryContact.middle_name, dashData.primaryContact.last_name]
                                      .filter(Boolean)
                                      .join(" ")
                                  : [profileData.parentFirstName, profileData.parentMiddleName, profileData.parentLastName]
                                      .filter(Boolean)
                                      .join(" ") || "Not provided"}
                              </span>
                            </div>
                            <div className="flex justify-between border-b border-slate-50 pb-1.5">
                              <span className="font-semibold text-slate-500">Phone Number:</span>
                              <span className="font-bold text-slate-900">
                                {dashData?.primaryContact?.phone || profileData.parentPhone || "Not provided"}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-semibold text-slate-500">Email Address:</span>
                              <span className="font-bold text-slate-900">
                                {dashData?.primaryContact?.email || profileData.parentEmail || "Not provided"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Section 3: Academic Background */}
                        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm shadow-slate-200/60 space-y-3">
                          <h4 className="font-extrabold text-slate-900 border-b border-slate-100 pb-2 text-sm flex items-center gap-2">
                            <GraduationCap className="w-4 h-4 text-blue-600" />
                            Academic Background
                          </h4>
                          <div className="space-y-2 text-slate-700 pt-1">
                            <div className="flex justify-between border-b border-slate-50 pb-1.5">
                              <span className="font-semibold text-slate-500">Highest Education:</span>
                              <span className="font-bold text-slate-900">{profileData.highestEducation || dashData?.profile?.highest_education || "Not provided"}</span>
                            </div>
                            {(profileData.oLevelSchool || dashData?.profile?.o_level_school) && (
                              <>
                                <div className="flex justify-between border-b border-slate-50 pb-1.5">
                                  <span className="font-semibold text-slate-500">O-Level School:</span>
                                  <span className="font-bold text-slate-900">{profileData.oLevelSchool || dashData?.profile?.o_level_school}</span>
                                </div>
                                <div className="flex justify-between border-b border-slate-50 pb-1.5">
                                  <span className="font-semibold text-slate-500">O-Level Year:</span>
                                  <span className="font-bold text-slate-900">{profileData.oLevelYear || dashData?.profile?.o_level_year}</span>
                                </div>
                              </>
                            )}
                            {(profileData.aLevelSchool || dashData?.profile?.a_level_school) && (
                              <>
                                <div className="flex justify-between border-b border-slate-50 pb-1.5">
                                  <span className="font-semibold text-slate-500">A-Level School:</span>
                                  <span className="font-bold text-slate-900">{profileData.aLevelSchool || dashData?.profile?.a_level_school}</span>
                                </div>
                                <div className="flex justify-between border-b border-slate-50 pb-1.5">
                                  <span className="font-semibold text-slate-500">A-Level Year:</span>
                                  <span className="font-bold text-slate-900">{profileData.aLevelYear || dashData?.profile?.a_level_year}</span>
                                </div>
                                <div className="flex justify-between border-b border-slate-50 pb-1.5">
                                  <span className="font-semibold text-slate-500">A-Level Combination:</span>
                                  <span className="font-bold text-slate-900">{profileData.aLevelCombination || dashData?.profile?.a_level_combination}</span>
                                </div>
                              </>
                            )}
                            {(profileData.certificateInstitution || dashData?.profile?.certificate_institution) && (
                              <>
                                <div className="flex justify-between border-b border-slate-50 pb-1.5">
                                  <span className="font-semibold text-slate-500">Certificate College:</span>
                                  <span className="font-bold text-slate-900">{profileData.certificateInstitution || dashData?.profile?.certificate_institution}</span>
                                </div>
                                <div className="flex justify-between border-b border-slate-50 pb-1.5">
                                  <span className="font-semibold text-slate-500">Certificate Course:</span>
                                  <span className="font-bold text-slate-900">{profileData.certificateCourse || dashData?.profile?.certificate_course} ({profileData.certificateYear || dashData?.profile?.certificate_year})</span>
                                </div>
                              </>
                            )}
                            {(profileData.diplomaInstitution || dashData?.profile?.diploma_institution) && (
                              <>
                                <div className="flex justify-between border-b border-slate-50 pb-1.5">
                                  <span className="font-semibold text-slate-500">Diploma College:</span>
                                  <span className="font-bold text-slate-900">{profileData.diplomaInstitution || dashData?.profile?.diploma_institution}</span>
                                </div>
                                <div className="flex justify-between border-b border-slate-50 pb-1.5">
                                  <span className="font-semibold text-slate-500">Diploma Course:</span>
                                  <span className="font-bold text-slate-900">{profileData.diplomaCourse || dashData?.profile?.diploma_course} ({profileData.diplomaYear || dashData?.profile?.diploma_year})</span>
                                </div>
                              </>
                            )}
                            {(profileData.bachelorInstitution || dashData?.profile?.bachelor_institution) && (
                              <>
                                <div className="flex justify-between border-b border-slate-50 pb-1.5">
                                  <span className="font-semibold text-slate-500">Bachelor&apos;s University:</span>
                                  <span className="font-bold text-slate-900">{profileData.bachelorInstitution || dashData?.profile?.bachelor_institution}</span>
                                </div>
                                <div className="flex justify-between border-b border-slate-50 pb-1.5">
                                  <span className="font-semibold text-slate-500">Bachelor&apos;s Degree:</span>
                                  <span className="font-bold text-slate-900">{profileData.bachelorCourse || dashData?.profile?.bachelor_course} ({profileData.bachelorYear || dashData?.profile?.bachelor_year})</span>
                                </div>
                              </>
                            )}
                            {(profileData.masterInstitution || dashData?.profile?.master_institution) && (
                              <>
                                <div className="flex justify-between border-b border-slate-50 pb-1.5">
                                  <span className="font-semibold text-slate-500">Master&apos;s University:</span>
                                  <span className="font-bold text-slate-900">{profileData.masterInstitution || dashData?.profile?.master_institution}</span>
                                </div>
                                <div className="flex justify-between border-b border-slate-50 pb-1.5">
                                  <span className="font-semibold text-slate-500">Master&apos;s Degree:</span>
                                  <span className="font-bold text-slate-900">{profileData.masterCourse || dashData?.profile?.master_course} ({profileData.masterYear || dashData?.profile?.master_year})</span>
                                </div>
                              </>
                            )}
                            {(profileData.phdInstitution || dashData?.profile?.phd_institution) && (
                              <>
                                <div className="flex justify-between border-b border-slate-50 pb-1.5">
                                  <span className="font-semibold text-slate-500">PhD University:</span>
                                  <span className="font-bold text-slate-900">{profileData.phdInstitution || dashData?.profile?.phd_institution}</span>
                                </div>
                                <div className="flex justify-between border-b border-slate-50 pb-1.5">
                                  <span className="font-semibold text-slate-500">PhD Field:</span>
                                  <span className="font-bold text-slate-900">{profileData.phdCourse || dashData?.profile?.phd_course} ({profileData.phdYear || dashData?.profile?.phd_year})</span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Section 4: Study Preferences */}
                        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm shadow-slate-200/60 space-y-3">
                          <h4 className="font-extrabold text-slate-900 border-b border-slate-100 pb-2 text-sm flex items-center gap-2">
                            <Globe className="w-4 h-4 text-blue-600" />
                            Study Preferences
                          </h4>
                          <div className="space-y-2 text-slate-700 pt-1">
                            <div className="flex justify-between border-b border-slate-50 pb-1.5">
                              <span className="font-semibold text-slate-500">Preferred Country:</span>
                              <span className="font-bold text-slate-900">{profileData.preferredCountry || "Not provided"}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-50 pb-1.5">
                              <span className="font-semibold text-slate-500">Preferred Course:</span>
                              <span className="font-bold text-slate-900">{profileData.preferredCourse || "Not provided"}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-semibold text-slate-500">Target Intake:</span>
                              <span className="font-bold text-slate-900">{profileData.intake || "Not provided"}</span>
                            </div>
                          </div>
                        </div>

                        {/* Section 5: Passport & Identification */}
                        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm shadow-slate-200/60 space-y-3">
                          <h4 className="font-extrabold text-slate-900 border-b border-slate-100 pb-2 text-sm flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-blue-600" />
                            Passport &amp; Identification
                          </h4>
                          <div className="space-y-2 text-slate-700 pt-1">
                            <div className="flex justify-between border-b border-slate-50 pb-1.5">
                              <span className="font-semibold text-slate-500">Has Passport:</span>
                              <span className="font-bold text-slate-900">{profileData.hasPassport || "Not provided"}</span>
                            </div>
                            {profileData.hasPassport === "Yes" ? (
                              <>
                                <div className="flex justify-between border-b border-slate-50 pb-1.5">
                                  <span className="font-semibold text-slate-500">Passport Number:</span>
                                  <span className="font-bold text-slate-900">{profileData.passportNumber || "Not provided"}</span>
                                </div>
                                <div className="flex justify-between border-b border-slate-50 pb-1.5">
                                  <span className="font-semibold text-slate-500">Issue Date:</span>
                                  <span className="font-bold text-slate-900">{profileData.passportIssue || "Not provided"}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="font-semibold text-slate-500">Expiry Date:</span>
                                  <span className="font-bold text-slate-900">{profileData.passportExpiry || "Not provided"}</span>
                                </div>
                              </>
                            ) : (
                              <p className="text-slate-500 text-xs italic pt-1">Student does not hold a passport at present.</p>
                            )}
                          </div>
                        </div>

                        {/* Section 6: Academic Documents */}
                        <div className="md:col-span-2 p-5 rounded-2xl bg-white border border-slate-200 shadow-sm shadow-slate-200/60 space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-2 gap-2">
                            <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                              <FileText className="w-4 h-4 text-blue-600" />
                              <span>Academic Documents</span>
                            </h4>
                            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold text-[10px] w-fit">
                              {(profileData.highestEducation || dashData?.profile?.highest_education || "A-Level / High School")} Requirements
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {getRequiredAcademicDocs(profileData.highestEducation || dashData?.profile?.highest_education || "").map((docItem) => {
                              // Match documents strictly for current student by document_type, using newest created_at
                              const matchingDocs = studentDocs
                                .filter((d) => d.document_type === docItem.type)
                                .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());

                              const doc = matchingDocs[0] || null;
                              const isUploaded = !!doc;

                              return (
                                <div key={docItem.type} className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3 flex flex-col justify-between hover:border-slate-300 transition-all">
                                  <div className="space-y-1.5">
                                    <div className="flex items-start justify-between gap-2">
                                      <p className="font-bold text-slate-900 text-xs leading-snug">{docItem.title}</p>
                                      {docItem.required && (
                                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-50 text-red-600 border border-red-200 shrink-0">
                                          Required
                                        </span>
                                      )}
                                    </div>

                                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isUploaded ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"}`}>
                                        {isUploaded ? "Uploaded ✓" : "Not uploaded"}
                                      </span>
                                      {isUploaded && (
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${doc?.is_verified ? "bg-blue-100 text-blue-800" : "bg-amber-100 text-amber-800"}`}>
                                          {doc?.is_verified ? "Verified ✓" : "Pending Verification"}
                                        </span>
                                      )}
                                    </div>

                                    {doc?.file_name && (
                                      <p className="text-[11px] text-slate-500 truncate pt-1 font-mono flex items-center gap-1">
                                        📄 {doc.file_name}
                                      </p>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60">
                                    {doc?.file_url && (
                                      <button
                                        type="button"
                                        disabled={viewingDoc === docItem.type}
                                        onClick={() => handleViewDocument(doc.file_url, docItem.title)}
                                        className="px-3 py-1.5 bg-blue-600 text-white font-bold rounded-lg text-[11px] hover:bg-blue-700 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50 shadow-xs"
                                      >
                                        {viewingDoc === docItem.type ? (
                                          <>
                                            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            <span>Opening...</span>
                                          </>
                                        ) : (
                                          <>
                                            <Eye className="w-3 h-3" />
                                            <span>View</span>
                                          </>
                                        )}
                                      </button>
                                    )}

                                    <label className="cursor-pointer px-3 py-1.5 bg-white border border-slate-300 text-slate-700 font-bold rounded-lg text-[11px] hover:bg-slate-100 transition-colors flex items-center gap-1 shadow-xs">
                                      {uploadingDoc === docItem.type ? (
                                        <span className="flex items-center gap-1">
                                          <div className="w-3 h-3 border-2 border-slate-700 border-t-transparent rounded-full animate-spin" />
                                          <span>Uploading...</span>
                                        </span>
                                      ) : (
                                        <>
                                          <Upload className="w-3 h-3 text-slate-500" />
                                          <span>{isUploaded ? "Replace" : "Upload"}</span>
                                        </>
                                      )}
                                      <input
                                        type="file"
                                        accept="image/*,.pdf"
                                        className="hidden"
                                        onChange={async (e) => {
                                          if (e.target.files && e.target.files[0] && currentUser?.id) {
                                            const file = e.target.files[0];
                                            setUploadingDoc(docItem.type);
                                            const res = await uploadStudentDocument(currentUser.id, file, docItem.type);
                                            if (res.success) {
                                              const updatedDocs = await fetchStudentDocuments(currentUser.id);
                                              setStudentDocs(updatedDocs);
                                            } else {
                                              alert(`Document upload failed: ${res.error}`);
                                            }
                                            setUploadingDoc("");
                                          }
                                        }}
                                      />
                                    </label>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Section 7: Additional Information */}
                        <div className="md:col-span-2 p-5 rounded-2xl bg-white border border-slate-200 shadow-sm shadow-slate-200/60 space-y-3">
                          <h4 className="font-extrabold text-slate-900 border-b border-slate-100 pb-2 text-sm flex items-center gap-2">
                            <HelpCircle className="w-4 h-4 text-blue-600" />
                            Additional Information
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-slate-700 pt-1">
                            <div>
                              <span className="font-semibold text-slate-500 block">Applied Abroad Before:</span>
                              <span className="font-bold text-slate-900">{profileData.appliedAbroadBefore || "Not provided"}</span>
                            </div>
                            <div>
                              <span className="font-semibold text-slate-500 block">How You Heard:</span>
                              <span className="font-bold text-slate-900">{profileData.howDidYouHear || "Not provided"}</span>
                            </div>
                            <div>
                              <span className="font-semibold text-slate-500 block">Need Financial Guidance:</span>
                              <span className="font-bold text-slate-900">{profileData.needFinancialGuidance || "Not provided"}</span>
                            </div>
                          </div>
                        </div>

                        {/* Section 8: Danger Zone — Delete Profile & Start Over */}
                        <div className="md:col-span-2 p-5 rounded-2xl bg-red-50/60 border-2 border-red-200 shadow-sm shadow-red-100/50 space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="space-y-1">
                              <h4 className="font-extrabold text-red-900 text-sm flex items-center gap-2">
                                <AlertTriangle className="w-4.5 h-4.5 text-red-600 shrink-0" />
                                <span>Danger Zone &mdash; Delete Profile &amp; Start Over</span>
                              </h4>
                              <p className="text-xs text-red-700 leading-relaxed font-medium">
                                Permanently remove your student profile, academic records, parent contact, applications, and all uploaded documents.
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setShowDeleteProfileModal(true);
                                setDeleteConfirmationInput("");
                                setDeleteProfileError("");
                              }}
                              className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-xl transition-all shadow-md shadow-red-600/20 shrink-0 flex items-center gap-1.5 cursor-pointer active:scale-95 self-start sm:self-auto"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span>Delete Profile &amp; Start Over</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="p-7 rounded-2xl bg-white border border-slate-200 shadow-sm shadow-slate-200/60 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-2">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <UserCheck className="w-5 h-5 text-blue-600" />
                        <span>Complete Profile Wizard &ndash; Step {profileStep} of 7</span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Fields marked with <span className="text-red-500 font-bold">*</span> are mandatory and required to proceed.
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full w-fit">
                      {Math.round((profileStep / 7) * 100)}% Profile Completed
                    </span>
                  </div>

                  {/* Step 1: Personal Information */}
                  {profileStep === 1 && (
                    <div className="space-y-4 text-xs">
                      <h4 className="font-bold text-slate-800 text-sm">Step 1: Personal Information</h4>

                      {profileErrorBanner && (
                        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                          <span>{profileErrorBanner}</span>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">
                            FIRST NAME <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={profileData.firstName}
                            onChange={(e) => {
                              const val = e.target.value;
                              setProfileData({ ...profileData, firstName: val });
                              if (val.trim()) clearProfileError("firstName");
                            }}
                            placeholder="Enter your first name"
                            className={`w-full p-2.5 rounded-xl border bg-slate-50 outline-none transition-colors ${
                              profileErrors.firstName
                                ? "border-red-500 bg-red-50/20 ring-1 ring-red-200"
                                : "border-slate-200 focus:border-blue-600"
                            }`}
                          />
                          {profileErrors.firstName && (
                            <p className="text-[11px] font-medium text-red-600 mt-1">{profileErrors.firstName}</p>
                          )}
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">MIDDLE NAME</label>
                          <input
                            type="text"
                            value={profileData.middleName}
                            onChange={(e) => setProfileData({ ...profileData, middleName: e.target.value })}
                            placeholder="Enter your middle name (optional)"
                            className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:border-blue-600"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">
                            LAST NAME <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={profileData.lastName}
                            onChange={(e) => {
                              const val = e.target.value;
                              setProfileData({ ...profileData, lastName: val });
                              if (val.trim()) clearProfileError("lastName");
                            }}
                            placeholder="Enter your last name"
                            className={`w-full p-2.5 rounded-xl border bg-slate-50 outline-none transition-colors ${
                              profileErrors.lastName
                                ? "border-red-500 bg-red-50/20 ring-1 ring-red-200"
                                : "border-slate-200 focus:border-blue-600"
                            }`}
                          />
                          {profileErrors.lastName && (
                            <p className="text-[11px] font-medium text-red-600 mt-1">{profileErrors.lastName}</p>
                          )}
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">
                            DATE OF BIRTH <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="date"
                            required
                            value={profileData.dob}
                            onChange={(e) => {
                              const val = e.target.value;
                              setProfileData({ ...profileData, dob: val });
                              if (val) clearProfileError("dob");
                            }}
                            placeholder="MM/DD/YYYY"
                            className={`w-full p-2.5 rounded-xl border bg-slate-50 outline-none transition-colors ${
                              profileErrors.dob
                                ? "border-red-500 bg-red-50/20 ring-1 ring-red-200"
                                : "border-slate-200 focus:border-blue-600"
                            }`}
                          />
                          {profileErrors.dob && (
                            <p className="text-[11px] font-medium text-red-600 mt-1">{profileErrors.dob}</p>
                          )}
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">
                            GENDER <span className="text-red-500">*</span>
                          </label>
                          <select
                            required
                            value={profileData.gender}
                            onChange={(e) => {
                              const val = e.target.value;
                              setProfileData({ ...profileData, gender: val });
                              if (val) clearProfileError("gender");
                            }}
                            className={`w-full p-2.5 rounded-xl border bg-slate-50 outline-none transition-colors text-slate-700 ${
                              profileErrors.gender
                                ? "border-red-500 bg-red-50/20 ring-1 ring-red-200"
                                : "border-slate-200 focus:border-blue-600"
                            }`}
                          >
                            <option value="" disabled>
                              Select your gender
                            </option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                          </select>
                          {profileErrors.gender && (
                            <p className="text-[11px] font-medium text-red-600 mt-1">{profileErrors.gender}</p>
                          )}
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">
                            NATIONALITY <span className="text-red-500">*</span>
                          </label>
                          <NationalitySelect
                            required
                            value={profileData.nationality}
                            onChange={(val) => {
                              setProfileData({ ...profileData, nationality: val });
                              if (val.trim()) clearProfileError("nationality");
                            }}
                            error={profileErrors.nationality}
                          />
                        </div>
                        {/* PHONE NUMBER */}
                        <div className="sm:col-span-3">
                          <label className="block font-bold text-slate-700 mb-1">
                            PHONE NUMBER <span className="text-red-500">*</span>
                          </label>
                          <PhoneInput
                            value={profileData.phone}
                            onChange={(fullPhone) => {
                              setProfileData({ ...profileData, phone: fullPhone });
                              const clean = fullPhone.replace(/[\s\-()]/g, "");
                              if (clean && clean !== "+255" && clean.length >= 8) {
                                clearProfileError("phone");
                              }
                            }}
                          />
                          {profileErrors.phone && (
                            <p className="text-[11px] font-medium text-red-600 mt-1">{profileErrors.phone}</p>
                          )}
                        </div>
                      </div>

                      {/* PARENT / GUARDIAN / SPONSOR DETAILS */}
                      <div className="pt-6 border-t border-slate-200/80 space-y-4">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                          <h5 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                            Parent / Guardian / Sponsor Details
                          </h5>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          {/* Relationship Type */}
                          <div>
                            <label className="block font-bold text-slate-700 mb-1">
                              RELATIONSHIP TYPE <span className="text-red-500">*</span>
                            </label>
                            <select
                              required
                              value={profileData.parentRelationship}
                              onChange={(e) => {
                                const val = e.target.value;
                                setProfileData({ ...profileData, parentRelationship: val });
                                if (val) clearProfileError("parentRelationship");
                              }}
                              className={`w-full p-2.5 rounded-xl border bg-slate-50 outline-none transition-colors text-slate-700 ${
                                profileErrors.parentRelationship
                                  ? "border-red-500 bg-red-50/20 ring-1 ring-red-200"
                                  : "border-slate-200 focus:border-blue-600"
                              }`}
                            >
                              <option value="" disabled>Select relationship</option>
                              <option value="Father">Father</option>
                              <option value="Mother">Mother</option>
                              <option value="Sponsor">Sponsor</option>
                              <option value="Guardian">Guardian</option>
                              <option value="Other">Other</option>
                            </select>
                            {profileErrors.parentRelationship && (
                              <p className="text-[11px] font-medium text-red-600 mt-1">{profileErrors.parentRelationship}</p>
                            )}
                          </div>

                          {/* First Name */}
                          <div>
                            <label className="block font-bold text-slate-700 mb-1">
                              FIRST NAME <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={profileData.parentFirstName}
                              onChange={(e) => {
                                const val = e.target.value;
                                setProfileData({ ...profileData, parentFirstName: val });
                                if (val.trim()) clearProfileError("parentFirstName");
                              }}
                              placeholder="e.g. Hamza"
                              className={`w-full p-2.5 rounded-xl border bg-slate-50 outline-none transition-colors ${
                                profileErrors.parentFirstName
                                  ? "border-red-500 bg-red-50/20 ring-1 ring-red-200"
                                  : "border-slate-200 focus:border-blue-600"
                              }`}
                            />
                            {profileErrors.parentFirstName && (
                              <p className="text-[11px] font-medium text-red-600 mt-1">{profileErrors.parentFirstName}</p>
                            )}
                          </div>

                          {/* Middle Name (Optional) */}
                          <div>
                            <label className="block font-bold text-slate-700 mb-1">
                              MIDDLE NAME <span className="text-slate-400 font-normal">(Optional)</span>
                            </label>
                            <input
                              type="text"
                              value={profileData.parentMiddleName}
                              onChange={(e) =>
                                setProfileData({ ...profileData, parentMiddleName: e.target.value })
                              }
                              placeholder="e.g. Said"
                              className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:border-blue-600 outline-none transition-colors"
                            />
                          </div>

                          {/* Last Name */}
                          <div>
                            <label className="block font-bold text-slate-700 mb-1">
                              LAST NAME <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={profileData.parentLastName}
                              onChange={(e) => {
                                const val = e.target.value;
                                setProfileData({ ...profileData, parentLastName: val });
                                if (val.trim()) clearProfileError("parentLastName");
                              }}
                              placeholder="e.g. Tariq"
                              className={`w-full p-2.5 rounded-xl border bg-slate-50 outline-none transition-colors ${
                                profileErrors.parentLastName
                                  ? "border-red-500 bg-red-50/20 ring-1 ring-red-200"
                                  : "border-slate-200 focus:border-blue-600"
                              }`}
                            />
                            {profileErrors.parentLastName && (
                              <p className="text-[11px] font-medium text-red-600 mt-1">{profileErrors.parentLastName}</p>
                            )}
                          </div>

                          {/* Phone Number */}
                          <div>
                            <label className="block font-bold text-slate-700 mb-1">
                              PHONE NUMBER <span className="text-red-500">*</span>
                            </label>
                            <PhoneInput
                              value={profileData.parentPhone}
                              onChange={(fullPhone) => {
                                setProfileData({ ...profileData, parentPhone: fullPhone });
                                const clean = fullPhone.replace(/[\s\-()]/g, "");
                                if (clean && clean !== "+255" && clean.length >= 8) {
                                  clearProfileError("parentPhone");
                                }
                              }}
                            />
                            {profileErrors.parentPhone && (
                              <p className="text-[11px] font-medium text-red-600 mt-1">{profileErrors.parentPhone}</p>
                            )}
                          </div>

                          {/* Email Address (Optional) */}
                          <div>
                            <label className="block font-bold text-slate-700 mb-1">
                              EMAIL ADDRESS <span className="text-slate-400 font-normal">(Optional)</span>
                            </label>
                            <input
                              type="email"
                              value={profileData.parentEmail}
                              onChange={(e) => {
                                const val = e.target.value;
                                setProfileData({ ...profileData, parentEmail: val });
                                if (profileErrors.parentEmail) clearProfileError("parentEmail");
                              }}
                              placeholder="e.g. parent@example.com"
                              className={`w-full p-2.5 rounded-xl border bg-slate-50 outline-none transition-colors ${
                                profileErrors.parentEmail
                                  ? "border-red-500 bg-red-50/20 ring-1 ring-red-200"
                                  : "border-slate-200 focus:border-blue-600"
                              }`}
                            />
                            {profileErrors.parentEmail && (
                              <p className="text-[11px] font-medium text-red-600 mt-1">{profileErrors.parentEmail}</p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end pt-4">
                        <button
                          onClick={() => {
                            if (!validateProfileStep(1)) return;
                            setProfileStep(2);
                          }}
                          className="bg-blue-600 text-white font-bold px-6 py-2.5 rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
                        >
                          <span>Next: Academic Background</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Academic Background */}
                  {profileStep === 2 && (
                    <div className="space-y-4 text-xs">
                      <h4 className="font-bold text-slate-800 text-sm">Step 2: Academic Background</h4>

                      {profileErrorBanner && (
                        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                          <span>{profileErrorBanner}</span>
                        </div>
                      )}
                      
                      {/* 1. Highest Education Level */}
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          HIGHEST EDUCATION LEVEL <span className="text-red-500">*</span>
                        </label>
                        <select
                          required
                          value={profileData.highestEducation}
                          onChange={(e) => {
                            setProfileData({ ...profileData, highestEducation: e.target.value });
                            if (e.target.value) clearProfileError("highestEducation");
                          }}
                          className={`w-full p-2.5 rounded-xl border bg-slate-50 outline-none transition-colors text-slate-700 font-medium ${
                            profileErrors.highestEducation
                              ? "border-red-500 bg-red-50/20 ring-1 ring-red-200"
                              : "border-slate-200 focus:border-blue-600"
                          }`}
                        >
                          <option value="" disabled>
                            Select your highest education level
                          </option>
                          <option value="O-Level / Secondary School">O-Level / Secondary School</option>
                          <option value="A-Level / High School">A-Level / High School</option>
                          <option value="Certificate">Certificate</option>
                          <option value="Diploma">Diploma</option>
                          <option value="Bachelor's Degree">Bachelor&apos;s Degree</option>
                          <option value="Master's Degree">Master&apos;s Degree</option>
                          <option value="PhD">PhD</option>
                        </select>
                        {profileErrors.highestEducation && (
                          <p className="text-[11px] font-medium text-red-600 mt-1">{profileErrors.highestEducation}</p>
                        )}
                      </div>

                      {/* Dynamic Form Sections based on highestEducation */}

                      {/* A. O-Level / Secondary School Section */}
                      {(profileData.highestEducation === "O-Level / Secondary School" ||
                        profileData.highestEducation === "A-Level / High School" ||
                        profileData.highestEducation === "Certificate" ||
                        profileData.highestEducation === "Diploma" ||
                        !profileData.highestEducation) && (
                        <div className="pt-3 border-t border-slate-100 space-y-3">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                            <h5 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                              O-Level / Secondary School Education
                            </h5>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block font-bold text-slate-700 mb-1">
                                O-LEVEL / SECONDARY SCHOOL NAME <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                required
                                value={profileData.oLevelSchool}
                                onChange={(e) => {
                                  setProfileData({ ...profileData, oLevelSchool: e.target.value });
                                  if (e.target.value.trim()) clearProfileError("oLevelSchool");
                                }}
                                placeholder="e.g. Kibaha Secondary School"
                                className={`w-full p-2.5 rounded-xl border bg-slate-50 outline-none transition-colors ${
                                  profileErrors.oLevelSchool
                                    ? "border-red-500 bg-red-50/20 ring-1 ring-red-200"
                                    : "border-slate-200 focus:border-blue-600"
                                }`}
                              />
                              {profileErrors.oLevelSchool && (
                                <p className="text-[11px] font-medium text-red-600 mt-1">{profileErrors.oLevelSchool}</p>
                              )}
                            </div>
                            <div>
                              <label className="block font-bold text-slate-700 mb-1">
                                O-LEVEL COMPLETION YEAR <span className="text-red-500">*</span>
                              </label>
                              <select
                                required
                                value={profileData.oLevelYear}
                                onChange={(e) => {
                                  setProfileData({ ...profileData, oLevelYear: e.target.value });
                                  if (e.target.value) clearProfileError("oLevelYear");
                                }}
                                className={`w-full p-2.5 rounded-xl border bg-slate-50 outline-none transition-colors text-slate-700 ${
                                  profileErrors.oLevelYear
                                    ? "border-red-500 bg-red-50/20 ring-1 ring-red-200"
                                    : "border-slate-200 focus:border-blue-600"
                                }`}
                              >
                                <option value="" disabled>Select completion year</option>
                                {Array.from({ length: 47 }, (_, i) => 2030 - i).map((yr) => (
                                  <option key={yr} value={yr.toString()}>{yr}</option>
                                ))}
                              </select>
                              {profileErrors.oLevelYear && (
                                <p className="text-[11px] font-medium text-red-600 mt-1">{profileErrors.oLevelYear}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* B. A-Level / High School Section */}
                      {(profileData.highestEducation === "A-Level / High School" ||
                        profileData.highestEducation?.includes("Bachelor") ||
                        profileData.highestEducation?.includes("Master") ||
                        !profileData.highestEducation) && (
                        <div className="pt-3 border-t border-slate-100 space-y-3">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-indigo-600"></div>
                            <h5 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                              A-Level / High School Education
                            </h5>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                              <label className="block font-bold text-slate-700 mb-1">
                                A-LEVEL / HIGH SCHOOL NAME <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                required
                                value={profileData.aLevelSchool}
                                onChange={(e) => {
                                  setProfileData({ ...profileData, aLevelSchool: e.target.value });
                                  if (e.target.value.trim()) clearProfileError("aLevelSchool");
                                }}
                                placeholder="e.g. Ilboru High School"
                                className={`w-full p-2.5 rounded-xl border bg-slate-50 outline-none transition-colors ${
                                  profileErrors.aLevelSchool
                                    ? "border-red-500 bg-red-50/20 ring-1 ring-red-200"
                                    : "border-slate-200 focus:border-blue-600"
                                }`}
                              />
                              {profileErrors.aLevelSchool && (
                                <p className="text-[11px] font-medium text-red-600 mt-1">{profileErrors.aLevelSchool}</p>
                              )}
                            </div>
                            <div>
                              <label className="block font-bold text-slate-700 mb-1">
                                A-LEVEL COMPLETION YEAR <span className="text-red-500">*</span>
                              </label>
                              <select
                                required
                                value={profileData.aLevelYear}
                                onChange={(e) => {
                                  setProfileData({ ...profileData, aLevelYear: e.target.value });
                                  if (e.target.value) clearProfileError("aLevelYear");
                                }}
                                className={`w-full p-2.5 rounded-xl border bg-slate-50 outline-none transition-colors text-slate-700 ${
                                  profileErrors.aLevelYear
                                    ? "border-red-500 bg-red-50/20 ring-1 ring-red-200"
                                    : "border-slate-200 focus:border-blue-600"
                                }`}
                              >
                                <option value="" disabled>Select completion year</option>
                                {Array.from({ length: 47 }, (_, i) => 2030 - i).map((yr) => (
                                  <option key={yr} value={yr.toString()}>{yr}</option>
                                ))}
                              </select>
                              {profileErrors.aLevelYear && (
                                <p className="text-[11px] font-medium text-red-600 mt-1">{profileErrors.aLevelYear}</p>
                              )}
                            </div>
                            <div>
                              <label className="block font-bold text-slate-700 mb-1">
                                A-LEVEL COMBINATION <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                required
                                value={profileData.aLevelCombination}
                                onChange={(e) => {
                                  setProfileData({ ...profileData, aLevelCombination: e.target.value });
                                  if (e.target.value.trim()) clearProfileError("aLevelCombination");
                                }}
                                placeholder="e.g. PCM, PCB, HGL, EGM"
                                className={`w-full p-2.5 rounded-xl border bg-slate-50 outline-none transition-colors ${
                                  profileErrors.aLevelCombination
                                    ? "border-red-500 bg-red-50/20 ring-1 ring-red-200"
                                    : "border-slate-200 focus:border-blue-600"
                                }`}
                              />
                              {profileErrors.aLevelCombination && (
                                <p className="text-[11px] font-medium text-red-600 mt-1">{profileErrors.aLevelCombination}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* C. Certificate Section */}
                      {profileData.highestEducation === "Certificate" && (
                        <div className="pt-3 border-t border-slate-100 space-y-3">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-amber-600"></div>
                            <h5 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                              Certificate Programme Details
                            </h5>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                              <label className="block font-bold text-slate-700 mb-1">
                                INSTITUTION / COLLEGE NAME <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                required
                                value={profileData.certificateInstitution}
                                onChange={(e) => {
                                  setProfileData({ ...profileData, certificateInstitution: e.target.value });
                                  if (e.target.value.trim()) clearProfileError("certificateInstitution");
                                }}
                                placeholder="e.g. Dar es Salaam Institute of Technology"
                                className={`w-full p-2.5 rounded-xl border bg-slate-50 outline-none transition-colors ${
                                  profileErrors.certificateInstitution
                                    ? "border-red-500 bg-red-50/20 ring-1 ring-red-200"
                                    : "border-slate-200 focus:border-blue-600"
                                }`}
                              />
                              {profileErrors.certificateInstitution && (
                                <p className="text-[11px] font-medium text-red-600 mt-1">{profileErrors.certificateInstitution}</p>
                              )}
                            </div>
                            <div>
                              <label className="block font-bold text-slate-700 mb-1">
                                COURSE / PROGRAMME <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                required
                                value={profileData.certificateCourse}
                                onChange={(e) => {
                                  setProfileData({ ...profileData, certificateCourse: e.target.value });
                                  if (e.target.value.trim()) clearProfileError("certificateCourse");
                                }}
                                placeholder="e.g. Certificate in Information Technology"
                                className={`w-full p-2.5 rounded-xl border bg-slate-50 outline-none transition-colors ${
                                  profileErrors.certificateCourse
                                    ? "border-red-500 bg-red-50/20 ring-1 ring-red-200"
                                    : "border-slate-200 focus:border-blue-600"
                                }`}
                              />
                              {profileErrors.certificateCourse && (
                                <p className="text-[11px] font-medium text-red-600 mt-1">{profileErrors.certificateCourse}</p>
                              )}
                            </div>
                            <div>
                              <label className="block font-bold text-slate-700 mb-1">
                                COMPLETION YEAR <span className="text-red-500">*</span>
                              </label>
                              <select
                                required
                                value={profileData.certificateYear}
                                onChange={(e) => {
                                  setProfileData({ ...profileData, certificateYear: e.target.value });
                                  if (e.target.value) clearProfileError("certificateYear");
                                }}
                                className={`w-full p-2.5 rounded-xl border bg-slate-50 outline-none transition-colors text-slate-700 ${
                                  profileErrors.certificateYear
                                    ? "border-red-500 bg-red-50/20 ring-1 ring-red-200"
                                    : "border-slate-200 focus:border-blue-600"
                                }`}
                              >
                                <option value="" disabled>Select completion year</option>
                                {Array.from({ length: 47 }, (_, i) => 2030 - i).map((yr) => (
                                  <option key={yr} value={yr.toString()}>{yr}</option>
                                ))}
                              </select>
                              {profileErrors.certificateYear && (
                                <p className="text-[11px] font-medium text-red-600 mt-1">{profileErrors.certificateYear}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* D. Diploma Section */}
                      {profileData.highestEducation === "Diploma" && (
                        <div className="pt-3 border-t border-slate-100 space-y-3">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-600"></div>
                            <h5 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                              Diploma Programme Details
                            </h5>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                              <label className="block font-bold text-slate-700 mb-1">
                                INSTITUTION / COLLEGE NAME <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                required
                                value={profileData.diplomaInstitution}
                                onChange={(e) => {
                                  setProfileData({ ...profileData, diplomaInstitution: e.target.value });
                                  if (e.target.value.trim()) clearProfileError("diplomaInstitution");
                                }}
                                placeholder="e.g. Arusha Technical College"
                                className={`w-full p-2.5 rounded-xl border bg-slate-50 outline-none transition-colors ${
                                  profileErrors.diplomaInstitution
                                    ? "border-red-500 bg-red-50/20 ring-1 ring-red-200"
                                    : "border-slate-200 focus:border-blue-600"
                                }`}
                              />
                              {profileErrors.diplomaInstitution && (
                                <p className="text-[11px] font-medium text-red-600 mt-1">{profileErrors.diplomaInstitution}</p>
                              )}
                            </div>
                            <div>
                              <label className="block font-bold text-slate-700 mb-1">
                                COURSE / PROGRAMME <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                required
                                value={profileData.diplomaCourse}
                                onChange={(e) => {
                                  setProfileData({ ...profileData, diplomaCourse: e.target.value });
                                  if (e.target.value.trim()) clearProfileError("diplomaCourse");
                                }}
                                placeholder="e.g. Ordinary Diploma in Computer Engineering"
                                className={`w-full p-2.5 rounded-xl border bg-slate-50 outline-none transition-colors ${
                                  profileErrors.diplomaCourse
                                    ? "border-red-500 bg-red-50/20 ring-1 ring-red-200"
                                    : "border-slate-200 focus:border-blue-600"
                                }`}
                              />
                              {profileErrors.diplomaCourse && (
                                <p className="text-[11px] font-medium text-red-600 mt-1">{profileErrors.diplomaCourse}</p>
                              )}
                            </div>
                            <div>
                              <label className="block font-bold text-slate-700 mb-1">
                                COMPLETION YEAR <span className="text-red-500">*</span>
                              </label>
                              <select
                                required
                                value={profileData.diplomaYear}
                                onChange={(e) => {
                                  setProfileData({ ...profileData, diplomaYear: e.target.value });
                                  if (e.target.value) clearProfileError("diplomaYear");
                                }}
                                className={`w-full p-2.5 rounded-xl border bg-slate-50 outline-none transition-colors text-slate-700 ${
                                  profileErrors.diplomaYear
                                    ? "border-red-500 bg-red-50/20 ring-1 ring-red-200"
                                    : "border-slate-200 focus:border-blue-600"
                                }`}
                              >
                                <option value="" disabled>Select completion year</option>
                                {Array.from({ length: 47 }, (_, i) => 2030 - i).map((yr) => (
                                  <option key={yr} value={yr.toString()}>{yr}</option>
                                ))}
                              </select>
                              {profileErrors.diplomaYear && (
                                <p className="text-[11px] font-medium text-red-600 mt-1">{profileErrors.diplomaYear}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* E. Bachelor's Degree Section */}
                      {(profileData.highestEducation?.includes("Bachelor") ||
                        profileData.highestEducation?.includes("Master")) && (
                        <div className="pt-3 border-t border-slate-100 space-y-3">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-700"></div>
                            <h5 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                              Bachelor&apos;s Degree Details
                            </h5>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                              <label className="block font-bold text-slate-700 mb-1">
                                INSTITUTION / UNIVERSITY <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                required
                                value={profileData.bachelorInstitution}
                                onChange={(e) => {
                                  setProfileData({ ...profileData, bachelorInstitution: e.target.value });
                                  if (e.target.value.trim()) clearProfileError("bachelorInstitution");
                                }}
                                placeholder="e.g. University of Dar es Salaam"
                                className={`w-full p-2.5 rounded-xl border bg-slate-50 outline-none transition-colors ${
                                  profileErrors.bachelorInstitution
                                    ? "border-red-500 bg-red-50/20 ring-1 ring-red-200"
                                    : "border-slate-200 focus:border-blue-600"
                                }`}
                              />
                              {profileErrors.bachelorInstitution && (
                                <p className="text-[11px] font-medium text-red-600 mt-1">{profileErrors.bachelorInstitution}</p>
                              )}
                            </div>
                            <div>
                              <label className="block font-bold text-slate-700 mb-1">
                                PROGRAMME / COURSE <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                required
                                value={profileData.bachelorCourse}
                                onChange={(e) => {
                                  setProfileData({ ...profileData, bachelorCourse: e.target.value });
                                  if (e.target.value.trim()) clearProfileError("bachelorCourse");
                                }}
                                placeholder="e.g. B.Sc. in Computer Science"
                                className={`w-full p-2.5 rounded-xl border bg-slate-50 outline-none transition-colors ${
                                  profileErrors.bachelorCourse
                                    ? "border-red-500 bg-red-50/20 ring-1 ring-red-200"
                                    : "border-slate-200 focus:border-blue-600"
                                }`}
                              />
                              {profileErrors.bachelorCourse && (
                                <p className="text-[11px] font-medium text-red-600 mt-1">{profileErrors.bachelorCourse}</p>
                              )}
                            </div>
                            <div>
                              <label className="block font-bold text-slate-700 mb-1">
                                COMPLETION YEAR <span className="text-red-500">*</span>
                              </label>
                              <select
                                required
                                value={profileData.bachelorYear}
                                onChange={(e) => {
                                  setProfileData({ ...profileData, bachelorYear: e.target.value });
                                  if (e.target.value) clearProfileError("bachelorYear");
                                }}
                                className={`w-full p-2.5 rounded-xl border bg-slate-50 outline-none transition-colors text-slate-700 ${
                                  profileErrors.bachelorYear
                                    ? "border-red-500 bg-red-50/20 ring-1 ring-red-200"
                                    : "border-slate-200 focus:border-blue-600"
                                }`}
                              >
                                <option value="" disabled>Select completion year</option>
                                {Array.from({ length: 47 }, (_, i) => 2030 - i).map((yr) => (
                                  <option key={yr} value={yr.toString()}>{yr}</option>
                                ))}
                              </select>
                              {profileErrors.bachelorYear && (
                                <p className="text-[11px] font-medium text-red-600 mt-1">{profileErrors.bachelorYear}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* F. Master's Degree Section */}
                      {(profileData.highestEducation?.includes("Master") ||
                        profileData.highestEducation === "PhD") && (
                        <div className="pt-3 border-t border-slate-100 space-y-3">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-purple-700"></div>
                            <h5 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                              Master&apos;s Degree Details
                            </h5>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                              <label className="block font-bold text-slate-700 mb-1">
                                INSTITUTION / UNIVERSITY <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                required
                                value={profileData.masterInstitution}
                                onChange={(e) => {
                                  setProfileData({ ...profileData, masterInstitution: e.target.value });
                                  if (e.target.value.trim()) clearProfileError("masterInstitution");
                                }}
                                placeholder="e.g. University of Dodoma"
                                className={`w-full p-2.5 rounded-xl border bg-slate-50 outline-none transition-colors ${
                                  profileErrors.masterInstitution
                                    ? "border-red-500 bg-red-50/20 ring-1 ring-red-200"
                                    : "border-slate-200 focus:border-blue-600"
                                }`}
                              />
                              {profileErrors.masterInstitution && (
                                <p className="text-[11px] font-medium text-red-600 mt-1">{profileErrors.masterInstitution}</p>
                              )}
                            </div>
                            <div>
                              <label className="block font-bold text-slate-700 mb-1">
                                PROGRAMME / COURSE <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                required
                                value={profileData.masterCourse}
                                onChange={(e) => {
                                  setProfileData({ ...profileData, masterCourse: e.target.value });
                                  if (e.target.value.trim()) clearProfileError("masterCourse");
                                }}
                                placeholder="e.g. M.Sc. in Data Science"
                                className={`w-full p-2.5 rounded-xl border bg-slate-50 outline-none transition-colors ${
                                  profileErrors.masterCourse
                                    ? "border-red-500 bg-red-50/20 ring-1 ring-red-200"
                                    : "border-slate-200 focus:border-blue-600"
                                }`}
                              />
                              {profileErrors.masterCourse && (
                                <p className="text-[11px] font-medium text-red-600 mt-1">{profileErrors.masterCourse}</p>
                              )}
                            </div>
                            <div>
                              <label className="block font-bold text-slate-700 mb-1">
                                COMPLETION YEAR <span className="text-red-500">*</span>
                              </label>
                              <select
                                required
                                value={profileData.masterYear}
                                onChange={(e) => {
                                  setProfileData({ ...profileData, masterYear: e.target.value });
                                  if (e.target.value) clearProfileError("masterYear");
                                }}
                                className={`w-full p-2.5 rounded-xl border bg-slate-50 outline-none transition-colors text-slate-700 ${
                                  profileErrors.masterYear
                                    ? "border-red-500 bg-red-50/20 ring-1 ring-red-200"
                                    : "border-slate-200 focus:border-blue-600"
                                }`}
                              >
                                <option value="" disabled>Select completion year</option>
                                {Array.from({ length: 47 }, (_, i) => 2030 - i).map((yr) => (
                                  <option key={yr} value={yr.toString()}>{yr}</option>
                                ))}
                              </select>
                              {profileErrors.masterYear && (
                                <p className="text-[11px] font-medium text-red-600 mt-1">{profileErrors.masterYear}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* G. PhD Section */}
                      {profileData.highestEducation === "PhD" && (
                        <div className="pt-3 border-t border-slate-100 space-y-3">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-rose-700"></div>
                            <h5 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                              PhD / Doctoral Degree Details
                            </h5>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                              <label className="block font-bold text-slate-700 mb-1">
                                INSTITUTION / UNIVERSITY <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                required
                                value={profileData.phdInstitution}
                                onChange={(e) => {
                                  setProfileData({ ...profileData, phdInstitution: e.target.value });
                                  if (e.target.value.trim()) clearProfileError("phdInstitution");
                                }}
                                placeholder="e.g. Sokoine University"
                                className={`w-full p-2.5 rounded-xl border bg-slate-50 outline-none transition-colors ${
                                  profileErrors.phdInstitution
                                    ? "border-red-500 bg-red-50/20 ring-1 ring-red-200"
                                    : "border-slate-200 focus:border-blue-600"
                                }`}
                              />
                              {profileErrors.phdInstitution && (
                                <p className="text-[11px] font-medium text-red-600 mt-1">{profileErrors.phdInstitution}</p>
                              )}
                            </div>
                            <div>
                              <label className="block font-bold text-slate-700 mb-1">
                                RESEARCH FIELD / PROGRAMME <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                required
                                value={profileData.phdCourse}
                                onChange={(e) => {
                                  setProfileData({ ...profileData, phdCourse: e.target.value });
                                  if (e.target.value.trim()) clearProfileError("phdCourse");
                                }}
                                placeholder="e.g. PhD in Biotechnology"
                                className={`w-full p-2.5 rounded-xl border bg-slate-50 outline-none transition-colors ${
                                  profileErrors.phdCourse
                                    ? "border-red-500 bg-red-50/20 ring-1 ring-red-200"
                                    : "border-slate-200 focus:border-blue-600"
                                }`}
                              />
                              {profileErrors.phdCourse && (
                                <p className="text-[11px] font-medium text-red-600 mt-1">{profileErrors.phdCourse}</p>
                              )}
                            </div>
                            <div>
                              <label className="block font-bold text-slate-700 mb-1">
                                COMPLETION YEAR <span className="text-red-500">*</span>
                              </label>
                              <select
                                required
                                value={profileData.phdYear}
                                onChange={(e) => {
                                  setProfileData({ ...profileData, phdYear: e.target.value });
                                  if (e.target.value) clearProfileError("phdYear");
                                }}
                                className={`w-full p-2.5 rounded-xl border bg-slate-50 outline-none transition-colors text-slate-700 ${
                                  profileErrors.phdYear
                                    ? "border-red-500 bg-red-50/20 ring-1 ring-red-200"
                                    : "border-slate-200 focus:border-blue-600"
                                }`}
                              >
                                <option value="" disabled>Select completion year</option>
                                {Array.from({ length: 47 }, (_, i) => 2030 - i).map((yr) => (
                                  <option key={yr} value={yr.toString()}>{yr}</option>
                                ))}
                              </select>
                              {profileErrors.phdYear && (
                                <p className="text-[11px] font-medium text-red-600 mt-1">{profileErrors.phdYear}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex justify-between pt-4">
                        <button
                          onClick={() => setProfileStep(1)}
                          className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-100"
                        >
                          &larr; Back
                        </button>
                        <button
                          onClick={() => {
                            if (!validateProfileStep(2)) return;
                            setProfileStep(3);
                          }}
                          className="bg-blue-600 text-white font-bold px-6 py-2.5 rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2 cursor-pointer"
                        >
                          <span>Next: Study Preference</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Study Preference & Intake */}
                  {profileStep === 3 && (
                    <div className="space-y-4 text-xs">
                      <h4 className="font-bold text-slate-800 text-sm">Step 3: Study Preference &amp; Intake</h4>

                      {profileErrorBanner && (
                        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                          <span>{profileErrorBanner}</span>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {/* 1. Preferred Country * */}
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">
                            PREFERRED COUNTRY <span className="text-red-500">*</span>
                          </label>
                          <select
                            required
                            value={profileData.preferredCountry}
                            onChange={(e) => {
                              setProfileData({ ...profileData, preferredCountry: e.target.value });
                              if (e.target.value) clearProfileError("preferredCountry");
                            }}
                            className={`w-full p-2.5 rounded-xl border bg-slate-50 outline-none transition-colors text-slate-700 ${
                              profileErrors.preferredCountry
                                ? "border-red-500 bg-red-50/20 ring-1 ring-red-200"
                                : "border-slate-200 focus:border-blue-600"
                            }`}
                          >
                            <option value="" disabled>
                              Select your preferred country
                            </option>
                            {step3AvailableCountries.map((country) => (
                              <option key={country} value={country}>
                                {country}
                              </option>
                            ))}
                          </select>
                          {profileErrors.preferredCountry && (
                            <p className="text-[11px] font-medium text-red-600 mt-1">{profileErrors.preferredCountry}</p>
                          )}
                        </div>

                        {/* 2. Target Intake * */}
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">
                            TARGET INTAKE <span className="text-red-500">*</span>
                          </label>
                          <select
                            required
                            value={profileData.intake}
                            onChange={(e) => {
                              setProfileData({ ...profileData, intake: e.target.value });
                              if (e.target.value) clearProfileError("intake");
                            }}
                            className={`w-full p-2.5 rounded-xl border bg-slate-50 outline-none transition-colors text-slate-700 font-semibold ${
                              profileErrors.intake
                                ? "border-red-500 bg-red-50/20 ring-1 ring-red-200"
                                : "border-slate-200 focus:border-blue-600"
                            }`}
                          >
                            <option value="" disabled>
                              Select your target intake
                            </option>
                            <option value="September Intake">September Intake</option>
                            <option value="January Intake">January Intake</option>
                            <option value="March Intake">March Intake</option>
                            <option value="July Intake">July Intake</option>
                          </select>
                          {profileErrors.intake && (
                            <p className="text-[11px] font-medium text-red-600 mt-1">{profileErrors.intake}</p>
                          )}
                        </div>

                        {/* 3. Preferred Course * (Free text input) */}
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">
                            PREFERRED COURSE <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={profileData.preferredCourse}
                            onChange={(e) => {
                              setProfileData({ ...profileData, preferredCourse: e.target.value });
                              if (e.target.value.trim()) clearProfileError("preferredCourse");
                            }}
                            placeholder="Enter your preferred course"
                            className={`w-full p-2.5 rounded-xl border bg-slate-50 outline-none transition-colors ${
                              profileErrors.preferredCourse
                                ? "border-red-500 bg-red-50/20 ring-1 ring-red-200"
                                : "border-slate-200 focus:border-blue-600"
                            }`}
                          />
                          {profileErrors.preferredCourse && (
                            <p className="text-[11px] font-medium text-red-600 mt-1">{profileErrors.preferredCourse}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-between pt-4">
                        <button
                          onClick={() => setProfileStep(2)}
                          className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-100"
                        >
                          &larr; Back
                        </button>
                        <button
                          onClick={() => {
                            if (!validateProfileStep(3)) return;
                            setProfileStep(4);
                          }}
                          className="bg-blue-600 text-white font-bold px-6 py-2.5 rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2 cursor-pointer"
                        >
                          <span>Next: Passport Status</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 4: Passport */}
                  {profileStep === 4 && (
                    <div className="space-y-4 text-xs">
                      <h4 className="font-bold text-slate-800 text-sm">Step 4: Passport Details</h4>

                      {profileErrorBanner && (
                        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                          <span>{profileErrorBanner}</span>
                        </div>
                      )}

                      <div className="space-y-3">
                        <label className="block font-bold text-slate-700">
                          DO YOU HAVE A VALID PASSPORT? <span className="text-red-500">*</span>
                        </label>
                        <div className="flex gap-4">
                          <label className="flex items-center gap-2 cursor-pointer font-semibold">
                            <input
                              type="radio"
                              name="passport"
                              value="Yes"
                              checked={profileData.hasPassport === "Yes"}
                              onChange={() => {
                                setProfileData({ ...profileData, hasPassport: "Yes" });
                                clearProfileError("hasPassport");
                              }}
                            />
                            <span>Yes, I have a Passport</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer font-semibold">
                            <input
                              type="radio"
                              name="passport"
                              value="No"
                              checked={profileData.hasPassport === "No"}
                              onChange={() => {
                                setProfileData({ ...profileData, hasPassport: "No" });
                                clearProfileError("hasPassport");
                              }}
                            />
                            <span>No, I need assistance</span>
                          </label>
                        </div>
                        {profileErrors.hasPassport && (
                          <p className="text-[11px] font-medium text-red-600">{profileErrors.hasPassport}</p>
                        )}
                      </div>

                      {profileData.hasPassport === "Yes" && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                          <div>
                            <label className="block font-bold text-slate-700 mb-1">
                              PASSPORT NUMBER <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={profileData.passportNumber}
                              onChange={(e) => {
                                setProfileData({ ...profileData, passportNumber: e.target.value });
                                if (e.target.value.trim()) clearProfileError("passportNumber");
                              }}
                              placeholder="e.g. AB123456"
                              className={`w-full p-2.5 rounded-xl border bg-slate-50 outline-none transition-colors ${
                                profileErrors.passportNumber
                                  ? "border-red-500 bg-red-50/20 ring-1 ring-red-200"
                                  : "border-slate-200 focus:border-blue-600"
                              }`}
                            />
                            {profileErrors.passportNumber && (
                              <p className="text-[11px] font-medium text-red-600 mt-1">{profileErrors.passportNumber}</p>
                            )}
                          </div>
                          <div>
                            <label className="block font-bold text-slate-700 mb-1">
                              ISSUE DATE <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="date"
                              value={profileData.passportIssue}
                              onChange={(e) => {
                                setProfileData({ ...profileData, passportIssue: e.target.value });
                                if (e.target.value) clearProfileError("passportIssue");
                              }}
                              className={`w-full p-2.5 rounded-xl border bg-slate-50 outline-none transition-colors ${
                                profileErrors.passportIssue
                                  ? "border-red-500 bg-red-50/20 ring-1 ring-red-200"
                                  : "border-slate-200 focus:border-blue-600"
                              }`}
                            />
                            {profileErrors.passportIssue && (
                              <p className="text-[11px] font-medium text-red-600 mt-1">{profileErrors.passportIssue}</p>
                            )}
                          </div>
                          <div>
                            <label className="block font-bold text-slate-700 mb-1">
                              EXPIRY DATE <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="date"
                              value={profileData.passportExpiry}
                              onChange={(e) => {
                                setProfileData({ ...profileData, passportExpiry: e.target.value });
                                if (e.target.value) clearProfileError("passportExpiry");
                              }}
                              className={`w-full p-2.5 rounded-xl border bg-slate-50 outline-none transition-colors ${
                                profileErrors.passportExpiry
                                  ? "border-red-500 bg-red-50/20 ring-1 ring-red-200"
                                  : "border-slate-200 focus:border-blue-600"
                              }`}
                            />
                            {profileErrors.passportExpiry && (
                              <p className="text-[11px] font-medium text-red-600 mt-1">{profileErrors.passportExpiry}</p>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex justify-between pt-4">
                        <button
                          onClick={() => setProfileStep(3)}
                          className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-100 cursor-pointer"
                        >
                          &larr; Back
                        </button>
                        <button
                          onClick={() => {
                            if (!validateProfileStep(4)) return;
                            setProfileStep(5);
                          }}
                          className="bg-blue-600 text-white font-bold px-6 py-2.5 rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2 cursor-pointer"
                        >
                          <span>Next: Mandatory Documents Upload</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 5: Document Uploads */}
                  {profileStep === 5 && (
                    <div className="space-y-4 text-xs">
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-bold text-slate-800 text-sm">Step 5: Academic Document Uploads</h4>
                          <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold text-[10px]">
                            {profileData.highestEducation || "A-Level / High School"} Path
                          </span>
                        </div>
                        <p className="text-slate-500 text-xs mt-0.5">
                          Upload the required academic certificates and transcripts for your selected education level.
                        </p>
                      </div>

                      {profileErrorBanner && (
                        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                          <span>{profileErrorBanner}</span>
                        </div>
                      )}

                      <div className="space-y-3 pt-2">
                        {getRequiredAcademicDocs(profileData.highestEducation).map((docItem) => {
                          const uploadedDoc = studentDocs.find((d) => d.document_type === docItem.type);
                          const isUploaded = !!uploadedDoc;

                          return (
                            <div
                              key={docItem.type}
                              className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                                isUploaded
                                  ? "border-emerald-500 bg-emerald-50/70 shadow-xs"
                                  : "border-slate-200 bg-slate-50 hover:bg-white"
                              }`}
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <FileText className={`w-4 h-4 shrink-0 ${isUploaded ? "text-emerald-600" : "text-blue-600"}`} />
                                  <span className="font-extrabold text-slate-900 text-xs sm:text-sm">{docItem.title}</span>
                                  {docItem.required ? (
                                    <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-700 text-[10px] font-bold">
                                      REQUIRED *
                                    </span>
                                  ) : (
                                    <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-600 text-[10px] font-semibold">
                                      OPTIONAL
                                    </span>
                                  )}
                                  {isUploaded && (
                                    <span className="text-emerald-800 font-extrabold bg-emerald-200/90 px-2 py-0.5 rounded-full text-[10px] flex items-center gap-1">
                                      <CheckCircle2 className="w-3 h-3 text-emerald-700" /> UPLOADED ✓
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-500 mt-1">{docItem.description}</p>
                                {docItem.note && (
                                  <p className="text-[10px] text-amber-800 bg-amber-50 border border-amber-200/60 rounded-lg p-1.5 mt-1.5 font-medium leading-relaxed">
                                    💡 <strong>Note:</strong> {docItem.note}
                                  </p>
                                )}
                                {isUploaded && uploadedDoc && (
                                  <p className="text-[10px] text-slate-600 font-mono mt-1 flex items-center gap-1 truncate">
                                    📄 {uploadedDoc.file_name}
                                  </p>
                                )}
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                {isUploaded && uploadedDoc ? (
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => handleViewDocument(uploadedDoc.file_url, docItem.title)}
                                      className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold rounded-xl text-xs flex items-center gap-1 transition-colors cursor-pointer border border-blue-200"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                      <span>View</span>
                                    </button>
                                    <label className="cursor-pointer px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1 transition-colors">
                                      {uploadingDoc === docItem.type ? (
                                        <span className="flex items-center gap-1">
                                          <div className="w-3 h-3 border-2 border-slate-700 border-t-transparent rounded-full animate-spin"></div>
                                          <span>Uploading...</span>
                                        </span>
                                      ) : (
                                        <>
                                          <Upload className="w-3.5 h-3.5" />
                                          <span>Re-upload</span>
                                        </>
                                      )}
                                      <input
                                        type="file"
                                        accept="image/*,.pdf"
                                        className="hidden"
                                        onChange={async (e) => {
                                          if (e.target.files && e.target.files[0] && currentUser?.id) {
                                            const file = e.target.files[0];
                                            setUploadingDoc(docItem.type);
                                            const res = await uploadStudentDocument(currentUser.id, file, docItem.type);
                                            if (res.success) {
                                              const updatedDocs = await fetchStudentDocuments(currentUser.id);
                                              setStudentDocs(updatedDocs);
                                              clearProfileError("documents");
                                            } else {
                                              alert(`Document upload failed: ${res.error}`);
                                            }
                                            setUploadingDoc("");
                                          }
                                        }}
                                      />
                                    </label>
                                  </div>
                                ) : (
                                  <label className="cursor-pointer px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700 flex items-center gap-1.5 shadow-sm transition-colors">
                                    {uploadingDoc === docItem.type ? (
                                      <span className="flex items-center gap-1">
                                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        <span>Uploading...</span>
                                      </span>
                                    ) : (
                                      <>
                                        <Upload className="w-3.5 h-3.5" />
                                        <span>Choose File</span>
                                      </>
                                    )}
                                    <input
                                      type="file"
                                      accept="image/*,.pdf"
                                      className="hidden"
                                      onChange={async (e) => {
                                        if (e.target.files && e.target.files[0] && currentUser?.id) {
                                          const file = e.target.files[0];
                                          setUploadingDoc(docItem.type);
                                          const res = await uploadStudentDocument(currentUser.id, file, docItem.type);
                                          if (res.success) {
                                            const updatedDocs = await fetchStudentDocuments(currentUser.id);
                                            setStudentDocs(updatedDocs);
                                            clearProfileError("documents");
                                          } else {
                                            alert(`Document upload failed: ${res.error}`);
                                          }
                                          setUploadingDoc("");
                                        }
                                      }}
                                    />
                                  </label>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="flex justify-between pt-4">
                        <button
                          onClick={() => setProfileStep(4)}
                          className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-100 cursor-pointer"
                        >
                          &larr; Back
                        </button>
                        <button
                          onClick={() => {
                            if (!validateProfileStep(5)) return;
                            setProfileStep(6);
                          }}
                          className="bg-blue-600 text-white font-bold px-6 py-2.5 rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2 cursor-pointer"
                        >
                          <span>Next: Additional Questions</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 6: Additional Questions */}
                  {profileStep === 6 && (
                    <div className="space-y-4 text-xs">
                      <h4 className="font-bold text-slate-800 text-sm">Step 6: Additional Questions</h4>

                      {profileErrorBanner && (
                        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                          <span>{profileErrorBanner}</span>
                        </div>
                      )}

                      <div className="space-y-3">
                        {/* 1. Have you applied abroad before? * */}
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">
                            HAVE YOU APPLIED ABROAD BEFORE? <span className="text-red-500">*</span>
                          </label>
                          <select
                            required
                            value={profileData.appliedAbroadBefore}
                            onChange={(e) => {
                              setProfileData({ ...profileData, appliedAbroadBefore: e.target.value });
                              if (e.target.value) clearProfileError("appliedAbroadBefore");
                            }}
                            className={`w-full p-2.5 rounded-xl border bg-slate-50 outline-none transition-colors text-slate-700 ${
                              profileErrors.appliedAbroadBefore
                                ? "border-red-500 bg-red-50/20 ring-1 ring-red-200"
                                : "border-slate-200 focus:border-blue-600"
                            }`}
                          >
                            <option value="" disabled>
                              Select an option
                            </option>
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                          </select>
                          {profileErrors.appliedAbroadBefore && (
                            <p className="text-[11px] font-medium text-red-600 mt-1">{profileErrors.appliedAbroadBefore}</p>
                          )}
                        </div>

                        {/* 2. How did you hear about MtishbiScholar? * */}
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">
                            HOW DID YOU HEAR ABOUT MTISHBISCHOLAR? <span className="text-red-500">*</span>
                          </label>
                          <select
                            required
                            value={profileData.howDidYouHear}
                            onChange={(e) => {
                              setProfileData({ ...profileData, howDidYouHear: e.target.value });
                              if (e.target.value) clearProfileError("howDidYouHear");
                            }}
                            className={`w-full p-2.5 rounded-xl border bg-slate-50 outline-none transition-colors text-slate-700 ${
                              profileErrors.howDidYouHear
                                ? "border-red-500 bg-red-50/20 ring-1 ring-red-200"
                                : "border-slate-200 focus:border-blue-600"
                            }`}
                          >
                            <option value="" disabled>
                              Select how you heard about us
                            </option>
                            <option value="Instagram">Instagram</option>
                            <option value="Facebook">Facebook</option>
                            <option value="TikTok">TikTok</option>
                            <option value="YouTube">YouTube</option>
                            <option value="Friend / Family">Friend / Family</option>
                            <option value="Google Search">Google Search</option>
                            <option value="University">University</option>
                            <option value="Other">Other</option>
                          </select>
                          {profileErrors.howDidYouHear && (
                            <p className="text-[11px] font-medium text-red-600 mt-1">{profileErrors.howDidYouHear}</p>
                          )}
                        </div>

                        {/* 3. Do you need financial & scholarship guidance? * */}
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">
                            DO YOU NEED FINANCIAL &amp; SCHOLARSHIP GUIDANCE? <span className="text-red-500">*</span>
                          </label>
                          <select
                            required
                            value={profileData.needFinancialGuidance}
                            onChange={(e) => {
                              setProfileData({ ...profileData, needFinancialGuidance: e.target.value });
                              if (e.target.value) clearProfileError("needFinancialGuidance");
                            }}
                            className={`w-full p-2.5 rounded-xl border bg-slate-50 outline-none transition-colors text-slate-700 ${
                              profileErrors.needFinancialGuidance
                                ? "border-red-500 bg-red-50/20 ring-1 ring-red-200"
                                : "border-slate-200 focus:border-blue-600"
                            }`}
                          >
                            <option value="" disabled>
                              Select an option
                            </option>
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                          </select>
                          {profileErrors.needFinancialGuidance && (
                            <p className="text-[11px] font-medium text-red-600 mt-1">{profileErrors.needFinancialGuidance}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-between pt-4">
                        <button
                          onClick={() => setProfileStep(5)}
                          className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-100 cursor-pointer"
                        >
                          &larr; Back
                        </button>
                        <button
                          onClick={() => {
                            if (!validateProfileStep(6)) return;
                            setProfileStep(7);
                          }}
                          className="bg-blue-600 text-white font-bold px-6 py-2.5 rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2 cursor-pointer"
                        >
                          <span>Next: Review &amp; Submit Profile</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 7: Review & Submit Profile */}
                  {profileStep === 7 && (
                    <div className="space-y-4 text-xs">
                      <h4 className="font-bold text-slate-800 text-sm">Step 7: Review &amp; Complete Profile</h4>
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                        <p className="font-bold text-slate-800">Profile Summary Verification:</p>
                        <p className="text-slate-600">&bull; Name: {profileData.firstName} {profileData.middleName ? profileData.middleName + " " : ""}{profileData.lastName}</p>
                        <p className="text-slate-600">&bull; Education Level: <span className="font-semibold text-slate-800">{profileData.highestEducation || "Not specified"}</span></p>
                        {profileData.oLevelSchool && (
                          <p className="text-slate-600">&bull; O-Level: {profileData.oLevelSchool} {profileData.oLevelYear ? `(${profileData.oLevelYear})` : ""}</p>
                        )}
                        {profileData.aLevelSchool && (
                          <p className="text-slate-600">&bull; A-Level: {profileData.aLevelSchool} {profileData.aLevelYear ? `(${profileData.aLevelYear})` : ""} {profileData.aLevelCombination ? `- ${profileData.aLevelCombination}` : ""}</p>
                        )}
                        {profileData.certificateInstitution && (
                          <p className="text-slate-600">&bull; Certificate: {profileData.certificateCourse} at {profileData.certificateInstitution} {profileData.certificateYear ? `(${profileData.certificateYear})` : ""}</p>
                        )}
                        {profileData.diplomaInstitution && (
                          <p className="text-slate-600">&bull; Diploma: {profileData.diplomaCourse} at {profileData.diplomaInstitution} {profileData.diplomaYear ? `(${profileData.diplomaYear})` : ""}</p>
                        )}
                        {profileData.bachelorInstitution && (
                          <p className="text-slate-600">&bull; Bachelor&apos;s: {profileData.bachelorCourse} at {profileData.bachelorInstitution} {profileData.bachelorYear ? `(${profileData.bachelorYear})` : ""}</p>
                        )}
                        {profileData.masterInstitution && (
                          <p className="text-slate-600">&bull; Master&apos;s: {profileData.masterCourse} at {profileData.masterInstitution} {profileData.masterYear ? `(${profileData.masterYear})` : ""}</p>
                        )}
                        {profileData.phdInstitution && (
                          <p className="text-slate-600">&bull; PhD: {profileData.phdCourse} at {profileData.phdInstitution} {profileData.phdYear ? `(${profileData.phdYear})` : ""}</p>
                        )}
                        <p className="text-slate-600">&bull; Target Country: {profileData.preferredCountry || "Not selected"} ({profileData.intake || "No intake selected"})</p>
                        <p className="text-slate-600">
                          &bull; {profileData.parentRelationship || "Parent / Guardian / Sponsor"}:{" "}
                          {[profileData.parentFirstName, profileData.parentMiddleName, profileData.parentLastName].filter(Boolean).join(" ") || "Not specified"}
                          {profileData.parentPhone ? ` (${profileData.parentPhone})` : ""}
                          {profileData.parentEmail ? ` &bull; ${profileData.parentEmail}` : ""}
                        </p>
                        <p className="text-slate-600">&bull; Academic Documents: Uploaded according to requirements ✓</p>
                      </div>

                      {profileSubmitError && (
                        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                          <span>{profileSubmitError}</span>
                        </div>
                      )}

                      <div className="flex justify-between pt-4">
                        <button
                          onClick={() => setProfileStep(6)}
                          className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-100 cursor-pointer"
                        >
                          &larr; Back
                        </button>
                        <button
                          disabled={savingProfile}
                          onClick={async () => {
                            for (let s = 1; s <= 6; s++) {
                              if (!validateProfileStep(s)) {
                                setProfileStep(s);
                                return;
                              }
                            }
                            if (!currentUser?.id) return;
                            setSavingProfile(true);
                            setProfileSubmitError("");

                            try {
                              // 1. Save student profile to public.profiles
                              const profileRes = await saveStudentFullProfile(currentUser.id, {
                                first_name: profileData.firstName,
                                middle_name: profileData.middleName,
                                last_name: profileData.lastName,
                                dob: profileData.dob,
                                gender: profileData.gender,
                                nationality: profileData.nationality,
                                phone: profileData.phone, // E.164 combined by PhoneInput, e.g. "+255712345678"
                                highest_education: profileData.highestEducation,
                                o_level_school: profileData.oLevelSchool,
                                o_level_year: profileData.oLevelYear,
                                a_level_school: profileData.aLevelSchool,
                                a_level_year: profileData.aLevelYear,
                                a_level_combination: profileData.aLevelCombination,
                                certificate_institution: profileData.certificateInstitution,
                                certificate_course: profileData.certificateCourse,
                                certificate_year: profileData.certificateYear,
                                diploma_institution: profileData.diplomaInstitution,
                                diploma_course: profileData.diplomaCourse,
                                diploma_year: profileData.diplomaYear,
                                bachelor_institution: profileData.bachelorInstitution,
                                bachelor_course: profileData.bachelorCourse,
                                bachelor_year: profileData.bachelorYear,
                                master_institution: profileData.masterInstitution,
                                master_course: profileData.masterCourse,
                                master_year: profileData.masterYear,
                                phd_institution: profileData.phdInstitution,
                                phd_course: profileData.phdCourse,
                                phd_year: profileData.phdYear,
                                has_passport: profileData.hasPassport,
                                passport_number: profileData.passportNumber,
                                passport_issue_date: profileData.passportIssue,
                                passport_expiry_date: profileData.passportExpiry,
                                applied_abroad_before: profileData.appliedAbroadBefore,
                                how_did_you_hear: profileData.howDidYouHear,
                                need_financial_guidance: profileData.needFinancialGuidance,
                                is_profile_completed: true,
                              });

                              if (!profileRes.success) {
                                throw new Error(profileRes.error || "Failed to save profile to database");
                              }

                              // 2. Save Parent / Guardian / Sponsor contact if provided
                              if (profileData.parentFirstName?.trim() || profileData.parentLastName?.trim()) {
                                try {
                                  await saveStudentContact(currentUser.id, {
                                    relationship_type: profileData.parentRelationship || "Father",
                                    first_name: profileData.parentFirstName.trim(),
                                    middle_name: profileData.parentMiddleName?.trim() || undefined,
                                    last_name: profileData.parentLastName.trim(),
                                    phone: profileData.parentPhone?.trim() || "+255",
                                    email: profileData.parentEmail?.trim() || undefined,
                                    is_primary: true,
                                  });
                                } catch (contactErr) {
                                  console.warn("Contact save notice (non-fatal):", contactErr);
                                }
                              }

                              // 3. Save application preferences to public.applications
                              const appRes = await saveApplicationPreference(currentUser.id, {
                                target_country: profileData.preferredCountry,
                                target_intake: profileData.intake,
                                preferred_course: profileData.preferredCourse,
                              });

                              if (!appRes.success) {
                                throw new Error(appRes.error || "Failed to save application preferences");
                              }

                              const updatedDash = await fetchStudentDashboardData(currentUser.id);
                              setDashData(updatedDash);

                              setStage("profile_submitted");
                              setShowTargetDashboard(true);
                              setIsEditingProfile(false);
                              setActiveNav("profile");
                            } catch (err: any) {
                              console.error("Submission error:", err);
                              setProfileSubmitError(err.message || "Database saving failed. Please check connection.");
                            } finally {
                              setSavingProfile(false);
                            }
                          }}
                          className="bg-emerald-600 text-white font-bold px-8 py-3 rounded-xl hover:bg-emerald-700 transition-colors shadow-md text-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                          {savingProfile ? (
                            <span className="flex items-center gap-2">
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              <span>Saving Profile to Database...</span>
                            </span>
                          ) : (
                            <>
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Save &amp; Complete Profile</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                )
              )}

              {/* ── STAGE 2 & 3: PAYMENTS SECTION (ONLY VISIBLE UNDER PAYMENTS TAB) ── */}
              {activeNav === "payments" && (
                <div className="space-y-4">
                  {stage === "payment_pending" && !isReuploadingPayment ? (
                    /* STAGE 3: PAYMENT PENDING FINANCE APPROVAL */
                    <div className="p-7 rounded-2xl bg-white border border-slate-200 shadow-sm shadow-slate-200/60 space-y-4">
                      <div className="flex items-center gap-3 text-amber-600">
                        <Clock className="w-6 h-6 animate-spin shrink-0" />
                        <div>
                          <h3 className="font-bold text-base text-slate-900">Waiting for Finance Approval</h3>
                          {(() => {
                            const rawRef = dashData?.payments?.[0]?.transaction_ref;
                            const displayRef = rawRef && !/^TXN-\d{12,}$/.test(rawRef.trim()) ? rawRef.trim() : "";
                            return (
                              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                Your 50,000 TSH payment {displayRef ? <>receipt (Reference: <span className="font-mono font-bold text-slate-800">{displayRef}</span>)</> : <>receipt</>} has been submitted to Mtishbi Finance Desk. Once approved, your University Application access will unlock automatically.
                              </p>
                            );
                          })()}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200/70 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                            Status: Pending Verification
                          </span>
                          <span className="text-[11px] text-slate-400 font-medium">
                            Under Review by Mtishbi Finance Desk
                          </span>
                        </div>

                        {/* Front / Bottom action area: ONLY View Receipt and Re-upload Receipt */}
                        <div className="flex items-center gap-2">
                          {(dashData?.payments?.[0]?.payment_proof_url || receiptFile) && (
                            <button
                              type="button"
                              onClick={() => {
                                const fileUrl = dashData?.payments?.[0]?.payment_proof_url;
                                const rawRef = dashData?.payments?.[0]?.transaction_ref;
                                const displayRef = rawRef && !/^TXN-\d{12,}$/.test(rawRef.trim()) ? rawRef.trim() : undefined;
                                if (fileUrl) {
                                  handleViewReceipt(fileUrl, displayRef);
                                } else if (receiptFile) {
                                  const localUrl = URL.createObjectURL(receiptFile);
                                  setPreviewReceiptModal({
                                    isOpen: true,
                                    url: localUrl,
                                    title: "Payment Receipt Proof",
                                    isPdf: receiptFile.name.toLowerCase().endsWith(".pdf"),
                                    loading: false,
                                  });
                                }
                              }}
                              className="px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <Eye className="w-4 h-4" />
                              <span>View Receipt</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              const latest = dashData?.payments?.[0];
                              if (latest) {
                                if (latest.payment_method === "Bank Transfer" || latest.payment_method === "BankTransfer") {
                                  setPaymentMethod("BankTransfer");
                                } else {
                                  setPaymentMethod("LipaNamba");
                                }
                                const rawRef = latest.transaction_ref;
                                const cleanRef = rawRef && !/^TXN-\d{12,}$/.test(rawRef.trim()) ? rawRef.trim() : "";
                                setTransactionRef(cleanRef);
                              }
                              setReceiptFile(null);
                              setIsReuploadingPayment(true);
                            }}
                            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Upload className="w-4 h-4" />
                            <span>Re-upload Receipt</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : stage === "payment_approved" || stage === "application_submitted" || stage === "offer_letter_uploaded" || dashData?.hasApprovedPayment ? (
                    /* ALREADY PAID & APPROVED NOTICE */
                    <div className="p-7 rounded-2xl bg-emerald-50 border-2 border-emerald-300 text-emerald-950 shadow-sm space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3.5">
                          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0 shadow-md">
                            <CheckCircle2 className="w-6 h-6" />
                          </div>
                          <div>
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-200 text-emerald-900 text-[10px] font-extrabold uppercase">
                              Payment Verified ✓
                            </span>
                            <h3 className="font-bold text-lg text-slate-900 mt-1">
                              MtishbiScholar Application File Fee (TSh 50,000) Paid &amp; Approved
                            </h3>
                            <p className="text-xs text-slate-600">
                              Your payment has been verified by Mtishbi Finance. You can proceed with your university application.
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {dashData?.payments?.[0]?.payment_proof_url && (
                            <button
                              type="button"
                              onClick={() => {
                                handleViewReceipt(dashData.payments[0].payment_proof_url!, dashData.payments[0].transaction_ref || undefined);
                              }}
                              className="px-4 py-2.5 bg-white hover:bg-emerald-100/50 text-emerald-900 font-bold text-xs rounded-xl border border-emerald-300 transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
                            >
                              <Eye className="w-4 h-4" />
                              <span>View Receipt</span>
                            </button>
                          )}
                          <button
                            onClick={() => setActiveNav("application")}
                            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl transition-all shadow-md shrink-0 flex items-center gap-2 cursor-pointer"
                          >
                            <Building2 className="w-4 h-4" />
                            <span>Go to My Application &rarr;</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* APPLICATION FEE PAYMENT FORM (TWO TOP CARDS SIDE-BY-SIDE + DYNAMIC DETAILS) */
                    <div className="space-y-4">
                      {/* Top Row: Two Cards Side-by-Side */}
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
                        {/* Card 1: Official Fee Banner */}
                        <div className="lg:col-span-7 p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-800 text-white shadow-md border border-blue-500/30 flex flex-col justify-between gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-xs text-white text-[10px] font-extrabold uppercase tracking-wider">
                                Official Fee
                              </span>
                              <span className="px-2.5 py-0.5 rounded-full bg-emerald-400 text-emerald-950 text-[10px] font-extrabold">
                                Application Processing
                              </span>
                            </div>
                            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                              MtishbiScholar Application File Fee — TSh 50,000
                            </h2>
                            <p className="text-xs sm:text-sm text-blue-100 font-medium leading-relaxed">
                              One-time fee to open and activate your application file with MtishbiScholar.
                            </p>
                            <p className="text-[11px] text-blue-200/90 font-normal leading-normal italic">
                              This fee does not cover university application fees or other university-specific charges. Those are separate.
                            </p>
                          </div>

                          <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20">
                            <div>
                              <p className="text-[10px] font-bold text-blue-200 uppercase tracking-wider">Amount Due</p>
                              <p className="text-xl font-black text-white font-mono mt-0.5">TSh 50,000</p>
                            </div>
                            <span className="text-[11px] text-blue-100 font-medium bg-white/10 px-2.5 py-1 rounded-lg">
                              One-time processing fee
                            </span>
                          </div>
                        </div>

                        {/* Card 2: Select Payment Method */}
                        <div className="lg:col-span-5 p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between gap-3">
                          <div className="border-b border-slate-100 pb-2">
                            <h3 className="font-extrabold text-sm sm:text-base text-slate-900">Select Payment Method</h3>
                            <p className="text-xs text-slate-500">Choose your preferred payment method:</p>
                          </div>

                          <div className="space-y-2.5 flex-1 flex flex-col justify-center">
                            {/* Option 1: Mobile Money / Lipa Namba */}
                            <button
                              type="button"
                              onClick={() => setPaymentMethod("LipaNamba")}
                              className={`w-full p-3 rounded-xl border-2 text-left transition-all flex items-center gap-3 cursor-pointer ${
                                paymentMethod === "LipaNamba"
                                  ? "border-emerald-500 bg-emerald-50/80 text-emerald-950 ring-2 ring-emerald-500/20 shadow-2xs"
                                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                              }`}
                            >
                              <div
                                className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold shrink-0 ${
                                  paymentMethod === "LipaNamba"
                                    ? "bg-emerald-600 text-white shadow-xs"
                                    : "bg-slate-100 text-slate-600"
                                }`}
                              >
                                <Smartphone className="w-5 h-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-1.5">
                                  <h4 className="font-extrabold text-xs sm:text-sm text-slate-900">
                                    Mobile Money / Lipa Namba
                                  </h4>
                                  {paymentMethod === "LipaNamba" && (
                                    <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 text-[10px]">
                                      <Check className="w-3 h-3" />
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] font-semibold text-emerald-700 mt-0.5">
                                  M-Pesa &bull; Mixx by Yas &bull; Airtel Money
                                </p>
                              </div>
                            </button>

                            {/* Option 2: Bank Transfer */}
                            <button
                              type="button"
                              onClick={() => setPaymentMethod("BankTransfer")}
                              className={`w-full p-3 rounded-xl border-2 text-left transition-all flex items-center gap-3 cursor-pointer ${
                                paymentMethod === "BankTransfer"
                                  ? "border-blue-600 bg-blue-50/80 text-blue-950 ring-2 ring-blue-500/20 shadow-2xs"
                                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                              }`}
                            >
                              <div
                                className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold shrink-0 ${
                                  paymentMethod === "BankTransfer"
                                    ? "bg-blue-600 text-white shadow-xs"
                                    : "bg-slate-100 text-slate-600"
                                }`}
                              >
                                <Building2 className="w-5 h-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-1.5">
                                  <h4 className="font-extrabold text-xs sm:text-sm text-slate-900">Bank Transfer</h4>
                                  {paymentMethod === "BankTransfer" && (
                                    <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 text-[10px]">
                                      <Check className="w-3 h-3" />
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] font-semibold text-blue-700 mt-0.5">CRDB TZS &bull; CRDB USD</p>
                              </div>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Dynamic Payment Content Card */}
                      <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
                        {/* Mobile Money Details */}
                        {paymentMethod === "LipaNamba" && (
                          <div className="space-y-4 pt-1">
                            <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50/50 to-white text-slate-900 shadow-sm border-2 border-emerald-300 flex flex-col md:flex-row items-center justify-between gap-5">
                              <div className="space-y-3.5 flex-1 w-full min-w-0">
                                <div className="flex items-center justify-between gap-2 border-b border-emerald-200/80 pb-2.5">
                                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider shadow-2xs">
                                    CRDB TIPS / TANQR
                                  </span>
                                  <span className="text-[11px] font-bold text-emerald-800 flex items-center gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                    Instant Confirmation
                                  </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div className="p-3.5 rounded-xl bg-white border-2 border-emerald-200 shadow-2xs">
                                    <p className="text-[10px] uppercase font-extrabold text-slate-500 tracking-wider">Lipa Namba</p>
                                    <div className="flex items-center justify-between gap-2 mt-0.5">
                                      <p className="font-mono text-xl sm:text-2xl font-black text-slate-900 tracking-wider">
                                        114535008
                                      </p>
                                      <button
                                        type="button"
                                        onClick={() => handleCopy("114535008", "lipa")}
                                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-extrabold transition-colors flex items-center gap-1 cursor-pointer shrink-0 shadow-2xs"
                                      >
                                        <Copy className="w-3 h-3" />
                                        <span>{copiedField === "lipa" ? "Copied!" : "Copy"}</span>
                                      </button>
                                    </div>
                                  </div>

                                  <div className="p-3.5 rounded-xl bg-white border-2 border-emerald-200 shadow-2xs">
                                    <p className="text-[10px] uppercase font-extrabold text-slate-500 tracking-wider">Beneficiary Name</p>
                                    <p className="text-xs sm:text-sm font-black text-slate-900 truncate mt-1">
                                      MTISHBI COMPANY LIMITED
                                    </p>
                                    <p className="text-[10px] font-bold text-emerald-700 mt-0.5">Verified Business Merchant</p>
                                  </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-700 bg-white/90 p-2.5 rounded-xl border border-emerald-200">
                                  <span className="font-extrabold text-slate-900">Supported Networks:</span>
                                  <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-md font-bold text-[10px]">Vodacom M-Pesa</span>
                                  <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-md font-bold text-[10px]">Mixx by Yas</span>
                                  <span className="px-2 py-0.5 bg-rose-100 text-rose-700 rounded-md font-bold text-[10px]">Airtel Money</span>
                                </div>
                              </div>

                              <div className="shrink-0 flex flex-col items-center justify-center p-3.5 bg-white rounded-2xl border-2 border-emerald-200 shadow-xs text-center">
                                <div className="w-32 h-32 bg-white rounded-xl flex items-center justify-center p-1 border border-slate-100">
                                  <img
                                    src="/images/lipa_namba_qr.png"
                                    alt="Lipa Namba CRDB TIPS TANQR 114535008"
                                    className="w-full h-full object-contain rounded-lg"
                                  />
                                </div>
                                <p className="text-[11px] font-extrabold text-slate-900 mt-1.5 flex items-center gap-1">
                                  <QrCode className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Scan to Pay</span>
                                </p>
                                <p className="text-[9px] text-slate-500">M-Pesa • Mixx • Airtel App</p>
                              </div>
                            </div>

                            {/* Mobile USSD Instructions */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              {/* 1. M-Pesa */}
                              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2.5 flex flex-col justify-between">
                                <div>
                                  <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                                    <div className="w-7 h-7 rounded-md bg-white border border-slate-200 flex items-center justify-center p-0.5 shrink-0 overflow-hidden">
                                      <img src="/images/mpesa_logo.png" alt="Vodacom M-Pesa" className="w-full h-full object-contain" />
                                    </div>
                                    <div>
                                      <h5 className="font-extrabold text-xs text-slate-900">Vodacom M-Pesa</h5>
                                      <p className="text-[10px] text-slate-500 font-mono">*150*00#</p>
                                    </div>
                                  </div>
                                  <ol className="text-[11px] text-slate-600 space-y-1 mt-2 font-medium">
                                    <li>1. Dial <span className="font-mono font-bold text-slate-900">*150*00#</span></li>
                                    <li>2. Select <span className="font-bold text-slate-900">4 (Lipa kwa M-Pesa)</span></li>
                                    <li>3. Select <span className="font-bold text-slate-900">1 (Lipa kwa Simu / Namba)</span></li>
                                    <li>4. Enter <span className="font-mono font-extrabold text-emerald-800">114535008</span></li>
                                    <li>5. Enter Amount: <span className="font-bold text-slate-900">50,000</span></li>
                                    <li>6. Confirm name: <span className="font-bold text-slate-900">MTISHBI COMPANY LIMITED</span></li>
                                  </ol>
                                </div>
                              </div>

                              {/* 2. Mixx by Yas */}
                              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2.5 flex flex-col justify-between">
                                <div>
                                  <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                                    <div className="w-7 h-7 rounded-md bg-white border border-slate-200 flex items-center justify-center p-0.5 shrink-0 overflow-hidden">
                                      <img src="/images/mixx_logo.png" alt="Mixx by Yas (Tigo / Halopesa)" className="w-full h-full object-contain" />
                                    </div>
                                    <div>
                                      <h5 className="font-extrabold text-xs text-slate-900">Mixx by Yas</h5>
                                      <p className="text-[10px] text-slate-500 font-mono">*150*01# / *150*88#</p>
                                    </div>
                                  </div>
                                  <ol className="text-[11px] text-slate-600 space-y-1 mt-2 font-medium">
                                    <li>1. Dial <span className="font-mono font-bold text-slate-900">*150*01#</span> au <span className="font-mono font-bold text-slate-900">*150*88#</span></li>
                                    <li>2. Select <span className="font-bold text-slate-900">Lipa kwa Simu</span></li>
                                    <li>3. Select <span className="font-bold text-slate-900">Kwenda Mitandao Mingine / CRDB TIPS</span></li>
                                    <li>4. Enter Merchant: <span className="font-mono font-extrabold text-emerald-800">114535008</span></li>
                                    <li>5. Enter Amount: <span className="font-bold text-slate-900">50,000</span></li>
                                    <li>6. Confirm: <span className="font-bold text-slate-900">MTISHBI COMPANY LIMITED</span></li>
                                  </ol>
                                </div>
                              </div>

                              {/* 3. Airtel Money */}
                              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2.5 flex flex-col justify-between">
                                <div>
                                  <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                                    <div className="w-7 h-7 rounded-md bg-white border border-slate-200 flex items-center justify-center p-0.5 shrink-0 overflow-hidden">
                                      <img src="/images/airtel_logo.svg" alt="Airtel Money" className="w-full h-full object-contain" />
                                    </div>
                                    <div>
                                      <h5 className="font-extrabold text-xs text-slate-900">Airtel Money</h5>
                                      <p className="text-[10px] text-slate-500 font-mono">*150*60#</p>
                                    </div>
                                  </div>
                                  <ol className="text-[11px] text-slate-600 space-y-1 mt-2 font-medium">
                                    <li>1. Dial <span className="font-mono font-bold text-slate-900">*150*60#</span></li>
                                    <li>2. Select <span className="font-bold text-slate-900">5 (Lipa kwa Simu / Merchant)</span></li>
                                    <li>3. Select <span className="font-bold text-slate-900">Kwenda CRDB TIPS / Mitandao Mingine</span></li>
                                    <li>4. Enter Merchant: <span className="font-mono font-extrabold text-emerald-800">114535008</span></li>
                                    <li>5. Enter Amount: <span className="font-bold text-slate-900">50,000</span></li>
                                    <li>6. Confirm: <span className="font-bold text-slate-900">MTISHBI COMPANY LIMITED</span></li>
                                  </ol>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Bank Transfer Details */}
                        {paymentMethod === "BankTransfer" && (
                          <div className="space-y-4 pt-1">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* CRDB TZS */}
                              <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50/40 to-white text-slate-900 shadow-sm border-2 border-emerald-300 space-y-3">
                                <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
                                  <div>
                                    <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-black uppercase">
                                      TZS Account
                                    </span>
                                    <h4 className="font-extrabold text-sm text-slate-900 mt-1">CRDB Bank &bull; Tanzanian Shillings</h4>
                                  </div>
                                  <Building2 className="w-5 h-5 text-emerald-700" />
                                </div>
                                <div className="space-y-2 text-xs">
                                  <div>
                                    <span className="text-[10px] uppercase font-bold text-slate-500">Account Number:</span>
                                    <div className="flex items-center justify-between gap-2 mt-0.5">
                                      <p className="font-mono text-lg font-black text-slate-900">10458426886</p>
                                      <button
                                        type="button"
                                        onClick={() => handleCopy("10458426886", "crdb_tzs")}
                                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-extrabold transition-colors flex items-center gap-1 cursor-pointer"
                                      >
                                        <Copy className="w-3 h-3" />
                                        <span>{copiedField === "crdb_tzs" ? "Copied!" : "Copy"}</span>
                                      </button>
                                    </div>
                                  </div>
                                  <div>
                                    <span className="text-[10px] uppercase font-bold text-slate-500">Account Name:</span>
                                    <p className="font-black text-slate-900">MTISHBI COMPANY LIMITED</p>
                                  </div>
                                  <div>
                                    <span className="text-[10px] uppercase font-bold text-slate-500">Amount Due:</span>
                                    <p className="font-black text-emerald-800 text-sm">TSh 50,000</p>
                                  </div>
                                </div>
                              </div>

                              {/* CRDB USD */}
                              <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-50 via-indigo-50/40 to-white text-slate-900 shadow-sm border-2 border-blue-300 space-y-3">
                                <div className="flex items-center justify-between border-b border-blue-200 pb-2">
                                  <div>
                                    <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-black uppercase">
                                      USD Account
                                    </span>
                                    <h4 className="font-extrabold text-sm text-slate-900 mt-1">CRDB Bank &bull; US Dollars</h4>
                                  </div>
                                  <Building2 className="w-5 h-5 text-blue-700" />
                                </div>
                                <div className="space-y-2 text-xs">
                                  <div>
                                    <span className="text-[10px] uppercase font-bold text-slate-500">Account Number:</span>
                                    <div className="flex items-center justify-between gap-2 mt-0.5">
                                      <p className="font-mono text-lg font-black text-slate-900">10458961889</p>
                                      <button
                                        type="button"
                                        onClick={() => handleCopy("10458961889", "crdb_usd")}
                                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-extrabold transition-colors flex items-center gap-1 cursor-pointer"
                                      >
                                        <Copy className="w-3 h-3" />
                                        <span>{copiedField === "crdb_usd" ? "Copied!" : "Copy"}</span>
                                      </button>
                                    </div>
                                  </div>
                                  <div>
                                    <span className="text-[10px] uppercase font-bold text-slate-500">Account Name:</span>
                                    <p className="font-black text-slate-900">MTISHBI COMPANY LIMITED</p>
                                  </div>
                                  <div>
                                    <span className="text-[10px] uppercase font-bold text-slate-500">Swift Code:</span>
                                    <p className="font-mono font-bold text-slate-900">CORUTZTZ</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Universal Safety Note */}
                        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
                          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <p className="leading-relaxed">
                            <span className="font-extrabold">Important:</span> Always verify that the recipient name displays <span className="font-bold text-slate-900">MTISHBI COMPANY LIMITED</span> before confirming payment.
                          </p>
                        </div>
                      </div>

                      {/* Payment Proof Submission Card */}
                      <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                          <div>
                            <h3 className="font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                              <Upload className="w-4 h-4 text-blue-600" />
                              <span>Provide Payment Proof</span>
                              <span className="text-red-500 font-bold">*</span>
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Please provide at least one payment proof: enter your transaction reference number or upload your payment receipt / screenshot.
                            </p>
                          </div>
                          <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-extrabold uppercase shrink-0">
                            At least 1 proof required
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* 1. Transaction Reference */}
                          <div className="space-y-1.5">
                            <label className="font-bold text-xs text-slate-700 block">
                              Transaction Reference Number
                            </label>
                            <input
                              type="text"
                              value={transactionRef}
                              onChange={(e) => setTransactionRef(e.target.value)}
                              placeholder="e.g. 987654321 or CRDB-TXN-123"
                              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                            />
                            <p className="text-[11px] text-slate-400">Found in your M-Pesa, Mixx by Yas, Airtel Money SMS or bank confirmation.</p>
                          </div>

                          {/* 2. Upload Receipt */}
                          <div className="space-y-1.5">
                            <label className="font-bold text-xs text-slate-700 block">
                              Upload Payment Receipt / Screenshot
                            </label>
                            <div className="flex items-center gap-3">
                              <label className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl cursor-pointer transition-colors shadow-xs">
                                Choose File
                                <input
                                  type="file"
                                  accept="image/*,.pdf"
                                  className="hidden"
                                  onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                      setReceiptFile(e.target.files[0]);
                                    }
                                  }}
                                />
                              </label>
                              <span className="text-xs text-slate-500 truncate">
                                {receiptFile ? receiptFile.name : "No file chosen"}
                              </span>
                            </div>
                            {receiptFile && (
                              <p className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Attached: {receiptFile.name}</span>
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <button
                            type="button"
                            disabled={submittingPayment}
                            onClick={async () => {
                              const existingUnapprovedPayment = dashData?.payments?.[0];
                              const hasExistingReceipt = Boolean(existingUnapprovedPayment?.payment_proof_url);
                              const hasEnteredRef = Boolean(transactionRef.trim());
                              const hasNewReceipt = Boolean(receiptFile);

                              // Strict validation: At least one proof (reference or receipt file) is required
                              if (!hasEnteredRef && !hasNewReceipt && !hasExistingReceipt) {
                                alert("Please provide at least one payment proof: enter your transaction reference number or upload your payment receipt.");
                                return;
                              }

                              try {
                                setSubmittingPayment(true);
                                const studentId = currentUser?.id || "00000000-0000-0000-0000-000000000000";
                                let uploadedFileUrl: string | undefined = undefined;

                                if (receiptFile && currentUser?.id) {
                                  const docRes = await uploadStudentDocument(currentUser.id, receiptFile, "Payment_Receipt");
                                  if (docRes.success && docRes.fileUrl) {
                                    uploadedFileUrl = docRes.fileUrl;
                                  }
                                } else if (hasExistingReceipt && !receiptFile) {
                                  uploadedFileUrl = existingUnapprovedPayment?.payment_proof_url || undefined;
                                }

                                const payMethod = paymentMethod === "LipaNamba" ? "Mobile Money" : "Bank Transfer";
                                const txnRef = hasEnteredRef ? transactionRef.trim() : null;

                                let payRes;
                                if (existingUnapprovedPayment?.id && !dashData?.hasApprovedPayment) {
                                  payRes = await updateOrResubmitPaymentProof({
                                    payment_id: existingUnapprovedPayment.id,
                                    student_id: studentId,
                                    payment_method: payMethod,
                                    transaction_ref: txnRef,
                                    file: receiptFile,
                                  });
                                } else {
                                  payRes = await submitPaymentToSupabase({
                                    student_id: studentId,
                                    amount: 50000,
                                    currency: "TZS",
                                    payment_method: payMethod,
                                    transaction_ref: txnRef,
                                    payment_proof_url: uploadedFileUrl,
                                  });
                                }

                                if (!payRes.success) {
                                  alert(`Payment notice: ${payRes.error || "Payment submission failed."}`);
                                  return;
                                }

                                if (currentUser?.id) {
                                  const liveData = await fetchStudentDashboardData(currentUser.id);
                                  setDashData(liveData);
                                }

                                setIsReuploadingPayment(false);
                                setStage("payment_pending");
                              } catch (err: any) {
                                console.error("Payment submit error:", err);
                                alert(`Payment submission error: ${err.message || "Failed to process payment."}`);
                              } finally {
                                setSubmittingPayment(false);
                              }
                            }}
                            className="w-full sm:w-auto px-7 py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 cursor-pointer disabled:opacity-50"
                          >
                            {submittingPayment ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                <span>Submitting Payment...</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Submit Payment Receipt for Approval &rarr;</span>
                              </>
                            )}
                          </button>

                          {isReuploadingPayment && (
                            <button
                              type="button"
                              onClick={() => setIsReuploadingPayment(false)}
                              className="w-full sm:w-auto px-5 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-100 transition-colors text-xs sm:text-sm cursor-pointer"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── MY APPLICATION SECTION (MULTI-UNIVERSITY APPLICATIONS) ── */}
              {activeNav === "application" && (
                !hasApprovedPayment ? (
                  <div className="p-8 sm:p-12 rounded-3xl bg-white border border-slate-200 shadow-xs text-center space-y-4 max-w-xl mx-auto my-12">
                    <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
                      <Lock className="w-8 h-8" />
                    </div>
                    <div className="space-y-1.5">
                      <h3 className="text-xl font-black text-slate-900 tracking-tight">Application Center Locked</h3>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                        Your TSh 50,000 MtishbiScholar Application File Opening Fee must be approved by a Finance Officer before you can access university applications.
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveNav("payments")}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs sm:text-sm rounded-xl transition-all shadow-md shadow-blue-600/25 inline-flex items-center gap-2 cursor-pointer mt-2"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Go to Payments &rarr;</span>
                    </button>
                  </div>
                ) : (
                <div className="space-y-6">

                  {/* A. Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-extrabold uppercase tracking-wider">
                          Application Center
                        </span>
                        {dashData?.hasApprovedPayment && (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            File Active
                          </span>
                        )}
                      </div>
                      <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
                        MY APPLICATION
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                        Manage and track your university applications through MtishbiScholar.
                      </p>
                    </div>

                    <button
                      onClick={handleOpenNewAppModal}
                      className="px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs sm:text-sm rounded-xl transition-all shadow-md shadow-blue-600/25 flex items-center justify-center gap-2 cursor-pointer shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      <span>+ Start New University Application</span>
                    </button>
                  </div>

                  {/* B. APPLICATION FILE SUMMARY CARD */}
                  <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wide">
                            Application File
                          </h3>
                          <p className="text-xs text-slate-500 font-mono">
                            {dashData?.profile?.id
                              ? `FILE-${dashData.profile.id.slice(0, 8).toUpperCase()}`
                              : "FILE-00000000"}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`px-3 py-1 rounded-full text-xs font-extrabold flex items-center gap-1.5 self-start sm:self-auto ${
                          dashData?.hasApprovedPayment
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            : dashData?.payments?.some((p) => (p.status || "").toLowerCase() === "submitted" || (p.status || "").toLowerCase() === "under review")
                            ? "bg-amber-100 text-amber-800 border border-amber-200"
                            : "bg-slate-100 text-slate-700 border border-slate-200"
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            dashData?.hasApprovedPayment
                              ? "bg-emerald-500"
                              : dashData?.payments?.some((p) => (p.status || "").toLowerCase() === "submitted" || (p.status || "").toLowerCase() === "under review")
                              ? "bg-amber-500 animate-pulse"
                              : "bg-slate-400"
                          }`}
                        />
                        <span>{dashData?.hasApprovedPayment ? "File Active" : "Pending Verification"}</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                        <p className="text-[10px] text-slate-400 uppercase font-bold">File Opened</p>
                        <p className="text-xs font-extrabold text-slate-800 mt-0.5">
                          {dashData?.profile?.created_at
                            ? new Date(dashData.profile.created_at).toLocaleDateString("en-GB", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })
                            : "Recent"}
                        </p>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                        <p className="text-[10px] text-slate-400 uppercase font-bold">University Applications</p>
                        <p className="text-xs font-extrabold text-blue-600 mt-0.5">
                          {officialApps.length} {officialApps.length === 1 ? "Application" : "Applications"}
                        </p>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                        <p className="text-[10px] text-slate-400 uppercase font-bold">Applicant Name</p>
                        <p className="text-xs font-extrabold text-slate-800 mt-0.5 truncate">
                          {studentFullName}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* C. UNIVERSITY APPLICATIONS SECTION */}
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                      <div>
                        <h3 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                          UNIVERSITY APPLICATIONS
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Your university applications are managed separately. You can apply to more than one university through our course catalogue.
                        </p>
                      </div>
                      <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full shrink-0">
                        {officialApps.length} {officialApps.length === 1 ? "Application" : "Applications"} Total
                      </span>
                    </div>

                    {/* Applications List */}
                    {officialApps.length === 0 ? (
                      /* Empty State */
                      <div className="p-10 rounded-2xl bg-white border border-slate-200 shadow-xs text-center space-y-4 max-w-lg mx-auto my-6">
                        <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-inner">
                          <BookOpen className="w-8 h-8" />
                        </div>
                        <div className="space-y-1.5">
                          <h4 className="font-extrabold text-base text-slate-900">
                            No university applications yet.
                          </h4>
                          <p className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto">
                            Start by searching for the course or program you wish to study. You will see all partner universities offering it.
                          </p>
                        </div>
                        <button
                          onClick={handleOpenNewAppModal}
                          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl transition-all shadow-md shadow-blue-600/25 inline-flex items-center gap-2 cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                          <span>+ Start New University Application</span>
                        </button>
                      </div>
                    ) : (
                      /* Cards Grid for all official university applications and course requests */
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {officialApps.map((app, idx) => {
                          const isUnlisted = isUnlistedCourseRequest(app);
                          const statusLower = (app.status || "").toLowerCase();
                          const isDraft = statusLower === "profile completed" || statusLower === "draft";
                          const isOffer = statusLower.includes("offer");
                          const isVisa = statusLower.includes("visa");
                          const isReview = statusLower.includes("review");
                          const isSubmitted = statusLower.includes("submitted");
                          const isRejected = statusLower.includes("rejected");

                          const badgeColor = isVisa || isOffer
                            ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                            : isReview
                            ? "bg-amber-100 text-amber-800 border-amber-200"
                            : isRejected
                            ? "bg-red-100 text-red-800 border-red-200"
                            : isDraft
                            ? "bg-slate-100 text-slate-700 border-slate-200"
                            : "bg-blue-100 text-blue-800 border-blue-200";

                          if (isUnlisted) {
                            return (
                              <div
                                key={app.id || idx}
                                className={`p-5 rounded-2xl bg-white border shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 ${
                                  isSubmitted
                                    ? "border-blue-200 hover:border-blue-300"
                                    : isOffer || isVisa
                                    ? "border-emerald-200 hover:border-emerald-300"
                                    : isRejected
                                    ? "border-red-200 hover:border-red-300"
                                    : "border-slate-200 hover:border-amber-400"
                                }`}
                              >
                                <div className="space-y-3">
                                  {/* Top card info */}
                                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                                    <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                                      Application #{idx + 1}
                                    </span>
                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${badgeColor}`}>
                                      {getApplicationStatusDisplay(app.status)}
                                    </span>
                                  </div>

                                  {/* Program Name & Destination */}
                                  <div>
                                    <h4 className="text-base font-extrabold text-slate-900">
                                      {app.preferred_course || "Requested Program"}
                                    </h4>
                                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                      <span>🌍</span>
                                      <span>{app.target_country || "International"}</span>
                                      <span>&bull;</span>
                                      <span>{app.target_intake || "Upcoming Intake"}</span>
                                    </p>
                                  </div>

                                  {/* Program Box */}
                                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1 text-xs">
                                    <span className="text-[10px] text-slate-400 font-bold uppercase">Program</span>
                                    <p className="font-bold text-slate-800 truncate">
                                      {app.preferred_course}
                                    </p>
                                  </div>

                                  {/* Status & Message */}
                                  {isSubmitted ? (
                                    <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-200/70 space-y-1 text-xs">
                                      <div className="flex items-center gap-1.5 font-bold text-blue-900">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                        <span>Submitted to University</span>
                                      </div>
                                      <p className="text-[11px] text-blue-800 leading-relaxed">
                                        Your application for {app.preferred_course} has been approved by the Admission Officer and forwarded to partner universities.
                                      </p>
                                    </div>
                                  ) : isOffer ? (
                                    <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200/70 space-y-1 text-xs">
                                      <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                                        <Award className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                        <span>Offer Letter Ready</span>
                                      </div>
                                      <p className="text-[11px] text-emerald-800 leading-relaxed">
                                        Congratulations! Your admission offer letter is ready.
                                      </p>
                                    </div>
                                  ) : isRejected ? (
                                    <div className="p-3 rounded-xl bg-red-50/80 border border-red-200/70 space-y-1 text-xs">
                                      <div className="flex items-center gap-1.5 font-bold text-red-900">
                                        <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                                        <span>Application Rejected</span>
                                      </div>
                                      <p className="text-[11px] text-red-800 leading-relaxed">
                                        This application could not proceed. Please contact your Admission Officer for guidance.
                                      </p>
                                    </div>
                                  ) : (
                                    <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/70 space-y-1 text-xs">
                                      <div className="flex items-center gap-1.5 font-bold text-amber-900">
                                        <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                        <span>Course request under review</span>
                                      </div>
                                      <p className="text-[11px] text-amber-800 leading-relaxed">
                                        Our Admission Officer is searching for suitable partner universities offering this program.
                                      </p>
                                    </div>
                                  )}

                                  {/* Metadata: ID & Date */}
                                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-1">
                                    <span>ID: {app.id ? app.id.slice(0, 8).toUpperCase() : "N/A"}</span>
                                    <span>
                                      {app.created_at
                                        ? new Date(app.created_at).toLocaleDateString("en-GB", {
                                            day: "numeric",
                                            month: "short",
                                            year: "numeric",
                                          })
                                        : "Recently"}
                                    </span>
                                  </div>
                                </div>

                                {/* Card Actions */}
                                <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                                  <button
                                    onClick={() => setSelectedAppDetail(app)}
                                    className="flex-1 py-2.5 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>View Details</span>
                                  </button>
                                  <button
                                    onClick={() => setAppToWithdraw(app)}
                                    className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                                    title="Withdraw and delete this application"
                                  >
                                    Withdraw
                                  </button>
                                </div>
                              </div>
                            );
                          }

                          return (
                            <div
                              key={app.id || idx}
                              className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                            >
                              <div className="space-y-3">
                                {/* Top card info */}
                                <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                                  <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                                    Application #{idx + 1}
                                  </span>
                                  <span
                                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${badgeColor}`}
                                  >
                                    {getApplicationStatusDisplay(app.status)}
                                  </span>
                                </div>

                                {/* University Name & Country */}
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-base font-bold text-slate-900">
                                      {app.universities?.name || "Partner University"}
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                    <span>{app.universities?.flag || "🌍"}</span>
                                    <span>{app.universities?.country || app.target_country || "International"}</span>
                                    {app.universities?.city && <span>&bull; {app.universities.city}</span>}
                                  </p>
                                </div>

                                {/* Course & Intake */}
                                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1 text-xs">
                                  <div>
                                    <span className="text-[10px] text-slate-400 font-bold uppercase">Program</span>
                                    <p className="font-bold text-slate-800 truncate">
                                      {app.courses?.title || app.preferred_course || "Degree Program"}
                                    </p>
                                  </div>
                                  <div className="flex justify-between pt-1 border-t border-slate-200/60">
                                    <span className="text-[10px] text-slate-500">Intake</span>
                                    <span className="font-semibold text-slate-700">
                                      {app.target_intake || app.courses?.intake_months || "September 2026"}
                                    </span>
                                  </div>
                                </div>

                                {/* Metadata: ID & Date */}
                                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-1">
                                  <span>ID: {app.id ? app.id.slice(0, 8).toUpperCase() : "N/A"}</span>
                                  <span>
                                    {app.created_at
                                      ? new Date(app.created_at).toLocaleDateString("en-GB", {
                                          day: "numeric",
                                          month: "short",
                                          year: "numeric",
                                        })
                                      : "Recently"}
                                  </span>
                                </div>
                              </div>

                              {/* Card Actions */}
                              <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                                <button
                                  onClick={() => setSelectedAppDetail(app)}
                                  className="flex-1 py-2.5 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>View Details</span>
                                </button>

                                {/* INDIVIDUAL DELETE / WITHDRAW ACTIONS (Allowed for Profile Completed, Under Review, Submitted to University) */}
                                {isApplicationDeletable(app.status) && (
                                  <button
                                    onClick={() => setAppToWithdraw(app)}
                                    className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                                    title="Withdraw and delete this application"
                                  >
                                    Withdraw
                                  </button>
                                )}

                                {(isOffer || app.offer_letter_url) && (
                                  <a
                                    href={app.offer_letter_url || "#"}
                                    onClick={(e) => {
                                      if (!app.offer_letter_url) {
                                        e.preventDefault();
                                        alert("Downloading Official Admission Offer Letter PDF...");
                                      }
                                    }}
                                    className="p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-colors"
                                    title="Download Offer Letter"
                                  >
                                    <Download className="w-4 h-4" />
                                  </a>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* ── VIEW APPLICATION DETAIL MODAL ── */}
                  {selectedAppDetail && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
                      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Modal Header */}
                        <div className="px-6 py-5 bg-gradient-to-r from-blue-700 to-indigo-800 text-white flex items-center justify-between">
                          <div className="space-y-0.5">
                            <span className="text-[10px] font-extrabold uppercase bg-white/20 px-2 py-0.5 rounded-full text-white">
                              {isUnlistedCourseRequest(selectedAppDetail) ? "Unlisted Course Request" : "Application Details"}
                            </span>
                            <h3 className="text-lg font-bold">
                              {selectedAppDetail.universities?.name || selectedAppDetail.preferred_course || "University Application"}
                            </h3>
                            <p className="text-xs text-blue-100">
                              {selectedAppDetail.universities?.country || selectedAppDetail.target_country || "International"} &bull; ID: {selectedAppDetail.id.slice(0, 8).toUpperCase()}
                            </p>
                          </div>
                          <button
                            onClick={() => setSelectedAppDetail(null)}
                            className="p-2 rounded-full hover:bg-white/20 text-white transition-colors"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 space-y-6 overflow-y-auto">

                          {/* 1. Status & Progress */}
                          {isUnlistedCourseRequest(selectedAppDetail) && ((selectedAppDetail.status || "").toLowerCase() === "profile completed" || (selectedAppDetail.status || "").toLowerCase() === "under review" || !selectedAppDetail.status) ? (
                            <div className="p-4.5 rounded-2xl bg-amber-50 border border-amber-200 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="font-extrabold text-xs text-amber-950 flex items-center gap-1.5">
                                  <Clock className="w-4 h-4 text-amber-600" />
                                  <span>Course Request Under Review</span>
                                </span>
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-200 text-amber-900">
                                  Under Review
                                </span>
                              </div>
                              <p className="text-xs text-amber-800 leading-relaxed">
                                Our Admission Officer is searching across our international partner university network for accredited institutions offering this program. Once matched, this request will automatically update with full university admission specifications.
                              </p>
                            </div>
                          ) : (
                            <div className="p-4.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-700">Application Lifecycle Status</span>
                                <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-blue-100 text-blue-800 border border-blue-200">
                                  {getApplicationStatusDisplay(selectedAppDetail.status)}
                                </span>
                              </div>

                              {/* Progress Stepper for this specific application */}
                              <div className="pt-2">
                                <div className="grid grid-cols-6 gap-1 text-center">
                                  {[
                                    { label: "Created", done: true },
                                    { label: "Docs Ready", done: true },
                                    { label: "Submitted", done: !((selectedAppDetail.status || "").toLowerCase().includes("profile completed")) },
                                    { label: "Review", done: ["under review", "university offer issued", "visa approved"].some(s => (selectedAppDetail.status || "").toLowerCase().includes(s)) },
                                    { label: "Offer", done: ["university offer issued", "visa approved"].some(s => (selectedAppDetail.status || "").toLowerCase().includes(s)) },
                                    { label: "Visa", done: (selectedAppDetail.status || "").toLowerCase().includes("visa") },
                                  ].map((st, i) => (
                                    <div key={i} className="flex flex-col items-center gap-1">
                                      <div
                                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                          st.done
                                            ? "bg-emerald-500 text-white"
                                            : "bg-slate-200 text-slate-500"
                                        }`}
                                      >
                                        {st.done ? "✓" : i + 1}
                                      </div>
                                      <span className="text-[9px] font-medium text-slate-600 truncate max-w-full">
                                        {st.label}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Protected stage message if not deletable */}
                          {!isApplicationDeletable(selectedAppDetail.status) && (
                            <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 space-y-1">
                              <p className="font-bold flex items-center gap-1.5 text-blue-950">
                                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                                <span>Official Admission Stage</span>
                              </p>
                              <p className="text-[11px] text-blue-800 leading-relaxed">
                                This application has reached an official admission stage and cannot be deleted. Please contact your Admission Officer for assistance.
                              </p>
                            </div>
                          )}

                          {/* 2. Application Specifications Grid */}
                          <div className="grid grid-cols-2 gap-4 text-xs">
                            <div className="p-3.5 rounded-xl border border-slate-200 space-y-1">
                              <span className="text-[10px] text-slate-400 font-bold uppercase">Program</span>
                              <p className="font-bold text-slate-800">
                                {selectedAppDetail.courses?.title || selectedAppDetail.preferred_course || "Degree Program"}
                              </p>
                              {selectedAppDetail.courses?.level && (
                                <span className="inline-block text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded font-semibold mt-1">
                                  {selectedAppDetail.courses.level}
                                </span>
                              )}
                            </div>

                            <div className="p-3.5 rounded-xl border border-slate-200 space-y-1">
                              <span className="text-[10px] text-slate-400 font-bold uppercase">Target Intake</span>
                              <p className="font-bold text-slate-800">
                                {selectedAppDetail.target_intake || selectedAppDetail.courses?.intake_months || "September 2026"}
                              </p>
                            </div>

                            <div className="p-3.5 rounded-xl border border-slate-200 space-y-1">
                              <span className="text-[10px] text-slate-400 font-bold uppercase">Destination</span>
                              <p className="font-bold text-slate-800">
                                {selectedAppDetail.universities?.country || selectedAppDetail.target_country || "International"}
                              </p>
                            </div>

                            <div className="p-3.5 rounded-xl border border-slate-200 space-y-1">
                              <span className="text-[10px] text-slate-400 font-bold uppercase">Date Created</span>
                              <p className="font-bold text-slate-800">
                                {selectedAppDetail.created_at
                                  ? new Date(selectedAppDetail.created_at).toLocaleDateString("en-GB", {
                                      day: "numeric",
                                      month: "long",
                                      year: "numeric",
                                    })
                                  : "Recently"}
                              </p>
                            </div>
                          </div>

                          {/* Notes if any */}
                          {selectedAppDetail.notes && (
                            <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900 space-y-1">
                              <p className="font-bold flex items-center gap-1">
                                <Info className="w-3.5 h-3.5 text-amber-600" />
                                <span>Application Notes &amp; Requests:</span>
                              </p>
                              <p className="text-[11px] text-amber-800 leading-relaxed whitespace-pre-wrap">
                                {selectedAppDetail.notes}
                              </p>
                            </div>
                          )}

                          {/* 3. Attached Documents Library */}
                          <div className="space-y-2">
                            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                              Attached Student Documents
                            </h4>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              {[
                                { name: "Form 4 Certificate", type: "Form4_Cert" },
                                { name: "Form 6 Certificate", type: "Form6_Cert" },
                                { name: "Academic Transcript", type: "Transcript" },
                                { name: "Passport Document", type: "Passport" },
                              ].map((d) => {
                                const doc = studentDocs.find((x) => x.document_type === d.type);
                                return (
                                  <div
                                    key={d.type}
                                    className="p-3 rounded-xl border border-slate-200 flex items-center justify-between"
                                  >
                                    <div>
                                      <p className="font-bold text-slate-800">{d.name}</p>
                                      <span
                                        className={`text-[10px] font-semibold ${
                                          doc ? "text-emerald-600" : "text-slate-400"
                                        }`}
                                      >
                                        {doc ? "✓ On File" : "Not Provided"}
                                      </span>
                                    </div>
                                    {doc && (
                                      <button
                                        onClick={() => handleViewDocument(doc.file_url, d.type)}
                                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] rounded-lg cursor-pointer"
                                      >
                                        View
                                      </button>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
                          <button
                            onClick={() => setSelectedAppDetail(null)}
                            className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl cursor-pointer"
                          >
                            Close
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── COURSE-FIRST NEW UNIVERSITY APPLICATION MODAL (4-STEP PROGRESSIVE FLOW) ── */}
                  {showNewAppModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
                      <div className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">

                        {/* Modal Header */}
                        <div className="px-6 py-5 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-800 text-white flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-extrabold uppercase bg-white/20 px-2.5 py-0.5 rounded-full text-white">
                                Step {newAppStep} of 4
                              </span>
                              <span className="text-xs text-blue-200 font-semibold">Course-First Selection</span>
                            </div>
                            <h3 className="text-lg font-bold mt-1">
                              {newAppStep === 1 && "Step 1: Select Your Course / Program"}
                              {newAppStep === 2 && `Step 2: Universities Offering "${selectedCourseTitle}"`}
                              {newAppStep === 3 && "Step 3: Select Target Intake & Options"}
                              {newAppStep === 4 && "Step 4: Review & Submit Application"}
                            </h3>
                          </div>
                          <button
                            onClick={() => {
                              setShowNewAppModal(false);
                              setIsRequestingUnlistedCourse(false);
                            }}
                            className="p-2 rounded-full hover:bg-white/20 text-white transition-colors"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-6 overflow-y-auto flex-1">

                          {/* UNLISTED COURSE REQUEST VIEW */}
                          {isRequestingUnlistedCourse ? (
                            <div className="space-y-4">
                              <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl space-y-1">
                                <h4 className="font-extrabold text-sm text-blue-950 flex items-center gap-2">
                                  <Sparkles className="w-4 h-4 text-blue-600" />
                                  <span>Request an Unlisted Course or Program</span>
                                </h4>
                                <p className="text-xs text-blue-800 leading-relaxed">
                                  Our Admission Officers will search across all accredited international university partners to find suitable matches and scholarship opportunities for you.
                                </p>
                              </div>

                              <div className="space-y-3 text-xs">
                                <div>
                                  <label className="block font-bold text-slate-700 mb-1">
                                    COURSE / PROGRAM NAME <span className="text-red-500">*</span>
                                  </label>
                                  <input
                                    type="text"
                                    required
                                    value={unlistedCourseName}
                                    onChange={(e) => setUnlistedCourseName(e.target.value)}
                                    placeholder="e.g. BSc Aerospace Engineering, MSc Data Science, B.Pharm..."
                                    className="w-full p-3 rounded-xl border border-slate-300 text-slate-800 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                                  />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div>
                                    <label className="block font-bold text-slate-700 mb-1">PREFERRED COUNTRY</label>
                                    <select
                                      value={unlistedTargetCountry}
                                      onChange={(e) => setUnlistedTargetCountry(e.target.value)}
                                      className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white"
                                    >
                                      {step3AvailableCountries.map((c) => (
                                        <option key={c} value={c}>
                                          {c}
                                        </option>
                                      ))}
                                      <option value="Any Country">Any Suitable Country</option>
                                    </select>
                                  </div>

                                  <div>
                                    <label className="block font-bold text-slate-700 mb-1">TARGET INTAKE</label>
                                    <select
                                      value={unlistedTargetIntake}
                                      onChange={(e) => setUnlistedTargetIntake(e.target.value)}
                                      className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white"
                                    >
                                      <option value="September 2026">September 2026</option>
                                      <option value="January 2027">January 2027</option>
                                      <option value="March 2027">March 2027</option>
                                      <option value="July 2027">July 2027</option>
                                    </select>
                                  </div>
                                </div>

                                <div>
                                  <label className="block font-bold text-slate-700 mb-1">
                                    ADDITIONAL NOTES OR PREFERENCES (OPTIONAL)
                                  </label>
                                  <textarea
                                    rows={3}
                                    value={unlistedNotes}
                                    onChange={(e) => setUnlistedNotes(e.target.value)}
                                    placeholder="Add any specific university preferences, budget constraints, or questions for your Admission Officer..."
                                    className="w-full p-3 rounded-xl border border-slate-300 text-slate-800 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                                  />
                                </div>
                              </div>

                              <div className="pt-3 flex justify-between items-center">
                                <button
                                  type="button"
                                  onClick={() => setIsRequestingUnlistedCourse(false)}
                                  className="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
                                >
                                  &larr; Back to Catalogue
                                </button>
                                <button
                                  type="button"
                                  disabled={submittingUnlisted || !unlistedCourseName.trim()}
                                  onClick={handleSubmitUnlistedCourseRequest}
                                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                                >
                                  {submittingUnlisted ? (
                                    <>
                                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                      <span>Submitting Request...</span>
                                    </>
                                  ) : (
                                    <>
                                      <Send className="w-3.5 h-3.5" />
                                      <span>Submit Course Request &rarr;</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              {/* STEP 1: SELECT YOUR COURSE */}
                              {newAppStep === 1 && (
                                <div className="space-y-4">
                                  {/* Search & Filter Pills */}
                                  <div className="space-y-3">
                                    <div className="relative">
                                      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                                      <input
                                        type="text"
                                        placeholder="Search program (e.g. Computer Science, Nursing, BBA, Pharmacy, Engineering)..."
                                        value={courseSearchTerm}
                                        onChange={(e) => setCourseSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                                      />
                                    </div>

                                    {/* Level Tabs */}
                                    <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs scrollbar-hide">
                                      {["All", "Bachelor", "Master", "Diploma", "PhD"].map((lvl) => (
                                        <button
                                          key={lvl}
                                          type="button"
                                          onClick={() => setCourseLevelFilter(lvl)}
                                          className={`px-3 py-1.5 rounded-full font-bold transition-all shrink-0 cursor-pointer ${
                                            courseLevelFilter === lvl
                                              ? "bg-blue-600 text-white shadow-xs"
                                              : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                                          }`}
                                        >
                                          {lvl === "All" ? "All Levels" : `${lvl}'s`}
                                        </button>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Catalogue List of Distinct Courses */}
                                  {loadingCatalogueCourses ? (
                                    <div className="text-center py-12 space-y-2">
                                      <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                                      <p className="text-xs text-slate-500">Loading university course catalogue...</p>
                                    </div>
                                  ) : (() => {
                                    // Derive filtered distinct course titles
                                    const searchLower = courseSearchTerm.toLowerCase().trim();
                                    const filteredOfferings = allCatalogueCourses.filter((c) => {
                                      const matchSearch =
                                        !searchLower ||
                                        c.title.toLowerCase().includes(searchLower) ||
                                        (c.level || "").toLowerCase().includes(searchLower) ||
                                        (c.universities?.name || "").toLowerCase().includes(searchLower) ||
                                        (c.universities?.country || "").toLowerCase().includes(searchLower);

                                      const matchLevel =
                                        courseLevelFilter === "All" ||
                                        (c.level || "").toLowerCase().includes(courseLevelFilter.toLowerCase());

                                      return matchSearch && matchLevel;
                                    });

                                    // Group by title
                                    const grouped = new Map<string, DbCourse[]>();
                                    filteredOfferings.forEach((c) => {
                                      const existing = grouped.get(c.title) || [];
                                      existing.push(c);
                                      grouped.set(c.title, existing);
                                    });

                                    const distinctTitles = Array.from(grouped.keys());

                                    if (distinctTitles.length === 0) {
                                      return (
                                        /* COURSE NOT FOUND EMPTY STATE */
                                        <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-2xl space-y-3 my-2">
                                          <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto">
                                            <Compass className="w-6 h-6" />
                                          </div>
                                          <h4 className="font-extrabold text-slate-900 text-sm">
                                            Course not currently listed
                                          </h4>
                                          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                                            We couldn&apos;t find this course in our current university catalogue. You can request it and our Admission Officer will review available options for you.
                                          </p>
                                          <button
                                            onClick={() => {
                                              setUnlistedCourseName(courseSearchTerm);
                                              setIsRequestingUnlistedCourse(true);
                                            }}
                                            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors inline-flex items-center gap-2 cursor-pointer mt-1"
                                          >
                                            <Plus className="w-4 h-4" />
                                            <span>Request This Course</span>
                                          </button>
                                        </div>
                                      );
                                    }

                                    return (
                                      <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                                        {distinctTitles.map((title) => {
                                          const offers = grouped.get(title) || [];
                                          const sample = offers[0];
                                          const uniCount = offers.length;
                                          const minFee = Math.min(...offers.map((o) => o.tuition_fee || 0).filter(Boolean));
                                          const maxScholarship = Math.max(...offers.map((o) => o.scholarship_percentage || 0));

                                          return (
                                            <div
                                              key={title}
                                              onClick={() => handleSelectCourseGroup(title)}
                                              className="p-4 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/40 transition-all flex items-center justify-between gap-3 cursor-pointer group bg-white shadow-xs"
                                            >
                                              <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold">
                                                    {sample.level || "Degree"}
                                                  </span>
                                                  {maxScholarship > 0 && (
                                                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                                      Up to {maxScholarship}% Scholarship
                                                    </span>
                                                  )}
                                                  <span className="text-[11px] text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded">
                                                    {uniCount} {uniCount === 1 ? "Partner University" : "Partner Universities"}
                                                  </span>
                                                </div>

                                                <h4 className="font-extrabold text-sm text-slate-900 group-hover:text-blue-600 transition-colors mt-1.5">
                                                  {title}
                                                </h4>

                                                <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                                                  <span>Duration: {sample.duration || "3-4 Years"}</span>
                                                  {minFee > 0 && (
                                                    <span>&bull; From {sample.currency} {minFee.toLocaleString()}/yr</span>
                                                  )}
                                                </p>
                                              </div>

                                              <div className="text-xs font-extrabold text-blue-600 flex items-center gap-1 shrink-0 group-hover:translate-x-0.5 transition-transform">
                                                <span>View Universities</span>
                                                <span>&rarr;</span>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    );
                                  })()}
                                </div>
                              )}

                              {/* STEP 2: UNIVERSITIES OFFERING THIS COURSE */}
                              {newAppStep === 2 && (
                                <div className="space-y-4">
                                  <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-between text-xs">
                                    <div>
                                      <span className="text-[10px] text-blue-700 font-bold uppercase">Selected Program</span>
                                      <h4 className="font-extrabold text-slate-900 text-sm mt-0.5">{selectedCourseTitle}</h4>
                                    </div>
                                    <button
                                      onClick={() => setNewAppStep(1)}
                                      className="text-blue-600 font-bold hover:underline cursor-pointer"
                                    >
                                      Change Course
                                    </button>
                                  </div>

                                  <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                                    {allCatalogueCourses
                                      .filter((c) => c.title.toLowerCase() === selectedCourseTitle.toLowerCase())
                                      .map((offering) => {
                                        const uni = offering.universities;
                                        return (
                                          <div
                                            key={offering.id}
                                            className="p-4 rounded-xl border border-slate-200 hover:border-blue-500 bg-white transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                                          >
                                            <div className="min-w-0 flex-1">
                                              <div className="flex items-center gap-2">
                                                <span className="text-lg">{uni?.flag || "🏛️"}</span>
                                                <div>
                                                  <h4 className="font-bold text-sm text-slate-900">{uni?.name}</h4>
                                                  <p className="text-xs text-slate-500">
                                                    {uni?.city ? `${uni.city}, ` : ""}{uni?.country}
                                                  </p>
                                                </div>
                                              </div>

                                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3 pt-2 border-t border-slate-100 text-xs">
                                                <div>
                                                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Tuition Fee</span>
                                                  <p className="font-bold text-slate-800 font-mono">
                                                    {offering.currency} {offering.tuition_fee?.toLocaleString() || "Standard"}
                                                  </p>
                                                </div>
                                                <div>
                                                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Scholarship</span>
                                                  <p className="font-bold text-emerald-700">
                                                    {offering.scholarship_percentage ? `${offering.scholarship_percentage}% Waiver` : uni?.scholarship || "Available"}
                                                  </p>
                                                </div>
                                                <div>
                                                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Intakes</span>
                                                  <p className="font-bold text-slate-700">
                                                    {offering.intake_months || "Sept / Jan"}
                                                  </p>
                                                </div>
                                              </div>
                                            </div>

                                            <button
                                              type="button"
                                              onClick={() => handleSelectUniversityOffering(offering)}
                                              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors shrink-0 flex items-center justify-center gap-1.5 cursor-pointer"
                                            >
                                              <span>Select University</span>
                                              <span>&rarr;</span>
                                            </button>
                                          </div>
                                        );
                                      })}
                                  </div>

                                  <div className="pt-2 flex justify-start">
                                    <button
                                      type="button"
                                      onClick={() => setNewAppStep(1)}
                                      className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
                                    >
                                      &larr; Back to Courses
                                    </button>
                                  </div>
                                </div>
                              )}

                              {/* STEP 3: SELECT INTAKE & SCHOLARSHIP */}
                              {newAppStep === 3 && (
                                <div className="space-y-4">
                                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-2 gap-3 text-xs">
                                    <div>
                                      <span className="text-[10px] text-slate-400 font-bold uppercase">Selected Program</span>
                                      <p className="font-bold text-slate-900">{selectedOffering?.title}</p>
                                    </div>
                                    <div>
                                      <span className="text-[10px] text-slate-400 font-bold uppercase">Selected University</span>
                                      <p className="font-bold text-slate-900">{selectedOffering?.universities?.name}</p>
                                      <p className="text-[11px] text-slate-500">{selectedOffering?.universities?.country}</p>
                                    </div>
                                  </div>

                                  <div className="space-y-1.5 text-xs">
                                    <label className="font-bold text-slate-700">Target Intake Period</label>
                                    <select
                                      value={newAppIntake}
                                      onChange={(e) => setNewAppIntake(e.target.value)}
                                      className="w-full px-3.5 py-3 border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white"
                                    >
                                      <option value="September 2026">September 2026 (Recommended Fall Intake)</option>
                                      <option value="January 2027">January 2027 (Spring Intake)</option>
                                      <option value="March 2027">March 2027 (Summer Intake)</option>
                                      <option value="September 2027">September 2027 (Next Academic Year)</option>
                                    </select>
                                  </div>

                                  <div className="space-y-1.5 text-xs pt-1">
                                    <label className="font-bold text-slate-700">Scholarship Review Requested</label>
                                    <div className="flex items-center gap-3">
                                      {["Yes", "No"].map((opt) => (
                                        <button
                                          key={opt}
                                          type="button"
                                          onClick={() => setNewAppScholarship(opt)}
                                          className={`flex-1 py-3 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                                            newAppScholarship === opt
                                              ? "border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20"
                                              : "border-slate-200 bg-white text-slate-700"
                                          }`}
                                        >
                                          {opt === "Yes" ? "✅ Yes — Apply for Scholarship" : "No — Standard Admission"}
                                        </button>
                                      ))}
                                    </div>
                                  </div>

                                  <div className="pt-4 flex justify-between">
                                    <button
                                      type="button"
                                      onClick={() => setNewAppStep(2)}
                                      className="px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 cursor-pointer"
                                    >
                                      &larr; Back to Universities
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setNewAppStep(4)}
                                      className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold cursor-pointer"
                                    >
                                      Continue to Review &rarr;
                                    </button>
                                  </div>
                                </div>
                              )}

                              {/* STEP 4: REVIEW & SUBMIT */}
                              {newAppStep === 4 && (
                                <div className="space-y-4">
                                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                                    <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-wide border-b border-slate-200 pb-2">
                                      Application Summary Review
                                    </h4>

                                    <div className="grid grid-cols-2 gap-3">
                                      <div>
                                        <span className="text-[10px] text-slate-400 font-bold uppercase">Applicant</span>
                                        <p className="font-bold text-slate-800">{studentFullName}</p>
                                      </div>
                                      <div>
                                        <span className="text-[10px] text-slate-400 font-bold uppercase">Course / Program</span>
                                        <p className="font-bold text-slate-800">{selectedOffering?.title}</p>
                                        <p className="text-[11px] text-slate-500">{selectedOffering?.level}</p>
                                      </div>
                                      <div>
                                        <span className="text-[10px] text-slate-400 font-bold uppercase">Partner University</span>
                                        <p className="font-bold text-slate-800">{selectedOffering?.universities?.name}</p>
                                        <p className="text-[11px] text-slate-500">{selectedOffering?.universities?.country}</p>
                                      </div>
                                      <div>
                                        <span className="text-[10px] text-slate-400 font-bold uppercase">Target Intake</span>
                                        <p className="font-bold text-slate-800">{newAppIntake}</p>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Attached Documents Notice */}
                                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1">
                                    <p className="font-bold flex items-center gap-1.5">
                                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                      <span>Verified Student Documents Linked</span>
                                    </p>
                                    <p className="text-[11px] text-emerald-800">
                                      Your uploaded academic certificates and passport from your MtishbiScholar file are attached automatically.
                                    </p>
                                  </div>

                                  <div className="pt-2 flex justify-between items-center">
                                    <button
                                      type="button"
                                      onClick={() => setNewAppStep(3)}
                                      className="px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 cursor-pointer"
                                    >
                                      &larr; Back
                                    </button>
                                    <button
                                      type="button"
                                      disabled={newAppSubmitting}
                                      onClick={handleSubmitNewUniversityApp}
                                      className="px-7 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm rounded-xl transition-all shadow-md shadow-emerald-600/25 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                                    >
                                      {newAppSubmitting ? (
                                        <>
                                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                          <span>Submitting Application...</span>
                                        </>
                                      ) : (
                                        <>
                                          <CheckCircle2 className="w-4 h-4" />
                                          <span>Submit Application to {selectedOffering?.universities?.name} &rarr;</span>
                                        </>
                                      )}
                                    </button>
                                  </div>
                                </div>
                              )}
                            </>
                          )}

                        </div>

                      </div>
                    </div>
                  )}



                  {/* ── CONFIRM WITHDRAW & DELETE APPLICATION MODAL ── */}
                  {appToWithdraw && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
                      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4">
                        <div className="flex items-center gap-3 text-red-600">
                          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                            <Trash2 className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-extrabold text-base text-slate-900">Withdraw Application?</h3>
                            <p className="text-xs text-slate-500">
                              This will permanently remove this application and all application-specific information. This action cannot be undone.
                            </p>
                          </div>
                        </div>

                        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                          <p className="font-bold text-slate-800">
                            {appToWithdraw.courses?.title || appToWithdraw.preferred_course || "Application"}
                          </p>
                          <p className="text-slate-500">
                            {appToWithdraw.universities?.name || (isUnlistedCourseRequest(appToWithdraw) ? `Unlisted Request (${appToWithdraw.target_country || "International"})` : appToWithdraw.target_country || "International")}
                          </p>
                        </div>

                        <div className="space-y-1 text-xs">
                          <label className="font-bold text-slate-700">Reason for withdrawal (Optional)</label>
                          <input
                            type="text"
                            value={withdrawalReason}
                            onChange={(e) => setWithdrawalReason(e.target.value)}
                            placeholder="e.g. Changed course preference, financial reasons..."
                            className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-red-500 focus:outline-hidden"
                          />
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                          <button
                            type="button"
                            onClick={() => {
                              setAppToWithdraw(null);
                              setWithdrawalReason("");
                            }}
                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            disabled={isWithdrawingApp}
                            onClick={handleConfirmWithdrawApp}
                            className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-xl transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                          >
                            {isWithdrawingApp ? (
                              <>
                                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                <span>Withdrawing...</span>
                              </>
                            ) : (
                              <span>Withdraw &amp; Delete</span>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
                )
              )}

              {/* ── MY DOCUMENTS SECTION ── */}
              {activeNav === "documents" && (
                <div className="space-y-6">

                  {/* 1. Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-extrabold uppercase tracking-wider">
                          Private Document Vault
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>RLS Protected &bull; Encrypted</span>
                        </span>
                      </div>
                      <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
                        My Documents
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                        Manage, view and track your academic documents securely.
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setUploadDocModalError("");
                        setUploadDocFile(null);
                        setShowUploadDocModal(true);
                      }}
                      className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs sm:text-sm rounded-xl transition-all shadow-md shadow-blue-600/25 flex items-center justify-center gap-2 cursor-pointer shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      <span>+ Upload New Document</span>
                    </button>
                  </div>

                  {/* 2. Document KPI Summary Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Total Documents */}
                    <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
                      <div>
                        <p className="text-[11px] uppercase font-bold text-slate-400">Total Documents</p>
                        <p className="text-2xl font-black text-slate-900 mt-1">
                          {studentDocs.length}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">On file in secure vault</p>
                      </div>
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                        <FileText className="w-6 h-6" />
                      </div>
                    </div>

                    {/* Verified Documents */}
                    <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
                      <div>
                        <p className="text-[11px] uppercase font-bold text-slate-400">Verified Documents</p>
                        <p className="text-2xl font-black text-emerald-600 mt-1">
                          {studentDocs.filter((d) => d.is_verified).length}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">Approved by admissions desk</p>
                      </div>
                      <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                        <ShieldCheck className="w-6 h-6" />
                      </div>
                    </div>

                    {/* Pending Verification */}
                    <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
                      <div>
                        <p className="text-[11px] uppercase font-bold text-slate-400">Pending Verification</p>
                        <p className="text-2xl font-black text-amber-600 mt-1">
                          {studentDocs.filter((d) => !d.is_verified).length}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">Under admissions review</p>
                      </div>
                      <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                        <Clock className="w-6 h-6" />
                      </div>
                    </div>
                  </div>

                  {/* 3. Security Info Banner */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                        <Lock className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">Private Cloud Storage Vault (`student-documents`)</p>
                        <p className="text-[11px] text-slate-500">
                          Your uploaded documents are securely protected. Direct storage URLs are never exposed; preview links expire after 5 minutes.
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] font-mono font-bold text-slate-400 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shrink-0">
                      Max: 10MB per file
                    </span>
                  </div>

                  {/* 4. Document Sections Container */}
                  {(() => {
                    const isOfferDoc = (docType: string) => {
                      const lower = docType.toLowerCase();
                      return lower.includes("offer") || lower.includes("admission");
                    };

                    // SECTION 1: Uploaded Academic & Identification Documents ONLY
                    const uploadedAcademicDocs = studentDocs.filter((d) => !isOfferDoc(d.document_type));

                    // SECTION 2: Missing required documents based on student's education level & passport status
                    const studentHighestEd = dashData?.profile?.highest_education || profileData.highestEducation || "";
                    const rawRequiredList = getRequiredAcademicDocs(studentHighestEd);

                    // Check if student has a valid passport based on existing profile choice
                    const studentHasPassport = (dashData?.profile?.has_passport || profileData.hasPassport) === "Yes";

                    const requiredSpecs = [
                      ...rawRequiredList.map((r) => ({
                        type: r.type,
                        title: r.title || DOCUMENT_TYPE_CONFIG[r.type]?.label || r.type,
                        description: r.description || DOCUMENT_TYPE_CONFIG[r.type]?.description || "Official academic certificate or document.",
                        required: r.required !== false,
                        note: (r as any).note,
                        category: DOCUMENT_TYPE_CONFIG[r.type]?.category || "Academic Qualification",
                      })),
                      // Include Passport only if student answered "Yes, I have a Passport"
                      ...(studentHasPassport
                        ? [
                            {
                              type: "Passport",
                              title: DOCUMENT_TYPE_CONFIG.Passport.label,
                              description: DOCUMENT_TYPE_CONFIG.Passport.description,
                              required: true,
                              note: undefined,
                              category: DOCUMENT_TYPE_CONFIG.Passport.category,
                            },
                          ]
                        : []),
                    ];

                    const uniqueRequiredMap = new Map<string, typeof requiredSpecs[0]>();
                    requiredSpecs.forEach((spec) => {
                      if (!uniqueRequiredMap.has(spec.type)) {
                        uniqueRequiredMap.set(spec.type, spec);
                      }
                    });

                    const missingRequiredDocs = Array.from(uniqueRequiredMap.values()).filter(
                      (req) => req.required && !studentDocs.some((d) => d.document_type === req.type)
                    );

                    // SECTION 3: Admission & Application Documents
                    const uploadedAdmissionDocs = studentDocs.filter((d) => isOfferDoc(d.document_type));
                    const appsWithOfferLetters = officialApps.filter((a) => a.offer_letter_url);
                    const hasAdmissionDocs = uploadedAdmissionDocs.length > 0 || appsWithOfferLetters.length > 0;

                    return (
                      <div className="space-y-10">

                        {/* ──────────────────────────────────────────────────────────── */}
                        {/* SECTION 1: ACADEMIC & IDENTIFICATION DOCUMENTS (UPLOADED)   */}
                        {/* ──────────────────────────────────────────────────────────── */}
                        <div className="space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                            <div>
                              <h3 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2 uppercase">
                                <GraduationCap className="w-5 h-5 text-blue-600" />
                                <span>Academic &amp; Identification Documents</span>
                              </h3>
                              <p className="text-xs text-slate-500 mt-0.5">
                                Official academic certificates, transcripts, and travel identification documents on file.
                              </p>
                            </div>
                            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                              <span className="text-xs font-bold px-3 py-1.5 bg-slate-100 text-slate-700 rounded-xl border border-slate-200">
                                {uploadedAcademicDocs.length} {uploadedAcademicDocs.length === 1 ? "Document" : "Documents"} Uploaded
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setUploadDocModalError("");
                                  setUploadDocFile(null);
                                  setShowUploadDocModal(true);
                                }}
                                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>+ Add Document</span>
                              </button>
                            </div>
                          </div>

                          {uploadedAcademicDocs.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                              {uploadedAcademicDocs.map((doc) => {
                                const config = DOCUMENT_TYPE_CONFIG[doc.document_type] || {
                                  label: doc.document_type.replace(/_/g, " "),
                                  description: "Uploaded document record.",
                                  category: "Academic & Identification",
                                  required: false,
                                };
                                const isUploading = uploadingDoc === doc.document_type;
                                const isViewing = viewingDoc === doc.document_type;
                                const isDocVerified = Boolean(
                                  doc.is_verified ||
                                  (doc.document_type === "Payment_Receipt" && (hasApprovedPayment || dashData?.hasApprovedPayment || dashData?.payments?.some((p) => (p.status || "").toLowerCase() === "approved")))
                                );

                                return (
                                  <div
                                    key={doc.id || doc.file_url}
                                    className={`p-5 rounded-2xl bg-white border transition-all flex flex-col justify-between space-y-4 ${
                                      isDocVerified
                                        ? "border-emerald-200 shadow-xs hover:border-emerald-300"
                                        : "border-slate-200 shadow-xs hover:border-slate-300"
                                    }`}
                                  >
                                    <div className="space-y-3">
                                      {/* Header: Category, Status Badge & Delete 'X' Button */}
                                      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                                          {config.category}
                                        </span>
                                        <div className="flex items-center gap-1.5">
                                          {isDocVerified ? (
                                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                              Verified ✓
                                            </span>
                                          ) : (
                                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                                              <Clock className="w-3 h-3 text-amber-600 animate-pulse" />
                                              Pending Verification
                                            </span>
                                          )}
                                          <button
                                            type="button"
                                            disabled={deletingDocId === doc.id}
                                            onClick={() => handleDeleteDoc(doc)}
                                            className="w-6 h-6 rounded-full text-slate-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition-colors cursor-pointer border border-transparent hover:border-red-200 disabled:opacity-50"
                                            title={`Delete ${config.label}`}
                                          >
                                            {deletingDocId === doc.id ? (
                                              <div className="w-3 h-3 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                              <X className="w-3.5 h-3.5" />
                                            )}
                                          </button>
                                        </div>
                                      </div>

                                      {/* Title & Description */}
                                      <div>
                                        <h4 className="font-extrabold text-sm text-slate-900 line-clamp-1">
                                          {config.label}
                                        </h4>
                                        <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                                          {config.description}
                                        </p>
                                      </div>

                                      {/* Uploaded File Specs Box */}
                                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1 text-xs font-mono">
                                        <div className="flex items-center justify-between text-slate-700 font-bold truncate">
                                          <span className="truncate">{doc.file_name}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-200/50">
                                          <span>
                                            {doc.created_at
                                              ? new Date(doc.created_at).toLocaleDateString("en-GB", {
                                                  day: "numeric",
                                                  month: "short",
                                                  year: "numeric",
                                                })
                                              : "Uploaded"}
                                          </span>
                                          {formatDocFileSize(doc.file_size) && (
                                            <span>{formatDocFileSize(doc.file_size)}</span>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                                      <button
                                        type="button"
                                        disabled={isViewing}
                                        onClick={() => handleViewDocument(doc.file_url, doc.document_type)}
                                        className="flex-1 py-2.5 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                                      >
                                        {isViewing ? (
                                          <div className="w-3.5 h-3.5 border-2 border-blue-700 border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                          <Eye className="w-3.5 h-3.5" />
                                        )}
                                        <span>View Document</span>
                                      </button>

                                      <label className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer shrink-0">
                                        {isUploading ? (
                                          <div className="w-3.5 h-3.5 border-2 border-slate-700 border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                          <Upload className="w-3.5 h-3.5" />
                                        )}
                                        <span>Replace</span>
                                        <input
                                          type="file"
                                          accept="image/*,.pdf"
                                          className="hidden"
                                          disabled={isUploading}
                                          onChange={(e) => {
                                            if (e.target.files && e.target.files[0]) {
                                              handleDirectDocUpload(e.target.files[0], doc.document_type);
                                            }
                                          }}
                                        />
                                      </label>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center space-y-3">
                              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                                <FileText className="w-6 h-6" />
                              </div>
                              <h4 className="font-extrabold text-sm text-slate-900">No academic documents uploaded yet</h4>
                              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                                Please review the required documents below to upload your certificates and passport.
                              </p>
                            </div>
                          )}
                        </div>

                        {/* ──────────────────────────────────────────────────────────── */}
                        {/* SECTION 2: DOCUMENTS YOU STILL NEED                          */}
                        {/* ──────────────────────────────────────────────────────────── */}
                        <div className="space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                            <div>
                              <h3 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2 uppercase">
                                <AlertCircle className="w-5 h-5 text-amber-600" />
                                <span>Documents You Still Need</span>
                              </h3>
                              <p className="text-xs text-slate-500 mt-0.5">
                                Based on your education level ({studentHighestEd || "Standard Track"}), these mandatory documents are required for university admissions.
                              </p>
                            </div>
                            {missingRequiredDocs.length > 0 && (
                              <span className="text-xs font-extrabold px-3 py-1 bg-amber-100 text-amber-800 rounded-full border border-amber-200 shrink-0 self-start sm:self-auto">
                                {missingRequiredDocs.length} Pending {missingRequiredDocs.length === 1 ? "Upload" : "Uploads"}
                              </span>
                            )}
                          </div>

                          {missingRequiredDocs.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                              {missingRequiredDocs.map((req) => {
                                const isUploading = uploadingDoc === req.type;

                                return (
                                  <div
                                    key={req.type}
                                    className="p-5 rounded-2xl bg-amber-50/30 border border-amber-200/80 hover:border-amber-400 transition-all flex flex-col justify-between space-y-4 shadow-xs"
                                  >
                                    <div className="space-y-3">
                                      <div className="flex items-center justify-between gap-2 border-b border-amber-100 pb-2.5">
                                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                                          {req.category}
                                        </span>
                                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                                          Required
                                        </span>
                                      </div>

                                      <div>
                                        <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                                          <span>{req.title}</span>
                                        </h4>
                                        <p className="text-[11px] text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                                          {req.description}
                                        </p>
                                      </div>

                                      {req.note && (
                                        <div className="p-2.5 rounded-xl bg-amber-100/70 border border-amber-200 text-[10px] text-amber-900 flex items-start gap-1.5">
                                          <Info className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                                          <span className="leading-snug">{req.note}</span>
                                        </div>
                                      )}
                                    </div>

                                    <div className="pt-2 border-t border-amber-100">
                                      <label className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer">
                                        {isUploading ? (
                                          <>
                                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            <span>Uploading...</span>
                                          </>
                                        ) : (
                                          <>
                                            <Upload className="w-3.5 h-3.5" />
                                            <span>Upload Document</span>
                                          </>
                                        )}
                                        <input
                                          type="file"
                                          accept="image/*,.pdf"
                                          className="hidden"
                                          disabled={isUploading}
                                          onChange={(e) => {
                                            if (e.target.files && e.target.files[0]) {
                                              handleDirectDocUpload(e.target.files[0], req.type);
                                            }
                                          }}
                                        />
                                      </label>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="p-6 rounded-2xl bg-emerald-50/90 border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                                  <CheckCircle2 className="w-6 h-6" />
                                </div>
                                <div>
                                  <h4 className="font-extrabold text-sm text-emerald-950">
                                    All currently required documents have been uploaded.
                                  </h4>
                                  <p className="text-xs text-emerald-800 mt-0.5">
                                    Need to upload an extra certificate, recommendation letter, or document requested by admission?
                                  </p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setUploadDocModalError("");
                                  setUploadDocFile(null);
                                  setShowUploadDocModal(true);
                                }}
                                className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl transition-colors shrink-0 flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                              >
                                <Plus className="w-4 h-4" />
                                <span>+ Add Document</span>
                              </button>
                            </div>
                          )}
                        </div>

                        {/* ──────────────────────────────────────────────────────────── */}
                        {/* SECTION 3: ADMISSION & APPLICATION DOCUMENTS                 */}
                        {/* ──────────────────────────────────────────────────────────── */}
                        {hasAdmissionDocs && (
                          <div className="space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                              <div>
                                <h3 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2 uppercase">
                                  <Award className="w-5 h-5 text-indigo-600" />
                                  <span>Admission &amp; Application Documents</span>
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                  Official university admission letters, offer documents, and application-specific files.
                                </p>
                              </div>
                              <span className="text-xs font-bold px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200 shrink-0 self-start sm:self-auto">
                                {uploadedAdmissionDocs.length + appsWithOfferLetters.length} Official {uploadedAdmissionDocs.length + appsWithOfferLetters.length === 1 ? "Document" : "Documents"}
                              </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                              {/* Uploaded Offer Letter Docs */}
                              {uploadedAdmissionDocs.map((doc) => (
                                <div
                                  key={doc.id || doc.file_url}
                                  className="p-5 rounded-2xl bg-white border border-indigo-200 shadow-xs flex flex-col justify-between space-y-4 hover:border-indigo-300 transition-all"
                                >
                                  <div className="space-y-3">
                                    <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600">
                                        Official Admission Document
                                      </span>
                                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-100 text-indigo-800 border border-indigo-200">
                                        Offer Letter
                                      </span>
                                    </div>

                                    <div>
                                      <h4 className="font-extrabold text-sm text-slate-900">
                                        {doc.file_name || "Official University Offer Letter"}
                                      </h4>
                                      <p className="text-[11px] text-slate-500 mt-1">
                                        Issued by Partner University Admissions Office
                                      </p>
                                    </div>

                                    <div className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-100 text-xs font-mono text-[10px] text-slate-500 flex justify-between">
                                      <span>
                                        {doc.created_at
                                          ? new Date(doc.created_at).toLocaleDateString("en-GB", {
                                              day: "numeric",
                                              month: "short",
                                              year: "numeric",
                                            })
                                          : "Issued"}
                                      </span>
                                      {formatDocFileSize(doc.file_size) && (
                                        <span>{formatDocFileSize(doc.file_size)}</span>
                                      )}
                                    </div>
                                  </div>

                                  <div className="pt-2 border-t border-slate-100">
                                    <button
                                      type="button"
                                      onClick={() => handleViewDocument(doc.file_url, doc.document_type)}
                                      className="w-full py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                      <span>View Offer Document</span>
                                    </button>
                                  </div>
                                </div>
                              ))}

                              {/* Application Offer Letters with direct URLs */}
                              {appsWithOfferLetters.map((app) => (
                                <div
                                  key={app.id}
                                  className="p-5 rounded-2xl bg-white border border-emerald-200 shadow-xs flex flex-col justify-between space-y-4 hover:border-emerald-300 transition-all"
                                >
                                  <div className="space-y-3">
                                    <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600">
                                        Admission Offer
                                      </span>
                                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                        Offer Issued
                                      </span>
                                    </div>

                                    <div>
                                      <h4 className="font-extrabold text-sm text-slate-900">
                                        {app.universities?.name || "Partner University"}
                                      </h4>
                                      <p className="text-[11px] text-slate-500 mt-1">
                                        {app.courses?.title || app.preferred_course || "Degree Program"} &bull; {app.target_country || "International"}
                                      </p>
                                    </div>

                                    <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100 text-xs font-mono text-[10px] text-slate-600 flex justify-between">
                                      <span>Application ID: {app.id.slice(0, 8).toUpperCase()}</span>
                                      <span>Official PDF</span>
                                    </div>
                                  </div>

                                  <div className="pt-2 border-t border-slate-100">
                                    <a
                                      href={app.offer_letter_url || "#"}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                                    >
                                      <Download className="w-3.5 h-3.5" />
                                      <span>Download Offer Letter</span>
                                    </a>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                      </div>
                    );
                  })()}

                  {/* ── UPLOAD NEW DOCUMENT MODAL ── */}
                  {showUploadDocModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
                      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Header */}
                        <div className="px-6 py-5 bg-gradient-to-r from-blue-700 to-indigo-800 text-white flex items-center justify-between">
                          <div>
                            <span className="text-[10px] font-extrabold uppercase bg-white/20 px-2.5 py-0.5 rounded-full text-white">
                              Secure Upload
                            </span>
                            <h3 className="text-lg font-bold mt-1">Upload Academic Document</h3>
                          </div>
                          <button
                            onClick={() => setShowUploadDocModal(false)}
                            className="p-2 rounded-full hover:bg-white/20 text-white transition-colors"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-4 overflow-y-auto">
                          {/* 1. Document Category Selection */}
                          <div className="space-y-1.5">
                            <label className="font-bold text-xs text-slate-700 block">
                              Select Document Type <span className="text-red-500">*</span>
                            </label>
                            <select
                              value={selectedDocTypeForUpload}
                              onChange={(e) => setSelectedDocTypeForUpload(e.target.value)}
                              className="w-full px-3.5 py-3 border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white text-slate-800"
                            >
                              <optgroup label="🎓 Academic Qualifications">
                                {Object.entries(DOCUMENT_TYPE_CONFIG)
                                  .filter(([_, c]) => c.category === "Academic Qualification")
                                  .map(([k, c]) => (
                                    <option key={k} value={k}>
                                      {c.label}
                                    </option>
                                  ))}
                              </optgroup>
                              <optgroup label="🛂 Identity & Travel Documents">
                                {Object.entries(DOCUMENT_TYPE_CONFIG)
                                  .filter(([_, c]) => c.category === "Identity & Travel")
                                  .map(([k, c]) => (
                                    <option key={k} value={k}>
                                      {c.label}
                                    </option>
                                  ))}
                              </optgroup>
                              <optgroup label="🗣️ Language & Tests">
                                {Object.entries(DOCUMENT_TYPE_CONFIG)
                                  .filter(([_, c]) => c.category === "Language & Tests")
                                  .map(([k, c]) => (
                                    <option key={k} value={k}>
                                      {c.label}
                                    </option>
                                  ))}
                              </optgroup>
                              <optgroup label="📄 Supporting & Requested Documents">
                                {Object.entries(DOCUMENT_TYPE_CONFIG)
                                  .filter(([_, c]) => c.category === "Supporting Documents" || c.category === "Payment Proof")
                                  .map(([k, c]) => (
                                    <option key={k} value={k}>
                                      {c.label}
                                    </option>
                                  ))}
                              </optgroup>
                            </select>
                            <p className="text-[11px] text-slate-400">
                              {DOCUMENT_TYPE_CONFIG[selectedDocTypeForUpload]?.description || "Official supporting document"}
                            </p>
                          </div>

                          {/* 2. File Picker */}
                          <div className="space-y-1.5">
                            <label className="font-bold text-xs text-slate-700 block">
                              Select File (PDF, PNG, JPG &bull; Max 10MB) <span className="text-red-500">*</span>
                            </label>
                            <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-6 text-center space-y-2 bg-slate-50 transition-colors">
                              <Upload className="w-8 h-8 text-slate-400 mx-auto" />
                              <div className="space-y-1">
                                <label className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl cursor-pointer transition-colors shadow-xs inline-block">
                                  Browse Computer / Phone
                                  <input
                                    type="file"
                                    accept="image/*,.pdf"
                                    className="hidden"
                                    onChange={(e) => {
                                      if (e.target.files && e.target.files[0]) {
                                        setUploadDocFile(e.target.files[0]);
                                        setUploadDocModalError("");
                                      }
                                    }}
                                  />
                                </label>
                                <p className="text-[11px] text-slate-500">Supported formats: PDF, JPG, JPEG, PNG</p>
                              </div>
                              {uploadDocFile && (
                                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 font-bold flex items-center justify-center gap-2">
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                  <span className="truncate">{uploadDocFile.name} ({formatDocFileSize(uploadDocFile.size)})</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Error Banner */}
                          {uploadDocModalError && (
                            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                              <AlertCircle className="w-4 h-4 shrink-0" />
                              <span>{uploadDocModalError}</span>
                            </div>
                          )}
                        </div>

                        {/* Footer */}
                        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => setShowUploadDocModal(false)}
                            className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                          >
                            Cancel
                          </button>

                          <button
                            type="button"
                            disabled={!uploadDocFile || uploadingDocModal}
                            onClick={handleModalDocUpload}
                            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl transition-all shadow-md shadow-blue-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                          >
                            {uploadingDocModal ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                <span>Uploading to Vault...</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Upload Document</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* ── UNIVERSITIES DIRECTORY SECTION ── */}
              {activeNav === "universities" && (
                <div className="space-y-6">

                  {/* 1. Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-extrabold uppercase tracking-wider">
                          Partner Institutions
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          Global Destination Network
                        </span>
                      </div>
                      <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
                        Universities
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                        Explore MtishbiScholar partner universities and find the right destination for your studies.
                      </p>
                    </div>

                    <div className="px-4 py-2 bg-blue-50 border border-blue-200 rounded-xl text-center shrink-0">
                      <p className="text-[10px] font-bold text-blue-700 uppercase">Partner Network</p>
                      <p className="text-lg font-black text-slate-900">
                        {loadingUniversities ? "..." : `${dbUniversities.length} Universities`}
                      </p>
                    </div>
                  </div>

                  {/* 2. Search & Multi-Filter Bar */}
                  <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {/* Search */}
                      <div className="relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                        <input
                          type="text"
                          placeholder="Search by name, country, city..."
                          value={uniSearchQuery}
                          onChange={(e) => setUniSearchQuery(e.target.value)}
                          className="w-full pl-9 pr-8 py-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                        />
                        {uniSearchQuery && (
                          <button
                            onClick={() => setUniSearchQuery("")}
                            className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Country Filter */}
                      <select
                        value={uniCountryFilter}
                        onChange={(e) => setUniCountryFilter(e.target.value)}
                        className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white"
                      >
                        <option value="All">All Countries ({Array.from(new Set(dbUniversities.map((u) => u.country).filter(Boolean))).length})</option>
                        {Array.from(new Set(dbUniversities.map((u) => u.country).filter(Boolean))).sort().map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>

                      {/* Scholarship Filter */}
                      <select
                        value={uniScholarshipFilter}
                        onChange={(e) => setUniScholarshipFilter(e.target.value)}
                        className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white"
                      >
                        <option value="All">All Scholarships</option>
                        <option value="HasScholarship">Scholarships Available Only</option>
                      </select>

                      {/* Tuition Range Filter */}
                      <select
                        value={uniTuitionFilter}
                        onChange={(e) => setUniTuitionFilter(e.target.value)}
                        className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white"
                      >
                        <option value="All">All Tuition Rates</option>
                        <option value="under3k">Under USD $3,000 / yr</option>
                        <option value="3kTo6k">USD $3,000 - $6,000 / yr</option>
                        <option value="above6k">Above USD $6,000 / yr</option>
                      </select>
                    </div>

                    {/* Filter status row & Clear button */}
                    {(uniSearchQuery || uniCountryFilter !== "All" || uniScholarshipFilter !== "All" || uniTuitionFilter !== "All") && (
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                        <span className="text-slate-500">
                          Showing <span className="font-bold text-slate-800">{
                            dbUniversities.filter((u) => {
                              const q = uniSearchQuery.toLowerCase().trim();
                              const matchSearch =
                                !q ||
                                u.name.toLowerCase().includes(q) ||
                                u.country.toLowerCase().includes(q) ||
                                (u.city && u.city.toLowerCase().includes(q));
                              const matchCountry = uniCountryFilter === "All" || u.country === uniCountryFilter;
                              const matchScholarship =
                                uniScholarshipFilter === "All" ||
                                (uniScholarshipFilter === "HasScholarship" &&
                                  Boolean(u.scholarship && !u.scholarship.toLowerCase().includes("none") && !u.scholarship.toLowerCase().includes("0%")));
                              let matchTuition = true;
                              const fee = u.tuitionFeeUSD || 0;
                              if (uniTuitionFilter === "under3k") matchTuition = fee > 0 && fee <= 3000;
                              else if (uniTuitionFilter === "3kTo6k") matchTuition = fee > 3000 && fee <= 6000;
                              else if (uniTuitionFilter === "above6k") matchTuition = fee > 6000;
                              return matchSearch && matchCountry && matchScholarship && matchTuition;
                            }).length
                          }</span> of {dbUniversities.length} partner universities
                        </span>

                        <button
                          onClick={() => {
                            setUniSearchQuery("");
                            setUniCountryFilter("All");
                            setUniScholarshipFilter("All");
                            setUniTuitionFilter("All");
                          }}
                          className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer flex items-center gap-1"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Clear Filters</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* 3. Universities Grid / Skeletons */}
                  {loadingUniversities ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="bg-white rounded-3xl border border-slate-200 p-5 space-y-4 animate-pulse">
                          <div className="h-40 bg-slate-200 rounded-2xl" />
                          <div className="h-5 bg-slate-200 rounded-md w-3/4" />
                          <div className="h-4 bg-slate-100 rounded-md w-1/2" />
                          <div className="pt-3 border-t border-slate-100 flex gap-2">
                            <div className="h-10 bg-slate-200 rounded-xl flex-1" />
                            <div className="h-10 bg-slate-200 rounded-xl flex-1" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : dbUniversities.length === 0 ? (
                    <div className="p-12 rounded-3xl bg-white border border-slate-200 text-center space-y-3 max-w-md mx-auto my-6">
                      <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                        <Building2 className="w-7 h-7" />
                      </div>
                      <h4 className="font-extrabold text-base text-slate-900">Universities are currently unavailable</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Unable to load the university directory from the database. Please check your connection and retry.
                      </p>
                      <button
                        onClick={loadUniversities}
                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs inline-flex items-center gap-2 cursor-pointer"
                      >
                        <RefreshCw className="w-4 h-4" />
                        <span>Retry Loading</span>
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Filtered Grid */}
                      {(() => {
                        const filtered = dbUniversities.filter((u) => {
                          const q = uniSearchQuery.toLowerCase().trim();
                          const matchSearch =
                            !q ||
                            u.name.toLowerCase().includes(q) ||
                            u.country.toLowerCase().includes(q) ||
                            (u.city && u.city.toLowerCase().includes(q));
                          const matchCountry = uniCountryFilter === "All" || u.country === uniCountryFilter;
                          const matchScholarship =
                            uniScholarshipFilter === "All" ||
                            (uniScholarshipFilter === "HasScholarship" &&
                              Boolean(u.scholarship && !u.scholarship.toLowerCase().includes("none") && !u.scholarship.toLowerCase().includes("0%")));
                          let matchTuition = true;
                          const fee = u.tuitionFeeUSD || 0;
                          if (uniTuitionFilter === "under3k") matchTuition = fee > 0 && fee <= 3000;
                          else if (uniTuitionFilter === "3kTo6k") matchTuition = fee > 3000 && fee <= 6000;
                          else if (uniTuitionFilter === "above6k") matchTuition = fee > 6000;
                          return matchSearch && matchCountry && matchScholarship && matchTuition;
                        });

                        if (filtered.length === 0) {
                          return (
                            <div className="p-12 rounded-3xl bg-white border border-slate-200 text-center space-y-3 max-w-md mx-auto my-6">
                              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                                <Search className="w-7 h-7" />
                              </div>
                              <h4 className="font-extrabold text-base text-slate-900">No universities found</h4>
                              <p className="text-xs text-slate-500 leading-relaxed">
                                We couldn't find any partner universities matching your current search or filter criteria.
                              </p>
                              <button
                                onClick={() => {
                                  setUniSearchQuery("");
                                  setUniCountryFilter("All");
                                  setUniScholarshipFilter("All");
                                  setUniTuitionFilter("All");
                                }}
                                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs inline-flex items-center gap-2 cursor-pointer"
                              >
                                <X className="w-4 h-4" />
                                <span>Clear Filters</span>
                              </button>
                            </div>
                          );
                        }

                        return (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filtered.map((u) => {
                              const courseCount =
                                liveCoursesList.filter((c) => c.university_id === u.id).length ||
                                u.courses?.length ||
                                0;
                              const appliedApp = dashData?.applications?.find(
                                (a) => a.university_id === u.id
                              );

                              return (
                                <div
                                  key={u.id}
                                  className="bg-white rounded-3xl border border-slate-200/90 hover:border-blue-400 shadow-xs hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 overflow-hidden flex flex-col justify-between group"
                                >
                                  {/* Top Image Banner */}
                                  <div className="relative h-44 w-full bg-gradient-to-tr from-slate-900 via-blue-950 to-slate-800 overflow-hidden">
                                    {u.image ? (
                                      <img
                                        src={u.image}
                                        alt={u.name}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                                        onError={(e) => {
                                          e.currentTarget.style.display = "none";
                                        }}
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-5xl opacity-40">
                                        🏛️
                                      </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />

                                    {/* Country & Flag Badge */}
                                    <div className="absolute top-3.5 left-3.5 flex items-center gap-2">
                                      <span className="px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-md border border-white/20 text-white text-xs font-bold flex items-center gap-1.5 shadow-md">
                                        <span>{u.flag || "🌐"}</span>
                                        <span>{u.country}</span>
                                      </span>
                                    </div>

                                    {/* Featured Badge or Applied Badge */}
                                    <div className="absolute top-3.5 right-3.5 flex flex-col items-end gap-1">
                                      {appliedApp && (
                                        <span className="px-3 py-1 rounded-full bg-emerald-600 text-white text-[11px] font-extrabold flex items-center gap-1 shadow-lg">
                                          <CheckCircle2 className="w-3.5 h-3.5" />
                                          <span>Applied ✓</span>
                                        </span>
                                      )}
                                      {u.featured && !appliedApp && (
                                        <span className="px-2.5 py-1 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-md">
                                          <Sparkles className="w-3 h-3 text-slate-950" />
                                          <span>Featured</span>
                                        </span>
                                      )}
                                    </div>

                                    {/* University Name inside banner */}
                                    <div className="absolute bottom-3 left-3.5 right-3.5">
                                      <h3 className="text-white font-extrabold text-base leading-tight drop-shadow-md line-clamp-2">
                                        {u.name}
                                      </h3>
                                      <p className="text-xs text-blue-200 font-medium flex items-center gap-1 mt-0.5">
                                        <MapPin className="w-3 h-3 shrink-0" />
                                        <span>{u.city ? `${u.city}, ` : ""}{u.country}</span>
                                      </p>
                                    </div>
                                  </div>

                                  {/* Card Body */}
                                  <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                                    <div className="space-y-3">
                                      {/* Scholarship Box */}
                                      {u.scholarship && (
                                        <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-900 text-xs font-bold flex items-center gap-2">
                                          <Award className="w-4 h-4 text-emerald-600 shrink-0" />
                                          <span className="truncate">{u.scholarship}</span>
                                        </div>
                                      )}

                                      {/* Specs Row */}
                                      <div className="grid grid-cols-2 gap-2 pt-1">
                                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs">
                                          <p className="text-[10px] text-slate-400 font-bold uppercase">Starting Tuition</p>
                                          <p className="font-extrabold text-slate-900 mt-0.5">
                                            {u.tuitionFeeUSD ? `USD $${u.tuitionFeeUSD.toLocaleString()}` : "Affordable"}
                                            <span className="text-[10px] font-normal text-slate-400"> / yr</span>
                                          </p>
                                        </div>

                                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs">
                                          <p className="text-[10px] text-slate-400 font-bold uppercase">Programs</p>
                                          <p className="font-extrabold text-blue-700 mt-0.5 flex items-center gap-1">
                                            <BookOpen className="w-3.5 h-3.5" />
                                            <span>{courseCount} {courseCount === 1 ? "Course" : "Courses"}</span>
                                          </p>
                                        </div>
                                      </div>

                                      {/* Description Snippet */}
                                      {u.description && (
                                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                                          {u.description}
                                        </p>
                                      )}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => handleOpenUniDetails(u)}
                                        className="flex-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                                      >
                                        <Eye className="w-3.5 h-3.5" />
                                        <span>View Details</span>
                                      </button>

                                      {appliedApp ? (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setSelectedAppDetail(appliedApp);
                                            setActiveNav("application");
                                          }}
                                          className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                                        >
                                          <CheckCircle2 className="w-3.5 h-3.5" />
                                          <span>View App</span>
                                        </button>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => handleApplyFromDirectory(u)}
                                          className="flex-1 py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                                        >
                                          <span>Apply Now &rarr;</span>
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </>
                  )}

                  {/* ── 4. UNIVERSITY DETAILS MODAL ── */}
                  {selectedUniForDetail && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
                      <div className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">

                        {/* Modal Header Cover */}
                        <div className="relative h-48 bg-slate-900 text-white overflow-hidden shrink-0">
                          {selectedUniForDetail.image ? (
                            <img
                              src={selectedUniForDetail.image}
                              alt={selectedUniForDetail.name}
                              className="w-full h-full object-cover opacity-80"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          ) : null}
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent" />

                          <button
                            onClick={() => setSelectedUniForDetail(null)}
                            className="absolute top-4 right-4 p-2 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white transition-colors cursor-pointer"
                          >
                            <X className="w-5 h-5" />
                          </button>

                          <div className="absolute bottom-4 left-6 right-6">
                            <div className="flex items-center gap-2">
                              <span className="px-3 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-white text-[11px] font-bold">
                                {selectedUniForDetail.flag} {selectedUniForDetail.country}
                              </span>
                              {selectedUniForDetail.featured && (
                                <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black uppercase">
                                  Featured Partner
                                </span>
                              )}
                            </div>
                            <h3 className="text-xl sm:text-2xl font-black text-white mt-1 leading-tight">
                              {selectedUniForDetail.name}
                            </h3>
                            <p className="text-xs text-blue-200 mt-0.5 flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5" />
                              <span>{selectedUniForDetail.city ? `${selectedUniForDetail.city}, ` : ""}{selectedUniForDetail.country}</span>
                            </p>
                          </div>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-6 overflow-y-auto flex-1">

                          {/* Key Specs Grid */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                              <span className="text-[10px] text-slate-400 font-bold uppercase">Starting Tuition</span>
                              <p className="font-extrabold text-slate-900 mt-0.5">
                                {selectedUniForDetail.tuitionFeeUSD ? `USD $${selectedUniForDetail.tuitionFeeUSD.toLocaleString()}` : "Competitive"}
                              </p>
                              <span className="text-[10px] text-slate-500">Per Academic Year</span>
                            </div>

                            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                              <span className="text-[10px] text-slate-400 font-bold uppercase">Scholarship</span>
                              <p className="font-extrabold text-emerald-600 mt-0.5 truncate">
                                {selectedUniForDetail.scholarship || "Available on Merit"}
                              </p>
                              <span className="text-[10px] text-slate-500">Subject to review</span>
                            </div>

                            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                              <span className="text-[10px] text-slate-400 font-bold uppercase">Intakes</span>
                              <p className="font-extrabold text-slate-900 mt-0.5 truncate">
                                {selectedUniForDetail.intakes?.join(", ") || "Sept & Jan"}
                              </p>
                              <span className="text-[10px] text-slate-500">Flexible starts</span>
                            </div>

                            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                              <span className="text-[10px] text-slate-400 font-bold uppercase">Total Programs</span>
                              <p className="font-extrabold text-blue-700 mt-0.5">
                                {uniDetailCourses.length > 0 ? `${uniDetailCourses.length} Programs` : `${selectedUniForDetail.courses?.length || 0} Listed`}
                              </p>
                              <span className="text-[10px] text-slate-500">Undergrad & Postgrad</span>
                            </div>
                          </div>

                          {/* Description */}
                          {selectedUniForDetail.description && (
                            <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 text-xs text-slate-700 leading-relaxed space-y-1">
                              <h4 className="font-bold text-slate-900 uppercase text-[11px]">About This Institution</h4>
                              <p>{selectedUniForDetail.description}</p>
                            </div>
                          )}

                          {/* ── COURSE DIRECTORY INSIDE UNIVERSITY ── */}
                          <div className="space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                              <div>
                                <h4 className="font-extrabold text-base text-slate-900 uppercase tracking-tight">
                                  Available Degree &amp; Diploma Programs
                                </h4>
                                <p className="text-xs text-slate-500">
                                  Select a course to start your application directly.
                                </p>
                              </div>

                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  placeholder="Search program..."
                                  value={uniDetailCourseSearch}
                                  onChange={(e) => setUniDetailCourseSearch(e.target.value)}
                                  className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden w-40 sm:w-48"
                                />

                                <select
                                  value={uniDetailCourseLevelFilter}
                                  onChange={(e) => setUniDetailCourseLevelFilter(e.target.value)}
                                  className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white"
                                >
                                  <option value="All">All Levels</option>
                                  <option value="Bachelor">Bachelor</option>
                                  <option value="Master">Master</option>
                                  <option value="Diploma">Diploma</option>
                                  <option value="PhD">PhD</option>
                                </select>
                              </div>
                            </div>

                            {/* Course List */}
                            {loadingUniDetailCourses ? (
                              <div className="text-center py-10 space-y-2">
                                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                                <p className="text-xs text-slate-500">Loading courses from database...</p>
                              </div>
                            ) : uniDetailCourses.length === 0 ? (
                              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2">
                                <p className="text-xs text-slate-500">
                                  Standard programs for this university are available on request through admissions.
                                </p>
                                <button
                                  onClick={() => handleApplyFromDirectory(selectedUniForDetail)}
                                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl"
                                >
                                  Apply for Custom Program &rarr;
                                </button>
                              </div>
                            ) : (
                              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                                {uniDetailCourses
                                  .filter((c) => {
                                    const q = uniDetailCourseSearch.toLowerCase().trim();
                                    const matchSearch =
                                      !q ||
                                      c.title.toLowerCase().includes(q) ||
                                      (c.intake_months && c.intake_months.toLowerCase().includes(q));
                                    const matchLevel =
                                      uniDetailCourseLevelFilter === "All" ||
                                      (c.level && c.level.toLowerCase().includes(uniDetailCourseLevelFilter.toLowerCase()));
                                    return matchSearch && matchLevel;
                                  })
                                  .map((c) => (
                                    <div
                                      key={c.id}
                                      className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-blue-400 hover:bg-blue-50/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                                    >
                                      <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                          <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700 text-[10px] font-bold">
                                            {c.level || "Degree"}
                                          </span>
                                          {c.scholarship_percentage && (
                                            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                              {c.scholarship_percentage}% Scholarship
                                            </span>
                                          )}
                                        </div>
                                        <h5 className="font-extrabold text-sm text-slate-900">{c.title}</h5>
                                        <p className="text-xs text-slate-500">
                                          Duration: {c.duration || "3 - 4 Years"} &bull; Tuition: {c.currency} {c.tuition_fee?.toLocaleString()} / yr
                                          {c.intake_months ? ` &bull; Intakes: ${c.intake_months}` : ""}
                                        </p>
                                      </div>

                                      <button
                                        type="button"
                                        onClick={() => handleApplyFromDirectory(selectedUniForDetail, c)}
                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-xs shrink-0 cursor-pointer"
                                      >
                                        Apply for Course &rarr;
                                      </button>
                                    </div>
                                  ))}
                              </div>
                            )}
                          </div>

                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => setSelectedUniForDetail(null)}
                            className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                          >
                            Close
                          </button>

                          <button
                            type="button"
                            onClick={() => handleApplyFromDirectory(selectedUniForDetail)}
                            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs sm:text-sm rounded-xl transition-all shadow-md shadow-blue-600/20 flex items-center gap-2 cursor-pointer"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Apply to {selectedUniForDetail.name} &rarr;</span>
                          </button>
                        </div>

                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* ── NOTIFICATIONS CENTER SECTION ── */}
              {activeNav === "notifications" && (
                <div className="space-y-6">

                  {/* 1. Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-extrabold uppercase tracking-wider">
                          Notification Center
                        </span>
                        {unreadNotifCount > 0 ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 text-[10px] font-extrabold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                            <span>{unreadNotifCount} Unread</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            All Caught Up ✓
                          </span>
                        )}
                      </div>
                      <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
                        Notifications
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                        Stay updated with your payments, applications and important MtishbiScholar updates.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {unreadNotifCount > 0 && (
                        <button
                          type="button"
                          disabled={markingAllRead}
                          onClick={handleMarkAllAsRead}
                          className="px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{markingAllRead ? "Marking..." : "Mark All as Read"}</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={async () => {
                          if (currentUser?.id) {
                            setLoadingNotifications(true);
                            const notifs = await fetchStudentNotifications(currentUser.id);
                            setNotificationsList(notifs);
                            setLoadingNotifications(false);
                          }
                        }}
                        className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer"
                        title="Refresh Notifications"
                      >
                        <RefreshCw className={`w-4 h-4 ${loadingNotifications ? "animate-spin" : ""}`} />
                      </button>
                    </div>
                  </div>

                  {/* 2. Filters Bar */}
                  <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Status filter tabs */}
                    <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
                      {[
                        { id: "all", label: `All (${notificationsList.length})` },
                        { id: "unread", label: `Unread (${unreadNotifCount})` },
                        { id: "read", label: `Read (${notificationsList.length - unreadNotifCount})` },
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setNotifFilter(tab.id as any)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            notifFilter === tab.id
                              ? "bg-white text-blue-700 shadow-xs"
                              : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    {/* Type Filter Dropdown */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-500">Category:</span>
                      <select
                        value={notifTypeFilter}
                        onChange={(e) => setNotifTypeFilter(e.target.value)}
                        className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white"
                      >
                        <option value="all">All Types</option>
                        <option value="payment">Payments</option>
                        <option value="application">Applications</option>
                        <option value="admission">Admissions</option>
                        <option value="doc">Documents</option>
                        <option value="system">System</option>
                      </select>
                    </div>
                  </div>

                  {/* 3. Notifications List */}
                  {loadingNotifications ? (
                    <div className="space-y-3">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="p-5 rounded-2xl bg-white border border-slate-200 animate-pulse space-y-2">
                          <div className="h-4 bg-slate-200 rounded w-1/3" />
                          <div className="h-3 bg-slate-100 rounded w-2/3" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <>
                      {(() => {
                        const filtered = notificationsList.filter((n) => {
                          if (notifFilter === "unread" && n.is_read) return false;
                          if (notifFilter === "read" && !n.is_read) return false;
                          if (notifTypeFilter !== "all") {
                            const t = (n.type || "").toLowerCase();
                            if (!t.includes(notifTypeFilter)) return false;
                          }
                          return true;
                        });

                        if (filtered.length === 0) {
                          return (
                            <div className="p-12 rounded-3xl bg-white border border-slate-200 text-center space-y-3 max-w-md mx-auto my-6">
                              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                                <CheckCircle2 className="w-7 h-7" />
                              </div>
                              <h4 className="font-extrabold text-base text-slate-900">
                                {notifFilter === "unread"
                                  ? "No unread notifications"
                                  : notificationsList.length === 0
                                  ? "No notifications yet"
                                  : "No matching notifications"}
                              </h4>
                              <p className="text-xs text-slate-500 leading-relaxed">
                                {notifFilter === "unread"
                                  ? "You have read all your notifications. We will alert you whenever there is an update!"
                                  : "Updates regarding your applications, payment receipts, and university admissions will appear here."}
                              </p>
                              {notifFilter !== "all" && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setNotifFilter("all");
                                    setNotifTypeFilter("all");
                                  }}
                                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs"
                                >
                                  Show All Notifications
                                </button>
                              )}
                            </div>
                          );
                        }

                        return (
                          <div className="space-y-3">
                            {filtered.map((n) => {
                              const visual = getNotificationVisual(n.type);
                              const Icon = visual.icon;

                              return (
                                <div
                                  key={n.id}
                                  className={`p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                                    !n.is_read
                                      ? "bg-white border-blue-200/90 shadow-sm shadow-blue-500/5 ring-1 ring-blue-500/10"
                                      : "bg-white border-slate-200/80 shadow-xs hover:border-slate-300"
                                  }`}
                                >
                                  {/* Left: Icon & Content */}
                                  <div className="flex items-start gap-4 flex-1 min-w-0">
                                    <div
                                      className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${visual.bgColor}`}
                                    >
                                      <Icon className="w-5 h-5" />
                                    </div>

                                    <div className="space-y-1 flex-1 min-w-0">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span
                                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${visual.badgeColor}`}
                                        >
                                          {visual.label}
                                        </span>

                                        {!n.is_read ? (
                                          <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-black uppercase flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                            <span>Unread</span>
                                          </span>
                                        ) : (
                                          <span className="text-[10px] text-slate-400 font-medium">Read</span>
                                        )}

                                        {n.created_at && (
                                          <span className="text-[11px] text-slate-400 font-mono">
                                            &bull;{" "}
                                            {new Date(n.created_at).toLocaleDateString("en-GB", {
                                              day: "numeric",
                                              month: "short",
                                              year: "numeric",
                                              hour: "2-digit",
                                              minute: "2-digit",
                                            })}
                                          </span>
                                        )}
                                      </div>

                                      <h4
                                        className={`text-sm leading-snug ${
                                          !n.is_read
                                            ? "font-extrabold text-slate-900"
                                            : "font-bold text-slate-800"
                                        }`}
                                      >
                                        {n.title}
                                      </h4>

                                      <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                                        {n.message}
                                      </p>
                                    </div>
                                  </div>

                                  {/* Right: Actions */}
                                  <div className="flex items-center gap-2 sm:self-center shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                                    {!n.is_read && (
                                      <button
                                        type="button"
                                        onClick={() => handleMarkOneAsRead(n.id)}
                                        className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                                      >
                                        <Check className="w-3.5 h-3.5" />
                                        <span>Mark Read</span>
                                      </button>
                                    )}

                                    <button
                                      type="button"
                                      onClick={() => handleDeleteNotification(n.id)}
                                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                                      title="Delete Notification"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </>
                  )}

                </div>
              )}

              {/* ── SETTINGS SECTION ── */}
              {activeNav === "settings" && (
                <div className="space-y-6">

                  {/* 1. Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-extrabold uppercase tracking-wider">
                          Account &bull; Preferences
                        </span>
                      </div>
                      <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
                        Settings &amp; Account
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                        Manage your account credentials, security, study preferences, and dashboard display.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="px-4 py-2 bg-slate-100 hover:bg-red-50 hover:text-red-700 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Log Out</span>
                      </button>
                    </div>
                  </div>

                  {/* 2. Grid Layout (2 Columns: Left 6 / Right 6) */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                    {/* ── LEFT COLUMN (6 COLS) ── */}
                    <div className="lg:col-span-6 space-y-6">

                      {/* Card A: Account Information */}
                      <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-5">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-black">
                              <User className="w-5 h-5" />
                            </div>
                            <div>
                              <h3 className="text-sm font-extrabold text-slate-900">Account Information</h3>
                              <p className="text-xs text-slate-500">Your official MtishbiScholar student credentials</p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => setActiveNav("profile")}
                            className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <span>Edit Profile</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                            <p className="text-[10px] text-slate-400 font-bold uppercase">Full Legal Name</p>
                            <p className="font-extrabold text-slate-900 text-sm truncate">{studentFullName}</p>
                          </div>

                          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                            <p className="text-[10px] text-slate-400 font-bold uppercase">Registered Email</p>
                            <p className="font-extrabold text-slate-900 text-sm truncate">
                              {currentUser?.email || dashData?.profile?.email || "Not specified"}
                            </p>
                          </div>

                          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                            <p className="text-[10px] text-slate-400 font-bold uppercase">Phone Number</p>
                            <p className="font-extrabold text-slate-900 text-sm">
                              {dashData?.profile?.phone || profileData.phone || "Not provided"}
                            </p>
                          </div>

                          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                            <p className="text-[10px] text-slate-400 font-bold uppercase">Profile Status</p>
                            <div className="flex items-center gap-1.5 pt-0.5">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                                  dashData?.profile?.is_profile_completed
                                    ? "bg-emerald-100 text-emerald-800"
                                    : "bg-amber-100 text-amber-800"
                                }`}
                              >
                                {dashData?.profile?.is_profile_completed ? "Completed (Active) ✓" : "Pending Profile Wizard"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Card B: Academic & Study Preferences */}
                      <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                              <GraduationCap className="w-4.5 h-4.5" />
                            </div>
                            <div>
                              <h3 className="text-sm font-extrabold text-slate-900">Study Preferences</h3>
                              <p className="text-[11px] text-slate-400">Your study abroad profile parameters</p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => setActiveNav("profile")}
                            className="text-xs font-bold text-emerald-700 hover:underline"
                          >
                            Edit
                          </button>
                        </div>

                        <div className="space-y-2.5 text-xs">
                          <div className="flex justify-between py-1.5 border-b border-slate-100">
                            <span className="text-slate-500">Nationality</span>
                            <span className="font-bold text-slate-800">{dashData?.profile?.nationality || "Tanzanian"}</span>
                          </div>
                          <div className="flex justify-between py-1.5 border-b border-slate-100">
                            <span className="text-slate-500">Highest Education</span>
                            <span className="font-bold text-slate-800">{dashData?.profile?.highest_education || "Not specified"}</span>
                          </div>
                          <div className="flex justify-between py-1.5 border-b border-slate-100">
                            <span className="text-slate-500">Preferred Country</span>
                            <span className="font-bold text-slate-800">{dashData?.applications?.[0]?.target_country || "Not specified"}</span>
                          </div>
                          <div className="flex justify-between py-1.5 border-b border-slate-100">
                            <span className="text-slate-500">Preferred Program</span>
                            <span className="font-bold text-slate-800 truncate max-w-[180px] text-right">
                              {dashData?.applications?.[0]?.preferred_course || "Not specified"}
                            </span>
                          </div>
                          <div className="flex justify-between py-1.5">
                            <span className="text-slate-500">Target Intake</span>
                            <span className="font-bold text-slate-800">{dashData?.applications?.[0]?.target_intake || "Not specified"}</span>
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* ── RIGHT COLUMN (6 COLS) ── */}
                    <div className="lg:col-span-6 space-y-6">

                      {/* Card C: Appearance / Theme */}
                      <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-4">
                        <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                            <Sun className="w-4.5 h-4.5" />
                          </div>
                          <div>
                            <h3 className="text-sm font-extrabold text-slate-900">Appearance</h3>
                            <p className="text-[11px] text-slate-400">Choose your preferred dashboard interface</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2.5">
                          {[
                            { id: "light", label: "Light", icon: Sun },
                            { id: "dark", label: "Dark", icon: Moon },
                            { id: "system", label: "System", icon: Monitor },
                          ].map((t) => {
                            const Icon = t.icon;
                            const isActive = selectedTheme === t.id;
                            return (
                              <button
                                key={t.id}
                                type="button"
                                onClick={() => handleThemeChange(t.id as any)}
                                className={`p-3.5 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                                  isActive
                                    ? "bg-blue-600 text-white font-extrabold border-blue-600 shadow-md shadow-blue-600/30"
                                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                                }`}
                              >
                                <div className="flex items-center gap-1.5">
                                  <Icon className="w-4 h-4" />
                                  {isActive && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                </div>
                                <span className="text-xs">{t.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Card D: In-Browser Notification Preferences */}
                      <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
                              <Bell className="w-4.5 h-4.5" />
                            </div>
                            <div>
                              <h3 className="text-sm font-extrabold text-slate-900">Notification Alerts</h3>
                              <p className="text-[11px] text-slate-400">Browser alerts and display preferences</p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => setActiveNav("notifications")}
                            className="text-xs font-bold text-purple-700 hover:underline"
                          >
                            View All
                          </button>
                        </div>

                        <div className="space-y-3 text-xs">
                          {[
                            { key: "app", label: "Application Status Updates", desc: "Notify when admission reviews change", state: notifAppPref },
                            { key: "pay", label: "Payment Verification Alerts", desc: "Receipt & file-opening fee approvals", state: notifPayPref },
                            { key: "adm", label: "University Offer Letters", desc: "Alerts when universities issue offer letters", state: notifAdmPref },
                            { key: "sound", label: "In-Browser Alert Sound", desc: "Audio cue for new notifications", state: notifSoundPref },
                          ].map((item) => (
                            <div key={item.key} className="flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors">
                              <div>
                                <p className="font-bold text-slate-800">{item.label}</p>
                                <p className="text-[10px] text-slate-400">{item.desc}</p>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleSaveNotifPref(item.key as any, !item.state)}
                                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                                  item.state ? "bg-blue-600" : "bg-slate-300"
                                }`}
                              >
                                <span
                                  className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                                    item.state ? "right-1" : "left-1"
                                  }`}
                                />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Card E: Danger Zone */}
                      <div className="p-5 rounded-3xl bg-red-50/50 border border-red-200/80 space-y-3">
                        <div className="flex items-center gap-2 text-red-700">
                          <ShieldAlert className="w-4.5 h-4.5" />
                          <h4 className="font-extrabold text-xs uppercase tracking-wider">Danger Zone</h4>
                        </div>
                        <p className="text-[11px] text-red-700/80 leading-relaxed">
                          Deleting your account permanently revokes access to your application records, verified documents, and offer letters. To request account closure, contact MtishbiScholar Support.
                        </p>
                        <a
                          href="https://wa.me/255700000000?text=Hello%20MtishbiScholar%20Support,%20I%20would%20like%20to%20request%20assistance%20regarding%20my%20account."
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center gap-1.5 w-full py-2.5 px-4 rounded-xl bg-white border border-red-200 text-red-700 hover:bg-red-50 text-xs font-bold transition-colors"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Contact Support for Deletion</span>
                        </a>
                      </div>

                    </div>

                  </div>

                </div>
              )}

            </div>
          )}

          {/* ── STUDENT CONNECT / CAMPUS CONNECT VIEW ── */}
          {activeNav === "connect" && (
            <div className="space-y-6">
              {/* Header Banner */}
              <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-800 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 bg-white/15 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider mb-2">
                    <Users className="w-3.5 h-3.5" />
                    <span>Campus Connect &bull; Peer-to-Peer Scholar Network</span>
                  </div>
                  <h2 className="text-2xl font-black tracking-tight">
                    Talk Directly to Tanzanian &amp; African Scholars Abroad
                  </h2>
                  <p className="text-xs text-emerald-100 mt-1 max-w-xl">
                    Connect with senior students currently studying at partner universities in India, UAE, China &amp; Cyprus. Ask about campus life, accommodation, food, and culture via WhatsApp!
                  </p>
                </div>
                <div className="px-4 py-2 bg-white/10 border border-white/20 rounded-2xl text-xs font-bold shrink-0 text-center">
                  <span className="block text-xl font-extrabold">{studentConnectList.length}</span>
                  <span className="text-emerald-100 text-[10px]">Verified Scholars Online</span>
                </div>
              </div>

              {/* Search & Filter Controls */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
                {/* Search Bar */}
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={connectSearch}
                    onChange={(e) => setConnectSearch(e.target.value)}
                    placeholder="Search by name, university, course (e.g. Joel, SRM, Computer Science)..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:border-emerald-600 focus:bg-white"
                  />
                  {connectSearch && (
                    <button
                      onClick={() => setConnectSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Country Filter */}
                <select
                  value={connectCountryFilter}
                  onChange={(e) => setConnectCountryFilter(e.target.value)}
                  className="w-full md:w-auto px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 outline-none focus:border-emerald-600 cursor-pointer"
                >
                  <option value="All">All Countries</option>
                  <option value="India">India 🇮🇳</option>
                  <option value="United Arab Emirates">United Arab Emirates 🇦🇪</option>
                  <option value="China">China 🇨🇳</option>
                  <option value="Cyprus">Cyprus 🇨🇾</option>
                </select>

                {/* Course Filter */}
                <select
                  value={connectCourseFilter}
                  onChange={(e) => setConnectCourseFilter(e.target.value)}
                  className="w-full md:w-auto px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 outline-none focus:border-emerald-600 cursor-pointer"
                >
                  <option value="All">All Courses</option>
                  <option value="Computer Science">Computer Science</option>
                </select>

                {/* Year Filter */}
                <select
                  value={connectYearFilter}
                  onChange={(e) => setConnectYearFilter(e.target.value)}
                  className="w-full md:w-auto px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 outline-none focus:border-emerald-600 cursor-pointer"
                >
                  <option value="All">All Years</option>
                  <option value="Active Scholar">Active Scholars</option>
                </select>
              </div>

              {/* Status Header */}
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
                <p>Showing <span className="font-extrabold text-slate-900">{filteredStudentConnect.length}</span> students</p>
              </div>

              {/* Grid of Student Cards (matching exact design from user screenshots, NO GPA) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
                {filteredStudentConnect.map((student) => (
                  <div
                    key={student.id}
                    className="bg-slate-100/90 border border-slate-200/90 hover:border-emerald-400 rounded-3xl p-5 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between items-center text-center group"
                  >
                    <div className="w-full flex flex-col items-center">
                      {/* Avatar with Online indicator */}
                      <div className="relative mb-3">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 text-white font-black text-lg flex items-center justify-center shadow-md">
                          {student.avatar}
                        </div>
                        {student.online && (
                          <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white" />
                        )}
                      </div>

                      {/* Name & University */}
                      <h4 className="font-extrabold text-slate-900 text-sm leading-snug group-hover:text-emerald-700 transition-colors">
                        {student.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 font-medium leading-tight mt-1 line-clamp-2">
                        {student.university}
                      </p>

                      {/* Course Badge */}
                      {student.course ? (
                        <span className="px-3 py-1 bg-blue-50 text-blue-700 text-[11px] font-bold rounded-full mt-3">
                          {student.course}
                        </span>
                      ) : null}

                      {/* Tags Row: Country & Year (NO GPA!) */}
                      <div className="flex items-center justify-center gap-1.5 mt-3 flex-wrap text-[10px] font-bold text-slate-600">
                        <span className="px-2 py-0.5 bg-white rounded-md border border-slate-200/80">
                          {student.flag} {student.country}
                        </span>
                        {(student as any).year && (
                          <span className="px-2 py-0.5 bg-amber-50 text-amber-800 rounded-md border border-amber-200/60">
                            {(student as any).year}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-2 w-full mt-5 pt-3 border-t border-slate-200/60">
                      <button
                        onClick={() => setSelectedStudentProfile(student)}
                        className="w-full bg-slate-200/80 hover:bg-slate-300 text-slate-800 font-bold text-[11px] py-2 rounded-xl transition-all border border-slate-300/60"
                      >
                        View Profile
                      </button>

                      <a
                        href={`https://wa.me/${student.phone.replace(/[^0-9]/g, "")}?text=Hello%20${encodeURIComponent(student.name)},%20I%20found%20your%20profile%20on%20MtishbiScholar%20Student%20Connect!`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-extrabold text-[11px] py-2 rounded-xl transition-all border border-emerald-300/80 flex items-center justify-center gap-1"
                      >
                        <MessageSquare className="w-3 h-3 text-emerald-600" />
                        <span>Connect</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── STUDENT PROFILE DETAIL MODAL (Light Theme, NO GPA, NO Admission/Scholarship) ── */}
          <AnimatePresence>
            {selectedStudentProfile && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full p-6 md:p-8 text-slate-800 relative shadow-2xl space-y-6"
                >
                  {/* Close Button */}
                  <button
                    onClick={() => setSelectedStudentProfile(null)}
                    className="absolute top-5 right-5 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-all z-10"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  {/* Profile Header */}
                  <div className="flex items-center gap-4 border-b border-slate-100 pb-5">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 text-white font-black text-xl flex items-center justify-center shadow-md">
                        {selectedStudentProfile.avatar}
                      </div>
                      {selectedStudentProfile.online && (
                        <span className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white" />
                      )}
                    </div>

                    <div>
                      <h3 className="text-xl font-black text-slate-900">{selectedStudentProfile.name}</h3>
                      <p className="text-xs font-medium text-slate-600">{selectedStudentProfile.university}</p>
                      <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{selectedStudentProfile.location}</span>
                      </p>
                    </div>
                  </div>

                  {/* Tag Pills */}
                  <div className="flex items-center gap-2 flex-wrap text-xs font-bold">
                    <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-100">
                      {selectedStudentProfile.flag} {selectedStudentProfile.country}
                    </span>
                    {selectedStudentProfile.course && (
                      <span className="px-3 py-1 bg-emerald-50 text-emerald-800 rounded-full border border-emerald-200">
                        {selectedStudentProfile.courseDetail || selectedStudentProfile.course}
                      </span>
                    )}
                    {selectedStudentProfile.year && (
                      <span className="px-3 py-1 bg-amber-50 text-amber-800 rounded-full border border-amber-200">
                        {selectedStudentProfile.year}
                      </span>
                    )}
                    {selectedStudentProfile.online && (
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        Online
                      </span>
                    )}
                  </div>

                  {/* ABOUT */}
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">About</h4>
                    <p className="text-xs text-slate-600 leading-relaxed font-normal bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      {selectedStudentProfile.bio}
                    </p>
                  </div>

                  {/* STUDENT DETAILS (4 Grid Cards - NO GPA) */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Student Details</h4>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="p-3 bg-slate-100/70 rounded-xl border border-slate-200/60">
                        <p className="text-[10px] text-slate-400 font-bold uppercase">From</p>
                        <p className="font-extrabold text-slate-800 mt-0.5">{selectedStudentProfile.from || "Tanzania"}</p>
                      </div>
                      <div className="p-3 bg-slate-100/70 rounded-xl border border-slate-200/60">
                        <p className="text-[10px] text-slate-400 font-bold uppercase">University / Institution</p>
                        <p className="font-extrabold text-slate-800 mt-0.5 truncate">{selectedStudentProfile.university}</p>
                      </div>
                      <div className="p-3 bg-slate-100/70 rounded-xl border border-slate-200/60">
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Program / Course</p>
                        <p className="font-extrabold text-slate-800 mt-0.5 truncate">{selectedStudentProfile.courseDetail || selectedStudentProfile.course || "Scholar Program"}</p>
                      </div>
                      <div className="p-3 bg-slate-100/70 rounded-xl border border-slate-200/60">
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Country</p>
                        <p className="font-extrabold text-slate-800 mt-0.5">{selectedStudentProfile.flag} {selectedStudentProfile.country}</p>
                      </div>
                    </div>
                  </div>

                  {/* CAN HELP WITH (NO Admission Process / Scholarship) */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Can Help With</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedStudentProfile.helpWith.map((item: string, i: number) => (
                        <span key={i} className="px-3 py-1.5 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{item}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Bottom Actions */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                    <a
                      href={`https://wa.me/${selectedStudentProfile.phone.replace(/[^0-9]/g, "")}?text=Hello%20${encodeURIComponent(selectedStudentProfile.name)},%20I%20found%20your%20profile%20on%20MtishbiScholar%20Student%20Connect!`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3 rounded-xl transition-all text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Connect on WhatsApp</span>
                    </a>

                    <button
                      onClick={() => setSelectedStudentProfile(null)}
                      className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* ── DELETE PROFILE & START OVER MODAL ── */}
          <AnimatePresence>
            {showDeleteProfileModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 15 }}
                  className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-red-100 overflow-hidden"
                >
                  <div className="p-5 sm:p-6 bg-gradient-to-r from-red-50 via-rose-50 to-red-50 border-b border-red-100 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-red-600/30">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-base text-red-950">Delete your profile?</h3>
                      <p className="text-xs text-red-800 font-medium">This action is permanent and cannot be undone.</p>
                    </div>
                  </div>

                  <div className="p-5 sm:p-6 space-y-4 text-xs">
                    <div className="p-3.5 bg-red-50/80 border border-red-200 rounded-xl text-red-800 leading-relaxed space-y-1.5 font-medium">
                      <p>
                        Deleting your profile will permanently remove your profile information, academic information, parent/guardian/sponsor details, applications, uploaded documents, and other associated student data.
                      </p>
                      <p className="font-bold text-red-900">This action cannot be undone.</p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block font-bold text-slate-700">
                        To confirm, please type <span className="font-mono font-extrabold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">DELETE</span> in capital letters below:
                      </label>
                      <input
                        type="text"
                        value={deleteConfirmationInput}
                        onChange={(e) => setDeleteConfirmationInput(e.target.value)}
                        placeholder="Type DELETE to confirm"
                        className="w-full p-2.5 rounded-xl border border-slate-300 outline-none focus:border-red-600 font-mono text-sm uppercase"
                      />
                    </div>

                    {deleteProfileError && (
                      <div className="p-3 rounded-xl bg-red-100 text-red-700 text-xs font-semibold flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{deleteProfileError}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-3 pt-2">
                      <button
                        type="button"
                        disabled={isDeletingProfile}
                        onClick={() => {
                          setShowDeleteProfileModal(false);
                          setDeleteConfirmationInput("");
                          setDeleteProfileError("");
                        }}
                        className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-100 transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={deleteConfirmationInput.trim() !== "DELETE" || isDeletingProfile}
                        onClick={handleDeleteProfilePermanently}
                        className="px-5 py-2.5 rounded-xl bg-red-600 text-white font-extrabold hover:bg-red-700 transition-all shadow-md shadow-red-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {isDeletingProfile ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Deleting Profile...</span>
                          </>
                        ) : (
                          <>
                            <Trash2 className="w-4 h-4" />
                            <span>Delete Profile Permanently</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* ── PAYMENT LOCK MODAL ── */}
          <AnimatePresence>
            {showPaymentLockModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 15 }}
                  className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-amber-200 overflow-hidden"
                >
                  <div className="p-6 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border-b border-amber-200 flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/30">
                      <Lock className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-900 font-extrabold text-[10px] uppercase tracking-wider">
                        Finance Verification Required
                      </span>
                      <h3 className="font-black text-base text-slate-900 mt-0.5">Application Feature Locked</h3>
                    </div>
                  </div>

                  <div className="p-6 space-y-4 text-xs">
                    <div className="p-4 bg-amber-50/80 border border-amber-200/80 rounded-2xl text-slate-700 leading-relaxed font-medium">
                      <p className="text-slate-800 font-semibold leading-relaxed">
                        {paymentLockMessage ||
                          "Your TSh 50,000 MtishbiScholar Application File Opening Fee must be approved by a Finance Officer before you can access university applications."}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-2">
                        Once your payment receipt is verified and marked <strong>Approved</strong>, all university application features and direct submissions will unlock immediately.
                      </p>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowPaymentLockModal(false)}
                        className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-100 transition-colors cursor-pointer"
                      >
                        Dismiss
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowPaymentLockModal(false);
                          setActiveNav("payments");
                        }}
                        className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold transition-all shadow-md shadow-blue-600/20 flex items-center gap-2 cursor-pointer"
                      >
                        <CreditCard className="w-4 h-4" />
                        <span>Go to Payments &rarr;</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* ── RECEIPT PREVIEW MODAL ── */}
          <AnimatePresence>
            {previewReceiptModal.isOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 15 }}
                  className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
                >
                  <div className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-sm">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-black text-base text-slate-900">{previewReceiptModal.title}</h3>
                        <p className="text-[11px] text-slate-500">Secure student payment document preview</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setPreviewReceiptModal((prev) => ({ ...prev, isOpen: false }))}
                      className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="p-6 flex-1 overflow-y-auto flex items-center justify-center bg-slate-50 min-h-[350px]">
                    {previewReceiptModal.loading ? (
                      <div className="flex flex-col items-center justify-center gap-3 text-slate-500 py-12">
                        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        <p className="text-xs font-semibold">Generating secure receipt preview link...</p>
                      </div>
                    ) : previewReceiptModal.url ? (
                      previewReceiptModal.isPdf ? (
                        <div className="w-full h-[60vh] flex flex-col rounded-2xl overflow-hidden border border-slate-200 bg-white">
                          <iframe
                            src={previewReceiptModal.url}
                            className="w-full h-full"
                            title="Receipt PDF Preview"
                          />
                        </div>
                      ) : (
                        <div className="max-w-full max-h-[60vh] flex items-center justify-center p-2">
                          <img
                            src={previewReceiptModal.url}
                            alt="Receipt Preview"
                            className="max-h-[58vh] max-w-full object-contain rounded-2xl shadow-md border border-slate-200 bg-white"
                          />
                        </div>
                      )
                    ) : (
                      <div className="text-center py-12 text-slate-400">
                        <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                        <p className="text-xs">No receipt preview could be loaded.</p>
                      </div>
                    )}
                  </div>

                  <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-between gap-3">
                    {previewReceiptModal.url ? (
                      <a
                        href={previewReceiptModal.url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>Open Full Screen / Download ↗</span>
                      </a>
                    ) : (
                      <div />
                    )}

                    <button
                      type="button"
                      onClick={() => setPreviewReceiptModal((prev) => ({ ...prev, isOpen: false }))}
                      className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-extrabold text-xs hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      Close Preview
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </main>
      </div>

    </div>
  );
}

export default function StudentDashboard() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex items-center justify-center">Loading Student Panel...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
