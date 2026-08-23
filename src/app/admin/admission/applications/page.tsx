"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Filter, Download, Eye, ChevronLeft, ChevronRight, Home } from "lucide-react";
import StatusBadge from "@/components/admin/admission/StatusBadge";

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

const ALL_APPLICATIONS = [
  { id: "APP-00124", student: "Tariq Hamza", university: "SRM University AP", course: "BSc Computer Science", status: "Ready for Review", submitted: "26 Aug 2026" },
  { id: "APP-00123", student: "Amina Ali", university: "Parul University", course: "BBA", status: "New", submitted: "26 Aug 2026" },
  { id: "APP-00122", student: "John Mwita", university: "X University", course: "BSc IT", status: "Documents Pending", submitted: "25 Aug 2026" },
  { id: "APP-00121", student: "Neema Said", university: "Manipal University", course: "BSc Data Science", status: "University Processing", submitted: "24 Aug 2026" },
  { id: "APP-00120", student: "David Mushi", university: "SRM University AP", course: "BCom", status: "University Approved", submitted: "23 Aug 2026" },
  { id: "APP-00119", student: "Fatma Salum", university: "Parul University", course: "MBA", status: "University Processing", submitted: "23 Aug 2026" },
  { id: "APP-00118", student: "Daniel Kayombo", university: "LU University", course: "BSc Economics", status: "Visa Processing", submitted: "22 Aug 2026" },
  { id: "APP-00117", student: "Peter John", university: "X University", course: "BSc Computer Science", status: "Completed", submitted: "20 Aug 2026" },
];

const STATUS_TAB_MAP: Record<string, string> = {
  "New": "New",
  "Ready for Review": "Ready for Review",
  "Documents Pending": "Documents Pending",
  "University Processing": "University Processing",
  "University Approved": "University Approved",
  "Visa Processing": "Visa Processing",
  "Completed": "Completed",
};

export default function ApplicationsPage() {
  const [activeTab, setActiveTab] = useState("All Applications");
  const [search, setSearch] = useState("");
  const [universityFilter, setUniversityFilter] = useState("All Universities");
  const [currentPage, setCurrentPage] = useState(1);

  const filtered = ALL_APPLICATIONS.filter((app) => {
    const matchTab =
      activeTab === "All Applications" || app.status === STATUS_TAB_MAP[activeTab];
    const matchSearch =
      !search ||
      app.student.toLowerCase().includes(search.toLowerCase()) ||
      app.id.toLowerCase().includes(search.toLowerCase());
    const matchUni =
      universityFilter === "All Universities" || app.university === universityFilter;
    return matchTab && matchSearch && matchUni;
  });

  const universities = ["All Universities", ...Array.from(new Set(ALL_APPLICATIONS.map((a) => a.university)))];

  return (
    <div className="space-y-5">
      {/* Breadcrumb + Title */}
      <div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2">
          <Home className="w-3.5 h-3.5" />
          <span>/</span>
          <Link href="/admin/admission/dashboard" className="hover:text-blue-600 transition-colors">Dashboard</Link>
          <span>/</span>
          <span className="text-slate-600 font-medium">Applications</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Applications</h1>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200">
        {/* Tab Bar */}
        <div className="flex overflow-x-auto border-b border-slate-100 px-4 scrollbar-hide">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setCurrentPage(1); }}
              className={`shrink-0 px-4 py-3.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                activeTab === tab
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by student name, email or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          {/* University filter */}
          <select
            value={universityFilter}
            onChange={(e) => setUniversityFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          >
            {universities.map((u) => <option key={u}>{u}</option>)}
          </select>

          {/* Status filter */}
          <select className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all">
            <option>All Status</option>
            {Object.keys(STATUS_TAB_MAP).map((s) => <option key={s}>{s}</option>)}
          </select>

          {/* Date range */}
          <button className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-100 transition-all cursor-pointer">
            <Filter className="w-4 h-4" />
            20 Aug – 26 Aug 2026
          </button>

          {/* Export */}
          <button className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-100 transition-all ml-auto cursor-pointer">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                {["Application ID", "Student", "University", "Course", "Status", "Submitted", "Action"].map((h) => (
                  <th key={h} className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide px-5 py-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400 text-sm">
                    No applications found matching your criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((app) => (
                  <tr key={app.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3.5 text-xs font-mono font-medium text-slate-700">{app.id}</td>
                    <td className="px-5 py-3.5 text-sm font-medium text-slate-800">{app.student}</td>
                    <td className="px-5 py-3.5 text-sm text-slate-600">{app.university}</td>
                    <td className="px-5 py-3.5 text-sm text-slate-600">{app.course}</td>
                    <td className="px-5 py-3.5"><StatusBadge status={app.status} /></td>
                    <td className="px-5 py-3.5 text-xs text-slate-500">{app.submitted}</td>
                    <td className="px-5 py-3.5">
                      <Link
                        href={`/admin/admission/applications/${app.id}`}
                        className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 transition-all cursor-pointer"
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

        {/* Pagination */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100">
          <p className="text-xs text-slate-500">
            Showing 1 to {filtered.length} of {filtered.length} results
          </p>
          <div className="flex items-center gap-1.5">
            <button className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50 disabled:opacity-40 transition-all cursor-pointer">
              <ChevronLeft className="w-4 h-4" />
            </button>
            {[1, 2, 3, 4, 5].map((p) => (
              <button
                key={p}
                onClick={() => setCurrentPage(p)}
                className={`w-8 h-8 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                  currentPage === p
                    ? "bg-blue-600 text-white shadow-sm"
                    : "border border-slate-200 text-slate-500 hover:bg-slate-50"
                }`}
              >
                {p}
              </button>
            ))}
            <button className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50 transition-all cursor-pointer">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
