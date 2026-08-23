import Link from "next/link";
import { Home, ChevronRight, User, Bell, Shield, Palette } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2">
          <Home className="w-3.5 h-3.5" />
          <ChevronRight className="w-3 h-3" />
          <Link href="/admin/admission/dashboard" className="hover:text-blue-600">Dashboard</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-600 font-medium">Settings</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
      </div>

      <div className="grid grid-cols-2 gap-5">
        {/* Profile */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
              <User className="w-4 h-4 text-blue-600" />
            </div>
            <h3 className="font-semibold text-slate-800">Profile Settings</h3>
          </div>
          <div className="space-y-4">
            {[["Full Name", "Sarah Johnson"], ["Email", "sarah@mtishbischolar.com"], ["Phone", "+255 712 000 001"], ["Role", "Admission Officer"]].map(([label, value]) => (
              <div key={label}>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">{label}</label>
                <input
                  defaultValue={value}
                  disabled={label === "Role"}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>
            ))}
            <button className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-all mt-2 shadow-sm cursor-pointer">
              Save Profile
            </button>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center">
              <Bell className="w-4 h-4 text-orange-500" />
            </div>
            <h3 className="font-semibold text-slate-800">Notification Preferences</h3>
          </div>
          <div className="space-y-3">
            {[
              "New application submitted",
              "Document uploaded by student",
              "Student replied to comment",
              "Passport assistance request",
              "University response received",
              "Application status changed",
            ].map((item) => (
              <label key={item} className="flex items-center justify-between py-2 cursor-pointer">
                <span className="text-sm text-slate-700">{item}</span>
                <div className="relative">
                  <input type="checkbox" defaultChecked className="sr-only peer" />
                  <div className="w-10 h-5 bg-slate-200 rounded-full peer peer-checked:bg-blue-600 transition-colors" />
                  <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5" />
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Security */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center">
              <Shield className="w-4 h-4 text-red-500" />
            </div>
            <h3 className="font-semibold text-slate-800">Security</h3>
          </div>
          <div className="space-y-4">
            {["Current Password", "New Password", "Confirm New Password"].map((label) => (
              <div key={label}>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">{label}</label>
                <input type="password" placeholder="••••••••" className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
              </div>
            ))}
            <button className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-sm transition-all mt-2 cursor-pointer">
              Update Password
            </button>
          </div>
        </div>

        {/* Appearance */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center">
              <Palette className="w-4 h-4 text-purple-500" />
            </div>
            <h3 className="font-semibold text-slate-800">Appearance</h3>
          </div>
          <p className="text-sm text-slate-500 mb-4">Choose your preferred display settings.</p>
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Language</label>
              <select className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
                <option>English</option>
                <option>Swahili</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Timezone</label>
              <select className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
                <option>Africa/Dar_es_Salaam (EAT, UTC+3)</option>
                <option>UTC</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
