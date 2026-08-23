import Link from "next/link";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export interface AdmissionPerformanceProps {
  performance?: {
    applicationsReceived?: number;
    applicationsReceivedChange?: string;

    applicationsReviewed?: number;
    applicationsReviewedChange?: string;

    applicationsApproved?: number;
    applicationsApprovedChange?: string;

    universitySubmissions?: number;
    universitySubmissionsChange?: string;

    completedCases?: number;
    completedCasesChange?: string;
  };
}

export default function AdmissionPerformance({ performance }: AdmissionPerformanceProps) {
  const stats = [
    {
      label: "Applications Received",
      value: performance?.applicationsReceived ?? 0,
      change: performance?.applicationsReceivedChange || "0%",
    },
    {
      label: "Applications Reviewed",
      value: performance?.applicationsReviewed ?? 0,
      change: performance?.applicationsReviewedChange || "0%",
    },
    {
      label: "Applications Approved",
      value: performance?.applicationsApproved ?? 0,
      change: performance?.applicationsApprovedChange || "0%",
    },
    {
      label: "University Submissions",
      value: performance?.universitySubmissions ?? 0,
      change: performance?.universitySubmissionsChange || "0%",
    },
    {
      label: "Completed Cases",
      value: performance?.completedCases ?? 0,
      change: performance?.completedCasesChange || "0%",
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-800 text-sm">
          Admission Performance
          <span className="text-slate-400 font-normal ml-1.5">Last 30 Days</span>
        </h3>
      </div>

      <div className="space-y-3">
        {stats.map((stat) => {
          const isPositive = stat.change.startsWith("+") || stat.change.includes("New");
          const isNegative = stat.change.startsWith("-");

          return (
            <div key={stat.label} className="flex items-center justify-between">
              <span className="text-sm text-slate-600">{stat.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-800">{stat.value}</span>
                <div
                  className={`flex items-center gap-0.5 ${
                    isPositive
                      ? "text-emerald-600"
                      : isNegative
                      ? "text-rose-600"
                      : "text-slate-400"
                  }`}
                >
                  {isPositive ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : isNegative ? (
                    <TrendingDown className="w-3 h-3" />
                  ) : (
                    <Minus className="w-3 h-3" />
                  )}
                  <span className="text-[11px] font-semibold">{stat.change}</span>
                </div>
              </div>
            </div>
          );
        })}
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
