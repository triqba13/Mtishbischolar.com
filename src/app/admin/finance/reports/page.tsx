"use client";

import { useState, useEffect, useMemo } from "react";
import {
  BarChart3,
  Download,
  Calendar,
  DollarSign,
  TrendingUp,
  CreditCard,
  CheckCircle2,
  Clock,
  ShieldAlert,
  FileSpreadsheet,
  RefreshCw,
  AlertCircle,
  Layers,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export interface ReportPaymentRecord {
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
  } | null;
}

export default function FinanceReportsPage() {
  const [payments, setPayments] = useState<ReportPaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Date filter state
  const [dateRange, setDateRange] = useState<"all" | "today" | "week" | "month" | "last_month">("all");

  const supabase = useMemo(() => createClient(), []);

  const loadData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/finance/payments");
      const result = await res.json();

      if (!res.ok || !result.success) {
        console.error("Finance Reports Error:", result);
        setError("Unable to load financial reports data.");
      } else {
        setPayments((result.data as ReportPaymentRecord[]) || []);
      }
    } catch (err: any) {
      console.error("Finance Reports Error:", {
        message: err?.message || "Unknown error",
        details: err?.details || null,
        hint: err?.hint || null,
        code: err?.code || null,
      });
      setError("Unable to load financial reports data.");
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter payments by date range
  const filteredPayments = useMemo(() => {
    if (dateRange === "all") return payments;

    const now = new Date();
    return payments.filter((p) => {
      if (!p.created_at) return false;
      const d = new Date(p.created_at);

      if (dateRange === "today") {
        return (
          d.getDate() === now.getDate() &&
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear()
        );
      }
      if (dateRange === "week") {
        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);
        return d >= weekAgo;
      }
      if (dateRange === "month") {
        return (
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear()
        );
      }
      if (dateRange === "last_month") {
        const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
        const lastMonthYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
        return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
      }
      return true;
    });
  }, [payments, dateRange]);

  // Financial Metrics Calculations
  const totalCount = filteredPayments.length;

  const approvedPayments = filteredPayments.filter(
    (p) => (p.status || "").toLowerCase() === "approved"
  );
  const pendingPayments = filteredPayments.filter((p) => {
    const s = (p.status || "").toLowerCase();
    return s === "pending" || s === "submitted" || s === "under review";
  });
  const rejectedPayments = filteredPayments.filter(
    (p) => (p.status || "").toLowerCase() === "rejected"
  );

  const totalRevenue = approvedPayments.reduce(
    (acc, p) => acc + (Number(p.amount) || 0),
    0
  );
  const pendingVolume = pendingPayments.reduce(
    (acc, p) => acc + (Number(p.amount) || 0),
    0
  );
  const rejectedVolume = rejectedPayments.reduce(
    (acc, p) => acc + (Number(p.amount) || 0),
    0
  );

  // Revenue Breakdown by Payment Method
  const methodBreakdown = useMemo(() => {
    const map = new Map<string, { count: number; total: number }>();
    approvedPayments.forEach((p) => {
      const method = p.payment_method || "Other";
      const existing = map.get(method) || { count: 0, total: 0 };
      existing.count += 1;
      existing.total += Number(p.amount) || 0;
      map.set(method, existing);
    });
    return Array.from(map.entries()).map(([method, data]) => ({
      method,
      count: data.count,
      total: data.total,
      percentage: totalRevenue > 0 ? (data.total / totalRevenue) * 100 : 0,
    }));
  }, [approvedPayments, totalRevenue]);

  // Revenue Breakdown by Purpose/Fee Type
  const purposeBreakdown = useMemo(() => {
    const map = new Map<string, { count: number; total: number }>();
    approvedPayments.forEach((p) => {
      const purpose = p.payment_type || "MtishbiScholar File Opening Fee";
      const existing = map.get(purpose) || { count: 0, total: 0 };
      existing.count += 1;
      existing.total += Number(p.amount) || 0;
      map.set(purpose, existing);
    });
    return Array.from(map.entries()).map(([purpose, data]) => ({
      purpose,
      count: data.count,
      total: data.total,
      percentage: totalRevenue > 0 ? (data.total / totalRevenue) * 100 : 0,
    }));
  }, [approvedPayments, totalRevenue]);

  // Export CSV Handler
  const handleExportCSV = () => {
    if (filteredPayments.length === 0) return;

    const headers = [
      "Payment ID",
      "Student Name",
      "Student Email",
      "Purpose",
      "Amount",
      "Currency",
      "Payment Method",
      "Transaction Ref",
      "Status",
      "Submission Date",
    ];

    const rows = filteredPayments.map((p) => {
      const studentName = p.student
        ? [p.student.first_name, p.student.last_name].filter(Boolean).join(" ")
        : "N/A";
      const studentEmail = p.student?.email || "N/A";

      return [
        `"${p.id}"`,
        `"${studentName}"`,
        `"${studentEmail}"`,
        `"${p.payment_type || "MtishbiScholar File Opening Fee"}"`,
        p.amount,
        `"${p.currency || "TZS"}"`,
        `"${p.payment_method}"`,
        `"${p.transaction_ref || ""}"`,
        `"${p.status}"`,
        `"${p.created_at ? new Date(p.created_at).toISOString() : ""}"`,
      ].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `MtishbiScholar_Finance_Report_${dateRange}_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-700/50">
        <div>
          <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-semibold mb-2">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Financial Reporting &amp; Analytics</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Financial Reports
          </h1>
          <p className="text-slate-300 text-sm mt-1">
            Revenue breakdown, payment method analytics, and data export.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            disabled={filteredPayments.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/30 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-700">Date Range Period:</span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {(
            [
              { id: "all", label: "All Time" },
              { id: "today", label: "Today" },
              { id: "week", label: "This Week" },
              { id: "month", label: "This Month" },
              { id: "last_month", label: "Last Month" },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setDateRange(t.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                dateRange === t.id
                  ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/30"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => loadData(true)}
            className="px-3 py-1 bg-red-600 text-white font-bold rounded-lg text-xs"
          >
            Retry
          </button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Revenue</p>
            <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-purple-700 mt-2">
            TSh {totalRevenue.toLocaleString()}
          </p>
          <p className="text-xs text-slate-400 mt-1">{approvedPayments.length} approved payments</p>
        </div>

        {/* Pending Volume */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Volume</p>
            <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-600 mt-2">
            TSh {pendingVolume.toLocaleString()}
          </p>
          <p className="text-xs text-slate-400 mt-1">{pendingPayments.length} pending verification</p>
        </div>

        {/* Rejected Volume */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Declined Volume</p>
            <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center text-red-600">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-red-600 mt-2">
            TSh {rejectedVolume.toLocaleString()}
          </p>
          <p className="text-xs text-slate-400 mt-1">{rejectedPayments.length} rejected records</p>
        </div>

        {/* Total Transactions */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Submissions</p>
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-800 mt-2">{totalCount}</p>
          <p className="text-xs text-slate-400 mt-1">In selected time period</p>
        </div>
      </div>

      {/* Revenue Breakdown by Method & Purpose */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Payment Methods Breakdown */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Revenue by Payment Method</h3>
              <p className="text-xs text-slate-400">Distribution across accepted channels</p>
            </div>
            <CreditCard className="w-5 h-5 text-slate-400" />
          </div>

          {methodBreakdown.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-6 text-center">
              No approved payments in this date range.
            </p>
          ) : (
            <div className="space-y-3.5">
              {methodBreakdown.map((m) => (
                <div key={m.method} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-800">{m.method}</span>
                    <span className="text-emerald-700">
                      TSh {m.total.toLocaleString()} ({m.percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                      style={{ width: `${m.percentage}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400">{m.count} successful transactions</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 2. Fee / Purpose Breakdown */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Revenue by Fee Type</h3>
              <p className="text-xs text-slate-400">File opening vs. tuition allocations</p>
            </div>
            <TrendingUp className="w-5 h-5 text-slate-400" />
          </div>

          {purposeBreakdown.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-6 text-center">
              No approved payments in this date range.
            </p>
          ) : (
            <div className="space-y-3.5">
              {purposeBreakdown.map((p) => (
                <div key={p.purpose} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-800">{p.purpose}</span>
                    <span className="text-purple-700">
                      TSh {p.total.toLocaleString()} ({p.percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-600 rounded-full transition-all duration-500"
                      style={{ width: `${p.percentage}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400">{p.count} successful transactions</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
