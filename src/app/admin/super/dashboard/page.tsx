"use client";

import { useState, useEffect } from "react";
import { ShieldAlert, Users, FileText, DollarSign, Building2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useAdminAuth } from "@/components/admin/AdminAuthProvider";

export default function SuperAdminDashboard() {
  const { fullName } = useAdminAuth();
  const [stats, setStats] = useState({
    studentsCount: 0,
    applicationsCount: 0,
    paymentsCount: 0,
    universitiesCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function loadStats() {
      try {
        const [
          { count: studentsCount },
          { count: applicationsCount },
          { count: paymentsCount },
          { count: universitiesCount },
        ] = await Promise.all([
          supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "student"),
          supabase.from("applications").select("id", { count: "exact", head: true }),
          supabase.from("payments").select("id", { count: "exact", head: true }),
          supabase.from("universities").select("id", { count: "exact", head: true }),
        ]);

        setStats({
          studentsCount: studentsCount || 0,
          applicationsCount: applicationsCount || 0,
          paymentsCount: paymentsCount || 0,
          universitiesCount: universitiesCount || 0,
        });
      } catch (err) {
        console.error("Error loading super admin stats:", err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  return (
    <div className="space-y-6">
      {/* Super Admin Welcome */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-indigo-900/50">
        <div>
          <div className="inline-flex items-center gap-2 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-full text-xs font-semibold mb-2">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Super Admin Headquarters</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome, {fullName}
          </h1>
          <p className="text-slate-300 text-sm mt-1">
            Full system oversight across Admissions, Finance, Partner Universities, and Staff Operations.
          </p>
        </div>
      </div>

      {/* System Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Students</p>
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-800 mt-2">{stats.studentsCount}</p>
          <p className="text-xs text-slate-400 mt-1">Registered student profiles</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Applications</p>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-indigo-600 mt-2">{stats.applicationsCount}</p>
          <p className="text-xs text-slate-400 mt-1">Active application files</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Payments</p>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-600 mt-2">{stats.paymentsCount}</p>
          <p className="text-xs text-slate-400 mt-1">Transactions logged</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Universities</p>
            <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-purple-600 mt-2">{stats.universitiesCount}</p>
          <p className="text-xs text-slate-400 mt-1">Partner institutions</p>
        </div>
      </div>

      {/* Quick Navigation Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-600/30">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Admission Officer Operations</h2>
              <p className="text-xs text-slate-400">Manage student admissions, verify documents, and review visa workflows.</p>
            </div>
          </div>
          <Link
            href="/admin/admission/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-md"
          >
            <span>Access Admission Panel</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/30">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Finance Officer Operations</h2>
              <p className="text-xs text-slate-400">Review file opening payments, verify receipts, and monitor financial flow.</p>
            </div>
          </div>
          <Link
            href="/admin/finance/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-md"
          >
            <span>Access Finance Panel</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
