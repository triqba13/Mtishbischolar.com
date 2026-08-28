"use client";

import { useState, useEffect, useMemo } from "react";
import {
  ShieldCheck,
  Search,
  RefreshCw,
  X,
  CreditCard,
  User,
  ArrowRight,
  AlertCircle,
  FileCheck2,
  FileX2,
} from "lucide-react";

export interface DbAuditLogItem {
  id: string;
  user_id: string;
  action: string;
  target_type: string;
  target_id?: string | null;
  details?: Record<string, any> | null;
  created_at: string;
  officer?: {
    id?: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    role: string | null;
  } | null;
  student?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    full_name: string;
  } | null;
  resolved_payment_type?: string;
  resolved_amount?: number;
  resolved_currency?: string;
  resolved_transaction_ref?: string | null;
  resolved_payment_method?: string;
  resolved_previous_status?: string;
  resolved_new_status?: string;
  resolved_reason?: string | null;
}

function formatFeeType(paymentType?: string | null) {
  if (!paymentType) return "MtishbiScholar File Opening Fee";
  const normalized = paymentType.toLowerCase().trim();
  if (normalized === "passport_assistance" || normalized.includes("passport")) {
    return "Passport Assistance Fee";
  }
  return "MtishbiScholar File Opening Fee";
}

function formatCurrencyAmount(amount?: number | null, currency = "TZS") {
  const num = Number(amount || 0);
  return `${currency.toUpperCase()} ${num.toLocaleString()}`;
}

function formatAuditTimestamp(isoDate?: string | null) {
  if (!isoDate) return "N/A";
  try {
    const d = new Date(isoDate);
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(d);
  } catch {
    return isoDate;
  }
}

