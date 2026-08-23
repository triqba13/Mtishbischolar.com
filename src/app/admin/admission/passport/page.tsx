"use client";

import { useState } from "react";
import Link from "next/link";
import { Home, Search, Eye, ChevronRight } from "lucide-react";
import StatusBadge from "@/components/admin/admission/StatusBadge";

const TABS = ["All", "Pending", "Processing", "Completed"];

const REQUESTS = [
  { student: "Neema Said", appId: "APP-00121", requestedOn: "25 Aug 2026", status: "Pending", hasPassport: false },
  { student: "Fatma Salum", appId: "APP-00119", requestedOn: "24 Aug 2026", status: "Processing", hasPassport: false },
  { student: "John Mwita", appId: "APP-00122", requestedOn: "23 Aug 2026", status: "Completed", hasPassport: true },
];

export default function PassportPage() {
  const [activeTab, setActiveTab] = useState("All");
  const [search, setSearch] = useState("");

  const filtered = REQUESTS.filter((r) => {
    const matchTab = activeTab === "All" || r.status === activeTab;
    const matchSearch = !search || r.student.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2">
          <Home className="w-3.5 h-3.5" />
          <ChevronRight className="w-3 h-3" />
          <Link href="/admin/admission/dashboard" className="hover:text-blue-600">Dashboard</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-600 font-medium">Passport Requests</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Passport Requests</h1>
        <p className="text-slate-500 text-sm mt-1">Manage passport assistance requests from students.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200">
        <div className="flex border-b border-slate-100 px-4">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3.5 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
                activeTab === tab
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="px-5 py-4 border-b border-slate-100">
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search student..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>

        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100">
              {["Student", "Application ID", "Type", "Requested On", "Status", "Action"].map((h) => (
                <th key={h} className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide px-5 py-3">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => (
              <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50 last:border-0">
                <td className="px-5 py-3.5 text-sm font-medium text-slate-800">{r.student}</td>
                <td className="px-5 py-3.5 text-xs font-mono text-slate-600">{r.appId}</td>
                <td className="px-5 py-3.5">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${r.hasPassport ? "bg-emerald-50 text-emerald-700" : "bg-orange-50 text-orange-700"}`}>
                    {r.hasPassport ? "Has Passport" : "Assistance Request"}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-xs text-slate-500">{r.requestedOn}</td>
                <td className="px-5 py-3.5"><StatusBadge status={r.status} /></td>
                <td className="px-5 py-3.5">
                  <button className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer">
                    <Eye className="w-3.5 h-3.5" /> View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="px-5 py-3 border-t border-slate-100">
          <p className="text-xs text-slate-500">Showing 1 to {filtered.length} of {filtered.length} results</p>
        </div>
      </div>
    </div>
  );
}
