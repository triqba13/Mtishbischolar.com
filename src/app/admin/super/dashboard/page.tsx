"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ShieldAlert,
  Users,
  FileText,
  DollarSign,
  Building2,
  ArrowRight,
  Eye,
  CheckCircle2,
  Clock,
  XCircle,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Calendar,
  CreditCard,
  GraduationCap,
  X,
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useAdminAuth } from "@/components/admin/AdminAuthProvider";

export interface SuperOverviewApp {
  id: string;
  student_name: string;
  student_email: string;
  university_name: string;
  preferred_course: string;
  status: string;
  created_at: string;
  target_country?: string;
  offer_letter_url?: string | null;
  notes?: string | null;
}

export interface SuperOverviewPayment {
  id: string;
  student_name: string;
  student_email: string;
  amount: number;
  currency: string;
  payment_method: string;
  transaction_ref: string | null;
  payment_proof_url: string | null;
  status: string;
  payment_type: string | null;
  verified_at: string | null;
  created_at: string;
}

export default function SuperAdminDashboard() {
  const { fullName } = useAdminAuth();
  const [stats, setStats] = useState({
    studentsCount: 0,
    applicationsCount: 0,
    paymentsCount: 0,
    approvedRevenue: 0,
    universitiesCount: 0,
  });

  const [recentApps, setRecentApps] = useState<SuperOverviewApp[]>([]);
  const [recentPayments, setRecentPayments] = useState<SuperOverviewPayment[]>([]);
  const [loading, setLoading] = useState(true);

  // Read-only modal states for inspection
  const [inspectApp, setInspectApp] = useState<SuperOverviewApp | null>(null);
  const [inspectPayment, setInspectPayment] = useState<SuperOverviewPayment | null>(null);

  const supabase = createClient();

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);

      // 1. Fetch approved payment student IDs (visibility rule)
      const { data: approvedPaymentsData } = await supabase
        .from("payments")
        .select("student_id, amount, status")
        .eq("status", "Approved");

      const approvedStudentIds = Array.from(
        new Set((approvedPaymentsData || []).map((p) => p.student_id).filter(Boolean))
      );

      const [
        { count: applicationsCount },
        { count: paymentsCount },
        { count: universitiesCount },
        { data: appsData },
        { data: paymentsData },
      ] = await Promise.all([
        supabase
          .from("applications")
          .select("id", { count: "exact", head: true })
          .in("student_id", approvedStudentIds.length > 0 ? approvedStudentIds : ["00000000-0000-0000-0000-000000000000"]),
        supabase
          .from("payments")
          .select("id", { count: "exact", head: true })
          .in("student_id", approvedStudentIds.length > 0 ? approvedStudentIds : ["00000000-0000-0000-0000-000000000000"]),
        supabase.from("universities").select("id", { count: "exact", head: true }),
        supabase
          .from("applications")
          .select(
            "id, preferred_course, target_country, status, created_at, offer_letter_url, notes, profiles:student_id(first_name, last_name, email), universities:university_id(name)"
          )
          .in("student_id", approvedStudentIds.length > 0 ? approvedStudentIds : ["00000000-0000-0000-0000-000000000000"])
          .order("created_at", { ascending: false })
          .limit(6),
        supabase
          .from("payments")
          .select(
            "id, amount, currency, payment_method, transaction_ref, payment_proof_url, status, payment_type, verified_at, created_at, profiles:student_id(first_name, last_name, email)"
          )
          .in("student_id", approvedStudentIds.length > 0 ? approvedStudentIds : ["00000000-0000-0000-0000-000000000000"])
          .order("created_at", { ascending: false })
          .limit(6),
      ]);

      const totalRevenue = (approvedPaymentsData || []).reduce(
        (sum, p) => sum + (Number(p.amount) || 0),
        0
      );

      setStats({
        studentsCount: approvedStudentIds.length,
        applicationsCount: applicationsCount || 0,
        paymentsCount: paymentsCount || 0,
        approvedRevenue: totalRevenue,
        universitiesCount: universitiesCount || 0,
      });

      const formattedApps: SuperOverviewApp[] = (appsData || []).map((a: any) => {
        const p = a.profiles;
        const u = a.universities;
        return {
          id: a.id,
          student_name: p ? `${p.first_name || ""} ${p.last_name || ""}`.trim() : "Student",
          student_email: p?.email || "",
          university_name: u?.name || "Selected University",
          preferred_course: a.preferred_course || "Undergraduate / Postgraduate",
          status: a.status || "Profile Completed",
          created_at: a.created_at,
          target_country: a.target_country,
          offer_letter_url: a.offer_letter_url,
          notes: a.notes,
        };
      });

      const formattedPayments: SuperOverviewPayment[] = (paymentsData || []).map((p: any) => {
        const prof = p.profiles;
        return {
          id: p.id,
          student_name: prof ? `${prof.first_name || ""} ${prof.last_name || ""}`.trim() : "Student",
          student_email: prof?.email || "",
          amount: Number(p.amount) || 0,
          currency: p.currency || "TZS",
          payment_method: p.payment_method || "Bank / Mobile",
          transaction_ref: p.transaction_ref,
          payment_proof_url: p.payment_proof_url,
          status: p.status || "Pending",
          payment_type: p.payment_type,
          verified_at: p.verified_at,
          created_at: p.created_at,
        };
      });

      setRecentApps(formattedApps);
      setRecentPayments(formattedPayments);
    } catch (err) {
      console.error("Error loading super admin dashboard data:", err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const formatMoney = (val: number, curr = "TZS") => {
    return `${curr} ${val.toLocaleString()}`;
  };

  const formatDate = (ts?: string) => {
    if (!ts) return "—";
    return new Date(ts).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Super Admin Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-indigo-900/50">
        <div>
          <div className="inline-flex items-center gap-2 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-full text-xs font-semibold mb-2">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Super Admin Headquarters • Read-Only Auditor Mode</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Executive Oversight, {fullName}
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl">
            Live system monitoring across Admission Desk & Finance Operations. As Super Admin, you have comprehensive audit visibility without interfering in officer actions.
          </p>
        </div>

        <button
          type="button"
          onClick={loadDashboardData}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50 shrink-0 self-start md:self-center"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Sync Realtime Data</span>
        </button>
      </div>

      {/* System Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Students</p>
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">{stats.studentsCount}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Registered student profiles</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Applications</p>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-2">{stats.applicationsCount}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Active admission workflows</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Revenue</p>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-2 truncate">
            {formatMoney(stats.approvedRevenue)}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{stats.paymentsCount} payments audited</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Universities</p>
            <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-2">{stats.universitiesCount}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Partner institutions</p>
        </div>
      </div>

      {/* Dual Live Activity Oversight Grids (Read-Only Streams) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Admission Stream */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">Admission Operations Stream</h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Recent applications & status audit</p>
              </div>
            </div>

            <Link
              href="/admin/admission/dashboard"
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
            >
              <span>View Desk</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {loading ? (
              <div className="py-8 text-center text-xs text-slate-400">Loading admission activity...</div>
            ) : recentApps.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">No applications recorded yet.</div>
            ) : (
              recentApps.map((app) => (
                <div key={app.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{app.student_name}</p>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {app.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {app.preferred_course} • {app.university_name}
                    </p>
                  </div>

                  {/* Read-Only Inspect Button */}
                  <button
                    type="button"
                    onClick={() => setInspectApp(app)}
                    className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/40 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer shrink-0"
                    title="Inspect Application (Read-Only)"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 2. Finance Stream */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <DollarSign className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">Finance Operations Stream</h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Recent student payments & revenue logs</p>
              </div>
            </div>

            <Link
              href="/admin/finance/dashboard"
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
            >
              <span>View Desk</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {loading ? (
              <div className="py-8 text-center text-xs text-slate-400">Loading financial activity...</div>
            ) : recentPayments.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">No payment records logged yet.</div>
            ) : (
              recentPayments.map((pay) => (
                <div key={pay.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{pay.student_name}</p>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          pay.status === "Approved"
                            ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                            : pay.status === "Rejected"
                            ? "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800"
                            : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                        }`}
                      >
                        {pay.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{formatMoney(pay.amount, pay.currency)}</span> • {pay.payment_method}
                    </p>
                  </div>

                  {/* Read-Only Inspect Button */}
                  <button
                    type="button"
                    onClick={() => setInspectPayment(pay)}
                    className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/40 text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer shrink-0"
                    title="Inspect Payment (Read-Only)"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── Read-Only Modal: Application Inspector ── */}
      {inspectApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 max-w-lg w-full space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Application Audit Record</h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectApp(null)}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl space-y-2 border border-slate-100 dark:border-slate-800">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Student:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{inspectApp.student_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Email:</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">{inspectApp.student_email || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">University:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{inspectApp.university_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Course:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{inspectApp.preferred_course}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Target Country:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{inspectApp.target_country || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Status:</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">{inspectApp.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Submitted:</span>
                  <span className="text-slate-600 dark:text-slate-400">{formatDate(inspectApp.created_at)}</span>
                </div>
              </div>

              {inspectApp.notes && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl text-amber-900 dark:text-amber-200 text-xs">
                  <p className="font-bold mb-0.5">Admission Desk Notes:</p>
                  <p>{inspectApp.notes}</p>
                </div>
              )}

              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/60 rounded-xl text-indigo-900 dark:text-indigo-200 text-[11px]">
                🛡️ <strong>Super Admin Note:</strong> This record is in read-only audit mode. State changes and admissions decisions are processed strictly by the Admission Officer desk.
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setInspectApp(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Close Audit View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Read-Only Modal: Payment Inspector ── */}
      {inspectPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 max-w-lg w-full space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Payment Audit Record</h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectPayment(null)}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl space-y-2 border border-slate-100 dark:border-slate-800">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Student:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{inspectPayment.student_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Email:</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">{inspectPayment.student_email || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Amount:</span>
                  <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">
                    {formatMoney(inspectPayment.amount, inspectPayment.currency)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Payment Method:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{inspectPayment.payment_method}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Transaction Ref:</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">{inspectPayment.transaction_ref || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Status:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{inspectPayment.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Date Logged:</span>
                  <span className="text-slate-600 dark:text-slate-400">{formatDate(inspectPayment.created_at)}</span>
                </div>
                {inspectPayment.verified_at && (
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium">Verified Date:</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{formatDate(inspectPayment.verified_at)}</span>
                  </div>
                )}
              </div>

              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60 rounded-xl text-emerald-900 dark:text-emerald-200 text-[11px]">
                🛡️ <strong>Super Admin Note:</strong> Approving or rejecting payments is reserved exclusively for the Finance Officer. Super Admin maintains full read-only audit logging.
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setInspectPayment(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Close Audit View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
