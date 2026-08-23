"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Home, Search, Eye, CheckCircle2, RefreshCw, X, FileText, ChevronRight, ChevronLeft, AlertTriangle, ExternalLink } from "lucide-react";
import { useAdminAuth } from "@/components/admin/AdminAuthProvider";
import { createClient } from "@/lib/supabase/client";

const TABS = ["All", "Pending", "Verified"];

export interface DocumentItem {
  id: string;
  studentId: string;
  applicationId?: string;
  appId: string;
  student: string;
  studentEmail?: string;
  document: string;
  rawType: string;
  fileName: string;
  fileSize: string;
  status: string;
  isVerified: boolean;
  university: string;
  uploaded: string;
  signedUrl?: string;
}

export interface PaginationState {
  page: number;
  pageSize: number;
  totalRecords: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

function DocumentReviewModal({
  doc,
  onClose,
  onVerify,
  onRequestReplacement,
  actionLoading,
}: {
  doc: DocumentItem;
  onClose: () => void;
  onVerify: (docId: string) => Promise<void>;
  onRequestReplacement: (docId: string, reason: string, comment: string) => Promise<void>;
  actionLoading: boolean;
}) {
  const [showReplacementForm, setShowReplacementForm] = useState(false);
  const [reason, setReason] = useState("Unclear / Blurry");
  const [comment, setComment] = useState("");

  const handleReplacement = async () => {
    await onRequestReplacement(doc.id, reason, comment);
    onClose();
  };

  const previewUrl = doc.signedUrl || `/api/admin/admission/documents/${doc.id}/preview`;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 border border-slate-200">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-bold text-slate-800 text-lg">Document Review</h3>
            <p className="text-xs text-slate-500 mt-0.5 font-mono">
              {doc.appId} — {doc.document}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Document preview / link */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 mb-5 flex flex-col items-center justify-center min-h-[140px]">
          <FileText className="w-12 h-12 text-blue-500 mb-2" />
          <p className="text-sm text-slate-800 font-semibold text-center">{doc.fileName}</p>
          <p className="text-xs text-slate-400 mt-1">Uploaded by {doc.student}</p>
          
          <a
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700 shadow-sm transition-all cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" /> Open File Preview <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Metadata */}
        <div className="grid grid-cols-2 gap-3 mb-5 bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Document Type</p>
            <p className="text-sm text-slate-700 font-medium mt-0.5">{doc.document}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Student</p>
            <p className="text-sm text-slate-700 font-medium mt-0.5">{doc.student}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Uploaded</p>
            <p className="text-sm text-slate-700 font-medium mt-0.5">{doc.uploaded}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Status</p>
            <p className={`text-xs font-bold mt-1 inline-block px-2 py-0.5 rounded-full ${
              doc.isVerified ? "bg-emerald-50 text-emerald-700" : "bg-orange-50 text-orange-700"
            }`}>
              {doc.status}
            </p>
          </div>
        </div>

        {/* Replacement Form Toggle */}
        {showReplacementForm ? (
          <div className="space-y-3 pt-2 border-t border-slate-100 mb-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Reason for Replacement</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
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
              <label className="block text-xs font-semibold text-slate-500 mb-1">Instructions for Student</label>
              <textarea
                rows={2}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="e.g., Please upload a clearer scanned PDF copy of your academic certificate..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowReplacementForm(false)}
                className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReplacement}
                disabled={actionLoading}
                className="flex-1 py-2 bg-orange-600 text-white rounded-xl text-xs font-semibold hover:bg-orange-700 transition-all cursor-pointer disabled:opacity-60"
              >
                {actionLoading ? "Sending..." : "Send Replacement Request to Student"}
              </button>
            </div>
          </div>
        ) : (
          /* Actions */
          <div className="flex gap-3">
            {!doc.isVerified && (
              <button
                type="button"
                onClick={async () => {
                  await onVerify(doc.id);
                  onClose();
                }}
                disabled={actionLoading}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-all cursor-pointer disabled:opacity-60 shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4" />
                {actionLoading ? "Verifying..." : "Verify Document"}
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowReplacementForm(true)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-orange-50 border border-orange-200 text-orange-700 text-sm font-semibold hover:bg-orange-100 transition-all cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              Request Replacement
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DocumentsPage() {
  const { loading: authLoading } = useAdminAuth();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    pageSize: 10,
    totalRecords: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState("All");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const [reviewDoc, setReviewDoc] = useState<DocumentItem | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // Debounce search input by 350ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const loadDocuments = useCallback(async () => {
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

      // Build server-side pagination query parameters
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: pageSize.toString(),
        tab: activeTab,
      });

      if (debouncedSearch) {
        params.set("search", debouncedSearch);
      }

      const res = await fetch(`/api/admin/admission/documents?${params.toString()}`, {
        headers,
        credentials: "include",
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to load documents.");
      }

      const fetchedItems = json.data?.items || json.documents || [];
      const fetchedPagination = json.data?.pagination || json.pagination || {
        page: currentPage,
        pageSize,
        totalRecords: fetchedItems.length,
        totalPages: Math.max(1, Math.ceil(fetchedItems.length / pageSize)),
        hasNextPage: false,
        hasPrevPage: currentPage > 1,
      };

      setDocuments(fetchedItems);
      setPagination(fetchedPagination);
      setCounts(json.data?.tabCounts || json.counts || {});
    } catch (err: any) {
      console.error("[DocumentsPage] Error fetching documents:", err);
      setError(err.message || "Failed to load documents.");
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, activeTab, debouncedSearch]);

  useEffect(() => {
    if (!authLoading) {
      loadDocuments();
    }
  }, [authLoading, loadDocuments]);

  const handleVerifyDoc = async (docId: string) => {
    try {
      setActionLoading(true);
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (session?.access_token) headers["Authorization"] = `Bearer ${session.access_token}`;

      const res = await fetch("/api/admin/admission/documents/action", {
        method: "POST",
        headers,
        body: JSON.stringify({ action: "verify", documentId: docId }),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to verify document.");
      }

      setActionSuccessMessage("Document verified successfully!");
      setTimeout(() => setActionSuccessMessage(null), 4000);

      // Re-fetch current page data from server
      await loadDocuments();
    } catch (err: any) {
      console.error("Verify error:", err);
      setError(err.message || "Failed to verify document.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestReplacement = async (docId: string, reason: string, comment: string) => {
    try {
      setActionLoading(true);
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (session?.access_token) headers["Authorization"] = `Bearer ${session.access_token}`;

      const res = await fetch("/api/admin/admission/documents/action", {
        method: "POST",
        headers,
        body: JSON.stringify({
          action: "request_replacement",
          documentId: docId,
          reason,
          comment,
        }),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to request replacement.");
      }

      setActionSuccessMessage("Replacement request sent to student dashboard successfully.");
      setTimeout(() => setActionSuccessMessage(null), 4000);

      // Re-fetch current page data from server
      await loadDocuments();
    } catch (err: any) {
      console.error("Replacement error:", err);
      setError(err.message || "Failed to request replacement.");
    } finally {
      setActionLoading(false);
    }
  };

  const totalRecords = pagination.totalRecords;
  const totalPages = pagination.totalPages;

  return (
    <>
      {reviewDoc && (
        <DocumentReviewModal
          doc={reviewDoc}
          onClose={() => setReviewDoc(null)}
          onVerify={handleVerifyDoc}
          onRequestReplacement={handleRequestReplacement}
          actionLoading={actionLoading}
        />
      )}

      <div className="space-y-5">
        {/* Header */}
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2">
            <Home className="w-3.5 h-3.5" />
            <ChevronRight className="w-3 h-3" />
            <Link href="/admin/admission/dashboard" className="hover:text-blue-600">
              Dashboard
            </Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-slate-600 font-medium">Documents</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Documents</h1>
              <p className="text-slate-500 text-sm mt-1">Review and verify student academic admission documents.</p>
            </div>
            <button
              onClick={loadDocuments}
              disabled={loading}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 shadow-sm transition-all cursor-pointer disabled:opacity-60"
              title="Refresh documents"
            >
              <RefreshCw className={`w-4 h-4 text-slate-400 ${loading ? "animate-spin" : ""}`} />
              <span className="text-xs font-semibold">Refresh</span>
            </button>
          </div>
        </div>

        {actionSuccessMessage && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <p className="text-sm font-medium">{actionSuccessMessage}</p>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
            <button
              onClick={loadDocuments}
              className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-slate-200">
          {/* Tabs */}
          <div className="flex border-b border-slate-100 px-4">
            {TABS.map((tab) => {
              const count =
                tab === "All"
                  ? counts.All ?? totalRecords
                  : tab === "Pending"
                  ? counts.Pending ?? 0
                  : counts.Verified ?? 0;
              return (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab);
                    setCurrentPage(1);
                  }}
                  className={`flex items-center gap-2 px-4 py-3.5 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
                    activeTab === tab
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {tab}
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      activeTab === tab ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search */}
          <div className="px-5 py-4 border-b border-slate-100">
            <div className="relative max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search student, document..."
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  {["Student", "Application ID", "Document", "Status", "Uploaded", "Action"].map((h) => (
                    <th
                      key={h}
                      className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide px-5 py-3"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-sm text-slate-400">
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                        Loading academic documents...
                      </div>
                    </td>
                  </tr>
                ) : documents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-sm text-slate-400">
                      No academic documents found in this review category.
                    </td>
                  </tr>
                ) : (
                  documents.map((d) => (
                    <tr
                      key={d.id}
                      className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors last:border-0"
                    >
                      <td className="px-5 py-3.5 text-sm font-medium text-slate-800">{d.student}</td>
                      <td className="px-5 py-3.5 text-xs font-mono text-slate-600">{d.appId}</td>
                      <td className="px-5 py-3.5 text-sm font-medium text-slate-700">{d.document}</td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            d.isVerified ? "bg-emerald-50 text-emerald-700" : "bg-orange-50 text-orange-700"
                          }`}
                        >
                          {d.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-500">{d.uploaded}</td>
                      <td className="px-5 py-3.5">
                        <button
                          type="button"
                          onClick={() => setReviewDoc(d)}
                          className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" /> Review
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination & Summary */}
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              Showing {totalRecords > 0 ? (currentPage - 1) * pageSize + 1 : 0} to{" "}
              {Math.min(currentPage * pageSize, totalRecords)} of {totalRecords} documents
            </p>
            {totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={!pagination.hasPrevPage || loading}
                  className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  title="Previous Page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p)}
                    disabled={loading}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      currentPage === p
                        ? "bg-blue-600 text-white"
                        : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={!pagination.hasNextPage || loading}
                  className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  title="Next Page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
