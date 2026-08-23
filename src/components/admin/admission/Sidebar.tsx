"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  FileText,
  FolderOpen,
  Building2,
  Globe,
  Bell,
  BarChart3,
  Settings,
  LogOut,
  GraduationCap,
  ChevronDown,
  DollarSign,
  ShieldAlert,
} from "lucide-react";
import { useState } from "react";
import { useAdminAuth } from "@/components/admin/AdminAuthProvider";

const navItems = [
  { href: "/admin/admission/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/admission/students", icon: Users, label: "Students" },
  { href: "/admin/admission/applications", icon: FileText, label: "Applications" },
  { href: "/admin/admission/documents", icon: FolderOpen, label: "Documents" },
  { href: "/admin/admission/universities", icon: Building2, label: "Universities" },
  {
    label: "Passport & Visa",
    icon: Globe,
    children: [
      { href: "/admin/admission/passport", label: "Passport" },
      { href: "/admin/admission/visa", label: "Visa" },
    ],
  },
  { href: "/admin/admission/notifications", icon: Bell, label: "Notifications", badge: 8 },
  { href: "/admin/admission/reports", icon: BarChart3, label: "Reports" },
  { href: "/admin/admission/settings", icon: Settings, label: "Settings" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { logout, role, roleLabel } = useAdminAuth();
  const [passportOpen, setPassportOpen] = useState(
    pathname.includes("/passport") || pathname.includes("/visa")
  );

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <aside className="fixed top-0 left-0 h-screen w-[220px] bg-[#0B132B] flex flex-col z-50 border-r border-slate-800">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-slate-800">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shrink-0 shadow-md shadow-blue-600/30">
          <GraduationCap className="w-4.5 h-4.5 text-white" />
        </div>
        <div>
          <p className="text-white font-extrabold text-sm leading-none">
            Mtishbi<span className="text-blue-400">Scholar</span>
          </p>
          <p className="text-slate-400 text-[10px] font-semibold mt-1 tracking-wider uppercase">
            {role === "super_admin" ? "Super Admin" : "Admission Panel"}
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {navItems.map((item) => {
          if (item.children) {
            return (
              <div key={item.label}>
                <button
                  onClick={() => setPassportOpen(!passportOpen)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all group cursor-pointer
                    ${
                      passportOpen || item.children.some((c) => isActive(c.href))
                        ? "text-white bg-slate-800/80"
                        : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                    }`}
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  <span className="flex-1 text-left">{item.label}</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform ${passportOpen ? "rotate-180" : ""}`}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {passportOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="pl-9 py-1 space-y-1">
                        {item.children.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            className={`block px-3 py-2 rounded-lg text-xs font-semibold transition-all
                              ${
                                isActive(child.href)
                                  ? "text-white bg-blue-600 shadow-sm shadow-blue-600/30"
                                  : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                              }`}
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href!}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all relative group
                ${
                  isActive(item.href!)
                    ? "text-white bg-blue-600 shadow-md shadow-blue-600/30"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                }`}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span className="w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}

        {/* Super Admin Switcher Shortcuts */}
        {role === "super_admin" && (
          <div className="pt-4 mt-4 border-t border-slate-800 space-y-1">
            <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Management Panels
            </p>
            <Link
              href="/admin/finance/dashboard"
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all"
            >
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span>Finance Panel</span>
            </Link>
            <Link
              href="/admin/super/dashboard"
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all"
            >
              <ShieldAlert className="w-4 h-4 text-indigo-400" />
              <span>Super Admin Overview</span>
            </Link>
          </div>
        )}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-slate-800">
        <button
          onClick={logout}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all font-semibold cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

