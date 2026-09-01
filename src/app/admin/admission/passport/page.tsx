"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  Search,
  Eye,
  ChevronRight,
  RefreshCw,
  AlertTriangle,
  Globe,
  FileText,
  User,
  Phone,
  MapPin,
  Calendar,
  CheckCircle2,
  Clock,
  Check,
  X,
  ExternalLink,
  ShieldCheck,
  Download,
  AlertCircle,
  FileCheck2,
  MessageSquarePlus,
  Send,
  Lock,
} from "lucide-react";
import StatusBadge from "@/components/admin/admission/StatusBadge";
import { useAdminAuth } from "@/components/admin/AdminAuthProvider";
import { createClient } from "@/lib/supabase/client";

export interface AssistanceRequest {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentPhone: string;
  nationality: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  dateOfBirth?: string;
  sex?: string;
  maritalStatus?: string;
  postalAddress?: string;
  birthCountry?: string;
  birthRegion?: string;
  birthDistrict?: string;
  birthWard?: string;
  birthVillageStreet?: string;
  residenceCountry?: string;
  residenceRegion?: string;
  residenceDistrict?: string;
  residenceWard?: string;
  residenceStreetVillage?: string;
  residenceHouseNumber?: string;
  fatherFullName?: string;
  fatherOccupation?: string;
  fatherDob?: string;
  fatherBirthCountry?: string;
  fatherBirthRegion?: string;
  fatherBirthDistrict?: string;
  fatherBirthWard?: string;
  fatherBirthVillage?: string;
  motherFullName?: string;
  motherOccupation?: string;
  motherDob?: string;
  motherBirthCountry?: string;
  motherBirthRegion?: string;
  motherBirthDistrict?: string;
  motherBirthWard?: string;
  motherBirthVillage?: string;
  assistanceStatus: string;
  status: string;
  paymentStatus: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
  documents?: any[];
}

export interface ExistingPassport {
  id: string;
  studentName: string;
  studentEmail: string;
  studentPhone: string;
  nationality: string;
  passportNumber: string;
  issueDate: string;
  expiryDate: string;
  hasUploadedCopy: boolean;
  documentId?: string;
  documentUrl?: string | null;
  documentVerified: boolean;
  createdAt: string;
}

function StudentAvatar({ name, avatarUrl }: { name: string; avatarUrl?: string | null }) {
  const [imgError, setImgError] = useState(false);
  const initials = (name || "ST").slice(0, 2).toUpperCase();

  if (avatarUrl && !imgError) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        onError={() => setImgError(true)}
        className="w-9 h-9 rounded-full object-cover border border-slate-200 shadow-2xs shrink-0"
      />
    );
  }

  return (
    <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 font-extrabold flex items-center justify-center text-xs border border-blue-200 shrink-0">
      {initials}
    </div>
  );
}

