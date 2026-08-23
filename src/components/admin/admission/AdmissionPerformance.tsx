import Link from "next/link";
import { TrendingUp } from "lucide-react";

const STATS = [
  { label: "Applications Received", value: 124, change: "+13%" },
  { label: "Applications Reviewed", value: 98, change: "+16%" },
  { label: "Applications Approved", value: 72, change: "+15%" },
  { label: "University Submissions", value: 61, change: "+22%" },
  { label: "Completed Cases", value: 32, change: "+10%" },
];

export default function AdmissionPerformance() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-800 text-sm">
          Admission Performance
          <span className="text-slate-400 font-normal ml-1.5">This Month</span>
        </h3>
      </div>

      <div className="space-y-3">
        {STATS.map((stat) => (
          <div key={stat.label} className="flex items-center justify-between">
            <span className="text-sm text-slate-600">{stat.label}</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-800">{stat.value}</span>
              <div className="flex items-center gap-0.5 text-emerald-600">
                <TrendingUp className="w-3 h-3" />
                <span className="text-[11px] font-semibold">{stat.change}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Link
        href="/admin/admission/reports"
        className="block text-center text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline mt-4 pt-3 border-t border-slate-100"
      >
        View Full Report
      </Link>
    </div>
  );
}
