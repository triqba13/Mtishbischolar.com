"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  FilePlus2,
  Search,
  FileWarning,
  Building2,
  Globe,
  CalendarRange,
  ChevronDown,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { useAdminAuth } from "@/components/admin/AdminAuthProvider";
import { createClient } from "@/lib/supabase/client";
import KpiCard from "@/components/admin/admission/KpiCard";
import RecentApplicationsTable from "@/components/admin/admission/RecentApplicationsTable";
import PendingTasks from "@/components/admin/admission/PendingTasks";
import NotificationsWidget from "@/components/admin/admission/NotificationsWidget";
import QuickActions from "@/components/admin/admission/QuickActions";
import AdmissionPerformance from "@/components/admin/admission/AdmissionPerformance";

const now = new Date();
const formatted = now.toLocaleDateString("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});
const weekEnd = new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

function getGreeting(name?: string): string {
  const hour = new Date().getHours();
  let timeGreeting = "Good Morning";
  if (hour >= 12 && hour < 17) {
    timeGreeting = "Good Afternoon";
  } else if (hour >= 17) {
    timeGreeting = "Good Evening";
  }
  return `${timeGreeting}, ${name || "Officer"}! 👋`;
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function AdmissionDashboardPage() {
  const { profile, loading: authLoading } = useAdminAuth();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string>("Just now");

  const loadDashboardData = useCallback(async () => {
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

      const res = await fetch("/api/admin/admission/dashboard", {
        headers,
        credentials: "include",
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to load admission dashboard data.");
      }

      setDashboardData(json);
      setLastSyncTime(
        new Date().toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    } catch (err: any) {
      console.error("[AdmissionDashboard] Error fetching data:", err);
      setError(err.message || "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) {
      loadDashboardData();
    }
  }, [authLoading, loadDashboardData]);

  const handleMarkAllRead = async () => {
    try {
      const supabase = createClient();
      await supabase.from("notifications").update({ is_read: true }).eq("is_read", false);
      if (dashboardData) {
        setDashboardData((prev: any) => ({
          ...prev,
          notifications: (prev?.notifications || []).map((n: any) => ({ ...n, is_read: true })),
        }));
      }
    } catch (err) {
      console.error("Failed to mark notifications read:", err);
    }
  };

  const kpi = dashboardData?.kpi;
  const officerName = dashboardData?.officer?.firstName || profile?.first_name || "Officer";

  const kpiCards = [
    {
      title: "New Applications",
      value: kpi?.newApplications ?? (loading ? "..." : 0),
      change: kpi?.newApplicationsChange ?? (loading ? "Calculating..." : "No change"),
      changeUp: kpi?.newApplicationsChangeUp ?? true,
      icon: FilePlus2,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-500",
      href: "/admin/admission/applications?status=new",
    },
    {
      title: "Ready for Review",
      value: kpi?.readyForReview ?? (loading ? "..." : 0),
      change: kpi?.readyForReviewChange ?? (loading ? "Calculating..." : "No change"),
      changeUp: kpi?.readyForReviewChangeUp ?? true,
      icon: Search,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-500",
      href: "/admin/admission/applications?status=ready_for_review",
    },
    {
      title: "Documents Pending",
      value: kpi?.documentsPending ?? (loading ? "..." : 0),
      change: kpi?.documentsPendingChange ?? (loading ? "Calculating..." : "No change"),
      changeUp: kpi?.documentsPendingChangeUp ?? true,
      icon: FileWarning,
      iconBg: "bg-orange-50",
      iconColor: "text-orange-500",
      href: "/admin/admission/documents?status=pending",
    },
    {
      title: "University Processing",
      value: kpi?.universityProcessing ?? (loading ? "..." : 0),
      change: kpi?.universityProcessingChange ?? (loading ? "Calculating..." : "No change"),
      changeUp: kpi?.universityProcessingChangeUp ?? true,
      icon: Building2,
      iconBg: "bg-purple-50",
      iconColor: "text-purple-500",
      breakdown: kpi?.uniBreakdown,
      href: "/admin/admission/applications?status=university_processing",
    },
    {
      title: "Visa Processing",
      value: kpi?.visaProcessing ?? (loading ? "..." : 0),
      change: kpi?.visaProcessingChange ?? (loading ? "Calculating..." : "No change"),
      changeUp: kpi?.visaProcessingChangeUp ?? true,
      icon: Globe,
      iconBg: "bg-cyan-50",
      iconColor: "text-cyan-500",
      href: "/admin/admission/visa?status=processing",
    },
  ];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Error Alert with Retry */}
      {error && (
        <motion.div variants={item} className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
            <p className="text-sm font-medium">Dashboard Sync Error: {error}</p>
          </div>
          <button
            onClick={loadDashboardData}
            className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer"
          >
            Retry Sync
          </button>
        </motion.div>
      )}

      {/* Page Header */}
      <motion.div variants={item} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            {getGreeting(officerName)}
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5 sm:mt-1">
            Here&apos;s what&apos;s happening with admissions today.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            onClick={loadDashboardData}
            disabled={loading}
            className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 sm:px-3.5 py-2 sm:py-2.5 text-xs sm:text-sm text-slate-600 hover:bg-slate-50 transition-all shadow-sm cursor-pointer disabled:opacity-60"
            title="Refresh dashboard data"
          >
            <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 ${loading ? "animate-spin" : ""}`} />
            <span className="font-medium text-xs">Refresh</span>
          </button>
          <button className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
            <CalendarRange className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400" />
            <span className="font-medium text-xs sm:text-sm">{formatted} – {weekEnd}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <motion.div variants={item} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {kpiCards.map((card) => (
          <KpiCard key={card.title} {...card} />
        ))}
      </motion.div>

      {/* Recent Applications (Full Width) */}
      <motion.div variants={item} className="w-full overflow-hidden">
        <RecentApplicationsTable applications={dashboardData?.recentApplications} />
      </motion.div>

      {/* Bottom Row */}
      <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <PendingTasks tasks={dashboardData?.pendingTasks} />
        <NotificationsWidget
          notifications={dashboardData?.notifications}
          onMarkAllRead={handleMarkAllRead}
        />
        <QuickActions />
        <AdmissionPerformance performance={dashboardData?.performance} />
      </motion.div>

      {/* System Status Footer */}
      <motion.div variants={item} className="flex flex-col sm:flex-row items-center justify-between bg-white rounded-xl border border-slate-200 px-4 sm:px-5 py-3 gap-2 text-center sm:text-left">
        <span className="text-xs text-slate-500">
          MtishbiScholars Admission System
        </span>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs text-slate-500">All systems operational</span>
        </div>
        <span className="text-xs text-slate-400">Last updated: {lastSyncTime}</span>
      </motion.div>
    </motion.div>
  );
}
