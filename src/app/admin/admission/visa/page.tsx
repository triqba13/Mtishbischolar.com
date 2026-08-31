"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  Search,
  Eye,
  ChevronRight,
  AlertTriangle,
  RefreshCw,
  Globe,
  Building2,
  GraduationCap,
  Calendar,
  CheckCircle2,
  X,
  FileCheck2,
  MessageSquarePlus,
  Send,
  Lock,
  AlertCircle,
  Clock,
  ShieldCheck,
} from "lucide-react";
import StatusBadge from "@/components/admin/admission/StatusBadge";
import { useAdminAuth } from "@/components/admin/AdminAuthProvider";
import { createClient } from "@/lib/supabase/client";

export interface VisaRequestItem {
  id: string;
  applicationId: string;
  appId: string;
  studentId: string;
  student: string;
  studentEmail: string;
  studentPhone: string;
  passportNumber: string;
  passportIssueDate?: string | null;
  passportExpiryDate?: string | null;
  university: string;
  course: string;
  targetCountry: string;
  appStatus: string;
  status: string; // Pending, Processing, Completed
  notes?: string;
  requestedOn: string;
  createdAt: string;
}

const TABS = ["All", "Pending", "Processing", "Completed"];

export default function VisaPage() {
  const { loading: authLoading } = useAdminAuth();
  const [requests, setRequests] = useState<VisaRequestItem[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("All");
  const [search, setSearch] = useState("");

  // Selected Visa Request Modal State
  const [selectedRequest, setSelectedRequest] = useState<VisaRequestItem | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);
  const [officerNote, setOfficerNote] = useState<string>("");
  const [isSendingNote, setIsSendingNote] = useState<boolean>(false);
  const [modalFeedback, setModalFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const loadVisaRequests = useCallback(async () => {
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

      const res = await fetch("/api/admin/admission/visa", {
        headers,
        credentials: "include",
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to load visa applications.");
      }

      setRequests(json.requests || []);
      setCounts(json.counts || {});
    } catch (err: any) {
      console.error("[VisaPage] Error fetching visa requests:", err);
      setError(err.message || "Failed to load visa applications.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) {
      loadVisaRequests();
    }
  }, [authLoading, loadVisaRequests]);

  const filtered = useMemo(() => {
    return requests.filter((r) => {
      const matchTab = activeTab === "All" || r.status === activeTab;
      const matchSearch =
        !search.trim() ||
        r.student.toLowerCase().includes(search.toLowerCase()) ||
        r.studentEmail.toLowerCase().includes(search.toLowerCase()) ||
        r.appId.toLowerCase().includes(search.toLowerCase()) ||
        r.targetCountry.toLowerCase().includes(search.toLowerCase()) ||
        r.passportNumber.toLowerCase().includes(search.toLowerCase());

      return matchTab && matchSearch;
    });
  }, [requests, activeTab, search]);

  // Handle status update
  const handleUpdateStatus = async (newStatus: "Visa Processing" | "Visa Approved") => {
    if (!selectedRequest) return;
    try {
      setIsUpdatingStatus(true);
      setModalFeedback(null);

      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (session?.access_token) headers["Authorization"] = `Bearer ${session.access_token}`;

      const res = await fetch("/api/admin/admission/visa", {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          applicationId: selectedRequest.applicationId,
          newStatus,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to update visa status.");
      }

      const tabStatus = newStatus === "Visa Approved" ? "Completed" : "Processing";

      setRequests((prev) =>
        prev.map((r) =>
          r.applicationId === selectedRequest.applicationId
            ? { ...r, appStatus: newStatus, status: tabStatus }
            : r
        )
      );

      setSelectedRequest((prev) =>
        prev ? { ...prev, appStatus: newStatus, status: tabStatus } : null
      );

      setModalFeedback({
        type: "success",
        message:
          newStatus === "Visa Processing"
            ? "Marked as Processing with Embassy! Notification sent to student."
            : "Visa Approved! Real-time student portal updated and congratulatory notification sent.",
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

      const res = await fetch("/api/admin/admission/visa", {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          actionType: "send_comment",
          applicationId: selectedRequest.applicationId,
          notes: officerNote.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to send visa note.");
      }

      setOfficerNote("");
      setModalFeedback({ type: "success", message: "Visa instruction sent to student portal notification!" });
    } catch (err: any) {
      setModalFeedback({ type: "error", message: err.message || "Failed to send note." });
    } finally {
      setIsSendingNote(false);
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
          <span className="text-slate-600 font-medium">Visa Processing</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
              <Globe className="w-6 h-6 text-blue-600" />
              <span>Visa Processing Desk</span>
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-1">
              Track and process student visas with embassies for students with completed passports.
            </p>
          </div>

          <button
            onClick={loadVisaRequests}
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
            onClick={loadVisaRequests}
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
            const count = counts[tab] ?? (tab === "All" ? requests.length : 0);
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
            placeholder="Search student, country, passport..."
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-600 outline-none transition-colors"
          />
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Student</th>
                <th className="py-3.5 px-4">Passport No</th>
                <th className="py-3.5 px-4">Destination &amp; University</th>
                <th className="py-3.5 px-4">Visa Status</th>
                <th className="py-3.5 px-4">Requested On</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading visa applications...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    No eligible visa applications found for students with completed passports.
                  </td>
                </tr>
              ) : (
                filtered.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{row.student}</div>
                      <div className="text-[11px] text-slate-500">{row.studentEmail}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                        {row.passportNumber}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{row.university}</div>
                      <div className="text-[11px] text-slate-500">{row.course} • ({row.targetCountry})</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide border ${
                          row.appStatus === "Visa Approved"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : row.appStatus === "Visa Processing"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}
                      >
                        {row.appStatus || "Pending"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">{row.requestedOn}</td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedRequest(row);
                          setModalFeedback(null);
                          setOfficerNote(row.notes || "");
                        }}
                        className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 font-extrabold text-xs transition-colors border border-blue-200 flex items-center gap-1.5 ml-auto cursor-pointer shadow-2xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Details</span>
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
      {/* MODAL: VISA DETAILS & ACTIONS                                 */}
      {/* ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedRequest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
            >
              {/* Modal Header */}
              <div className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-600/20">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900">
                      Visa Application Review &ndash; {selectedRequest.student}
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      {selectedRequest.appId} • Target Country: {selectedRequest.targetCountry}
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
                {/* 1. Student & University Details */}
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
                  <h4 className="font-extrabold text-xs text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    <span>Student &amp; Verified Passport Information</span>
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Student Name</span>
                      <p className="font-bold text-slate-900">{selectedRequest.student}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Passport Number</span>
                      <p className="font-mono font-bold text-blue-700">{selectedRequest.passportNumber}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Contact Email</span>
                      <p className="font-bold text-slate-800 truncate">{selectedRequest.studentEmail}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">University</span>
                      <p className="font-bold text-slate-800">{selectedRequest.university}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Degree Program</span>
                      <p className="font-bold text-slate-800">{selectedRequest.course}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Current Status</span>
                      <p className="font-extrabold text-blue-600">{selectedRequest.appStatus}</p>
                    </div>
                  </div>
                </div>

                {/* 2. Visa Action Controls */}
                <div className="p-4.5 bg-blue-50/70 rounded-2xl border border-blue-200 space-y-3">
                  <h4 className="font-extrabold text-xs text-blue-950 uppercase tracking-wider flex items-center gap-1.5">
                    <FileCheck2 className="w-4 h-4 text-blue-600" />
                    <span>Embassy Processing Action</span>
                  </h4>

                  <div className="flex flex-wrap items-center gap-3">
                    {/* Processing Button - LOCKED if already processing or approved */}
                    {selectedRequest.appStatus === "Visa Processing" ? (
                      <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-100 border border-blue-300 text-blue-800 font-extrabold text-xs">
                        <Lock className="w-3.5 h-3.5 text-blue-600" />
                        <span>Currently Processing with Embassy</span>
                      </div>
                    ) : selectedRequest.appStatus === "Visa Approved" ? (
                      <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-800 font-extrabold text-xs">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Visa Approved &amp; Completed</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={isUpdatingStatus}
                        onClick={() => handleUpdateStatus("Visa Processing")}
                        className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs transition-colors cursor-pointer shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                      >
                        {isUpdatingStatus && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                        <span>Mark As &quot;Visa In Process (Embassy)&quot;</span>
                      </button>
                    )}

                    {/* Visa Completed Button */}
                    {selectedRequest.appStatus !== "Visa Approved" && (
                      <button
                        type="button"
                        disabled={isUpdatingStatus}
                        onClick={() => handleUpdateStatus("Visa Approved")}
                        className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs transition-colors cursor-pointer shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                      >
                        {isUpdatingStatus && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Mark As &quot;Visa Completed (Visa Approved)&quot;</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* 3. Instructions / Notes for Student */}
                <div className="p-4.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <MessageSquarePlus className="w-4 h-4 text-blue-600" />
                    <span>Send Embassy / Appointment Instructions to Student</span>
                  </h4>
                  <textarea
                    rows={2}
                    value={officerNote}
                    onChange={(e) => setOfficerNote(e.target.value)}
                    placeholder="e.g. Your Embassy Biometrics appointment is scheduled for Friday at 10:00 AM at the Canadian Visa Application Center. Bring your original passport and proof of funds."
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white focus:border-blue-600 outline-none resize-none text-slate-800 text-xs"
                  />
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] text-slate-400">
                      This instruction will be delivered as an in-app portal notification directly to the student.
                    </p>
                    <button
                      type="button"
                      disabled={isSendingNote || !officerNote.trim()}
                      onClick={handleSendNote}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-xs"
                    >
                      {isSendingNote ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      <span>Send Visa Note</span>
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
    </div>
  );
}
