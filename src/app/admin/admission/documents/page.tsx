"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  Search,
  Eye,
  CheckCircle2,
  RefreshCw,
  X,
  FileText,
  ChevronRight,
  AlertTriangle,
  Download,
  AlertCircle,
  FolderOpen,
  Send,
  RotateCcw,
  Check,
} from "lucide-react";
import { useAdminAuth } from "@/components/admin/AdminAuthProvider";
import { createClient } from "@/lib/supabase/client";

export interface StudentDocItem {
  id: string;
  studentId: string;
  applicationId?: string;
  documentType: string;
  rawType: string;
  fileName: string;
  fileSize: string;
  fileUrl: string;
  previewUrl: string;
  isVerified: boolean;
  status: string;
  uploadedAt: string;
}

export interface StudentWithDocs {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentPhone: string;
  avatarUrl: string | null;
  documents: StudentDocItem[];
  totalDocs: number;
  pendingDocs: number;
  verifiedDocs: number;
  status: string; // "Pending Review", "Partially Verified", "Fully Verified"
  lastUploaded: string;
  lastUploadedFormatted: string;
}

const TABS = ["All Students", "Pending Review", "Fully Verified"];

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

export default function DocumentsPage() {
  const { loading: authLoading, role } = useAdminAuth();
  const isSuperAdmin = role === "super_admin";
  const [students, setStudents] = useState<StudentWithDocs[]>([]);
  const [counts, setCounts] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("All Students");
  const [search, setSearch] = useState("");

  // Selected Student ID (Derived cleanly without re-fetch loop)
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [actionLoadingDocId, setActionLoadingDocId] = useState<string | null>(null);
  const [replacementDocId, setReplacementDocId] = useState<string | null>(null);
  const [replacementReason, setReplacementReason] = useState("Unclear / Blurry");
  const [replacementComment, setReplacementComment] = useState("");
  const [modalFeedback, setModalFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // In-App Lightbox Document Viewer (SAME SCREEN/TAB)
  const [previewDocUrl, setPreviewDocUrl] = useState<string | null>(null);
  const [previewDocTitle, setPreviewDocTitle] = useState<string>("Document Preview");
  const [previewDocFileName, setPreviewDocFileName] = useState<string>("document.pdf");
  const [previewLoading, setPreviewLoading] = useState<boolean>(false);

  const loadDocumentsData = useCallback(async () => {
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

      const res = await fetch("/api/admin/admission/documents", {
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
        throw new Error(json.error || "Failed to load student documents.");
      }

      setStudents(json.students || []);
      setCounts(json.counts || {});
    } catch (err: any) {
      console.error("[DocumentsPage] Error:", err);
      setError(err.message || "Failed to load student documents.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) {
      loadDocumentsData();
    }
  }, [authLoading, loadDocumentsData]);

  // Derive the active selected student object
  const selectedStudent = useMemo(() => {
    if (!selectedStudentId) return null;
    return students.find((s) => s.id === selectedStudentId) || null;
  }, [students, selectedStudentId]);

  // Filtered Students
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchTab =
        activeTab === "All Students" ||
        (activeTab === "Pending Review" && s.pendingDocs > 0) ||
        (activeTab === "Fully Verified" && s.totalDocs > 0 && s.pendingDocs === 0);

      const matchSearch =
        !search.trim() ||
        s.studentName.toLowerCase().includes(search.toLowerCase()) ||
        s.studentEmail.toLowerCase().includes(search.toLowerCase()) ||
        s.studentPhone.includes(search) ||
        s.documents.some((d) => d.documentType.toLowerCase().includes(search.toLowerCase()) || d.fileName.toLowerCase().includes(search.toLowerCase()));

      return matchTab && matchSearch;
    });
  }, [students, activeTab, search]);

  // Handle Document Verification
  const handleVerifyDocument = async (docId: string) => {
    try {
      setActionLoadingDocId(docId);
      setModalFeedback(null);

      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (session?.access_token) headers["Authorization"] = `Bearer ${session.access_token}`;

      const res = await fetch("/api/admin/admission/documents/action", {
        method: "POST",
        headers,
        body: JSON.stringify({
          action: "verify",
          documentId: docId,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to verify document.");
      }

      setModalFeedback({ type: "success", message: "Document verified successfully!" });
      await loadDocumentsData();
    } catch (err: any) {
      setModalFeedback({ type: "error", message: err.message || "Failed to verify document." });
    } finally {
      setActionLoadingDocId(null);
    }
  };

  // Handle Request Replacement
  const handleRequestReplacement = async (docId: string) => {
    try {
      setActionLoadingDocId(docId);
      setModalFeedback(null);

      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (session?.access_token) headers["Authorization"] = `Bearer ${session.access_token}`;

      const res = await fetch("/api/admin/admission/documents/action", {
        method: "POST",
        headers,
        body: JSON.stringify({
          action: "request_replacement",
          documentId: docId,
          reason: replacementReason,
          comment: replacementComment.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to request replacement.");
      }

      setReplacementDocId(null);
      setReplacementComment("");
      setModalFeedback({ type: "success", message: "Re-upload request and instructions sent to student portal!" });
      await loadDocumentsData();
    } catch (err: any) {
      setModalFeedback({ type: "error", message: err.message || "Failed to request replacement." });
    } finally {
      setActionLoadingDocId(null);
    }
  };

  // Open In-App Document Lightbox (SAME TAB)
  const handleOpenDocPreview = async (doc: StudentDocItem) => {
    try {
      setPreviewLoading(true);
      setPreviewDocTitle(doc.documentType);
      setPreviewDocFileName(doc.fileName);
      setPreviewDocUrl("");

      const supabase = createClient();
      let signedUrl = doc.fileUrl;

      if (!doc.fileUrl || !doc.fileUrl.startsWith("http")) {
        let cleanPath = doc.fileUrl || doc.fileName;
        if (cleanPath.startsWith("student-documents/")) {
          cleanPath = cleanPath.replace(/^student-documents\//, "");
        }
        const { data } = await supabase.storage
          .from("student-documents")
          .createSignedUrl(cleanPath, 60 * 60);

        if (data?.signedUrl) {
          signedUrl = data.signedUrl;
        } else {
          signedUrl = doc.previewUrl;
        }
      }

      setPreviewDocUrl(signedUrl);
    } catch (err: any) {
      alert("Failed to load document preview.");
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleCloseModal = () => {
    setSelectedStudentId(null);
    setModalFeedback(null);
    setReplacementDocId(null);
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
          <span className="text-slate-600 font-medium">Student Documents</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
              <FolderOpen className="w-6 h-6 text-blue-600" />
              <span>Student Documents Hub</span>
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-1">
              Review, preview, and verify student academic and admission documents grouped by applicant.
            </p>
          </div>

          <button
            onClick={loadDocumentsData}
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
            onClick={loadDocumentsData}
            className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Tabs & Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {TABS.map((tab) => {
            const count =
              tab === "All Students"
                ? counts.All || students.length
                : tab === "Pending Review"
                ? counts.Pending || 0
                : counts.Verified || 0;

            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === tab
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                <span>{tab}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    activeTab === tab ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search student, email, doc..."
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-600 outline-none transition-colors"
          />
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Student</th>
                <th className="py-3.5 px-4">Contact</th>
                <th className="py-3.5 px-4">Uploaded Documents</th>
                <th className="py-3.5 px-4">Review Progress</th>
                <th className="py-3.5 px-4">Last Uploaded</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading student documents...
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    No students with documents found.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <StudentAvatar name={s.studentName} avatarUrl={s.avatarUrl} />
                        <div>
                          <div className="font-bold text-slate-900 text-sm">{s.studentName}</div>
                          <div className="text-[11px] text-slate-500">{s.studentEmail}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-slate-700 font-medium">{s.studentPhone || "N/A"}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 text-slate-800 font-bold text-xs border border-slate-200/80">
                        <FileText className="w-3.5 h-3.5 text-blue-600" />
                        <span>{s.totalDocs} Documents</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="space-y-1.5 min-w-[140px]">
                        <div className="flex items-center justify-between text-[11px] font-bold">
                          <span className={s.pendingDocs === 0 ? "text-emerald-700" : "text-amber-700"}>
                            {s.verifiedDocs} / {s.totalDocs} Verified
                          </span>
                          <span className="text-slate-400">
                            {Math.round((s.verifiedDocs / Math.max(1, s.totalDocs)) * 100)}%
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              s.pendingDocs === 0 ? "bg-emerald-500" : "bg-blue-600"
                            }`}
                            style={{
                              width: `${Math.round((s.verifiedDocs / Math.max(1, s.totalDocs)) * 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-medium">
                      {s.lastUploadedFormatted}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedStudentId(s.id);
                          setModalFeedback(null);
                          setReplacementDocId(null);
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 font-extrabold text-xs transition-colors border border-blue-200 flex items-center gap-1.5 ml-auto cursor-pointer shadow-2xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Documents</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* MODAL 1: STUDENT DOCUMENT HUB (LIST OF ALL DOCS FOR STUDENT)   */}
      {/* ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedStudent && (
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
                    <FolderOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900">
                      Documents &ndash; {selectedStudent.studentName}
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      {selectedStudent.studentEmail} • {selectedStudent.totalDocs} Uploaded Documents ({selectedStudent.verifiedDocs} Verified)
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCloseModal}
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

              {/* Modal Body: Documents Table */}
              <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
                <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                        <th className="py-3 px-4">Document Type</th>
                        <th className="py-3 px-4">File Name</th>
                        <th className="py-3 px-4">Uploaded</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedStudent.documents.map((doc) => (
                        <tr key={doc.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900">{doc.documentType}</div>
                            <div className="text-[10px] text-slate-400">{doc.fileSize}</div>
                          </td>
                          <td className="py-3.5 px-4 text-slate-700 font-mono text-[11px] truncate max-w-[200px]">
                            {doc.fileName}
                          </td>
                          <td className="py-3.5 px-4 text-slate-500">{doc.uploadedAt}</td>
                          <td className="py-3.5 px-4">
                            {doc.isVerified ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <Check className="w-3 h-3" />
                                <span>Verified</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide bg-amber-50 text-amber-700 border border-amber-200">
                                <span>Pending Review</span>
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {/* Preview File Button (SAME TAB) */}
                              <button
                                type="button"
                                onClick={() => handleOpenDocPreview(doc)}
                                className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs transition-colors border border-blue-200 flex items-center gap-1 cursor-pointer shadow-2xs"
                                title="Preview Document on this screen"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Preview</span>
                              </button>

                              {/* Verify & Reject Buttons (Admission Officers Only) */}
                              {!isSuperAdmin && (
                                <>
                                  {!doc.isVerified && (
                                    <button
                                      type="button"
                                      disabled={actionLoadingDocId === doc.id}
                                      onClick={() => handleVerifyDocument(doc.id)}
                                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors cursor-pointer shadow-2xs disabled:opacity-50 flex items-center gap-1"
                                      title="Approve and mark document verified"
                                    >
                                      {actionLoadingDocId === doc.id ? (
                                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                      ) : (
                                        <Check className="w-3.5 h-3.5" />
                                      )}
                                      <span>Verify</span>
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() =>
                                      setReplacementDocId(replacementDocId === doc.id ? null : doc.id)
                                    }
                                    className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors border flex items-center gap-1.5 cursor-pointer shadow-2xs whitespace-nowrap ${
                                      replacementDocId === doc.id
                                        ? "bg-rose-600 text-white border-rose-700"
                                        : "bg-rose-50 text-rose-700 hover:bg-rose-100 border-rose-200"
                                    }`}
                                    title="Reject and request student to re-upload"
                                  >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    <span>Reject</span>
                                  </button>
                                </>
                              )}
                            </div>

                            {/* Inline Request Re-upload Drawer */}
                            {replacementDocId === doc.id && (
                              <div className="mt-3 p-3.5 bg-amber-50/90 rounded-xl border border-amber-200 text-left space-y-2.5 animate-in fade-in duration-150">
                                <p className="font-bold text-xs text-amber-950">
                                  Request Re-upload for {doc.documentType}:
                                </p>
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                                    Reason
                                  </label>
                                  <select
                                    value={replacementReason}
                                    onChange={(e) => setReplacementReason(e.target.value)}
                                    className="w-full p-2 rounded-lg border border-amber-200 bg-white font-semibold text-xs outline-none"
                                  >
                                    <option>Unclear / Blurry</option>
                                    <option>Incomplete Pages</option>
                                    <option>Wrong Document Uploaded</option>
                                    <option>Expired Document</option>
                                    <option>Certified True Copy Required</option>
                                    <option>Other</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                                    Instructions for Student
                                  </label>
                                  <textarea
                                    rows={2}
                                    value={replacementComment}
                                    onChange={(e) => setReplacementComment(e.target.value)}
                                    placeholder="e.g. Please scan all 4 pages in high resolution PDF format."
                                    className="w-full p-2 rounded-lg border border-amber-200 bg-white text-xs outline-none resize-none"
                                  />
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    disabled={actionLoadingDocId === doc.id}
                                    onClick={() => handleRequestReplacement(doc.id)}
                                    className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                                  >
                                    {actionLoadingDocId === doc.id && (
                                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                    )}
                                    <Send className="w-3.5 h-3.5" />
                                    <span>Send Re-upload Request</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setReplacementDocId(null)}
                                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-white cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-end">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs transition-colors cursor-pointer"
                >
                  Close Documents Hub
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* MODAL 2: IN-APP DOCUMENT LIGHTBOX (SAME SCREEN/TAB)           */}
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
                  <p className="text-[10px] text-slate-400">{previewDocFileName}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {previewDocUrl && (
                  <a
                    href={previewDocUrl}
                    download={previewDocFileName}
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
                  <iframe
                    src={previewDocUrl}
                    className="w-full h-[75vh] rounded-2xl border-0 bg-white shadow-lg"
                    title="Document PDF Preview"
                  />
                ) : (
                  <img
                    src={previewDocUrl}
                    alt={previewDocTitle}
                    className="max-h-[72vh] max-w-full object-contain rounded-2xl shadow-2xl"
                  />
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
