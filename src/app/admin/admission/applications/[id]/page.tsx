"use client";

import { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import {
  Home,
  ChevronRight,
  CheckCircle2,
  Check,
  AlertTriangle,
  Upload,
  Eye,
  MessageCircle,
  X,
  FileText,
  Clock,
  RefreshCw,
  Lock,
  ArrowLeft,
  ShieldCheck,
} from "lucide-react";
import StatusBadge from "@/components/admin/admission/StatusBadge";
import { createClient } from "@/lib/supabase/client";

// ─── Upload Offer Letter / PAL Modal ─────────────────────────────────────────
function OfferLetterModal({
  appDisplayId,
  studentName,
  applicationId,
  onClose,
  onSuccess,
}: {
  appDisplayId: string;
  studentName: string;
  applicationId: string;
  onClose: () => void;
  onSuccess: () => Promise<void>;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [docType, setDocType] = useState("Offer_Letter");
  const [status, setStatus] = useState("Offer Letter Received");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a file to upload.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const formData = new FormData();
      formData.append("file", file);
      formData.append("applicationId", applicationId);
      formData.append("documentType", docType);
      formData.append("newStatus", status);
      if (notes.trim()) formData.append("notes", notes.trim());

      const headers: Record<string, string> = {};
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      const res = await fetch("/api/admin/admission/upload-offer-letter", {
        method: "POST",
        headers,
        body: formData,
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to upload offer letter.");
      }

      alert("Offer letter uploaded successfully! Student has been notified.");
      await onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to upload offer letter.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Upload University Decision Letter</h3>
              <p className="text-[11px] text-slate-500 font-medium">Application {appDisplayId} • {studentName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wide">
              Document Type <span className="text-red-500">*</span>
            </label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-600 outline-none font-semibold text-slate-800"
            >
              <option value="Offer_Letter">Official Offer Letter / Acceptance</option>
              <option value="PAL">Provincial Attestation Letter (PAL)</option>
              <option value="Visa_Support_Letter">Visa Support Letter</option>
              <option value="Scholarship_Award">Scholarship Award Letter</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wide">
              Select Document File (PDF / Image) <span className="text-red-500">*</span>
            </label>
            <input
              type="file"
              required
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
            />
            {file && (
              <p className="text-[11px] text-emerald-600 font-semibold mt-1">
                Selected: {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
              </p>
            )}
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wide">
              Update Application Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-600 outline-none font-semibold text-slate-800"
            >
              <option value="Offer Letter Received">Offer Letter Received</option>
              <option value="University Approved">University Approved</option>
              <option value="Visa Processing">Ready for Visa Processing</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wide">
              Notes for Student (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Please confirm acceptance and review fee schedule before visa application."
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-600 outline-none resize-none text-slate-800"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !file}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold shadow-sm transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <span>Upload &amp; Notify Student</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}







// ─── Section Card ─────────────────────────────────────────────────────────────
function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/50">
        <h3 className="font-semibold text-slate-800 text-sm">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ─── Info Row ─────────────────────────────────────────────────────────────────
function InfoRow({ label, value }: { label: string; value: string | React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">{label}</p>
      <div className="text-sm text-slate-800 font-medium">{value}</div>
    </div>
  );
}

// ─── Document Pending / Replacement Modal ──────────────────────────────────────
function DocumentPendingModal({
  documents,
  onClose,
  onSubmit,
  loading,
}: {
  documents: any[];
  onClose: () => void;
  onSubmit: (docId: string, docType: string, reason: string, comment: string) => Promise<void>;
  loading: boolean;
}) {
  const [selectedDocId, setSelectedDocId] = useState("");
  const [reason, setReason] = useState("Unclear");
  const [comment, setComment] = useState("");

  const handleSubmit = async () => {
    const doc = documents.find((d) => d.id === selectedDocId);
    const docType = doc?.document_type || "Document";
    await onSubmit(selectedDocId, docType, reason, comment);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-slate-800 text-lg">Mark Document Pending</h3>
          <button
            onClick={onClose}
            disabled={loading}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
              Document
            </label>
            <select
              value={selectedDocId}
              onChange={(e) => setSelectedDocId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="">Select document...</option>
              {documents.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.document_type} ({d.file_name || "File"})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
              Reason
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option>Missing</option>
              <option>Unclear</option>
              <option>Wrong document</option>
              <option>Expired</option>
              <option>Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
              Comment
            </label>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Please upload a clearer copy of your transcript..."
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            <p className="text-[11px] text-slate-400 mt-1">Student will receive a notification with this message.</p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !selectedDocId}
              className="flex-1 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              Send Request
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Add Comment Modal ────────────────────────────────────────────────────────
function CommentModal({
  appDisplayId,
  studentName,
  onClose,
  onSubmit,
  loading,
}: {
  appDisplayId: string;
  studentName: string;
  onClose: () => void;
  onSubmit: (message: string, notifyStudent: boolean) => Promise<void>;
  loading: boolean;
}) {
  const [message, setMessage] = useState("");
  const [notify, setNotify] = useState(true);

  const handleSubmit = async () => {
    if (!message.trim()) return;
    await onSubmit(message.trim(), notify);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-slate-800 text-lg">Add Comment / Request Info</h3>
          <button
            onClick={onClose}
            disabled={loading}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          Application: <span className="font-mono font-semibold text-slate-700">{appDisplayId}</span>: {studentName}
        </p>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
              Message / Comment
            </label>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="The selected course is currently unavailable. Please choose another programme."
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={notify}
              onChange={(e) => setNotify(e.target.checked)}
              className="w-4 h-4 rounded"
            />
            <span className="text-sm text-slate-600">Notify student via portal notifications</span>
          </label>
          <div className="flex gap-3 pt-1">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !message.trim()}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-all shadow-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              Save Comment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ViewApplicationPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const unwrappedParams = use(params as Promise<{ id: string }>);
  const appId = unwrappedParams.id;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPaymentLocked, setIsPaymentLocked] = useState(false);

  const [showDocPending, setShowDocPending] = useState(false);
  const [showComment, setShowComment] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [universityStatus, setUniversityStatus] = useState<string>("Submitted to University");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setIsPaymentLocked(false);

      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      const res = await fetch(`/api/admin/admission/applications/${appId}`, { headers });
      const json = await res.json();

      if (!res.ok || !json.success) {
        if (json.paymentLocked || res.status === 403) {
          setIsPaymentLocked(true);
        }
        throw new Error(json.error || "Failed to load application details.");
      }

      setData(json);
      setUniversityStatus(json.application.status || "Under Review");
    } catch (err: any) {
      console.error("[ViewApplicationPage] Fetch error:", err);
      setError(err.message || "Failed to load application.");
    } finally {
      setLoading(false);
    }
  }, [appId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const executeAction = async (actionPayload: any) => {
    try {
      setActionLoading(true);
      setActionFeedback(null);

      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      const res = await fetch(`/api/admin/admission/applications/${appId}/action`, {
        method: "POST",
        headers,
        body: JSON.stringify(actionPayload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Action failed.");
      }

      setActionFeedback({ type: "success", message: json.message || "Action completed successfully." });
      await loadData();
      return json;
    } catch (err: any) {
      console.error("[ViewApplicationPage] Action error:", err);
      setActionFeedback({ type: "error", message: err.message || "Action failed." });
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async () => {
    await executeAction({ action: "approve_application" });
  };

  const handleSaveUniversityStatus = async () => {
    await executeAction({
      action: "update_university_status",
      status: universityStatus,
    });
  };

  const handleVerifyDocument = async (docId: string) => {
    await executeAction({
      action: "verify_document",
      documentId: docId,
    });
  };

  const handleDocPendingSubmit = async (
    docId: string,
    docType: string,
    reason: string,
    comment: string
  ) => {
    await executeAction({
      action: "request_document_replacement",
      documentId: docId,
      documentType: docType,
      reason,
      comment,
    });
    setShowDocPending(false);
  };

  const handleCommentSubmit = async (message: string, notifyStudent: boolean) => {
    await executeAction({
      action: "add_comment",
      message,
      notifyStudent,
    });
    setShowComment(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-sm font-medium text-slate-500">Loading application details...</p>
      </div>
    );
  }

  if (isPaymentLocked) {
    return (
      <div className="max-w-[700px] mx-auto mt-12 bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-4">
          <Lock className="w-7 h-7 text-amber-600" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Application Locked</h2>
        <p className="text-slate-600 text-sm max-w-md mx-auto mb-6">
          This application cannot be reviewed yet because the student&apos;s TSh 50,000 file-opening fee payment is pending Finance Officer approval.
        </p>
        <Link
          href="/admin/admission/applications"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-sm font-semibold text-slate-700 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Applications
        </Link>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-[700px] mx-auto mt-12 bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-7 h-7 text-red-600" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Error Loading Application</h2>
        <p className="text-slate-600 text-sm max-w-md mx-auto mb-6">
          {error || "Application not found or access unauthorized."}
        </p>
        <Link
          href="/admin/admission/applications"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-sm font-semibold text-slate-700 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Applications
        </Link>
      </div>
    );
  }

  const { application, student, academic, previousEducation, passport, documents } = data;
  const isApproved = ["Under Review", "Submitted to University", "Visa Approved"].includes(application.status);

  // Timeline events derived from real state
  const timelineSteps = [
    { label: "Application Submitted", done: true, date: application.applicationDate },
    { label: "Admission Officer Review", done: isApproved, date: isApproved ? "Completed" : undefined },
    { label: "Submitted to University", done: ["Submitted to University", "Visa Approved"].includes(application.status) },
    { label: "Visa Processing", done: application.status === "Visa Approved" },
    { label: "Completed", done: application.status === "Visa Approved" },
  ];

  return (
    <>
      {showDocPending && (
        <DocumentPendingModal
          documents={documents}
          onClose={() => setShowDocPending(false)}
          onSubmit={handleDocPendingSubmit}
          loading={actionLoading}
        />
      )}

      {showOfferModal && (
        <OfferLetterModal
          appDisplayId={application.displayId}
          studentName={student.fullName}
          applicationId={appId}
          onClose={() => setShowOfferModal(false)}
          onSuccess={loadData}
        />
      )}

      {showComment && (
        <CommentModal
          appDisplayId={application.displayId}
          studentName={student.fullName}
          onClose={() => setShowComment(false)}
          onSubmit={handleCommentSubmit}
          loading={actionLoading}
        />
      )}

      <div className="space-y-5 max-w-[1100px]">
        {/* Feedback Alert */}
        {actionFeedback && (
          <div
            className={`p-4 rounded-xl border flex items-center justify-between ${
              actionFeedback.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            <div className="flex items-center gap-2 text-sm font-medium">
              {actionFeedback.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-600" />
              )}
              {actionFeedback.message}
            </div>
            <button onClick={() => setActionFeedback(null)} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <Home className="w-3.5 h-3.5" />
          <ChevronRight className="w-3 h-3" />
          <Link href="/admin/admission/dashboard" className="hover:text-blue-600">
            Dashboard
          </Link>
          <ChevronRight className="w-3 h-3" />
          <Link href="/admin/admission/applications" className="hover:text-blue-600">
            Applications
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-600 font-medium">{application.displayId}</span>
        </div>

        {/* Header */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-mono text-slate-400 mb-1">{application.displayId}</p>
              <h1 className="text-2xl font-bold text-slate-900">{student.fullName}</h1>
              <p className="text-slate-500 text-sm mt-1">
                {application.university} · {application.course}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {isApproved && (
                <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-semibold text-emerald-700">Reviewed by Officer</span>
                </div>
              )}
              <StatusBadge status={application.status} size="md" />
            </div>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-[1fr_340px] gap-5">
          {/* Left column */}
          <div className="space-y-5">
            {/* A. Student Information */}
            <SectionCard title="A. Student Information">
              <div className="grid grid-cols-2 gap-4">
                <InfoRow label="Full Name" value={student.fullName} />
                <InfoRow label="Email" value={student.email} />
                <InfoRow label="Phone" value={student.phone} />
                <InfoRow label="Date of Birth" value={student.dob} />
                <InfoRow label="Nationality" value={student.nationality} />
              </div>
            </SectionCard>

            {/* B. University & Course */}
            <SectionCard title="B. University & Course">
              <div className="grid grid-cols-2 gap-4">
                <InfoRow label="University" value={application.university} />
                <InfoRow label="Course" value={application.course} />
                <InfoRow label="Intake" value={application.intake} />
                <InfoRow label="Study Level" value={application.studyLevel} />
                <InfoRow label="Application Date" value={application.applicationDate} />
              </div>
            </SectionCard>

            {/* C. Academic Background */}
            <SectionCard title="C. Academic Background">
              <div className="grid grid-cols-2 gap-4">
                <InfoRow label="Highest Qualification" value={academic.qualification} />
                <InfoRow label="School / Institution" value={academic.school} />
                <InfoRow label="Completion Year" value={academic.completionYear} />
                <InfoRow label="Grades / Details" value={academic.grades} />
                <InfoRow label="Western Equivalent" value={academic.westernEquivalent} />
              </div>
            </SectionCard>

            {/* D. Previous Education */}
            <SectionCard title="D. Previous Education">
              <p className="text-sm text-slate-700 leading-relaxed">{previousEducation}</p>
            </SectionCard>

            {/* F. Documents */}
            <SectionCard title="F. Documents">
              <div className="space-y-2.5">
                {documents.length === 0 ? (
                  <p className="text-sm text-slate-400 py-4 text-center">No documents uploaded yet.</p>
                ) : (
                  documents.map((doc: any) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between py-2 px-3 rounded-xl bg-slate-50 border border-slate-100"
                    >
                      <div className="flex items-center gap-2.5">
                        {doc.is_verified ? (
                          <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                            <Check className="w-3 h-3 text-emerald-600" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center">
                            <AlertTriangle className="w-3 h-3 text-orange-500" />
                          </div>
                        )}
                        <div>
                          <span className="text-sm text-slate-700 font-medium">{doc.document_type}</span>
                          <span className="text-[11px] text-slate-400 block">{doc.file_name || "Document file"}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            doc.is_verified
                              ? "bg-emerald-50 text-emerald-600"
                              : "bg-orange-50 text-orange-600"
                          }`}
                        >
                          {doc.is_verified ? "Verified" : "Pending Review"}
                        </span>

                        {doc.signedUrl && (
                          <a
                            href={doc.signedUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-blue-600 font-bold hover:underline px-2 py-1 bg-blue-50 rounded-lg"
                          >
                            <Eye className="w-3 h-3" /> View
                          </a>
                        )}

                        {!doc.is_verified && (
                          <button
                            onClick={() => handleVerifyDocument(doc.id)}
                            disabled={actionLoading}
                            className="px-2.5 py-1 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all cursor-pointer"
                          >
                            Verify
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </SectionCard>

            {/* H. Comments & Notes */}
            <SectionCard title="H. Comments & Notes">
              {application.notes ? (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 whitespace-pre-wrap text-sm text-slate-700">
                  {application.notes}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-slate-400">
                  <MessageCircle className="w-8 h-8 mb-2 opacity-40" />
                  <p className="text-sm">No comments yet.</p>
                  <p className="text-xs mt-1">Add a comment to record notes or communicate with the student.</p>
                </div>
              )}
            </SectionCard>

            {/* I. University Status */}
            <SectionCard title="I. University Status">
              <p className="text-xs text-slate-500 mb-3">
                Update the status manually after completing the university application process.
              </p>
              <div className="flex items-center gap-3">
                <select
                  value={universityStatus}
                  onChange={(e) => setUniversityStatus(e.target.value)}
                  className="flex-1 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="Under Review">Under Review</option>
                  <option value="Submitted to University">Submitted to University</option>
                  <option value="Visa Approved">Visa Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
                <button
                  onClick={handleSaveUniversityStatus}
                  disabled={actionLoading}
                  className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-sm cursor-pointer disabled:opacity-60 flex items-center gap-2"
                >
                  {actionLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  Save Status
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                MtishbiScholar does not auto-submit to universities. This is a status record only.
              </p>
            </SectionCard>

            {/* J. Offer Letter */}
            <SectionCard title="J. Offer Letter">
              <div className="flex items-center gap-4 py-2">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-slate-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-slate-600 font-medium">
                    {application.offerLetterUrl ? "Offer letter available" : "No offer letter uploaded yet."}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {application.offerLetterUrl
                      ? "The university has issued an official offer letter for this student."
                      : "Upload when university provides official acceptance documentation."}
                  </p>
                </div>
                {application.offerLetterUrl ? (
                  <a
                    href={application.offerLetterUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 text-blue-600 font-semibold text-sm hover:bg-blue-100 transition-all"
                  >
                    <Eye className="w-4 h-4" /> View Offer
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowOfferModal(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-all cursor-pointer shadow-xs"
                  >
                    <Upload className="w-4 h-4" /> Upload Offer Letter / PAL
                  </button>
                )}
              </div>
            </SectionCard>

            {/* K. Application Timeline */}
            <SectionCard title="K. Application Timeline">
              <div className="relative">
                <div className="absolute left-[9px] top-0 bottom-0 w-px bg-slate-200" />
                <div className="space-y-4">
                  {timelineSteps.map((step) => (
                    <div key={step.label} className="flex items-center gap-3 relative">
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 z-10 ${
                          step.done
                            ? "bg-emerald-500 border-emerald-500"
                            : "bg-white border-slate-300"
                        }`}
                      >
                        {step.done && <Check className="w-2.5 h-2.5 text-white" />}
                      </div>
                      <span className={`text-sm ${step.done ? "text-slate-800 font-medium" : "text-slate-400"}`}>
                        {step.label}
                      </span>
                      {step.date && (
                        <span className="ml-auto flex items-center gap-1 text-[11px] text-slate-400">
                          <Clock className="w-3 h-3" /> {step.date}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </SectionCard>
          </div>

          {/* Right column */}
          <div className="space-y-5">
            {/* E. Passport Information */}
            <SectionCard title="E. Passport Information">
              {passport.hasPassport ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                      <Check className="w-3 h-3 text-emerald-600" />
                    </div>
                    <span className="text-sm font-semibold text-emerald-700">Has Passport</span>
                  </div>
                  <InfoRow label="Passport Number" value={passport.number} />
                  {passport.issueDate && <InfoRow label="Issue Date" value={passport.issueDate} />}
                  {passport.expiryDate && <InfoRow label="Expiry Date" value={passport.expiryDate} />}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center">
                    <AlertTriangle className="w-3 h-3 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-orange-700">{passport.status}</p>
                    <p className="text-xs text-slate-500 mt-0.5">Status: Pending student submission</p>
                  </div>
                </div>
              )}
            </SectionCard>

            {/* G. Admission Actions */}
            <SectionCard title="G. Admission Actions">
              <div className="space-y-2.5">
                <button
                  onClick={handleApprove}
                  disabled={actionLoading}
                  className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                    isApproved
                      ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                      : "bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm"
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {isApproved ? "Application Approved" : "Approve Application"}
                </button>

                <button
                  onClick={() => setShowDocPending(true)}
                  disabled={actionLoading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-orange-50 text-orange-600 border border-orange-200 hover:bg-orange-100 transition-all cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  Document Pending
                </button>

                <button
                  onClick={() => setShowComment(true)}
                  disabled={actionLoading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 transition-all cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  Add Comment / Request Info
                </button>
              </div>
            </SectionCard>
          </div>
        </div>
      </div>
    </>
  );
}
