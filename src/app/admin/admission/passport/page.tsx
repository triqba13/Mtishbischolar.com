"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { Home, Search, Eye, ChevronRight, RefreshCw, AlertTriangle, Globe } from "lucide-react";
import StatusBadge from "@/components/admin/admission/StatusBadge";
import { useAdminAuth } from "@/components/admin/AdminAuthProvider";
import { createClient } from "@/lib/supabase/client";

const TABS = ["All", "Pending", "Processing", "Completed"];

export interface PassportRequestItem {
  id: string;
  applicationId?: string;
  student: string;
  studentEmail: string;
  appId: string;
  hasPassport: boolean;
  status: string;
  requestedOn: string;
}

export default function PassportPage() {
  const { loading: authLoading } = useAdminAuth();
  const [requests, setRequests] = useState<PassportRequestItem[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("All");
  const [search, setSearch] = useState("");

  const loadPassportRequests = useCallback(async () => {
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

      const res = await fetch("/api/admin/admission/passport", {
        headers,
        credentials: "include",
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to load passport requests.");
      }

      setRequests(json.requests || []);
      setCounts(json.counts || {});
    } catch (err: any) {
      console.error("[PassportPage] Error:", err);
      setError(err.message || "Failed to load passport requests.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) {
      loadPassportRequests();
    }
  }, [authLoading, loadPassportRequests]);

  const filtered = useMemo(() => {
    return requests.filter((r) => {
      const matchTab = activeTab === "All" || r.status === activeTab;
      const matchSearch =
        !search.trim() ||
        r.student.toLowerCase().includes(search.toLowerCase()) ||
        r.studentEmail.toLowerCase().includes(search.toLowerCase()) ||
        r.appId.toLowerCase().includes(search.toLowerCase());
      return matchTab && matchSearch;
    });
  }, [requests, activeTab, search]);

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2">
          <Home className="w-3.5 h-3.5" />
          <ChevronRight className="w-3 h-3" />
          <Link href="/admin/admission/dashboard" className="hover:text-blue-600">
            Dashboard
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-600 font-medium">Passport Requests</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Passport Requests</h1>
            <p className="text-slate-500 text-sm mt-1">Manage passport assistance requests from students.</p>
          </div>
          <button
            onClick={loadPassportRequests}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 shadow-sm transition-all cursor-pointer disabled:opacity-60"
            title="Refresh passport requests"
          >
            <RefreshCw className={`w-4 h-4 text-slate-400 ${loading ? "animate-spin" : ""}`} />
            <span className="text-xs font-semibold">Refresh</span>
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
            onClick={loadPassportRequests}
            className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200">
        <div className="flex border-b border-slate-100 px-4">
          {TABS.map((tab) => {
            const count = counts[tab] ?? (tab === "All" ? requests.length : 0);
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
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

        <div className="px-5 py-4 border-b border-slate-100">
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search student or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                {["Student", "Application ID", "Type", "Requested On", "Status", "Action"].map((h) => (
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
                      Loading passport assistance requests...
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-sm text-slate-400">
                    No passport requests found in this category.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50/50 last:border-0">
                    <td className="px-5 py-3.5 text-sm font-medium text-slate-800">{r.student}</td>
                    <td className="px-5 py-3.5 text-xs font-mono text-slate-600">{r.appId}</td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          r.hasPassport ? "bg-emerald-50 text-emerald-700" : "bg-orange-50 text-orange-700"
                        }`}
                      >
                        {r.hasPassport ? "Has Passport" : "Assistance Request"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-500">{r.requestedOn}</td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-5 py-3.5">
                      {r.applicationId ? (
                        <Link
                          href={`/admin/admission/applications/${r.applicationId}`}
                          className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" /> View
                        </Link>
                      ) : (
                        <Link
                          href={`/admin/admission/students`}
                          className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" /> View Student
                        </Link>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-3 border-t border-slate-100">
          <p className="text-xs text-slate-500">
            Showing {filtered.length > 0 ? 1 : 0} to {filtered.length} of {filtered.length} requests
          </p>
        </div>
      </div>
    </div>
  );
}
