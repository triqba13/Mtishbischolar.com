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
  Plane,
} from "lucide-react";
import { useAdminAuth } from "@/components/admin/AdminAuthProvider";
import { createClient } from "@/lib/supabase/client";

export interface StudentVisaApp {
  id: string;
  applicationId: string;
  appId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  passportNumber: string;
  university: string;
  course: string;
  targetCountry: string;
  appStatus: string;
  status: string; // "Pending", "Processing", "Completed"
  notes?: string;
  requestedOn: string;
  createdAt: string;
  updatedAt?: string;
}

export interface StudentWithVisaApps {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentPhone: string;
  avatarUrl: string | null;
  passportNumber: string;
  passportIssueDate?: string | null;
  passportExpiryDate?: string | null;
  applications: StudentVisaApp[];
  totalApplications: number;
  pendingApplications: number;
  processingApplications: number;
  completedApplications: number;
  overallStatus: string; // "Visa Approved", "Visa Processing", "Pending Review"
  lastRequestedOn: string;
  lastRequestedFormatted: string;
}

const TABS = ["All Students", "Pending Review", "In Processing", "Visa Approved"];

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

export default function VisaPage() {
  const { loading: authLoading } = useAdminAuth();
  const [students, setStudents] = useState<StudentWithVisaApps[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("All Students");
  const [search, setSearch] = useState("");

  // Selected Student ID (cleanly derived without re-render loop)
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [activeAppIdForNote, setActiveAppIdForNote] = useState<string | null>(null);
  const [officerNote, setOfficerNote] = useState<string>("");
  const [isSendingNote, setIsSendingNote] = useState<boolean>(false);
  const [actionLoadingAppId, setActionLoadingAppId] = useState<string | null>(null);
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

      setStudents(json.students || []);
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

  // Derive active selected student
  const selectedStudent = useMemo(() => {
    if (!selectedStudentId) return null;
    return students.find((s) => s.id === selectedStudentId) || null;
  }, [students, selectedStudentId]);

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchTab =
        activeTab === "All Students" ||
        (activeTab === "Pending Review" && s.pendingApplications > 0 && s.completedApplications === 0 && s.processingApplications === 0) ||
        (activeTab === "In Processing" && s.processingApplications > 0 && s.completedApplications === 0) ||
        (activeTab === "Visa Approved" && s.completedApplications > 0);

      const matchSearch =
        !search.trim() ||
        s.studentName.toLowerCase().includes(search.toLowerCase()) ||
        s.studentEmail.toLowerCase().includes(search.toLowerCase()) ||
        s.passportNumber.toLowerCase().includes(search.toLowerCase()) ||
        s.applications.some(
          (a) =>
            a.university.toLowerCase().includes(search.toLowerCase()) ||
            a.targetCountry.toLowerCase().includes(search.toLowerCase()) ||
            a.appId.toLowerCase().includes(search.toLowerCase())
        );

      return matchTab && matchSearch;
    });
  }, [students, activeTab, search]);

  // Handle status update
  const handleUpdateStatus = async (applicationId: string, newStatus: "Visa Processing" | "Visa Approved") => {
    try {
      setActionLoadingAppId(applicationId);
      setModalFeedback(null);

      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (session?.access_token) headers["Authorization"] = `Bearer ${session.access_token}`;

      const res = await fetch("/api/admin/admission/visa", {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          applicationId,
          newStatus,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to update visa status.");
      }

      setModalFeedback({
        type: "success",
        message:
          newStatus === "Visa Processing"
            ? "Marked as Processing with Embassy! Notification sent to student."
            : "Visa Approved! Real-time student portal updated and congratulatory notification sent.",
      });

      await loadVisaRequests();
    } catch (err: any) {
      setModalFeedback({ type: "error", message: err.message || "Failed to update status." });
    } finally {
      setActionLoadingAppId(null);
    }
  };

  // Handle sending note/comment to student
  const handleSendNote = async (applicationId: string) => {
    if (!officerNote.trim()) return;
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
          applicationId,
          notes: officerNote.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to send visa note.");
      }

      setOfficerNote("");
      setActiveAppIdForNote(null);
      setModalFeedback({ type: "success", message: "Visa instruction sent to student portal notification!" });
      await loadVisaRequests();
    } catch (err: any) {
      setModalFeedback({ type: "error", message: err.message || "Failed to send note." });
    } finally {
      setIsSendingNote(false);
    }
  };

  const handleCloseModal = () => {
    setSelectedStudentId(null);
    setModalFeedback(null);
    setActiveAppIdForNote(null);
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
              Track and process student visas with embassies grouped by applicant with verified passports.
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
            const count =
              tab === "All Students"
                ? counts.All || students.length
                : tab === "Pending Review"
                ? counts.Pending || 0
                : tab === "In Processing"
                ? counts.Processing || 0
                : counts.Completed || 0;

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
            placeholder="Search student, passport, country..."
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
                <th className="py-3.5 px-4">Passport No</th>
                <th className="py-3.5 px-4">Applications</th>
                <th className="py-3.5 px-4">Visa Progress</th>
                <th className="py-3.5 px-4">Last Requested</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading eligible visa students...
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    No eligible students with verified passports found.
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
                      <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                        {s.passportNumber}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 text-slate-800 font-bold text-xs border border-slate-200/80">
                        <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
                        <span>{s.totalApplications} Applications</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide border ${
                          s.overallStatus === "Visa Approved"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : s.overallStatus === "Visa Processing"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}
                      >
                        {s.overallStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-medium">{s.lastRequestedFormatted}</td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedStudentId(s.id);
                          setModalFeedback(null);
                          setActiveAppIdForNote(null);
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 font-extrabold text-xs transition-colors border border-blue-200 flex items-center gap-1.5 ml-auto cursor-pointer shadow-2xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Applications</span>
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
      {/* MODAL: STUDENT VISA APPLICATIONS HUB                          */}
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
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900">
                      Visa Applications &ndash; {selectedStudent.studentName}
                    </h3>
                    <p className="text-[11px] text-slate-500 font-mono">
                      Passport No: <span className="font-bold text-blue-700">{selectedStudent.passportNumber}</span> • {selectedStudent.totalApplications} University Applications
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

              {/* Modal Body: List of Applications */}
              <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
                {selectedStudent.applications.map((app) => (
                  <div
                    key={app.id}
                    className="p-5 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-4 hover:border-blue-200 transition-colors"
                  >
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] font-extrabold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-md">
                            {app.appId}
                          </span>
                          <h4 className="font-extrabold text-sm text-slate-900">{app.university}</h4>
                        </div>
                        <p className="text-slate-600 text-xs mt-0.5">
                          {app.course} &bull; <span className="font-semibold text-slate-700">Target Country: {app.targetCountry}</span>
                        </p>
                      </div>

                      <div>
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wide border ${
                            app.appStatus === "Visa Approved"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : app.appStatus === "Visa Processing"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : app.appStatus === "Rejected"
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                        >
                          {app.appStatus}
                        </span>
                      </div>
                    </div>

                    {/* Action Controls */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Visa In Process Button */}
                        {app.appStatus === "Visa Processing" ? (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-100 border border-blue-300 text-blue-800 font-extrabold text-xs">
                            <Lock className="w-3.5 h-3.5 text-blue-600" />
                            <span>In Processing with Embassy</span>
                          </div>
                        ) : app.appStatus === "Visa Approved" ? (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-800 font-extrabold text-xs">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Visa Approved</span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            disabled={actionLoadingAppId === app.id}
                            onClick={() => handleUpdateStatus(app.id, "Visa Processing")}
                            className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs transition-colors cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                          >
                            {actionLoadingAppId === app.id && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                            <span>Mark &quot;In Process (Embassy)&quot;</span>
                          </button>
                        )}

                        {/* Visa Approved Button */}
                        {app.appStatus !== "Visa Approved" && (
                          <button
                            type="button"
                            disabled={actionLoadingAppId === app.id}
                            onClick={() => handleUpdateStatus(app.id, "Visa Approved")}
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs transition-colors cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                          >
                            {actionLoadingAppId === app.id && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Mark &quot;Visa Approved&quot;</span>
                          </button>
                        )}
                      </div>

                      {/* Toggle Send Note Button */}
                      <button
                        type="button"
                        onClick={() =>
                          setActiveAppIdForNote(activeAppIdForNote === app.id ? null : app.id)
                        }
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors border flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                          activeAppIdForNote === app.id
                            ? "bg-blue-600 text-white border-blue-700"
                            : "bg-white text-slate-700 hover:bg-slate-100 border-slate-200"
                        }`}
                      >
                        <MessageSquarePlus className="w-3.5 h-3.5 text-blue-600" />
                        <span>Embassy Instructions</span>
                      </button>
                    </div>

                    {/* Inline Note Sender */}
                    {activeAppIdForNote === app.id && (
                      <div className="p-3.5 bg-white rounded-xl border border-blue-200 space-y-2.5 animate-in fade-in duration-150 shadow-2xs">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">
                          Send Embassy / Appointment Instructions to Student for {app.university}:
                        </label>
                        <textarea
                          rows={2}
                          value={officerNote}
                          onChange={(e) => setOfficerNote(e.target.value)}
                          placeholder="e.g. Your Biometrics appointment is scheduled for Friday at 10:00 AM at the Canadian Visa Application Center. Bring your original passport."
                          className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white text-xs outline-none focus:border-blue-600 resize-none text-slate-800"
                        />
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] text-slate-400">
                            Sent directly as an in-app portal notification to {selectedStudent.studentName}.
                          </p>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              disabled={isSendingNote || !officerNote.trim()}
                              onClick={() => handleSendNote(app.id)}
                              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-2xs"
                            >
                              {isSendingNote ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                              <span>Send Note</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setActiveAppIdForNote(null)}
                              className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-50 cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-end">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs transition-colors cursor-pointer"
                >
                  Close Visa Hub
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
