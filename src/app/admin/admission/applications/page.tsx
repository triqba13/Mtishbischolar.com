"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { Search, Filter, Download, Eye, ChevronLeft, ChevronRight, Home, RefreshCw, AlertTriangle } from "lucide-react";
import StatusBadge from "@/components/admin/admission/StatusBadge";
import { useAdminAuth } from "@/components/admin/AdminAuthProvider";
import { createClient } from "@/lib/supabase/client";

const TABS = [
  "All Applications",
  "New",
  "Ready for Review",
  "Documents Pending",
  "University Processing",
  "University Approved",
  "Visa Processing",
  "Completed",
];

const TAB_STATUS_GROUPS: Record<string, string[]> = {
  "New": ["Profile Completed", "New", "Submitted"],
  "Ready for Review": ["Ready for Review", "Under Review"],
  "Documents Pending": ["Documents Pending", "Replacement Requested"],
  "University Processing": ["Submitted to University", "University Processing"],
  "University Approved": ["University Approved", "Offer Received"],
  "Visa Processing": ["Visa Processing", "Visa Approved"],
  "Completed": ["Completed", "Visa Approved"],
};

export interface ApplicationListItem {
  id: string;
  displayId: string;
  student: string;
  studentEmail: string;
  university: string;
  course: string;
  status: string;
  submitted: string;
  created_at: string;
}

export default function ApplicationsPage() {
  const { loading: authLoading } = useAdminAuth();
  const [applications, setApplications] = useState<ApplicationListItem[]>([]);
  const [universities, setUniversities] = useState<string[]>(["All Universities"]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState("All Applications");
  const [search, setSearch] = useState("");
  const [universityFilter, setUniversityFilter] = useState("All Universities");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const loadApplications = useCallback(async () => {
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

      const res = await fetch("/api/admin/admission/applications", {
        headers,
        credentials: "include",
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to load applications.");
      }

      setApplications(json.applications || []);
      setUniversities(json.universities || ["All Universities"]);
      setCounts(json.counts || {});
    } catch (err: any) {
      console.error("[ApplicationsPage] Error fetching applications:", err);
      setError(err.message || "Failed to load applications.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) {
      loadApplications();
    }
  }, [authLoading, loadApplications]);

  const filtered = useMemo(() => {
    return applications.filter((app) => {
      const matchTab =
        activeTab === "All Applications" ||
        (TAB_STATUS_GROUPS[activeTab] && TAB_STATUS_GROUPS[activeTab].includes(app.status));

      const matchSearch =
        !search.trim() ||
        app.student.toLowerCase().includes(search.toLowerCase()) ||
        app.studentEmail.toLowerCase().includes(search.toLowerCase()) ||
        app.displayId.toLowerCase().includes(search.toLowerCase()) ||
        app.id.toLowerCase().includes(search.toLowerCase());

      const matchUni =
        universityFilter === "All Universities" || app.university === universityFilter;

      const matchStatus =
        statusFilter === "All Status" || app.status === statusFilter;

      return matchTab && matchSearch && matchUni && matchStatus;
    });
  }, [applications, activeTab, search, universityFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage]);

  const handleExportCSV = () => {
    if (filtered.length === 0) return;
    const headers = ["Application ID", "Student", "Email", "University", "Course", "Status", "Submitted"];
    const rows = filtered.map((a) => [
      `"${a.displayId}"`,
      `"${a.student}"`,
      `"${a.studentEmail}"`,
      `"${a.university}"`,
      `"${a.course}"`,
      `"${a.status}"`,
      `"${a.submitted}"`,
    ]);
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `applications_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      {/* Breadcrumb + Title */}
      <div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2">
          <Home className="w-3.5 h-3.5" />
          <span>/</span>
          <Link href="/admin/admission/dashboard" className="hover:text-blue-600 transition-colors">
            Dashboard
          </Link>
          <span>/</span>
          <span className="text-slate-600 font-medium">Applications</span>
        </div>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">Applications</h1>
          <button
            onClick={loadApplications}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 shadow-sm transition-all cursor-pointer disabled:opacity-60"
            title="Refresh applications"
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
            onClick={loadApplications}
            className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Tabs & Table */}
      <div className="bg-white rounded-2xl border border-slate-200">
        {/* Tab Bar */}
        <div className="flex overflow-x-auto border-b border-slate-100 px-4 scrollbar-hide">
          {TABS.map((tab) => {
            const count = counts[tab] ?? (tab === "All Applications" ? applications.length : 0);
            return (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setCurrentPage(1);
                }}
                className={`shrink-0 flex items-center gap-2 px-4 py-3.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
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

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-slate-100">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search student, email, ID..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          {/* University filter */}
          <select
            value={universityFilter}
            onChange={(e) => {
              setUniversityFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          >
            {universities.map((u) => (
              <option key={u}>{u}</option>
            ))}
          </select>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          >
            <option>All Status</option>
            <option value="Profile Completed">Profile Completed</option>
            <option value="Under Review">Under Review</option>
            <option value="Submitted to University">Submitted to University</option>
            <option value="Visa Approved">Visa Approved</option>
            <option value="Rejected">Rejected</option>
          </select>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            disabled={filtered.length === 0}
            className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-100 transition-all ml-auto cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                {["Application ID", "Student", "University", "Course", "Status", "Submitted", "Action"].map(
                  (h) => (
                    <th
                      key={h}
                      className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide px-5 py-3"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400 text-sm">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                      Loading application records...
                    </div>
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400 text-sm">
                    No applications match the selected criteria.
                  </td>
                </tr>
              ) : (
                paginated.map((app) => (
                  <tr
                    key={app.id}
                    className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors last:border-0"
                  >
                    <td className="px-5 py-3.5 text-xs font-mono font-medium text-slate-700">
                      {app.displayId}
                    </td>
                    <td className="px-5 py-3.5 text-sm font-medium text-slate-800">{app.student}</td>
                    <td className="px-5 py-3.5 text-sm text-slate-600">{app.university}</td>
                    <td className="px-5 py-3.5 text-sm text-slate-600">{app.course}</td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={app.status} />
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-500">{app.submitted}</td>
                    <td className="px-5 py-3.5">
                      <Link
                        href={`/admin/admission/applications/${app.id}`}
                        className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 transition-all cursor-pointer"
                        title="View Application Details"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
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
            Showing {filtered.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} to{" "}
            {Math.min(currentPage * pageSize, filtered.length)} of {filtered.length} results
          </p>
          {totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
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
                disabled={currentPage === totalPages}
                className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
