"use client";

import { useState } from "react";
import {
  Settings,
  User,
  Sun,
  Moon,
  Laptop,
  Check,
  ShieldCheck,
  LogOut,
  Bell,
} from "lucide-react";
import { useAdminAuth } from "@/components/admin/AdminAuthProvider";
import { useFinanceTheme } from "@/components/admin/finance/FinanceThemeProvider";

export default function FinanceSettingsPage() {
  const { fullName, profile, logout, roleLabel } = useAdminAuth();
  const { theme, setTheme } = useFinanceTheme();

  // Notification toggles
  const [notifyNewPayment, setNotifyNewPayment] = useState(true);
  const [notifyDailySummary, setNotifyDailySummary] = useState(false);

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-700/50">
        <div>
          <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-semibold mb-2">
            <Settings className="w-3.5 h-3.5" />
            <span>Preferences &amp; Account</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Finance Officer Settings
          </h1>
          <p className="text-slate-300 text-sm mt-1">
            Manage your personal profile, notification preferences, and workspace appearance.
          </p>
        </div>
      </div>

      {/* 1. Account Details Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Account Information</h2>
            <p className="text-xs text-slate-400">Your assigned administrative credentials</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px] font-semibold">Full Legal Name</span>
            <span className="font-bold text-slate-900 text-sm mt-0.5 block">{fullName}</span>
          </div>

          <div>
            <span className="text-slate-400 block text-[11px] font-semibold">Work Email</span>
            <span className="font-bold text-slate-900 text-sm mt-0.5 block truncate">
              {profile?.email || "finance@mtishbischolar.com"}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block text-[11px] font-semibold">Authorized Role</span>
            <span className="inline-flex items-center gap-1 mt-1 px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{roleLabel}</span>
            </span>
          </div>

          <div>
            <span className="text-slate-400 block text-[11px] font-semibold">Contact Phone</span>
            <span className="font-bold text-slate-900 mt-0.5 block">
              {profile?.phone || "Not specified"}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Appearance & Theme Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
            <Sun className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Workspace Appearance</h2>
            <p className="text-xs text-slate-400">Select your preferred color mode for the Finance Portal</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Light */}
          <button
            type="button"
            onClick={() => setTheme("light")}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
              theme === "light"
                ? "border-emerald-600 bg-emerald-50/40 ring-2 ring-emerald-500/20"
                : "border-slate-200 hover:border-slate-300 bg-white"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Sun className="w-5 h-5" />
              </div>
              {theme === "light" && (
                <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              )}
            </div>
            <div className="mt-3">
              <p className="font-bold text-slate-900 text-xs">Light Mode</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Default clean light styling</p>
            </div>
          </button>

          {/* Dark */}
          <button
            type="button"
            onClick={() => setTheme("dark")}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
              theme === "dark"
                ? "border-emerald-600 bg-emerald-50/40 ring-2 ring-emerald-500/20"
                : "border-slate-200 hover:border-slate-300 bg-white"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-slate-900 text-slate-200 flex items-center justify-center">
                <Moon className="w-5 h-5" />
              </div>
              {theme === "dark" && (
                <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              )}
            </div>
            <div className="mt-3">
              <p className="font-bold text-slate-900 text-xs">Dark Mode</p>
              <p className="text-[10px] text-slate-400 mt-0.5">High-contrast dark palette</p>
            </div>
          </button>

          {/* System */}
          <button
            type="button"
            onClick={() => setTheme("system")}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
              theme === "system"
                ? "border-emerald-600 bg-emerald-50/40 ring-2 ring-emerald-500/20"
                : "border-slate-200 hover:border-slate-300 bg-white"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Laptop className="w-5 h-5" />
              </div>
              {theme === "system" && (
                <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              )}
            </div>
            <div className="mt-3">
              <p className="font-bold text-slate-900 text-xs">System Match</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Follows OS system settings</p>
            </div>
          </button>
        </div>
      </div>

      {/* 3. Notification Preferences Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Notification Alerts</h2>
            <p className="text-xs text-slate-400">Configure financial activity alert delivery</p>
          </div>
        </div>

        <div className="space-y-3">
          <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100 cursor-pointer">
            <div>
              <p className="font-bold text-slate-800 text-xs">New Payment Submissions</p>
              <p className="text-[11px] text-slate-400">
                Receive notifications whenever a student uploads bank receipt proof
              </p>
            </div>
            <input
              type="checkbox"
              checked={notifyNewPayment}
              onChange={(e) => setNotifyNewPayment(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded-md focus:ring-emerald-500"
            />
          </label>

          <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100 cursor-pointer">
            <div>
              <p className="font-bold text-slate-800 text-xs">Daily Financial Digest</p>
              <p className="text-[11px] text-slate-400">
                Daily summary of approved revenue and pending queue size
              </p>
            </div>
            <input
              type="checkbox"
              checked={notifyDailySummary}
              onChange={(e) => setNotifyDailySummary(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded-md focus:ring-emerald-500"
            />
          </label>
        </div>
      </div>

      {/* 4. Security & Logout Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Sign Out of Finance Session</h2>
          <p className="text-xs text-slate-400">
            Terminate your authenticated session on this browser
          </p>
        </div>

        <button
          type="button"
          onClick={logout}
          className="px-5 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-extrabold text-xs transition-colors flex items-center gap-2 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}
