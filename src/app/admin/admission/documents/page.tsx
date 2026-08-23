"use client";

import { useState } from "react";
import Link from "next/link";
import { Home, Search, Eye, CheckCircle2, RefreshCw, X, FileText, ChevronRight } from "lucide-react";
import StatusBadge from "@/components/admin/admission/StatusBadge";

const TABS = ["All", "Pending", "Under Review", "Verified"];

const DOCUMENTS = [
  { student: "Tariq Hamza", appId: "APP-00124", document: "Academic Transcript", issue: "Missing", status: "Pending", university: "SRM University AP" },
  { student: "Amina Ali", appId: "APP-00123", document: "Passport Photo", issue: "Unclear", status: "Pending", university: "Parul University" },
  { student: "John Mwita", appId: "APP-00122", document: "Academic Certificate", issue: "Wrong file", status: "Pending", university: "X University" },
  { student: "Neema Said", appId: "APP-00121", document: "Proof of Passport", issue: "Expired", status: "Under Review", university: "Manipal University" },
  { student: "David Mushi", appId: "APP-00120", document: "Academic Transcript", issue: "Unclear", status: "Under Review", university: "SRM University AP" },
  { student: "Daniel Kayombo", appId: "APP-00118", document: "Academic Certificate", issue: "—", status: "Verified", university: "LU University" },
  { student: "Peter John", appId: "APP-00117", document: "Passport Photo", issue: "—", status: "Verified", university: "X University" },
];

function DocumentReviewModal({ doc, onClose }: { doc: typeof DOCUMENTS[0]; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-bold text-slate-800 text-lg">Document Review</h3>
            <p className="text-xs text-slate-500 mt-0.5 font-mono">{doc.appId} — {doc.document}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mock document preview */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 mb-5 flex flex-col items-center justify-center min-h-[160px]">
          <FileText className="w-12 h-12 text-slate-300 mb-3" />
          <p className="text-sm text-slate-500 font-medium">transcript.NBL.pdf</p>
          <p className="text-xs text-slate-400 mt-1">PDF · 2.3 MB</p>
        </div>

        {/* Metadata */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {[
            ["File Name", "transcript.NBL.pdf"],
            ["File Type", "PDF"],
            ["Uploaded", "26 Aug 2026, 10:30 AM"],
            ["Uploaded By", doc.student],
            ["Status", "Under Review"],
          ].map(([label, value]) => (
            <div key={label}>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">{label}</p>
              <p className="text-sm text-slate-700 font-medium mt-0.5">{value}</p>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            Verify Document
          </button>
          <button
            onClick={onClose}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-orange-50 border border-orange-200 text-orange-600 text-sm font-semibold hover:bg-orange-100 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Request Replacement
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DocumentsPage() {
  const [activeTab, setActiveTab] = useState("All");
  const [search, setSearch] = useState("");
  const [reviewDoc, setReviewDoc] = useState<typeof DOCUMENTS[0] | null>(null);

  const filtered = DOCUMENTS.filter((d) => {
    const matchTab = activeTab === "All" || d.status === activeTab;
    const matchSearch = !search || d.student.toLowerCase().includes(search.toLowerCase()) || d.appId.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const counts: Record<string, number> = {};
  TABS.forEach((t) => {
    counts[t] = t === "All" ? DOCUMENTS.length : DOCUMENTS.filter((d) => d.status === t).length;
  });

  return (
    <>
      {reviewDoc && <DocumentReviewModal doc={reviewDoc} onClose={() => setReviewDoc(null)} />}

      <div className="space-y-5">
        {/* Header */}
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2">
            <Home className="w-3.5 h-3.5" />
            <ChevronRight className="w-3 h-3" />
            <Link href="/admin/admission/dashboard" className="hover:text-blue-600">Dashboard</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-slate-600 font-medium">Documents</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Documents</h1>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200">
          {/* Tabs */}
          <div className="flex border-b border-slate-100 px-4">
            {TABS.map((tab) => (
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
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  activeTab === tab ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-400"
                }`}>
                  {counts[tab]}
                </span>
              </button>
            ))}
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search student or application ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <select className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
              <option>All Document Types</option>
              <option>Academic Certificate</option>
              <option>Academic Transcript</option>
              <option>Passport Photo</option>
              <option>Proof of Passport</option>
            </select>
            <select className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
              <option>All Universities</option>
              <option>SRM University AP</option>
              <option>Parul University</option>
              <option>X University</option>
            </select>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  {["Student", "Application", "Document", "Issue", "Status", "Action"].map((h) => (
                    <th key={h} className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide px-5 py-3">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((doc, i) => (
                  <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors last:border-0">
                    <td className="px-5 py-3.5 text-sm font-medium text-slate-800">{doc.student}</td>
                    <td className="px-5 py-3.5 text-xs font-mono text-slate-600">{doc.appId}</td>
                    <td className="px-5 py-3.5 text-sm text-slate-700">{doc.document}</td>
                    <td className="px-5 py-3.5">
                      {doc.issue !== "—" ? (
                        <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">{doc.issue}</span>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={doc.status} />
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => setReviewDoc(doc)}
                        className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        {doc.status === "Under Review" ? "Review" : "View"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-slate-100">
            <p className="text-xs text-slate-500">Showing 1 to {filtered.length} of {filtered.length} results</p>
          </div>
        </div>
      </div>
    </>
  );
}