export default function PassportPage() {
  const { loading: authLoading } = useAdminAuth();
  const [activeMainTab, setActiveMainTab] = useState<"assistance" | "existing">("assistance");
  const [assistanceFilter, setAssistanceFilter] = useState<string>("All"); // All, Pending, Processing, Completed
  const [search, setSearch] = useState<string>("");

  const [assistanceRequests, setAssistanceRequests] = useState<AssistanceRequest[]>([]);
  const [existingPassports, setExistingPassports] = useState<ExistingPassport[]>([]);
  const [counts, setCounts] = useState<any>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Selected Assistance Request Modal State
  const [selectedRequest, setSelectedRequest] = useState<AssistanceRequest | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);
  const [showCompletedForm, setShowCompletedForm] = useState<boolean>(false);
  const [newPassportNumber, setNewPassportNumber] = useState<string>("");
  const [newIssueDate, setNewIssueDate] = useState<string>("");
  const [newExpiryDate, setNewExpiryDate] = useState<string>("");

  // Comment/Note State
  const [officerNote, setOfficerNote] = useState<string>("");
  const [isSendingNote, setIsSendingNote] = useState<boolean>(false);
  const [modalFeedback, setModalFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Document Lightbox Preview
  const [previewDocUrl, setPreviewDocUrl] = useState<string | null>(null);
  const [previewDocTitle, setPreviewDocTitle] = useState<string>("Passport Document");
  const [previewLoading, setPreviewLoading] = useState<boolean>(false);

  const loadPassportData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      const res = await fetch("/api/admin/admission/passport", {
        headers,
        credentials: "include",
      });

      if (!res.ok) {
        let errorMsg = `Server response error (${res.status})`;
        try {
          const errJson = await res.json();
          errorMsg = errJson.error || errorMsg;
        } catch {}
        throw new Error(errorMsg);
      }

      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error || "Failed to load passport requests.");
      }

      setAssistanceRequests(json.assistanceRequests || []);
      setExistingPassports(json.existingPassports || []);
      setCounts(json.counts || {});
    } catch (err: any) {
      console.error("[PassportPage] Error:", err);
      setError(err.message || "Failed to load passport requests.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) {
      loadPassportData();
    }
  }, [authLoading, loadPassportData]);

  // Filtered Assistance Requests (Only verified payments)
  const filteredAssistance = useMemo(() => {
    return assistanceRequests.filter((r) => {
      const matchFilter =
        assistanceFilter === "All" ||
        (assistanceFilter === "Pending" && (r.assistanceStatus === "form_pending" || r.status === "pending")) ||
        (assistanceFilter === "Processing" && (r.assistanceStatus === "processing" || r.assistanceStatus === "form_completed")) ||
        (assistanceFilter === "Completed" && r.assistanceStatus === "completed");

      const matchSearch =
        !search.trim() ||
        r.studentName.toLowerCase().includes(search.toLowerCase()) ||
        r.studentEmail.toLowerCase().includes(search.toLowerCase()) ||
        (r.birthRegion && r.birthRegion.toLowerCase().includes(search.toLowerCase())) ||
        (r.studentPhone && r.studentPhone.includes(search));

      return matchFilter && matchSearch;
    });
  }, [assistanceRequests, assistanceFilter, search]);

  // Filtered Existing Passports (Strictly has_passport = Yes)
  const filteredExisting = useMemo(() => {
    return existingPassports.filter((p) => {
      const matchSearch =
        !search.trim() ||
        p.studentName.toLowerCase().includes(search.toLowerCase()) ||
        p.studentEmail.toLowerCase().includes(search.toLowerCase()) ||
        p.passportNumber.toLowerCase().includes(search.toLowerCase()) ||
        p.studentPhone.includes(search);

      return matchSearch;
    });
  }, [existingPassports, search]);

  // Handle status update of passport assistance request
  const handleUpdateStatus = async (status: string) => {
    if (!selectedRequest) return;
    try {
      setIsUpdatingStatus(true);
      setModalFeedback(null);

      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (session?.access_token) headers["Authorization"] = `Bearer ${session.access_token}`;

      const res = await fetch("/api/admin/admission/passport", {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          assistanceId: selectedRequest.id,
          studentId: selectedRequest.studentId,
          assistanceStatus: status,
          passportNumber: newPassportNumber.trim() || undefined,
          issueDate: newIssueDate || undefined,
          expiryDate: newExpiryDate || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to update passport status.");
      }

      // Update local state
      setAssistanceRequests((prev) =>
        prev.map((r) => (r.id === selectedRequest.id ? { ...r, assistanceStatus: status } : r))
      );
      if (selectedRequest) {
        setSelectedRequest({ ...selectedRequest, assistanceStatus: status });
      }

      setShowCompletedForm(false);
      setModalFeedback({
        type: "success",
        message:
          status === "processing"
            ? "Marked as Processing with Immigration! Notification sent to student."
            : "Marked as Completed & Passport issued! Notification sent to student.",
      });
    } catch (err: any) {
      setModalFeedback({ type: "error", message: err.message || "Failed to update status." });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Handle sending note/comment to student
  const handleSendNote = async () => {
    if (!selectedRequest || !officerNote.trim()) return;
    try {
      setIsSendingNote(true);
      setModalFeedback(null);

      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (session?.access_token) headers["Authorization"] = `Bearer ${session.access_token}`;

      const res = await fetch("/api/admin/admission/passport", {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          actionType: "send_comment",
          assistanceId: selectedRequest.id,
          studentId: selectedRequest.studentId,
          notes: officerNote.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to send note.");
      }

      setSelectedRequest((prev) => (prev ? { ...prev, notes: officerNote.trim() } : prev));
      setOfficerNote("");
      setModalFeedback({ type: "success", message: "Instruction note sent to student portal notification!" });
    } catch (err: any) {
      setModalFeedback({ type: "error", message: err.message || "Failed to send note." });
    } finally {
      setIsSendingNote(false);
    }
  };

  // Preview document
  const handlePreviewDoc = async (fileUrlOrPath: string, title = "Passport Copy") => {
    if (!fileUrlOrPath) {
      alert("No document file attached.");
      return;
    }
    try {
      setPreviewLoading(true);
      setPreviewDocTitle(title);
      setPreviewDocUrl("");

      const supabase = createClient();
      let signedUrl = fileUrlOrPath;
      if (!fileUrlOrPath.startsWith("http")) {
        let cleanPath = fileUrlOrPath;
        if (cleanPath.startsWith("student-documents/")) {
          cleanPath = cleanPath.replace(/^student-documents\//, "");
        }
        const { data } = await supabase.storage
          .from("student-documents")
          .createSignedUrl(cleanPath, 60 * 60);

        if (data?.signedUrl) {
          signedUrl = data.signedUrl;
        }
      }

      setPreviewDocUrl(signedUrl);
    } catch (err: any) {
      alert("Failed to load document preview.");
    } finally {
      setPreviewLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumbs & Header */}
      <div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2">
          <Home className="w-3.5 h-3.5" />
          <ChevronRight className="w-3 h-3" />
          <Link href="/admin/admission/dashboard" className="hover:text-blue-600">
            Dashboard
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-600 font-medium">Passport Management</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
              <Globe className="w-6 h-6 text-blue-600" />
              <span>Passport Management</span>
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-1">
              Manage student passport assistance forms and verify on-file passports.
            </p>
          </div>

          <button
            onClick={loadPassportData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition-all cursor-pointer disabled:opacity-60 self-start sm:self-auto"
          >
            <RefreshCw className={`w-4 h-4 text-slate-400 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
          <button
            onClick={loadPassportData}
            className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Main Section Switcher Tabs */}
      <div className="grid grid-cols-2 w-full sm:w-auto sm:inline-flex items-center gap-1.5 sm:gap-2 bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/80">
        <button
          type="button"
          onClick={() => {
            setActiveMainTab("assistance");
            setSearch("");
          }}
          className={`flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 px-3 sm:px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
            activeMainTab === "assistance"
              ? "bg-white text-blue-600 shadow-xs border border-slate-200/60"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <FileText className="w-4 h-4 shrink-0" />
          <span className="truncate">Assistance <span className="hidden sm:inline">Requests</span></span>
          <span className="px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-black bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
            {counts.assistanceTotal || assistanceRequests.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveMainTab("existing");
            setSearch("");
          }}
          className={`flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 px-3 sm:px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
            activeMainTab === "existing"
              ? "bg-white text-blue-600 shadow-xs border border-slate-200/60"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span className="truncate">Existing <span className="hidden sm:inline">Passports</span></span>
          <span className="px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
            {counts.existingTotal || existingPassports.length}
          </span>
        </button>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* SECTION 1: PASSPORT ASSISTANCE REQUESTS                       */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeMainTab === "assistance" && (
        <div className="space-y-4">
          {/* Sub-filter bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {["All", "Pending", "Processing", "Completed"].map((tab) => {
                const count =
                  tab === "All"
                    ? assistanceRequests.length
                    : tab === "Pending"
                    ? counts.assistancePending || 0
                    : tab === "Processing"
                    ? counts.assistanceProcessing || 0
                    : counts.assistanceCompleted || 0;

                return (
                  <button
                    key={tab}
                    onClick={() => setAssistanceFilter(tab)}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      assistanceFilter === tab
                        ? "bg-blue-600 text-white shadow-xs"
                        : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
                    }`}
                  >
                    <span>{tab}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        assistanceFilter === tab ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search student, email, region..."
                className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-600 outline-none transition-colors"
              />
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Student</th>
                    <th className="py-3.5 px-4">Contact</th>
                    <th className="py-3.5 px-4">Birth Location</th>
                    <th className="py-3.5 px-4">Assistance Status</th>
                    <th className="py-3.5 px-4">Submitted Date</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        Loading assistance requests...
                      </td>
                    </tr>
                  ) : filteredAssistance.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        No passport assistance requests found.
                      </td>
                    </tr>
                  ) : (
                    filteredAssistance.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <StudentAvatar name={row.studentName} />
                            <div>
                              <div className="font-bold text-slate-900">{row.studentName}</div>
                              <div className="text-[11px] text-slate-500">{row.nationality}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="text-slate-800 font-medium">{row.studentEmail}</div>
                          <div className="text-[11px] text-slate-500">{row.studentPhone}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="text-slate-800 font-medium">
                            {row.birthRegion || "Tanzania"}, {row.birthDistrict || ""}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {row.birthWard || ""} {row.birthVillageStreet ? `• ${row.birthVillageStreet}` : ""}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide border ${
                              row.assistanceStatus === "completed"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : row.assistanceStatus === "processing"
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : "bg-amber-50 text-amber-700 border-amber-200"
                            }`}
                          >
                            {row.assistanceStatus.replace("_", " ")}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500">
                          {new Date(row.createdAt).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedRequest(row);
                              setModalFeedback(null);
                              setShowCompletedForm(false);
                              setNewPassportNumber("");
                              setOfficerNote(row.notes || "");
                            }}
                            className="px-3.5 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 font-extrabold text-xs transition-colors border border-blue-200 flex items-center gap-1.5 ml-auto cursor-pointer shadow-2xs"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* SECTION 2: EXISTING PASSPORTS (ON FILE)                       */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeMainTab === "existing" && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-xs text-slate-500 font-medium">
              Students who registered with a pre-existing passport on file.
            </p>
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search passport number, student..."
                className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-600 outline-none transition-colors"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Student</th>
                    <th className="py-3.5 px-4">Passport Number</th>
                    <th className="py-3.5 px-4">Issue Date</th>
                    <th className="py-3.5 px-4">Expiry Date</th>
                    <th className="py-3.5 px-4">Copy Uploaded</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        Loading existing passports...
                      </td>
                    </tr>
                  ) : filteredExisting.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        No existing passport records found.
                      </td>
                    </tr>
                  ) : (
                    filteredExisting.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <StudentAvatar name={p.studentName} />
                            <div>
                              <div className="font-bold text-slate-900">{p.studentName}</div>
                              <div className="text-[11px] text-slate-500">{p.studentEmail} • {p.studentPhone}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                            {p.passportNumber}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 font-medium">{p.issueDate}</td>
                        <td className="py-3.5 px-4 text-slate-600 font-medium">{p.expiryDate}</td>
                        <td className="py-3.5 px-4">
                          {p.hasUploadedCopy ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Copy on File</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                              <span>Number Only</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {p.documentUrl ? (
                            <button
                              type="button"
                              onClick={() => handlePreviewDoc(p.documentUrl!, `${p.studentName} - Passport Copy`)}
                              className="px-3.5 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 font-extrabold text-xs transition-colors border border-blue-200 flex items-center gap-1.5 ml-auto cursor-pointer shadow-2xs"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View Copy</span>
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">No File Copy</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* MODAL: FULL PASSPORT ASSISTANCE FORM DETAILS                  */}
      {/* ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedRequest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
            >
              {/* Modal Header */}
              <div className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-600/20">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900">
                      Passport Assistance Form &ndash; {selectedRequest.studentName}
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Submitted on {new Date(selectedRequest.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedRequest(null);
                    setModalFeedback(null);
                  }}
                  className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Feedback Banner */}
              {modalFeedback && (
                <div
                  className={`px-5 py-3 border-b flex items-center justify-between text-xs font-semibold ${
                    modalFeedback.type === "success"
                      ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                      : "bg-red-50 border-red-200 text-red-800"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {modalFeedback.type === "success" ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                    )}
                    <span>{modalFeedback.message}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setModalFeedback(null)}
                    className="text-slate-400 hover:text-slate-700"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
                {/* ──────────────────────────────────────────────────────────── */}
                {/* SECTION 1: APPLICANT INFORMATION (Q1 - Q14)                  */}
                {/* ──────────────────────────────────────────────────────────── */}
                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3.5">
                  <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
                    <h4 className="font-extrabold text-xs text-blue-900 uppercase tracking-wider flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-black flex items-center justify-center">1</span>
                      <span>Applicant Information / Taarifa za Mwombaji</span>
                    </h4>
                    <span className="text-[10px] font-bold text-slate-500 bg-white px-2.5 py-0.5 rounded-full border border-slate-200">
                      Questions 1 to 14
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">1. First Name / Jina la kwanza</span>
                      <p className="font-bold text-slate-900 mt-0.5">{selectedRequest.firstName || "N/A"}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">2. Middle Name / Jina la kati</span>
                      <p className="font-bold text-slate-900 mt-0.5">{selectedRequest.middleName || "-"}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">3. Last Name / Jina la ukoo</span>
                      <p className="font-bold text-slate-900 mt-0.5">{selectedRequest.lastName || "N/A"}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">4. Gender / Jinsia</span>
                      <p className="font-bold text-slate-900 mt-0.5">{selectedRequest.sex || "N/A"}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">5. Date of Birth / Tarehe ya kuzaliwa</span>
                      <p className="font-bold text-slate-900 mt-0.5">{selectedRequest.dateOfBirth || "N/A"}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">6. Country of Birth / Nchi ya kuzaliwa</span>
                      <p className="font-bold text-slate-900 mt-0.5">{selectedRequest.birthCountry || "Tanzania"}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">7. Region of Birth / Mkoa uliozaliwa</span>
                      <p className="font-bold text-slate-900 mt-0.5">{selectedRequest.birthRegion || "N/A"}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">8. District of Birth / Wilaya uliyozaliwa</span>
                      <p className="font-bold text-slate-900 mt-0.5">{selectedRequest.birthDistrict || "N/A"}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">9. Ward of Birth / Kata uliyozaliwa</span>
                      <p className="font-bold text-slate-900 mt-0.5">{selectedRequest.birthWard || "N/A"}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">10. Village / Street / Kijiji au Mtaa</span>
                      <p className="font-bold text-slate-900 mt-0.5">{selectedRequest.birthVillageStreet || "N/A"}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">11. Marital Status / Hali ya ndoa</span>
                      <p className="font-bold text-slate-900 mt-0.5">{selectedRequest.maritalStatus || "Single"}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">12. Phone / Namba ya simu</span>
                      <p className="font-bold text-slate-900 mt-0.5">{selectedRequest.studentPhone || "N/A"}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">13. Email / Barua pepe</span>
                      <p className="font-bold text-slate-900 mt-0.5 break-all">{selectedRequest.studentEmail || "N/A"}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">14. Postal Address / Sanduku la Posta</span>
                      <p className="font-bold text-slate-900 mt-0.5">{selectedRequest.postalAddress || "N/A"}</p>
                    </div>
                  </div>
                </div>

                {/* ──────────────────────────────────────────────────────────── */}
                {/* SECTION 2: CURRENT RESIDENCE (Q15 - Q20)                     */}
                {/* ──────────────────────────────────────────────────────────── */}
                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3.5">
                  <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
                    <h4 className="font-extrabold text-xs text-blue-900 uppercase tracking-wider flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-black flex items-center justify-center">2</span>
                      <span>Current Residence / Makazi ya Sasa</span>
                    </h4>
                    <span className="text-[10px] font-bold text-slate-500 bg-white px-2.5 py-0.5 rounded-full border border-slate-200">
                      Questions 15 to 20
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">15. Country of Residence / Nchi unayoishi</span>
                      <p className="font-bold text-slate-900 mt-0.5">{selectedRequest.residenceCountry || "Tanzania"}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">16. Current Region / Mkoa unaoishi</span>
                      <p className="font-bold text-slate-900 mt-0.5">{selectedRequest.residenceRegion || "N/A"}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">17. Current District / Wilaya unayoishi</span>
                      <p className="font-bold text-slate-900 mt-0.5">{selectedRequest.residenceDistrict || "N/A"}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">18. Current Ward / Kata unayoishi</span>
                      <p className="font-bold text-slate-900 mt-0.5">{selectedRequest.residenceWard || "N/A"}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">19. Street / Village / Kijiji au Mtaa</span>
                      <p className="font-bold text-slate-900 mt-0.5">{selectedRequest.residenceStreetVillage || "N/A"}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">20. House Number / Namba ya nyumba</span>
                      <p className="font-bold text-slate-900 mt-0.5">{selectedRequest.residenceHouseNumber || "N/A"}</p>
                    </div>
                  </div>
                </div>

                {/* ──────────────────────────────────────────────────────────── */}
                {/* SECTION 3: FATHER'S INFORMATION (Q21 - Q28)                  */}
                {/* ──────────────────────────────────────────────────────────── */}
                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3.5">
                  <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
                    <h4 className="font-extrabold text-xs text-blue-900 uppercase tracking-wider flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-black flex items-center justify-center">3</span>
                      <span>Father&apos;s Information / Taarifa za Baba</span>
                    </h4>
                    <span className="text-[10px] font-bold text-slate-500 bg-white px-2.5 py-0.5 rounded-full border border-slate-200">
                      Questions 21 to 28
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">21. Full Name / Jina kamili</span>
                      <p className="font-bold text-slate-900 mt-0.5">{selectedRequest.fatherFullName || "N/A"}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">22. Occupation / Kazi ya baba</span>
                      <p className="font-bold text-slate-900 mt-0.5">{selectedRequest.fatherOccupation || "N/A"}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">23. Date of Birth / Tarehe ya kuzaliwa</span>
                      <p className="font-bold text-slate-900 mt-0.5">{selectedRequest.fatherDob || "N/A"}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">24. Country of Birth / Nchi aliyozaliwa</span>
                      <p className="font-bold text-slate-900 mt-0.5">{selectedRequest.fatherBirthCountry || "Tanzania"}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">25. Region of Birth / Mkoa aliozaliwa</span>
                      <p className="font-bold text-slate-900 mt-0.5">{selectedRequest.fatherBirthRegion || "N/A"}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">26. District of Birth / Wilaya aliyozaliwa</span>
                      <p className="font-bold text-slate-900 mt-0.5">{selectedRequest.fatherBirthDistrict || "N/A"}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">27. Ward / Shehia / Kata aliyozaliwa</span>
                      <p className="font-bold text-slate-900 mt-0.5">{selectedRequest.fatherBirthWard || "N/A"}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">28. Street / Village / Mtaa aliozaliwa</span>
                      <p className="font-bold text-slate-900 mt-0.5">{selectedRequest.fatherBirthVillage || "N/A"}</p>
                    </div>
                  </div>
                </div>

                {/* ──────────────────────────────────────────────────────────── */}
                {/* SECTION 4: MOTHER'S INFORMATION (Q29 - Q36)                  */}
                {/* ──────────────────────────────────────────────────────────── */}
                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3.5">
                  <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
                    <h4 className="font-extrabold text-xs text-blue-900 uppercase tracking-wider flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-black flex items-center justify-center">4</span>
                      <span>Mother&apos;s Information / Taarifa za Mama</span>
                    </h4>
                    <span className="text-[10px] font-bold text-slate-500 bg-white px-2.5 py-0.5 rounded-full border border-slate-200">
                      Questions 29 to 36
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">29. Full Name / Jina kamili</span>
                      <p className="font-bold text-slate-900 mt-0.5">{selectedRequest.motherFullName || "N/A"}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">30. Occupation / Kazi ya mama</span>
                      <p className="font-bold text-slate-900 mt-0.5">{selectedRequest.motherOccupation || "N/A"}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">31. Date of Birth / Tarehe ya kuzaliwa</span>
                      <p className="font-bold text-slate-900 mt-0.5">{selectedRequest.motherDob || "N/A"}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">32. Country of Birth / Nchi aliyozaliwa</span>
                      <p className="font-bold text-slate-900 mt-0.5">{selectedRequest.motherBirthCountry || "Tanzania"}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">33. Region of Birth / Mkoa aliozaliwa</span>
                      <p className="font-bold text-slate-900 mt-0.5">{selectedRequest.motherBirthRegion || "N/A"}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">34. District of Birth / Wilaya aliyozaliwa</span>
                      <p className="font-bold text-slate-900 mt-0.5">{selectedRequest.motherBirthDistrict || "N/A"}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">35. Ward / Shehia / Kata aliyozaliwa</span>
                      <p className="font-bold text-slate-900 mt-0.5">{selectedRequest.motherBirthWard || "N/A"}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">36. Street / Village / Mtaa aliozaliwa</span>
                      <p className="font-bold text-slate-900 mt-0.5">{selectedRequest.motherBirthVillage || "N/A"}</p>
                    </div>
                  </div>
                </div>

                {/* 4. Action & Status Controls */}
                <div className="p-4.5 bg-blue-50/70 rounded-2xl border border-blue-200 space-y-4">
                  <h4 className="font-extrabold text-xs text-blue-950 uppercase tracking-wider flex items-center gap-1.5">
                    <FileCheck2 className="w-4 h-4 text-blue-600" />
                    <span>Admission Processing Action</span>
                  </h4>

                  <div className="flex flex-wrap items-center gap-3">
                    {/* Processing Button - LOCKED if already processing or completed */}
                    {selectedRequest.assistanceStatus === "processing" ? (
                      <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-100 border border-blue-300 text-blue-800 font-extrabold text-xs">
                        <Lock className="w-3.5 h-3.5 text-blue-600" />
                        <span>Currently Processing with Immigration</span>
                      </div>
                    ) : selectedRequest.assistanceStatus === "completed" ? (
                      <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-800 font-extrabold text-xs">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Passport Issued &amp; Completed</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={isUpdatingStatus}
                        onClick={() => handleUpdateStatus("processing")}
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs transition-colors cursor-pointer shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                      >
                        {isUpdatingStatus && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                        <span>Mark As &quot;Processing with Immigration&quot;</span>
                      </button>
                    )}

                    {/* Completed Button - Opens Passport Issue Drawer */}
                    {selectedRequest.assistanceStatus !== "completed" && (
                      <button
                        type="button"
                        onClick={() => setShowCompletedForm(!showCompletedForm)}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs transition-colors cursor-pointer shadow-sm flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Mark As &quot;Completed (Passport Issued)&quot;</span>
                      </button>
                    )}
                  </div>

                  {/* Completed Form Drawer */}
                  {showCompletedForm && (
                    <div className="p-4 bg-white rounded-xl border border-emerald-200 shadow-xs space-y-3 animate-in fade-in duration-150">
                      <p className="font-bold text-xs text-emerald-950">
                        Enter Issued Passport Details (Will update student profile and notify student):
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                            Passport Number <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. TAE640107"
                            value={newPassportNumber}
                            onChange={(e) => setNewPassportNumber(e.target.value)}
                            className="w-full p-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white font-mono font-bold uppercase text-xs outline-none focus:border-emerald-600"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                            Issue Date
                          </label>
                          <input
                            type="date"
                            value={newIssueDate}
                            onChange={(e) => setNewIssueDate(e.target.value)}
                            className="w-full p-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white text-xs outline-none focus:border-emerald-600"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                            Expiry Date
                          </label>
                          <input
                            type="date"
                            value={newExpiryDate}
                            onChange={(e) => setNewExpiryDate(e.target.value)}
                            className="w-full p-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white text-xs outline-none focus:border-emerald-600"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          disabled={isUpdatingStatus || !newPassportNumber.trim()}
                          onClick={() => handleUpdateStatus("completed")}
                          className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                        >
                          {isUpdatingStatus && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                          <span>Save &amp; Complete Passport</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowCompletedForm(false)}
                          className="px-3 py-2 rounded-lg border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-50 cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* 5. Instructions / Notes for Student */}
                <div className="p-4.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <MessageSquarePlus className="w-4 h-4 text-blue-600" />
                    <span>Send Instruction Note to Student</span>
                  </h4>
                  <textarea
                    rows={2}
                    value={officerNote}
                    onChange={(e) => setOfficerNote(e.target.value)}
                    placeholder="e.g. Please arrive at the Immigration Office on Thursday at 9:00 AM with your original birth certificate and 2 passport size photos."
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white focus:border-blue-600 outline-none resize-none text-slate-800 text-xs"
                  />
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] text-slate-400">
                      Sending this note will create an in-app portal notification directly for this student.
                    </p>
                    <button
                      type="button"
                      disabled={isSendingNote || !officerNote.trim()}
                      onClick={handleSendNote}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-xs"
                    >
                      {isSendingNote ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      <span>Send Note to Student</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRequest(null);
                    setModalFeedback(null);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs transition-colors cursor-pointer"
                >
                  Close Details
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* LIGHTBOX: DOCUMENT PREVIEW MODAL                              */}
      {/* ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {previewDocUrl !== null && (
          <div
            className="fixed inset-0 z-[80] flex flex-col items-center justify-center p-4 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150"
            onClick={(e) => {
              if (e.target === e.currentTarget) setPreviewDocUrl(null);
            }}
          >
            <div className="w-full max-w-4xl bg-slate-900/90 text-white px-5 py-3 rounded-2xl border border-slate-800 mb-3 flex items-center justify-between shadow-2xl backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-600/30 text-blue-400 flex items-center justify-center font-bold">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-xs sm:text-sm text-slate-100">{previewDocTitle}</p>
                  <p className="text-[10px] text-slate-400">Official student passport document</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {previewDocUrl && (
                  <a
                    href={previewDocUrl}
                    download={`passport_${Date.now()}`}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </a>
                )}

                <button
                  type="button"
                  onClick={() => setPreviewDocUrl(null)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-red-600/80 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="w-full max-w-4xl max-h-[82vh] bg-slate-900/60 rounded-3xl border border-slate-800 p-3 sm:p-4 flex items-center justify-center overflow-auto shadow-2xl">
              {previewLoading ? (
                <div className="py-16 text-center text-slate-400">
                  <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-xs font-semibold">Generating secure preview...</p>
                </div>
              ) : previewDocUrl ? (
                previewDocUrl.toLowerCase().includes(".pdf") ? (
                  <iframe src={previewDocUrl} className="w-full h-[75vh] rounded-2xl border-0 bg-white shadow-lg" title="PDF Preview" />
                ) : (
                  <img src={previewDocUrl} alt="Passport Document" className="max-h-[72vh] max-w-full object-contain rounded-2xl shadow-2xl" />
                )
              ) : (
                <div className="py-12 text-center text-slate-400">
                  <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs">No preview could be loaded.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
