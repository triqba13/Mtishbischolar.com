"use client";

import { useState, useEffect, useMemo } from "react";
import {
  ShieldCheck,
  Search,
  Filter,
  Calendar,
  User,
  Clock,
  RefreshCw,
  AlertCircle,
  X,
  FileText,
  ShieldAlert,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export interface DbAuditLogItem {
  id: string;
  user_id: string;
  action: string;
  target_type: string;
  target_id?: string | null;
  details?: Record<string, any> | null;
  created_at: string;
  officer?: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    role: string | null;
  } | null;
}

export default function FinanceAuditLogsPage() {
  const [logs, setLogs] = useState<DbAuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");

  const supabase = useMemo(() => createClient(), []);

  const loadAuditLogs = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      const { data, error: logError } = await supabase
        .from("audit_logs")
        .select(
          "*, officer:profiles!audit_logs_user_id_fkey(id, first_name, last_name, email, role)"
        )
        .order("created_at", { ascending: false });

      if (logError) throw logError;
      setLogs((data as DbAuditLogItem[]) || []);
    } catch (err: any) {
      console.error("Finance Audit Logs Error:", {
        message: err?.message || "Unknown error",
        details: err?.details || null,
        hint: err?.hint || null,
        code: err?.code || null,
      });
      setError("Unable to load audit logs from database.");
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
        ? [log.officer.first_name, log.officer.last_name].filter(Boolean).join(" ")
        : "";
      const action = log.action || "";
      const targetType = log.target_type || "";
      const targetId = log.target_id || "";
      const detailsStr = log.details ? JSON.stringify(log.details) : "";

      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          officerName.toLowerCase().includes(q) ||
          action.toLowerCase().includes(q) ||
          targetType.toLowerCase().includes(q) ||
          targetId.toLowerCase().includes(q) ||
          detailsStr.toLowerCase().includes(q);
        if (!matches) return false;
      }

      // 2. Action Filter
      if (actionFilter !== "all" && log.action !== actionFilter) {
        return false;
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

  // Distinct Actions list
  const availableActions = useMemo(() => {
    const set = new Set<string>();
    logs.forEach((l) => {
      if (l.action) set.add(l.action);
    });
    return Array.from(set);
  }, [logs]);

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
            Immutable, append-only records of payment approvals, rejections, and administrative verifications.
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
            <p className="text-xs text-slate-400">Timestamped records of all verified operations</p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Search */}
            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search action, officer, ref..."
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
              <option value="all">All Actions</option>
              {availableActions.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
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
                <th className="py-3.5 px-4">Details / Metadata</th>
                <th className="py-3.5 px-4 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading audit trail...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <p className="font-semibold text-slate-500 text-sm">No audit records found.</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const officerName = log.officer
                    ? [log.officer.first_name, log.officer.last_name].filter(Boolean).join(" ") ||
                      log.officer.email ||
                      "System"
                    : "System";

                  const isApproval = (log.action || "").toLowerCase().includes("approve");
                  const isRejection = (log.action || "").toLowerCase().includes("reject");

                  const formattedActionLabel = (log.action || "")
                    .replace(/_/g, " ")
                    .toLowerCase()
                    .replace(/\b\w/g, (c) => c.toUpperCase());

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-[10px]">
                            {officerName[0]?.toUpperCase() || "O"}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800">{officerName}</p>
                            <p className="text-[10px] text-slate-400">{log.officer?.role || "finance_officer"}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                            isApproval
                              ? "bg-emerald-100 text-emerald-800"
                              : isRejection
                              ? "bg-red-100 text-red-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {formattedActionLabel || log.action}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">
                        <span className="font-semibold text-slate-800">{log.target_type}</span>
                        {log.target_id && (
                          <span className="text-slate-400 block text-[10px]">
                            ID: {log.target_id.slice(0, 12)}...
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 max-w-xs">
                        {log.details ? (
                          <pre className="font-mono text-[10px] bg-slate-50 p-1.5 rounded-md text-slate-700 whitespace-pre-wrap">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">No extra details</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right text-slate-400 text-[11px] whitespace-nowrap">
                        {log.created_at ? new Date(log.created_at).toLocaleString() : "N/A"}
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
