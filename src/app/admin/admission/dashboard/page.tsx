"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  FilePlus2,
  Search,
  FileWarning,
  Building2,
  Globe,
  CalendarRange,
  ChevronDown,
} from "lucide-react";
import KpiCard from "@/components/admin/admission/KpiCard";
import ApplicationOverviewChart from "@/components/admin/admission/ApplicationOverviewChart";
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

const KPI_CARDS = [
  {
    title: "New Applications",
    value: 12,
    change: "+20% from last 7 days",
    changeUp: true,
    icon: FilePlus2,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-500",
  },
  {
    title: "Ready for Review",
    value: 8,
    change: "+16% from last 7 days",
    changeUp: true,
    icon: Search,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-500",
  },
  {
    title: "Documents Pending",
    value: 7,
    change: "-5% from last 7 days",
    changeUp: false,
    icon: FileWarning,
    iconBg: "bg-orange-50",
    iconColor: "text-orange-500",
  },
  {
    title: "University Processing",
    value: 16,
    change: "+8% from last 7 days",
    changeUp: true,
    icon: Building2,
    iconBg: "bg-purple-50",
    iconColor: "text-purple-500",
    breakdown: [
      { label: "SRM University AP", value: 6 },
      { label: "Parul University", value: 4 },
      { label: "USM Malaysia", value: 3 },
      { label: "Other", value: 3 },
    ],
  },
  {
    title: "Visa Processing",
    value: 9,
    change: "+10% from last 7 days",
    changeUp: true,
    icon: Globe,
    iconBg: "bg-cyan-50",
    iconColor: "text-cyan-500",
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function AdmissionDashboardPage() {
  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Page Header */}
      <motion.div variants={item} className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Good Morning, Sarah! 👋
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Here&apos;s what&apos;s happening with admissions today.
          </p>
        </div>
        <button className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
          <CalendarRange className="w-4 h-4 text-slate-400" />
          <span className="font-medium">{formatted} – {weekEnd}</span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </button>
      </motion.div>

      {/* KPI Cards */}
      <motion.div variants={item} className="grid grid-cols-5 gap-4">
        {KPI_CARDS.map((card) => (
          <KpiCard key={card.title} {...card} />
        ))}
      </motion.div>

      {/* Charts + Recent Applications */}
      <motion.div variants={item} className="grid grid-cols-[1fr_1.1fr] gap-4">
        <ApplicationOverviewChart />
        <RecentApplicationsTable />
      </motion.div>

      {/* Bottom Row */}
      <motion.div variants={item} className="grid grid-cols-4 gap-4">
        <PendingTasks />
        <NotificationsWidget />
        <QuickActions />
        <AdmissionPerformance />
      </motion.div>

      {/* System Status Footer */}
      <motion.div variants={item} className="flex items-center justify-between bg-white rounded-xl border border-slate-200 px-5 py-3">
        <span className="text-xs text-slate-500">
          MtishbiScholar Admission System
        </span>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs text-slate-500">All systems operational</span>
        </div>
        <span className="text-xs text-slate-400">Last updated: 2 minutes ago</span>
      </motion.div>
    </motion.div>
  );
}