function formatRoleLabel(role?: string | null) {
  if (!role) return "Finance Officer";
  const norm = role.toLowerCase().replace(/_/g, " ").trim();
  return norm.replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function FinanceAuditLogsPage() {
  const [logs, setLogs] = useState<DbAuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");

  const loadAuditLogs = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/finance/audit-logs");
      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error || "Failed to load financial audit logs.");
      }

      setLogs((json.data as DbAuditLogItem[]) || []);
    } catch (err: any) {
      console.error("Finance Audit Logs Error:", {
        message: err?.message || "Unknown error",
        details: err?.details || null,
      });
      setError("Unable to load financial audit logs from database.");
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    loadAuditLogs();
  }, []);

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const officerName = log.officer
        ? [log.officer.first_name, log.officer.last_name].filter(Boolean).join(" ") ||
          log.officer.email ||
          ""
        : "";
      const studentName = log.student?.full_name || "";
      const studentEmail = log.student?.email || "";
      const action = log.action || "";
      const feeTitle = formatFeeType(log.resolved_payment_type);
      const targetType = log.target_type || "";
      const targetId = log.target_id || "";
      const txRef = log.resolved_transaction_ref || "";
      const reason = log.resolved_reason || "";

      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          officerName.toLowerCase().includes(q) ||
          studentName.toLowerCase().includes(q) ||
          studentEmail.toLowerCase().includes(q) ||
          action.toLowerCase().includes(q) ||
          feeTitle.toLowerCase().includes(q) ||
          targetType.toLowerCase().includes(q) ||
          targetId.toLowerCase().includes(q) ||
          txRef.toLowerCase().includes(q) ||
          reason.toLowerCase().includes(q);
        if (!matches) return false;
      }

      // 2. Action Filter
      if (actionFilter !== "all") {
        const normAction = action.toLowerCase();
        const normFilter = actionFilter.toLowerCase();
        if (normFilter === "payment_approved" && !normAction.includes("approve")) {
          return false;
        }
        if (normFilter === "payment_rejected" && !normAction.includes("reject")) {
          return false;
        }
        if (
          normFilter !== "payment_approved" &&
          normFilter !== "payment_rejected" &&
          normAction !== normFilter
        ) {
          return false;
        }
      }

      // 3. Date Filter
      if (dateFilter !== "all" && log.created_at) {
        const d = new Date(log.created_at);
        const now = new Date();

        if (dateFilter === "today") {
          if (
            d.getDate() !== now.getDate() ||
            d.getMonth() !== now.getMonth() ||
            d.getFullYear() !== now.getFullYear()
          ) {
            return false;
          }
        } else if (dateFilter === "week") {
          const weekAgo = new Date();
          weekAgo.setDate(now.getDate() - 7);
          if (d < weekAgo) return false;
        } else if (dateFilter === "month") {
          const monthAgo = new Date();
          monthAgo.setMonth(now.getMonth() - 1);
          if (d < monthAgo) return false;
        }
      }

      return true;
    });
  }, [logs, searchQuery, actionFilter, dateFilter]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-700/50">
        <div>
          <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-semibold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Financial Accountability Trail</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Financial Audit Logs
          </h1>
          <p className="text-slate-300 text-sm mt-1">
            Immutable, append-only records of payment approvals, rejections, and financial transactions.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadAuditLogs(true)}
          disabled={loading}
          className="self-start md:self-auto inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-all cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Logs</span>
        </button>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Filter Controls */}
        <div className="p-5 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-800">Action History</h2>
            <p className="text-xs text-slate-400">Timestamped financial verification records</p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Search */}
            <div className="relative min-w-[220px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search officer, student, ref..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 placeholder-slate-400 outline-none focus:border-emerald-500 focus:bg-white transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Action Filter */}
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="all">All Payment Actions</option>
              <option value="payment_approved">Payment Approved</option>
              <option value="payment_rejected">Payment Rejected</option>
            </select>

            {/* Date Filter */}
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="m-5 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center justify-between">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => loadAuditLogs(true)}
              className="px-3 py-1 bg-red-600 text-white font-bold rounded-lg text-xs"
            >
              Retry
            </button>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Officer / User</th>
                <th className="py-3.5 px-4">Action</th>
                <th className="py-3.5 px-4">Target Type / ID</th>
                <th className="py-3.5 px-4 min-w-[340px]">Details / Metadata</th>
                <th className="py-3.5 px-4 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading financial audit trail...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <p className="font-semibold text-slate-500 text-sm">No financial audit records found.</p>
                    <p className="text-xs text-slate-400 mt-1">Try adjusting your search query or filters.</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const officerName = log.officer
                    ? [log.officer.first_name, log.officer.last_name].filter(Boolean).join(" ") ||
                      log.officer.email ||
                      "Finance Officer"
                    : log.details?.verified_by_name || "Finance Officer";

                  const officerRole = formatRoleLabel(log.officer?.role || log.details?.officer_role);

                  const isApproval = (log.action || "").toLowerCase().includes("approve");
                  const isRejection = (log.action || "").toLowerCase().includes("reject");

                  const feeTypeLabel = formatFeeType(log.resolved_payment_type);
                  const formattedAmount = formatCurrencyAmount(
                    log.resolved_amount,
                    log.resolved_currency
                  );
                  const studentDisplayName =
                    log.student?.full_name ||
                    (log.details?.student_id
                      ? `Student (ID: ${log.details.student_id.slice(0, 8)}...)`
                      : "Registered Student");

                  const txRef = log.resolved_transaction_ref;
                  const reason = log.resolved_reason;

                  const prevStatus = log.resolved_previous_status || "Pending";
                  const newStatus = log.resolved_new_status || (isApproval ? "Approved" : "Rejected");

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* 1. Officer / User */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-xs border border-slate-200">
                            {officerName[0]?.toUpperCase() || "F"}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800">{officerName}</p>
                            <p className="text-[10px] text-slate-400 font-medium">{officerRole}</p>
                          </div>
                        </div>
                      </td>

                      {/* 2. Action */}
                      <td className="py-3.5 px-4 align-top">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${
                            isApproval
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : isRejection
                              ? "bg-red-50 text-red-800 border-red-200"
                              : "bg-blue-50 text-blue-800 border-blue-200"
                          }`}
                        >
                          {isApproval ? (
                            <FileCheck2 className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <FileX2 className="w-3 h-3 text-red-600" />
                          )}
                          <span>{isApproval ? "Payment Approved" : "Payment Rejected"}</span>
                        </span>
                      </td>

                      {/* 3. Target Type / ID */}
                      <td className="py-3.5 px-4 align-top font-mono text-[11px] text-slate-600">
                        <span className="font-semibold text-slate-800 capitalize">{log.target_type || "payment"}</span>
                        {log.target_id && (
                          <span className="text-slate-400 block text-[10px] mt-0.5">
                            ID: {log.target_id.slice(0, 12)}...
                          </span>
                        )}
                      </td>

                      {/* 4. Details / Metadata (Formatted Human-Readable Summary) */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1.5 text-xs">
                          {/* Payment Fee Type & Amount */}
                          <div className="flex items-center justify-between gap-2 flex-wrap pb-1.5 border-b border-slate-200/60">
                            <div className="flex items-center gap-1.5 text-slate-800 font-bold">
                              <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                              <span>{feeTypeLabel}</span>
                            </div>
                            <span className="font-extrabold text-slate-900 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                              {formattedAmount}
                            </span>
                          </div>

                          {/* Student Name */}
                          <div className="flex items-center gap-1.5 text-slate-700">
                            <User className="w-3 h-3 text-slate-400" />
                            <span className="text-slate-500 font-medium">Student:</span>
                            <span className="font-bold text-slate-900">{studentDisplayName}</span>
                          </div>

                          {/* Status Transition */}
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
                            <span className="text-slate-500 font-medium">Status:</span>
                            <span className="font-semibold text-slate-600 bg-slate-200/70 px-1.5 py-0.2 rounded">
                              {prevStatus}
                            </span>
                            <ArrowRight className="w-3 h-3 text-slate-400" />
                            <span
                              className={`font-bold px-1.5 py-0.2 rounded ${
                                isApproval
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {newStatus}
                            </span>
                          </div>

                          {/* Transaction Reference */}
                          <div className="text-[11px] text-slate-600">
                            <span className="text-slate-500 font-medium">Reference: </span>
                            <span className="font-mono font-medium text-slate-800">
                              {txRef ? txRef : "N/A"}
                            </span>
                          </div>

                          {/* Rejection Reason (if applicable) */}
                          {reason && (
                            <div className="mt-1 p-2 bg-red-50/80 border border-red-100 rounded-lg flex items-start gap-1.5 text-[11px] text-red-800">
                              <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
                              <div>
                                <span className="font-bold">Reason: </span>
                                <span>{reason}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* 5. Timestamp */}
                      <td className="py-3.5 px-4 align-top text-right text-slate-500 text-[11px] whitespace-nowrap">
                        <span className="font-semibold text-slate-700 block">
                          {formatAuditTimestamp(log.created_at)}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
