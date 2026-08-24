"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  DollarSign,
  CheckCircle2,
  Clock,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  TrendingUp,
  CreditCard,
  Users,
  BarChart3,
  FileText,
  AlertCircle,
  Calendar,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAdminAuth } from "@/components/admin/AdminAuthProvider";

export interface DbPaymentItem {
  id: string;
  student_id: string;
  amount: number;
  currency: string;
  payment_method: string;
  transaction_ref?: string | null;
  payment_type?: string | null;
  status: string;
  created_at: string;
  student?: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    phone: string | null;
  } | null;
}

export default function FinanceOverviewDashboard() {
  const { fullName } = useAdminAuth();
  const [payments, setPayments] = useState<DbPaymentItem[]>([]);
  const [counts, setCounts] = useState({
    all: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    approvedAmount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = useMemo(() => createClient(), []);

  const loadData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const headers: Record<string, string> = {};
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      const res = await fetch("/api/admin/finance/payments?pageSize=50", {
        headers,
        credentials: "include",
      });
      const result = await res.json();

      if (!res.ok || !result.success) {
        console.error("Finance Dashboard Supabase Error:", {
          message: result.error || "Failed to load financial data",
          status: res.status,
        });
        setError("Unable to load financial data. Please try again.");
      } else {
        setPayments((result.data as DbPaymentItem[]) || []);
        if (result.counts) {
          setCounts(result.counts);
        }
      }
    } catch (err: any) {
      console.error("Finance Dashboard Error:", {
        message: err?.message || "Unknown error",
        details: err?.details || null,
        hint: err?.hint || null,
        code: err?.code || null,
      });
      setError("Unable to load financial data. Please try again.");
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const channel = supabase
      .channel("finance-dashboard-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "payments" },
        () => {
          loadData(false);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  // Live KPI Calculations from Database Response
  const totalPaymentsCount = counts.all;
  const pendingPaymentsCount = counts.pending;
  const approvedPaymentsCount = counts.approved;
  const rejectedPaymentsCount = counts.rejected;
  const totalAmountReceived = counts.approvedAmount || 0;

  const pendingPayments = useMemo(() => {
    return payments.filter((p) => {
      const s = (p.status || "").toLowerCase();
      return s === "pending" || s === "submitted" || s === "under review";
    });
  }, [payments]);

  const approvedPayments = useMemo(() => {
    return payments.filter(
      (p) => (p.status || "").toLowerCase() === "approved"
    );
  }, [payments]);

  const rejectedPayments = useMemo(() => {
    return payments.filter(
      (p) => (p.status || "").toLowerCase() === "rejected"
    );
  }, [payments]);

  // Today's Payments Count
  const todaysPaymentsCount = useMemo(() => {
    const now = new Date();
    return payments.filter((p) => {
      if (!p.created_at) return false;
      const d = new Date(p.created_at);
      return (
        d.getDate() === now.getDate() &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      );
    }).length;
  }, [payments]);

  // This Month's Approved Revenue
  const thisMonthRevenue = useMemo(() => {
    const now = new Date();
    return approvedPayments.reduce((acc, p) => {
      if (!p.created_at) return acc;
      const d = new Date(p.created_at);
      if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
        return acc + (Number(p.amount) || 0);
      }
      return acc;
    }, 0);
  }, [approvedPayments]);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-5 sm:p-7 md:p-8 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-slate-700/50">
        <div>
          <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-semibold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Finance Officer Portal</span>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight">
            Welcome, {fullName}
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm mt-1">
            Real-time financial overview, fee collections, and verification metrics.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>

          <Link
            href="/admin/finance/payments"
            className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/30 transition-all cursor-pointer"
          >
            <span>Open Queue</span>
            <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </Link>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => loadData(true)}
            className="px-3 py-1 bg-red-600 text-white font-bold rounded-lg text-xs hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      )}

      {/* Primary KPI Grid (7 Metrics) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Payments */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Payments</p>
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-800 mt-2">{totalPaymentsCount}</p>
          <p className="text-xs text-slate-400 mt-1">Total recorded submissions</p>
        </div>

        {/* Pending Review */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Review</p>
            <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-600 mt-2">{pendingPaymentsCount}</p>
          <p className="text-xs text-slate-400 mt-1">Requires officer action</p>
        </div>

        {/* Approved Payments */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Approved</p>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-600 mt-2">{approvedPaymentsCount}</p>
          <p className="text-xs text-slate-400 mt-1">Verified &amp; cleared</p>
        </div>

        {/* Rejected Payments */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Rejected</p>
            <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center text-red-600">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-red-600 mt-2">{rejectedPaymentsCount}</p>
          <p className="text-xs text-slate-400 mt-1">Declined transactions</p>
        </div>
      </div>

      {/* Revenue & Volume Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Amount Received */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Revenue</p>
            <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 font-bold text-xs">
              TZS
            </div>
          </div>
          <p className="text-2xl font-black text-purple-700 mt-2">
            TSh {totalAmountReceived.toLocaleString()}
          </p>
          <p className="text-xs text-slate-400 mt-1">All-time approved revenue</p>
        </div>

        {/* This Month's Revenue */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">This Month's Revenue</p>
            <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-teal-700 mt-2">
            TSh {thisMonthRevenue.toLocaleString()}
          </p>
          <p className="text-xs text-slate-400 mt-1">Current month's collections</p>
        </div>

        {/* Today's Payments */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Today's Activity</p>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-indigo-700 mt-2">{todaysPaymentsCount}</p>
          <p className="text-xs text-slate-400 mt-1">Submissions received today</p>
        </div>
      </div>

      {/* Main Grid: Pending Attention (Left 7) + Recent Activity & Quick Actions (Right 5) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ── LEFT COLUMN: Payments Requiring Attention ── */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-800">Pending Attention</h2>
              <p className="text-xs text-slate-400">
                Payment submissions awaiting verification &amp; authorization
              </p>
            </div>
            <Link
              href="/admin/finance/payments"
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {loading ? (
              <div className="py-12 text-center text-slate-400">
                <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Loading pending payments...
              </div>
            ) : pendingPayments.length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                <p className="font-bold text-slate-700 text-sm">All caught up!</p>
                <p className="text-xs text-slate-400">There are no pending payment verifications.</p>
              </div>
            ) : (
              pendingPayments.slice(0, 5).map((p) => {
                const studentName = p.student
                  ? [p.student.first_name, p.student.last_name].filter(Boolean).join(" ") ||
                    p.student.email ||
                    "Student"
                  : "Student";

                return (
                  <div
                    key={p.id}
                    className="p-4 flex items-center justify-between hover:bg-slate-50/80 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-slate-800 text-xs">{studentName}</p>
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-extrabold">
                          {p.status || "Pending"}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-mono">
                        Ref: {p.transaction_ref || "N/A"} • Method: {p.payment_method || "Bank"}
                      </p>
                    </div>

                    <div className="text-right space-y-1">
                      <p className="font-extrabold text-slate-900 text-xs">
                        {p.currency || "TSh"} {Number(p.amount || 50000).toLocaleString()}
                      </p>
                      <Link
                        href="/admin/finance/payments"
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:underline"
                      >
                        <span>Review</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── RIGHT COLUMN: Quick Links & Recent Submissions ── */}
        <div className="lg:col-span-5 space-y-6">
          {/* Quick Actions Card */}
          <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <h3 className="text-sm font-extrabold text-slate-900">Quick Navigation</h3>
            <div className="grid grid-cols-2 gap-2.5">
              <Link
                href="/admin/finance/payments"
                className="p-3 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-100 hover:border-emerald-200 text-slate-700 hover:text-emerald-800 transition-all flex flex-col gap-1 text-left"
              >
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold">Payments Queue</span>
                <span className="text-[10px] text-slate-400">Verify submissions</span>
              </Link>

              <Link
                href="/admin/finance/students"
                className="p-3 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-100 hover:border-blue-200 text-slate-700 hover:text-blue-800 transition-all flex flex-col gap-1 text-left"
              >
                <Users className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold">Student Records</span>
                <span className="text-[10px] text-slate-400">Financial summaries</span>
              </Link>

              <Link
                href="/admin/finance/reports"
                className="p-3 rounded-xl bg-slate-50 hover:bg-purple-50 border border-slate-100 hover:border-purple-200 text-slate-700 hover:text-purple-800 transition-all flex flex-col gap-1 text-left"
              >
                <BarChart3 className="w-4 h-4 text-purple-600" />
                <span className="text-xs font-bold">Revenue Reports</span>
                <span className="text-[10px] text-slate-400">Export analytics</span>
              </Link>

              <Link
                href="/admin/finance/audit-logs"
                className="p-3 rounded-xl bg-slate-50 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-200 text-slate-700 hover:text-indigo-800 transition-all flex flex-col gap-1 text-left"
              >
                <FileText className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-bold">Audit Logs</span>
                <span className="text-[10px] text-slate-400">Accountability trail</span>
              </Link>
            </div>
          </div>

          {/* Recent Submissions Feed */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-900">Recent Payment Activity</h3>
              <span className="text-[11px] text-slate-400">Latest 5</span>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <div className="p-6 text-center text-slate-400">Loading activity...</div>
              ) : payments.length === 0 ? (
                <div className="p-6 text-center text-slate-400">No payment records found.</div>
              ) : (
                payments.slice(0, 5).map((p) => {
                  const studentName = p.student
                    ? [p.student.first_name, p.student.last_name].filter(Boolean).join(" ") ||
                      p.student.email
                    : "Student";
                  const s = (p.status || "").toLowerCase();
                  const isApproved = s === "approved" || s === "verified";
                  const isRejected = s === "rejected";

                  return (
                    <div key={p.id} className="p-3.5 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-slate-800">{studentName}</p>
                        <p className="text-[10px] text-slate-400">
                          {p.created_at ? new Date(p.created_at).toLocaleDateString() : ""} • {p.payment_method}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="font-bold text-slate-900">
                          {p.currency || "TSh"} {Number(p.amount || 50000).toLocaleString()}
                        </p>
                        <span
                          className={`inline-block text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                            isApproved
                              ? "bg-emerald-100 text-emerald-800"
                              : isRejected
                              ? "bg-red-100 text-red-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {p.status || "Pending"}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
