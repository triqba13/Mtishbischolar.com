"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Home, ChevronRight, User, Bell, Palette, Check, Moon, Sun, Sparkles, Monitor, CheckCircle2 } from "lucide-react";
import { useAdminAuth } from "@/components/admin/AdminAuthProvider";
import { createClient } from "@/lib/supabase/client";

import {
  AdmissionNotifPrefs,
  DEFAULT_ADMISSION_NOTIF_PREFS,
  getAdmissionNotifPrefs,
  saveAdmissionNotifPrefs,
} from "@/lib/notifications/prefs";

export default function SettingsPage() {
  const { profile, user, refreshProfile, loading: authLoading } = useAdminAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("Admission Officer");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [prefsSaved, setPrefsSaved] = useState(false);

  // Theme selection state
  // "light" | "dark" | "gold_dark" | "system"
  const [theme, setTheme] = useState<string>("light");

  // Notification toggles
  const [notifPreferences, setNotifPreferences] = useState<AdmissionNotifPrefs>(DEFAULT_ADMISSION_NOTIF_PREFS);

  useEffect(() => {
    if (profile) {
      const name = `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || profile.email || "";
      setFullName(name);
      setEmail(profile.email || user?.email || "");
      setPhone(profile.phone || "");
      setRole(profile.role === "super_admin" ? "Super Admin" : "Admission Officer");
    } else if (user) {
      setEmail(user.email || "");
    }

    // Load saved theme and preferences
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("mtishbi_admin_theme") || "light";
      setTheme(savedTheme);
      applyThemeToDOM(savedTheme);

      setNotifPreferences(getAdmissionNotifPrefs());
    }
  }, [profile, user]);

  const applyThemeToDOM = (selectedTheme: string) => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;

    root.classList.remove("dark", "theme-dark", "theme-gold-dark");
    if (selectedTheme === "dark") {
      root.classList.add("dark", "theme-dark");
      root.setAttribute("data-theme", "dark");
    } else if (selectedTheme === "gold_dark") {
      root.classList.add("dark", "theme-gold-dark");
      root.setAttribute("data-theme", "gold_dark");
    } else if (selectedTheme === "system") {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (prefersDark) {
        root.classList.add("dark", "theme-dark");
        root.setAttribute("data-theme", "dark");
      } else {
        root.removeAttribute("data-theme");
      }
    } else {
      root.removeAttribute("data-theme");
    }
  };

  const handleSelectTheme = (newTheme: string) => {
    setTheme(newTheme);
    localStorage.setItem("mtishbi_admin_theme", newTheme);
    applyThemeToDOM(newTheme);
  };

  const handleSaveProfile = async () => {
    try {
      setSavingProfile(true);
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user?.id) {
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
          .eq("id", user.id);

        await refreshProfile();
      }

      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    } catch (err) {
      console.error("Failed to save profile:", err);
    } finally {
      setSavingProfile(false);
    }
  };

  const toggleNotif = (key: keyof AdmissionNotifPrefs) => {
    setNotifPreferences((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      saveAdmissionNotifPrefs(updated);
      setPrefsSaved(true);
      setTimeout(() => setPrefsSaved(false), 2000);
      return updated;
    });
  };

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
          <span className="text-slate-600 font-medium">Settings</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 text-sm mt-1">Manage admission officer profile, themes, and notification preferences.</p>
      </div>

      <div className="grid grid-cols-2 gap-5">
        {/* Profile Settings */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
              <User className="w-4 h-4 text-blue-600" />
            </div>
            <h3 className="font-semibold text-slate-800">Profile Settings</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Officer Name"
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full px-3 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-sm text-slate-500 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+255 700 000 000"
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                Role
              </label>
              <input
                type="text"
                value={role}
                disabled
                className="w-full px-3 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-sm text-slate-500 cursor-not-allowed"
              />
            </div>
            <button
              onClick={handleSaveProfile}
              disabled={savingProfile}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-all mt-2 shadow-sm cursor-pointer flex items-center justify-center gap-2"
            >
              {profileSaved ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  Saved Successfully!
                </>
              ) : savingProfile ? (
                "Saving..."
              ) : (
                "Save Profile"
              )}
            </button>
          </div>
        </div>

        {/* Theme & Appearance Customization */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center">
              <Palette className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">Theme & System Color</h3>
              <p className="text-xs text-slate-400 mt-0.5">Customize your admission workspace interface</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            {/* White / Light Theme */}
            <button
              type="button"
              onClick={() => handleSelectTheme("light")}
              className={`p-3.5 rounded-xl border-2 text-left transition-all cursor-pointer relative ${
                theme === "light"
                  ? "border-blue-600 bg-blue-50/20 shadow-sm"
                  : "border-slate-200 hover:border-slate-300 bg-white"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
                  <Sun className="w-4 h-4" />
                </div>
                {theme === "light" && <Check className="w-4 h-4 text-blue-600 font-bold" />}
              </div>
              <p className="text-xs font-bold text-slate-800">White System</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Clean light mode</p>
            </button>

            {/* Dark Theme */}
            <button
              type="button"
              onClick={() => handleSelectTheme("dark")}
              className={`p-3.5 rounded-xl border-2 text-left transition-all cursor-pointer relative ${
                theme === "dark"
                  ? "border-blue-600 bg-slate-900 text-white shadow-sm"
                  : "border-slate-200 hover:border-slate-300 bg-slate-900 text-white"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-slate-200">
                  <Moon className="w-4 h-4" />
                </div>
                {theme === "dark" && <Check className="w-4 h-4 text-blue-400 font-bold" />}
              </div>
              <p className="text-xs font-bold text-white">Dark Mode</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Deep slate midnight</p>
            </button>

            {/* Gold & Dark Theme */}
            <button
              type="button"
              onClick={() => handleSelectTheme("gold_dark")}
              className={`p-3.5 rounded-xl border-2 text-left transition-all cursor-pointer relative ${
                theme === "gold_dark"
                  ? "border-amber-500 bg-[#0F172A] text-white shadow-md ring-2 ring-amber-500/20"
                  : "border-slate-200 hover:border-amber-500/60 bg-[#0F172A] text-white"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                {theme === "gold_dark" && <Check className="w-4 h-4 text-amber-400 font-bold" />}
              </div>
              <p className="text-xs font-bold text-amber-400">Gold & Dark</p>
              <p className="text-[11px] text-slate-300 mt-0.5">Luxury Gold & Midnight</p>
            </button>

            {/* System Default */}
            <button
              type="button"
              onClick={() => handleSelectTheme("system")}
              className={`p-3.5 rounded-xl border-2 text-left transition-all cursor-pointer relative ${
                theme === "system"
                  ? "border-blue-600 bg-blue-50/20 shadow-sm"
                  : "border-slate-200 hover:border-slate-300 bg-white"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
                  <Monitor className="w-4 h-4" />
                </div>
                {theme === "system" && <Check className="w-4 h-4 text-blue-600 font-bold" />}
              </div>
              <p className="text-xs font-bold text-slate-800">System Auto</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Matches OS setting</p>
            </button>
          </div>

          <div className="space-y-3 pt-3 border-t border-slate-100">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                Language
              </label>
              <select className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
                <option>English (United Kingdom)</option>
                <option>Swahili (Tanzania)</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                Timezone
              </label>
              <select className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
                <option>Africa/Dar_es_Salaam (EAT, UTC+3)</option>
                <option>UTC (Coordinated Universal Time)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notifications Preferences */}
        <div className="col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200/60 dark:border-orange-900/50 flex items-center justify-center">
                <Bell className="w-4 h-4 text-orange-500" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 dark:text-white">Notification Preferences</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Control which event alerts trigger in your workspace</p>
              </div>
            </div>
            {prefsSaved && (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800 animate-in fade-in duration-150">
                <Check className="w-3.5 h-3.5" />
                <span>Saved</span>
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
            {[
              { key: "newApp" as const, label: "New application submitted by verified student" },
              { key: "docUploaded" as const, label: "Academic document uploaded by student" },
              { key: "studentReply" as const, label: "Student replied to review notes or query" },
              { key: "passportRequest" as const, label: "Passport assistance request received" },
              { key: "uniResponse" as const, label: "University admission response received" },
              { key: "statusChanged" as const, label: "Visa or application stage transition alerts" },
            ].map(({ key, label }) => {
              const isOn = notifPreferences[key];
              return (
                <label
                  key={key}
                  className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                >
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</span>
                  <div className="relative shrink-0 ml-4">
                    <input
                      type="checkbox"
                      checked={isOn}
                      onChange={() => toggleNotif(key)}
                      className="sr-only peer"
                    />
                    <div
                      className={`w-11 h-6 rounded-full transition-colors flex items-center p-0.5 ${
                        isOn
                          ? "bg-blue-600 dark:bg-amber-500 justify-end"
                          : "bg-slate-300 dark:bg-slate-700 justify-start"
                      }`}
                    >
                      <div className="w-5 h-5 bg-white rounded-full shadow-md transition-transform" />
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
