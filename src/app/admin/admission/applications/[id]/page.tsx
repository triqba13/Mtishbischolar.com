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
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  ExternalLink,
  Ban,
  Award,
  GraduationCap,
  Globe,
  User,
  Calendar,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Building,
  BookOpen,
  Users,
  Briefcase,
  Layers,
  Sparkles,
} from "lucide-react";
import StatusBadge from "@/components/admin/admission/StatusBadge";
import { useAdminAuth } from "@/components/admin/AdminAuthProvider";
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
              <option value="Submitted to University">Submitted to University</option>
              <option value="Under Review">Under Review</option>
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

// ─── Reject Application Modal ────────────────────────────────────────────────
function RejectApplicationModal({
  appDisplayId,
  studentName,
  onClose,
  onSubmit,
  loading,
}: {
  appDisplayId: string;
  studentName: string;
  onClose: () => void;
  onSubmit: (reason: string, comment: string) => Promise<void>;
  loading: boolean;
}) {
  const [reason, setReason] = useState("Academic requirements not met");
  const [comment, setComment] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(reason, comment);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Reject Application</h3>
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

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wide">
              Rejection Reason <span className="text-red-500">*</span>
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-red-500 outline-none font-semibold text-slate-800"
            >
              <option value="Academic requirements not met">Academic requirements not met</option>
              <option value="Prerequisite academic certificates missing">Prerequisite academic certificates missing</option>
              <option value="Program intake capacity reached">Program intake capacity reached</option>
              <option value="Ineligible subject combination / level">Ineligible subject combination / level</option>
              <option value="Student requested withdrawal">Student requested withdrawal</option>
              <option value="Other">Other reason</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wide">
              Explanation Note for Student
            </label>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Describe why this application is being rejected..."
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-red-500 outline-none resize-none text-slate-800"
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
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold shadow-sm transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <span>Confirm Rejection</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Document Pending / Replacement Modal ──────────────────────────────────────
function DocumentPendingModal({
  documents,
  initialDocId = "",
  onClose,
  onSubmit,
  loading,
}: {
  documents: any[];
  initialDocId?: string;
  onClose: () => void;
  onSubmit: (docId: string, docType: string, reason: string, comment: string) => Promise<void>;
  loading: boolean;
}) {
  const [selectedDocId, setSelectedDocId] = useState(initialDocId);
  const [reason, setReason] = useState("Unclear");
  const [comment, setComment] = useState("");

  const handleSubmit = async () => {
    const doc = documents.find((d) => d.id === selectedDocId);
    const docType = doc?.document_type || "Document";
    await onSubmit(selectedDocId, docType, reason, comment);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 border border-slate-200">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
          <h3 className="font-bold text-slate-900 text-base">Request Document Replacement</h3>
          <button
            onClick={onClose}
            disabled={loading}
            className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wide">
              Document
            </label>
            <select
              value={selectedDocId}
              onChange={(e) => setSelectedDocId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
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
            <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wide">
              Reason
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="Unclear">Unclear / Blurry scan</option>
              <option value="Expired">Expired document</option>
              <option value="Incomplete">Incomplete / missing pages</option>
              <option value="Wrong Document">Wrong document type uploaded</option>
              <option value="Not Certified">Not officially certified / stamped</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wide">
              Comment / Instructions for Student
            </label>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="e.g. Please re-upload a clear colour PDF of your certificate..."
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !selectedDocId}
              className="flex-1 py-2.5 rounded-xl bg-orange-500 text-white font-bold hover:bg-orange-600 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {loading ? "Sending..." : "Send Request"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Comment Modal ────────────────────────────────────────────────────────────
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
  const [notifyStudent, setNotifyStudent] = useState(true);

  const handleSubmit = async () => {
    if (!message.trim()) return;
    await onSubmit(message, notifyStudent);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 border border-slate-200">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Add Officer Comment</h3>
            <p className="text-[11px] text-slate-400 font-medium">App {appDisplayId} • {studentName}</p>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wide">
              Message / Notes
            </label>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write an internal note or message to the student..."
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none font-medium"
            />
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={notifyStudent}
              onChange={(e) => setNotifyStudent(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
            />
            <span className="text-slate-700 font-medium">Notify student of this note</span>
          </label>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || !message.trim()}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {loading ? "Saving..." : "Save Comment"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── In-Page Document Viewer Modal ──────────────────────────────────────────
function DocumentViewerModal({
  doc,
  onClose,
  onVerify,
  onRequestPending,
  loading,
  isSuperAdmin = false,
}: {
  doc: any;
  onClose: () => void;
  onVerify: (docId: string) => Promise<void>;
  onRequestPending: (doc: any) => void;
  loading: boolean;
  isSuperAdmin?: boolean;
}) {
  const [zoom, setZoom] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const docUrl = doc.signedUrl || doc.file_url;
  const isPdf =
    (doc.file_name && doc.file_name.toLowerCase().endsWith(".pdf")) ||
    (doc.file_url && doc.file_url.toLowerCase().includes(".pdf")) ||
    (doc.document_type && doc.document_type.toLowerCase().includes("pdf"));

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4">
      <div
        className={`bg-white rounded-3xl shadow-2xl flex flex-col border border-slate-200 overflow-hidden transition-all duration-200 ${
          isFullscreen ? "w-full h-full rounded-none" : "w-full max-w-4xl max-h-[92vh] h-[850px]"
        }`}
      >
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">{doc.document_type}</h3>
              <p className="text-[11px] text-slate-400 font-medium">{doc.file_name || "Document Preview"}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(z - 25, 50))}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
              title="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono font-bold text-slate-500 w-10 text-center">{zoom}%</span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(z + 25, 250))}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
              title="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setZoom(100)}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
              title="Reset Zoom"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
              title="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            {docUrl && (
              <a
                href={docUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                title="Open in new window"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-200/80 hover:bg-slate-300 text-slate-700 transition-colors cursor-pointer ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body - Viewer Canvas */}
        <div className="flex-1 bg-slate-900 relative overflow-auto flex items-center justify-center p-4">
          {!docUrl ? (
            <div className="text-center text-slate-400 p-8">
              <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-2" />
              <p className="font-bold text-white text-sm">Document preview is not available.</p>
              <p className="text-xs text-slate-400 mt-1">
                The file URL could not be generated. Please request the student to re-upload.
              </p>
            </div>
          ) : isPdf ? (
            <iframe
              src={`${docUrl}#toolbar=1&navpanes=0&scrollbar=1`}
              className="w-full h-full rounded-xl border border-slate-700 bg-white shadow-2xl"
              title={doc.document_type || "Document PDF"}
            />
          ) : (
            <div className="overflow-auto max-w-full max-h-full flex items-center justify-center p-2">
              <img
                src={docUrl}
                alt={doc.document_type || "Document Preview"}
                style={{ transform: `scale(${zoom / 100})`, transformOrigin: "center center" }}
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl transition-transform duration-150"
              />
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="px-5 py-3 border-t border-slate-200 bg-white flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <ShieldCheck className="w-4 h-4 text-slate-400" />
            <span>Secure Officer Document Verification</span>
          </div>

          {isSuperAdmin ? (
            <div className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 border border-slate-200 text-xs font-semibold flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
              <span>Super Admin Oversight (Read-Only)</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onRequestPending(doc)}
                className="px-3 py-1.5 rounded-xl border border-orange-200 bg-orange-50 hover:bg-orange-100 text-orange-700 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                Request Replacement
              </button>

              {!doc.is_verified && (
                <button
                  type="button"
                  onClick={() => onVerify(doc.id)}
                  disabled={loading}
                  className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  Verify Document
                </button>
              )}

              {doc.is_verified && (
                <div className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Verified
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main View Application Component ─────────────────────────────────────────
export default function ViewApplicationPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const unwrappedParams = use(params as any) as { id: string };
  const appId = unwrappedParams.id;
  const { role } = useAdminAuth();
  const isSuperAdmin = role === "super_admin";

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPaymentLocked, setIsPaymentLocked] = useState(false);

  // Active Tab State (Allows full depth view without vertical scrolling)
  const [activeTab, setActiveTab] = useState<"profile" | "academics" | "documents" | "applications" | "activity">("profile");

  // Modals state
  const [showDocPending, setShowDocPending] = useState(false);
  const [showComment, setShowComment] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [pendingInitialDocId, setPendingInitialDocId] = useState<string>("");

  // In-Page Interactive Document Viewer Modal
  const [previewingDoc, setPreviewingDoc] = useState<any | null>(null);

  // Form State
  const [universityStatus, setUniversityStatus] = useState("Under Review");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

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

  const handleReject = async (reason: string, comment: string) => {
    await executeAction({
      action: "reject_application",
      reason,
      comment,
    });
    setShowRejectModal(false);
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
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
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

  const { application, student, academic, contacts, primaryContact, passport, allStudentApplications, documents, payment, auditLogs } = data;
  const isApproved = ["Under Review", "Submitted to University", "Offer Letter Received", "Offer Letter", "Visa Approved"].includes(application.status);
  const isRejected = application.status === "Rejected";

  const isVisaReady = application.status === "Visa Approved" || (application.status || "").toLowerCase().includes("ready to fly");

  const timelineSteps = [
    { label: "Application Activated (50k Fee)", done: true, date: payment?.verified_at ? "Verified" : "Paid" },
    { label: "Admission Officer Review", done: isApproved, date: isApproved ? "Reviewed" : undefined },
    { label: "Submitted to University", done: ["Submitted to University", "Offer Letter Received", "Offer Letter", "Visa Approved"].includes(application.status) },
    { label: "Offer Letter Received", done: Boolean(application.offerLetterUrl || ["Offer Letter Received", "Offer Letter", "Visa Approved"].includes(application.status)) },
    { label: "Visa Processing", done: isVisaReady, date: isVisaReady ? "Approved" : undefined },
    { label: "Ready to Fly", done: isVisaReady, date: isVisaReady ? "Ready" : undefined },
  ];

  return (
    <>
      {/* In-Page Interactive Document Viewer Modal */}
      {previewingDoc && (
        <DocumentViewerModal
          doc={previewingDoc}
          onClose={() => setPreviewingDoc(null)}
          onVerify={async (docId: string) => {
            await handleVerifyDocument(docId);
            setPreviewingDoc((prev: any) => (prev ? { ...prev, is_verified: true } : null));
          }}
          onRequestPending={(doc: any) => {
            setPreviewingDoc(null);
            setPendingInitialDocId(doc.id);
            setShowDocPending(true);
          }}
          loading={actionLoading}
        />
      )}

      {/* Reject Application Modal */}
      {showRejectModal && (
        <RejectApplicationModal
          appDisplayId={application.displayId}
          studentName={student.fullName}
          onClose={() => setShowRejectModal(false)}
          onSubmit={handleReject}
          loading={actionLoading}
        />
      )}

      {/* Document Replacement Request Modal */}
      {showDocPending && (
        <DocumentPendingModal
          documents={documents}
          initialDocId={pendingInitialDocId}
          onClose={() => {
            setShowDocPending(false);
            setPendingInitialDocId("");
          }}
          onSubmit={handleDocPendingSubmit}
          loading={actionLoading}
        />
      )}

      {/* Upload Offer Letter Modal */}
      {showOfferModal && (
        <OfferLetterModal
          appDisplayId={application.displayId}
          studentName={student.fullName}
          applicationId={appId}
          onClose={() => setShowOfferModal(false)}
          onSuccess={async () => {
            await loadData();
            setActionFeedback({ type: "success", message: "Official university offer letter uploaded successfully! Student has been notified." });
          }}
        />
      )}

      {/* Comment Modal */}
      {showComment && (
        <CommentModal
          appDisplayId={application.displayId}
          studentName={student.fullName}
          onClose={() => setShowComment(false)}
          onSubmit={handleCommentSubmit}
          loading={actionLoading}
        />
      )}

      <div className="space-y-4 max-w-[1440px] mx-auto pb-12 font-sans">
        {/* Feedback Alert */}
        {actionFeedback && (
          <div
            className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs font-semibold animate-in fade-in duration-150 ${
              actionFeedback.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            <div className="flex items-center gap-2">
              {actionFeedback.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span>{actionFeedback.message}</span>
            </div>
            <button onClick={() => setActionFeedback(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── BREADCRUMB ── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Link href="/admin/admission/dashboard" className="hover:text-blue-600 flex items-center gap-1">
              <Home className="w-3.5 h-3.5" /> Dashboard
            </Link>
            <ChevronRight className="w-3 h-3 text-slate-300" />
            <Link href="/admin/admission/applications" className="hover:text-blue-600 font-medium">
              Applications Desk
            </Link>
            <ChevronRight className="w-3 h-3 text-slate-300" />
            <span className="text-slate-700 font-bold">{application.displayId}</span>
          </div>

          <Link
            href="/admin/admission/applications"
            className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Applications
          </Link>
        </div>

        {/* ── COMPACT TOP HEADER HERO ── */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-base shadow-md shadow-blue-500/20 shrink-0">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">{student.fullName}</h1>
                <span className="px-2 py-0.5 rounded-md bg-slate-100 font-mono text-[11px] font-bold text-slate-600 border border-slate-200">
                  {application.displayId}
                </span>
                {isApproved && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Reviewed by Officer
                  </span>
                )}
                {isRejected && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-50 border border-red-200 text-red-700 text-[11px] font-bold">
                    <Ban className="w-3 h-3 text-red-600" /> Rejected
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5 flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-slate-700">{application.university}</span>
                <span>•</span>
                <span>{application.course}</span>
                <span>•</span>
                <span className="text-blue-600 font-semibold">{application.intake}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 self-start md:self-auto">
            <StatusBadge status={application.status} size="md" />

            {/* Officer Actions (Hidden for Super Admin) */}
            {!isSuperAdmin && (
              <>
                {/* If NOT approved yet, or if it was Rejected and officer wants to overturn/approve */}
                {(!isApproved || isRejected) && (
                  <button
                    type="button"
                    onClick={handleApprove}
                    disabled={actionLoading}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" /> {isRejected ? "Overturn & Approve" : "Approve"}
                  </button>
                )}

                {/* Reject button (always available unless currently Rejected) */}
                {!isRejected && (
                  <button
                    type="button"
                    onClick={() => setShowRejectModal(true)}
                    disabled={actionLoading}
                    className="px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <Ban className="w-3.5 h-3.5" /> Reject
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* ── 3 COMPACT QUICK SUMMARY CARDS ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: University & Financial Gate */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-blue-600" /> Target University
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-50 text-blue-700 border border-blue-200">
                {application.studyLevel}
              </span>
            </div>

            <div className="space-y-1 text-xs">
              <p className="text-[10px] text-slate-400 font-semibold uppercase">Institution &amp; Country</p>
              <p className="font-bold text-slate-900">{application.university} ({application.targetCountry})</p>
              <p className="text-slate-700 font-medium">{application.course}</p>
              <p className="text-slate-500 text-[11px]">Target Intake: <strong className="text-slate-800">{application.intake}</strong></p>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px]">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                  <span className="font-black text-emerald-950 text-xs">TZS 50,000 File-Opening Fee</span>
                </div>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-emerald-100 text-emerald-800 uppercase">
                  Verified
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Student Quick Contact & Passport */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-600" /> Student Profile
              </span>
              <span className="text-[11px] font-semibold text-slate-500">{student.nationality}</span>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex items-center gap-2 text-slate-700">
                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="font-medium truncate">{student.email}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="font-medium">{student.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>DOB: <strong className="text-slate-800">{student.dob}</strong> ({student.gender})</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <div className={`p-2 rounded-xl border flex items-center justify-between text-xs ${
                passport.hasPassport ? "bg-slate-50 border-slate-200 text-slate-800" : "bg-amber-50 border-amber-200 text-amber-800"
              }`}>
                <span className="font-bold text-[11px]">
                  {passport.hasPassport ? `Passport: ${passport.number}` : passport.status}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                  passport.hasPassport ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                }`}>
                  {passport.hasPassport ? "Valid" : "Assistance"}
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Academic Qualifications */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-blue-600" /> Academic Dossier
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                {academic.qualification}
              </span>
            </div>

            <div className="space-y-1.5 text-xs">
              <div>
                <p className="text-[10px] text-slate-400 font-semibold uppercase">School / Institution</p>
                <p className="font-bold text-slate-900">{academic.school} ({academic.completionYear})</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-semibold uppercase">Grades / Subject Combination</p>
                <p className="font-medium text-slate-800">{academic.grades}</p>
              </div>
              <div className="pt-1 text-[11px] text-slate-500 font-medium">
                {academic.oLevelIndexNumber && <span>O-Level Index: <strong className="text-slate-700">{academic.oLevelIndexNumber}</strong></span>}
                {academic.aLevelIndexNumber && <span className="ml-2">• A-Level Index: <strong className="text-slate-700">{academic.aLevelIndexNumber}</strong></span>}
              </div>
            </div>
          </div>
        </div>

        {/* ── 2-COLUMN DOSSIER BODY (Tabs on Left, Action & Status on Right) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* LEFT SECTION (7 COLS): Comprehensive Tabs */}
          <div className="lg:col-span-7 space-y-4">
            {/* Tab Navigation Pill Bar */}
            <div className="bg-white rounded-2xl border border-slate-200 p-1.5 shadow-xs flex items-center gap-1 overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveTab("profile")}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  activeTab === "profile"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <User className="w-3.5 h-3.5" /> Full Profile &amp; Sponsor
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("academics")}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  activeTab === "academics"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" /> Academic History
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("documents")}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  activeTab === "documents"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <FileText className="w-3.5 h-3.5" /> Documents ({documents.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("applications")}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  activeTab === "applications"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Layers className="w-3.5 h-3.5" /> Other Choices ({allStudentApplications.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("activity")}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  activeTab === "activity"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <MessageCircle className="w-3.5 h-3.5" /> Notes &amp; Audit
              </button>
            </div>

            {/* TAB 1: FULL PROFILE & SPONSOR/PARENT DETAILS */}
            {activeTab === "profile" && (
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4 animate-in fade-in duration-150">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-600" /> Comprehensive Personal &amp; Family Profile
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">All student personal records, National ID, address, and sponsor contacts.</p>
                </div>

                {/* Personal Information Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 p-3.5 rounded-xl bg-slate-50 border border-slate-150 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">First Name</span>
                    <p className="font-bold text-slate-800">{student.firstName || "-"}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Middle Name</span>
                    <p className="font-bold text-slate-800">{student.middleName || "-"}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Last Name</span>
                    <p className="font-bold text-slate-800">{student.lastName || "-"}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Date of Birth</span>
                    <p className="font-medium text-slate-800">{student.dob}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Gender</span>
                    <p className="font-medium text-slate-800 capitalize">{student.gender}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Nationality</span>
                    <p className="font-medium text-slate-800">{student.nationality}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">City / Region</span>
                    <p className="font-medium text-slate-800">{student.region} {student.district ? `(${student.district})` : ""}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">National ID (NIDA)</span>
                    <p className="font-mono font-bold text-slate-800">{student.nidaNumber}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Applied Abroad Before</span>
                    <p className="font-medium text-slate-800">{student.appliedAbroadBefore}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">How Did You Hear</span>
                    <p className="font-medium text-slate-800">{student.howDidYouHear}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Need Financial Guidance</span>
                    <p className="font-medium text-slate-800">{student.needFinancialGuidance}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Sponsorship / Funding</span>
                    <p className="font-medium text-slate-800">{student.sponsorType}</p>
                  </div>
                </div>

                {/* Parent / Guardian / Sponsor Contacts */}
                <div className="pt-2">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-blue-600" /> Parent / Guardian / Sponsor Contact
                  </h4>

                  {contacts.length === 0 ? (
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-150 text-xs text-slate-500">
                      No additional parent/sponsor contacts listed.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {contacts.map((contact: any) => (
                        <div key={contact.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-150 space-y-1.5 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900">{contact.full_name}</span>
                            <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10px] font-extrabold uppercase">
                              {contact.relationship || "Sponsor"}
                            </span>
                          </div>
                          <p className="text-slate-600 flex items-center gap-1.5">
                            <Phone className="w-3 h-3 text-slate-400" /> {contact.phone}
                          </p>
                          {contact.email && (
                            <p className="text-slate-600 flex items-center gap-1.5">
                              <Mail className="w-3 h-3 text-slate-400" /> {contact.email}
                            </p>
                          )}
                          {contact.occupation && (
                            <p className="text-slate-500 flex items-center gap-1.5 text-[11px]">
                              <Briefcase className="w-3 h-3 text-slate-400" /> Occupation: {contact.occupation}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: COMPLETE ACADEMIC HISTORY */}
            {activeTab === "academics" && (
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4 animate-in fade-in duration-150">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-blue-600" /> Full Academic Background &amp; Qualifications
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">O-Level, A-Level, and tertiary degree details provided by student.</p>
                </div>

                <div className="space-y-3">
                  {/* Secondary / O-Level */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-150 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-blue-600" /> Ordinary Level (O-Level) Secondary
                      </span>
                      {academic.oLevelYear && (
                        <span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 text-[10px] font-bold">
                          Class of {academic.oLevelYear}
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-1 text-slate-700">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">School Name</span>
                        <p className="font-bold text-slate-800">{academic.oLevelSchool || "Secondary School"}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Index Number</span>
                        <p className="font-mono font-bold text-slate-800">{academic.oLevelIndexNumber || "On Certificate File"}</p>
                      </div>
                    </div>
                  </div>

                  {/* High School / A-Level */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-150 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-purple-600" /> Advanced Level (A-Level) / High School
                      </span>
                      {academic.aLevelYear && (
                        <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 text-[10px] font-bold">
                          Class of {academic.aLevelYear}
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-slate-700">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">School Name</span>
                        <p className="font-bold text-slate-800">{academic.aLevelSchool || "High School"}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Subject Combination</span>
                        <p className="font-bold text-purple-700">{academic.aLevelCombination || "General"}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">A-Level Index</span>
                        <p className="font-mono font-bold text-slate-800">{academic.aLevelIndexNumber || "On Certificate File"}</p>
                      </div>
                    </div>
                  </div>

                  {/* Tertiary / Bachelor / Master if applicable */}
                  {(academic.bachelorInstitution || academic.bachelorCourse) && (
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-150 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5 text-emerald-600" /> University / Tertiary Degree
                        </span>
                        {academic.bachelorYear && (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            {academic.bachelorYear}
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-1 text-slate-700">
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-semibold">Institution</span>
                          <p className="font-bold text-slate-800">{academic.bachelorInstitution}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-semibold">Course &amp; GPA</span>
                          <p className="font-medium text-slate-800">{academic.bachelorCourse} {academic.bachelorGpa ? `(GPA: ${academic.bachelorGpa})` : ""}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: DOCUMENTS & DECISION LETTERS */}
            {activeTab === "documents" && (
              <div className="space-y-4 animate-in fade-in duration-150">
                {/* 1. Uploaded Student Documents Card */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                        <FileText className="w-4 h-4" />
                      </div>
                      <h3 className="font-bold text-slate-900 text-sm">Uploaded Documents ({documents.length})</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowDocPending(true)}
                      className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 cursor-pointer"
                    >
                      <AlertTriangle className="w-3 h-3" /> Request Replacement
                    </button>
                  </div>

                  <div className="space-y-2">
                    {documents.length === 0 ? (
                      <p className="text-xs text-slate-400 py-6 text-center">No documents uploaded yet.</p>
                    ) : (
                      documents.map((doc: any) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-150 hover:bg-slate-100/70 transition-colors"
                        >
                          <div className="flex items-center gap-2.5 min-w-0 pr-2">
                            {doc.is_verified ? (
                              <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                                <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
                              </div>
                            ) : (
                              <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                                <Clock className="w-3 h-3 text-amber-600" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-800 truncate">{doc.document_type}</p>
                              <p className="text-[10px] text-slate-400 truncate">{doc.file_name || "Document file"}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                doc.is_verified
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-amber-100 text-amber-700"
                              }`}
                            >
                              {doc.is_verified ? "Verified" : "Pending"}
                            </span>

                            <button
                              type="button"
                              onClick={() => setPreviewingDoc(doc)}
                              className="flex items-center gap-1 text-xs text-blue-600 font-bold hover:bg-blue-100 hover:text-blue-700 px-2.5 py-1 bg-blue-50 rounded-lg transition-all cursor-pointer shadow-2xs"
                            >
                              <Eye className="w-3.5 h-3.5" /> View
                            </button>

                            {!doc.is_verified && (
                              <button
                                type="button"
                                onClick={() => handleVerifyDocument(doc.id)}
                                disabled={actionLoading}
                                className="px-2.5 py-1 text-xs font-bold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all cursor-pointer shadow-2xs"
                              >
                                Verify
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* 2. Official University Offer Letter / PAL Card */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                        <Award className="w-4 h-4" />
                      </div>
                      <h3 className="font-bold text-slate-900 text-sm">University Decision / Offer Letter</h3>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-150">
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        {application.offerLetterUrl ? "Official Offer Letter on File" : "No Offer Letter Uploaded"}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {application.offerLetterUrl
                          ? "University acceptance document has been issued and shared with the student."
                          : "Upload the official University Letter of Acceptance (PAL / LOA) once received."}
                      </p>
                    </div>

                    {application.offerLetterUrl ? (
                      <a
                        href={application.offerLetterUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs transition-all shrink-0 cursor-pointer shadow-2xs"
                      >
                        <Eye className="w-3.5 h-3.5" /> View Offer Letter
                      </a>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowOfferModal(true)}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all shrink-0 cursor-pointer shadow-xs"
                      >
                        <Upload className="w-3.5 h-3.5" /> Upload Offer Letter / PAL
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: OTHER UNIVERSITY PREFERENCES */}
            {activeTab === "applications" && (
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4 animate-in fade-in duration-150">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-blue-600" /> All University Applications Submitted by Student ({allStudentApplications.length})
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Summary of all primary and backup university choices selected by this student.</p>
                </div>

                <div className="space-y-2.5">
                  {allStudentApplications.length === 0 ? (
                    <p className="text-xs text-slate-400 py-4 text-center">No additional application choices found.</p>
                  ) : (
                    allStudentApplications.map((app: any, idx: number) => {
                      const isCurrent = app.id === application.id;
                      const uni = app.universities?.name || `Partner University (${app.target_country || "Abroad"})`;
                      const courseTitle = app.courses?.title || app.preferred_course || "Degree Programme";

                      return (
                        <div
                          key={app.id}
                          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                            isCurrent
                              ? "bg-blue-50/70 border-blue-200"
                              : "bg-slate-50 border-slate-150 hover:bg-slate-100"
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-slate-900">{uni}</span>
                              {isCurrent && (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-blue-600 text-white uppercase">
                                  Current Viewing
                                </span>
                              )}
                            </div>
                            <p className="text-slate-600 font-medium mt-0.5">{courseTitle} • Intake: {app.target_intake || "Upcoming"}</p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <StatusBadge status={app.status || "Under Review"} size="sm" />
                            {!isCurrent && (
                              <Link
                                href={`/admin/admission/applications/${app.id}`}
                                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 text-xs shadow-2xs"
                              >
                                View File
                              </Link>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* TAB 5: NOTES & AUDIT TRAIL */}
            {activeTab === "activity" && (
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4 animate-in fade-in duration-150">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                      <MessageCircle className="w-4 h-4 text-blue-600" /> Officer Notes &amp; Activity Log
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">Recorded comments, audit trails, and status transitions.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowComment(true)}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
                  >
                    + Add Note
                  </button>
                </div>

                {application.notes ? (
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-150 whitespace-pre-wrap text-xs text-slate-700 font-medium leading-relaxed max-h-48 overflow-y-auto">
                    {application.notes}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 py-3 text-center">No internal comments added yet.</p>
                )}

                {/* Audit Logs List */}
                <div className="pt-2 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Audit History</h4>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto text-xs">
                    {auditLogs && auditLogs.length > 0 ? (
                      auditLogs.map((log: any) => (
                        <div key={log.id} className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-[11px] text-slate-600 flex items-center justify-between">
                          <span className="font-semibold text-slate-800">{log.action.replace(/_/g, " ")}</span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(log.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-slate-400 text-[11px]">No previous audit logs recorded.</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT SECTION (5 COLS): Decision Controls & University Stage */}
          <div className="lg:col-span-5 space-y-4">
            {/* 1. Primary Admission Actions Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600" /> Admission Actions
                </h3>
              </div>

              {isSuperAdmin ? (
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                  <div className="flex items-center gap-2 font-bold text-slate-800">
                    <ShieldCheck className="w-4 h-4 text-indigo-600" />
                    <span>Super Admin Audit View</span>
                  </div>
                  <p className="text-slate-500 text-[11px] leading-relaxed">
                    Decisions, document requests, and status changes are restricted to the Admission Officer desk.
                  </p>
                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium">Current Status:</span>
                    <StatusBadge status={data.status} />
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    {/* Upload Decision / Offer Letter Button */}
                    <button
                      type="button"
                      onClick={() => setShowOfferModal(true)}
                      disabled={actionLoading}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-all cursor-pointer shadow-2xs"
                    >
                      <Upload className="w-4 h-4" />
                      Upload Offer Letter / Decision
                    </button>

                    {/* Document Replacement Button */}
                    <button
                      type="button"
                      onClick={() => setShowDocPending(true)}
                      disabled={actionLoading}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100 transition-all cursor-pointer"
                    >
                      <FileText className="w-4 h-4" />
                      Request Document Replacement
                    </button>

                    {/* Add Comment Button */}
                    <button
                      type="button"
                      onClick={() => setShowComment(true)}
                      disabled={actionLoading}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 transition-all cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Add Note / Message Student
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* 2. University Status Dropdown (Only for Admission Officers) */}
            {!isSuperAdmin && (
              <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3">
                <div className="border-b border-slate-100 pb-2">
                  <h3 className="font-extrabold text-slate-900 text-sm">University Application Stage</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Update once the institution confirms stage progress.
                  </p>
                </div>

                <div className="space-y-2">
                  <select
                    value={universityStatus}
                    onChange={(e) => setUniversityStatus(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="Under Review">Under Review</option>
                    <option value="Submitted to University">Submitted to University</option>
                  </select>

                  <button
                    type="button"
                    onClick={handleSaveUniversityStatus}
                    disabled={actionLoading}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {actionLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    <span>Save Status</span>
                  </button>
                </div>
              </div>
            )}

            {/* 3. Compact Application Timeline Stepper */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3">
              <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
                Milestone Timeline
              </h3>

              <div className="relative pl-2">
                <div className="absolute left-[13px] top-1 bottom-1 w-0.5 bg-slate-200" />
                <div className="space-y-3 relative">
                  {timelineSteps.map((step, idx) => (
                    <div key={idx} className="flex items-center gap-2.5 text-xs">
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 z-10 ${
                          step.done
                            ? "bg-emerald-500 border-emerald-500"
                            : "bg-white border-slate-300"
                        }`}
                      >
                        {step.done && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
                      </div>
                      <span className={`text-xs ${step.done ? "text-slate-800 font-bold" : "text-slate-400 font-medium"}`}>
                        {step.label}
                      </span>
                      {step.date && (
                        <span className="ml-auto text-[10px] text-slate-400 font-mono">
                          {step.date}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
