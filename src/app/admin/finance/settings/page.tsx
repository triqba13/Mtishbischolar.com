"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Home,
  ChevronRight,
  Settings,
  User,
  Sun,
  Moon,
  Laptop,
  Check,
  ShieldCheck,
  LogOut,
  Bell,
  CheckCircle2,
  Phone,
  Mail,
  Sliders,
} from "lucide-react";
import { useAdminAuth } from "@/components/admin/AdminAuthProvider";
import { useFinanceTheme } from "@/components/admin/finance/FinanceThemeProvider";
import { createClient } from "@/lib/supabase/client";
import {
  FinanceNotifPrefs,
  DEFAULT_FINANCE_NOTIF_PREFS,
  getFinanceNotifPrefs,
  saveFinanceNotifPrefs,
} from "@/lib/notifications/prefs";

export default function FinanceSettingsPage() {
  const { fullName: initialFullName, profile, user, logout, roleLabel, refreshProfile } = useAdminAuth();
  const { theme, setTheme } = useFinanceTheme();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  // Notification toggles with persistence
  const [notifPreferences, setNotifPreferences] = useState<FinanceNotifPrefs>(DEFAULT_FINANCE_NOTIF_PREFS);
  const [prefsSaved, setPrefsSaved] = useState(false);

  useEffect(() => {
    if (profile) {
      const name = `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || profile.email || "";
      setFullName(name);
      setPhone(profile.phone || "");
    }
    setNotifPreferences(getFinanceNotifPrefs());
  }, [profile]);

  const handleSaveProfile = async () => {
    try {
      setSavingProfile(true);
      const supabase = createClient();
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (authUser?.id) {
        const parts = fullName.trim().split(" ");
        const first = parts[0] || "";
        const last = parts.slice(1).join(" ") || "";

        await supabase
          .from("profiles")
          .update({
            first_name: first,
            last_name: last,
            phone,
          })
          .eq("id", authUser.id);

        await refreshProfile();
      }

      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    } catch (err) {
      console.error("Failed to save finance profile:", err);
    } finally {
      setSavingProfile(false);
    }
  };

  const toggleNotif = (key: keyof FinanceNotifPrefs) => {
    setNotifPreferences((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      saveFinanceNotifPrefs(updated);
      setPrefsSaved(true);
      setTimeout(() => setPrefsSaved(false), 2000);
      return updated;
    });
  };

  return (
    <div className="space-y-5">
      {/* Header & Breadcrumb */}
      <div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1.5">
          <Home className="w-3.5 h-3.5" />
          <ChevronRight className="w-3 h-3" />
          <Link href="/admin/finance/dashboard" className="hover:text-emerald-600 transition-colors">
            Dashboard
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-600 dark:text-slate-300 font-medium">Settings</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>Finance Officer Settings</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-0.5">
              Manage personal credentials, workspace theme, and financial alert preferences.
            </p>
          </div>
        </div>
      </div>

      {/* Main 2-Column Responsive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Column 1: Profile & Credentials */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">Profile &amp; Credentials</h2>
                  <p className="text-[11px] text-slate-400">Your assigned administrative identity</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-bold text-[11px] border border-emerald-200 dark:border-emerald-800">
                <ShieldCheck className="w-3 h-3" />
                <span>{roleLabel}</span>
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
                  Full Legal Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Officer Name"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
                    Work Email
                  </label>
                  <input
                    type="email"
                    value={profile?.email || user?.email || "finance@mtishbischolar.com"}
                    disabled
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 cursor-not-allowed truncate"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+255 700 000 000"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleSaveProfile}
              disabled={savingProfile}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-60"
            >
              {profileSaved ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Saved</span>
                </>
              ) : (
                <span>{savingProfile ? "Saving..." : "Save Profile"}</span>
              )}
            </button>

            <button
              type="button"
              onClick={logout}
              className="px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/60 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Column 2: Appearance & Theme */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 pb-3.5 mb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                <Sun className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">Workspace Appearance</h2>
                <p className="text-[11px] text-slate-400">Select color theme for Finance Desk</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2.5 mb-4">
              {/* Light */}
              <button
                type="button"
                onClick={() => setTheme("light")}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  theme === "light"
                    ? "border-emerald-600 bg-emerald-50/40 dark:bg-emerald-950/20 ring-2 ring-emerald-500/20 shadow-xs"
                    : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-800/40"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <Sun className="w-3.5 h-3.5" />
                  </div>
                  {theme === "light" && (
                    <div className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white text-xs">Light</p>
                  <p className="text-[10px] text-slate-400">Clean white</p>
                </div>
              </button>

              {/* Dark */}
              <button
                type="button"
                onClick={() => setTheme("dark")}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  theme === "dark"
                    ? "border-emerald-600 bg-emerald-50/40 dark:bg-emerald-950/20 ring-2 ring-emerald-500/20 shadow-xs"
                    : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-800/40"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-7 h-7 rounded-lg bg-slate-900 text-slate-200 flex items-center justify-center">
                    <Moon className="w-3.5 h-3.5" />
                  </div>
                  {theme === "dark" && (
                    <div className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white text-xs">Dark</p>
                  <p className="text-[10px] text-slate-400">Midnight dark</p>
                </div>
              </button>

              {/* System */}
              <button
                type="button"
                onClick={() => setTheme("system")}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  theme === "system"
                    ? "border-emerald-600 bg-emerald-50/40 dark:bg-emerald-950/20 ring-2 ring-emerald-500/20 shadow-xs"
                    : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-800/40"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <Laptop className="w-3.5 h-3.5" />
                  </div>
                  {theme === "system" && (
                    <div className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white text-xs">System</p>
                  <p className="text-[10px] text-slate-400">Auto match</p>
                </div>
              </button>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] font-semibold">Language</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 block mt-0.5">English (UK)</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] font-semibold">Timezone</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 block mt-0.5 truncate">Africa/Dar_es_Salaam (EAT)</span>
            </div>
          </div>
        </div>

        {/* Full-Width Bottom Card: Notification Alerts */}
        <div className="col-span-1 lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3.5 mb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">Notification Alert Preferences</h2>
                <p className="text-[11px] text-slate-400">Control which financial events trigger live alerts on your workspace</p>
              </div>
            </div>
            {prefsSaved && (
              <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 animate-in fade-in duration-150">
                <Check className="w-3 h-3" />
                <span>Saved</span>
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* New Payment Submissions */}
            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 hover:bg-slate-100/70 dark:hover:bg-slate-800 transition-colors cursor-pointer">
              <div className="pr-2">
                <p className="font-bold text-slate-800 dark:text-slate-200 text-xs">New Payment Submissions</p>
                <p className="text-[10.5px] text-slate-400 mt-0.5">
                  Receive alerts whenever a student uploads bank receipt proof
                </p>
              </div>
              <div className="relative shrink-0 ml-2">
                <input
                  type="checkbox"
                  checked={notifPreferences.notifyNewPayment}
                  onChange={() => toggleNotif("notifyNewPayment")}
                  className="sr-only peer"
                />
                <div
                  className={`w-10 h-5.5 rounded-full transition-colors flex items-center p-0.5 ${
                    notifPreferences.notifyNewPayment
                      ? "bg-emerald-600 justify-end"
                      : "bg-slate-300 dark:bg-slate-700 justify-start"
                  }`}
                >
                  <div className="w-4.5 h-4.5 bg-white rounded-full shadow-md transition-transform" />
                </div>
              </div>
            </label>

            {/* Daily Financial Digest */}
            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 hover:bg-slate-100/70 dark:hover:bg-slate-800 transition-colors cursor-pointer">
              <div className="pr-2">
                <p className="font-bold text-slate-800 dark:text-slate-200 text-xs">Daily Financial Digest</p>
                <p className="text-[10.5px] text-slate-400 mt-0.5">
                  Summary alerts of approved revenue and pending queue size
                </p>
              </div>
              <div className="relative shrink-0 ml-2">
                <input
                  type="checkbox"
                  checked={notifPreferences.notifyDailySummary}
                  onChange={() => toggleNotif("notifyDailySummary")}
                  className="sr-only peer"
                />
                <div
                  className={`w-10 h-5.5 rounded-full transition-colors flex items-center p-0.5 ${
                    notifPreferences.notifyDailySummary
                      ? "bg-emerald-600 justify-end"
                      : "bg-slate-300 dark:bg-slate-700 justify-start"
                  }`}
                >
                  <div className="w-4.5 h-4.5 bg-white rounded-full shadow-md transition-transform" />
                </div>
              </div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}


