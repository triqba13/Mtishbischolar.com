import Link from "next/link";
import { Home, ChevronRight, FileBarChart2, Users, Building2, Globe, BarChart3, Download } from "lucide-react";

const REPORT_CARDS = [
  { title: "Application Report", description: "Full breakdown of applications by status, university, and date range.", icon: FileBarChart2, color: "text-blue-500", bg: "bg-blue-50" },
  { title: "Admission Performance", description: "Officer performance metrics, review times, and approval rates.", icon: BarChart3, color: "text-emerald-500", bg: "bg-emerald-50" },
  { title: "University Report", description: "Applications per university, acceptance rates, and processing times.", icon: Building2, color: "text-purple-500", bg: "bg-purple-50" },
  { title: "Documents Report", description: "Document submission rates, pending issues, and verification stats.", icon: FileBarChart2, color: "text-orange-500", bg: "bg-orange-50" },
  { title: "Passport & Visa Report", description: "Passport assistance requests, visa processing timelines.", icon: Globe, color: "text-teal-500", bg: "bg-teal-50" },
  { title: "Custom Report", description: "Build a custom report with selected fields, filters and date ranges.", icon: Users, color: "text-slate-500", bg: "bg-slate-100" },
];

export default function ReportsPage() {
  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2">
          <Home className="w-3.5 h-3.5" />
          <ChevronRight className="w-3 h-3" />
          <Link href="/admin/admission/dashboard" className="hover:text-blue-600">Dashboard</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-600 font-medium">Reports</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
        <p className="text-slate-500 text-sm mt-1">Generate detailed reports and export data in PDF or Excel format.</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {REPORT_CARDS.map((r) => (
          <div key={r.title} className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
            <div className={`w-10 h-10 rounded-xl ${r.bg} flex items-center justify-center mb-3`}>
              <r.icon className={`w-5 h-5 ${r.color}`} />
            </div>
            <h3 className="font-semibold text-slate-800 text-sm">{r.title}</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">{r.description}</p>
            <button className="flex items-center gap-1.5 mt-4 text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer">
              <Download className="w-3.5 h-3.5" />
              View Report
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
