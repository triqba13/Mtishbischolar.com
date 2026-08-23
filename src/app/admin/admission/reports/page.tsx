"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Home, ChevronRight, FileBarChart2, Users, Building2, Globe, BarChart3, Download, RefreshCw, AlertTriangle } from "lucide-react";
import { useAdminAuth } from "@/components/admin/AdminAuthProvider";
import { createClient } from "@/lib/supabase/client";

export default function ReportsPage() {
  const { loading: authLoading } = useAdminAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReports = useCallback(async () => {
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

      const res = await fetch("/api/admin/admission/reports", {
        headers,
        credentials: "include",
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to load report metrics.");
      }

      setStats(json.stats || {});
    } catch (err: any) {
      console.error("[ReportsPage] Error:", err);
      setError(err.message || "Failed to load reports.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) {
      loadReports();
    }
  }, [authLoading, loadReports]);

  const handleDownloadReport = (type: string) => {
    const dateStr = new Date().toISOString().slice(0, 10);
    let rows: string[][] = [];
    let filename = `admission_${type.toLowerCase().replace(/\s+/g, "_")}_report_${dateStr}.csv`;

    if (type === "Application Report") {
      rows = [
        ["Report Type", "Application Summary Report"],
        ["Generated Date", dateStr],
        ["Total Applications", String(stats?.totalApplications ?? 0)],
        ["Under Review", String(stats?.totalUnderReview ?? 0)],
        ["Approved / Submitted to University", String(stats?.totalApproved ?? 0)],
        ["Visa Approved", String(stats?.totalVisaApproved ?? 0)],
      ];
    } else if (type === "Admission Performance") {
      rows = [
        ["Report Type", "Admission Performance Metrics"],
        ["Generated Date", dateStr],
        ["Total Applications Handled", String(stats?.totalApplications ?? 0)],
        ["Review Completion Rate", `${stats?.totalApplications ? Math.round((stats?.totalApproved / stats?.totalApplications) * 100) : 0}%`],
      ];
    } else if (type === "University Report") {
      rows = [
        ["Report Type", "Partner University Report"],
        ["Generated Date", dateStr],
        ["Total Active Partner Universities", String(stats?.totalUniversities ?? 0)],
      ];
    } else if (type === "Documents Report") {
      rows = [
        ["Report Type", "Document Verification Report"],
        ["Generated Date", dateStr],
        ["Total Uploaded Documents", String(stats?.totalDocuments ?? 0)],
        ["Verified Documents", String(stats?.verifiedDocuments ?? 0)],
        ["Pending Verification", String((stats?.totalDocuments ?? 0) - (stats?.verifiedDocuments ?? 0))],
      ];
    } else {
      rows = [
        ["Report Type", "MtishbiScholar General Admission Report"],
        ["Generated Date", dateStr],
        ["Total Applications", String(stats?.totalApplications ?? 0)],
        ["Total Documents", String(stats?.totalDocuments ?? 0)],
        ["Total Partner Universities", String(stats?.totalUniversities ?? 0)],
      ];
    }

    const csvContent = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const REPORT_CARDS = [
    {
      title: "Application Report",
      description: `Full breakdown of applications. Total: ${stats?.totalApplications ?? 0} applications.`,
      icon: FileBarChart2,
      color: "text-blue-500",
      bg: "bg-blue-50",
    },
    {
      title: "Admission Performance",
      description: `Officer review metrics and approval rates (${stats?.totalApproved ?? 0} approved).`,
      icon: BarChart3,
      color: "text-emerald-500",
      bg: "bg-emerald-50",
    },
    {
      title: "University Report",
      description: `Applications per university across ${stats?.totalUniversities ?? 0} partner campuses.`,
      icon: Building2,
      color: "text-purple-500",
      bg: "bg-purple-50",
    },
    {
      title: "Documents Report",
      description: `${stats?.verifiedDocuments ?? 0} of ${stats?.totalDocuments ?? 0} documents verified.`,
      icon: FileBarChart2,
      color: "text-orange-500",
      bg: "bg-orange-50",
    },
    {
      title: "Passport & Visa Report",
      description: `Visa processing timelines and ${stats?.totalVisaApproved ?? 0} approved visas.`,
      icon: Globe,
      color: "text-teal-500",
      bg: "bg-teal-50",
    },
    {
      title: "Custom Report",
      description: "Export full live dataset including applications, payments and profiles.",
      icon: Users,
      color: "text-slate-500",
      bg: "bg-slate-100",
    },
  ];

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
          <span className="text-slate-600 font-medium">Reports</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
            <p className="text-slate-500 text-sm mt-1">Generate detailed reports and export live data in CSV format.</p>
          </div>
          <button
            onClick={loadReports}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 shadow-sm transition-all cursor-pointer disabled:opacity-60"
            title="Refresh reports"
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
            onClick={loadReports}
            className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        {REPORT_CARDS.map((r) => (
          <div
            key={r.title}
            className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md transition-shadow flex flex-col justify-between"
          >
            <div>
              <div className={`w-10 h-10 rounded-xl ${r.bg} flex items-center justify-center mb-3`}>
                <r.icon className={`w-5 h-5 ${r.color}`} />
              </div>
              <h3 className="font-semibold text-slate-800 text-sm">{r.title}</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">{r.description}</p>
            </div>
            <button
              onClick={() => handleDownloadReport(r.title)}
              className="flex items-center gap-1.5 mt-5 text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Download CSV Report
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
