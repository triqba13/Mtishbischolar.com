"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  FileText,
  FolderOpen,
  Globe,
  Bell,
  BarChart3,
  Settings,
  LogOut,
  ChevronDown,
  DollarSign,
  ShieldAlert,
  X,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAdminAuth } from "@/components/admin/AdminAuthProvider";
import { createClient } from "@/lib/supabase/client";

const navItems = [
  { href: "/admin/admission/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/admission/students", icon: Users, label: "Students" },
  { href: "/admin/admission/applications", icon: FileText, label: "Applications" },
  { href: "/admin/admission/documents", icon: FolderOpen, label: "Documents" },
  {
    label: "Passport & Visa",
    icon: Globe,
    children: [
      { href: "/admin/admission/passport", label: "Passport" },
      { href: "/admin/admission/visa", label: "Visa" },
    ],
  },
  { href: "/admin/admission/notifications", icon: Bell, label: "Notifications" },
  { href: "/admin/admission/reports", icon: BarChart3, label: "Reports" },
  { href: "/admin/admission/settings", icon: Settings, label: "Settings" },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { logout, role, roleLabel } = useAdminAuth();
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [passportOpen, setPassportOpen] = useState(
    pathname.includes("/passport") || pathname.includes("/visa")
  );

  useEffect(() => {
    async function fetchUnreadCount() {
      try {
        const supabase = createClient();
        const { count, error } = await supabase
          .from("notifications")
          .select("*", { count: "exact", head: true })
          .eq("is_read", false);
        if (!error && count !== null) {
          setUnreadCount(count);
        }
      } catch (err) {
        console.warn("Failed to fetch notification count for sidebar:", err);
      }
    }
    fetchUnreadCount();
  }, [pathname]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  const renderSidebarContent = (isMobile = false) => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="relative h-9 w-11 shrink-0 overflow-hidden rounded-lg">
            <Image
              src="/logo.png"
              alt="Mtishbi Scholars official logo"
              fill
              className="object-contain"
              sizes="44px"
            />
          </div>
          <div>
            <p className="text-white font-extrabold text-sm leading-none">
              Mtishbi<span className="text-blue-400">Scholars</span>
            </p>
            <p className="text-slate-400 text-[10px] font-semibold mt-1 tracking-wider uppercase">
              {role === "super_admin" ? "Super Admin" : "Admission Panel"}
            </p>
          </div>
        </div>
        {isMobile && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {navItems.map((item) => {
          if (item.children) {
            return (
              <div key={item.label}>
                <button
                  type="button"
                  onClick={() => setPassportOpen(!passportOpen)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    pathname.includes("/passport") || pathname.includes("/visa")
                      ? "text-white bg-slate-800/80"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <item.icon className="w-4 h-4 text-blue-400" />
                    <span>{item.label}</span>
                  </div>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                      passportOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {passportOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden pl-7 pr-1 py-1 space-y-1"
                    >
                      {item.children.map((sub) => {
                        const active = isActive(sub.href);
                        return (
                          <Link
                            key={sub.href}
                            href={sub.href}
                            onClick={() => {
                              if (isMobile && onClose) onClose();
                            }}
                            className={`block px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                              active
                                ? "text-blue-400 bg-blue-500/10 font-bold"
                                : "text-slate-400 hover:text-white hover:bg-slate-800/40"
                            }`}
                          >
                            {sub.label}
                          </Link>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          }

          const active = isActive(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href!}
              onClick={() => {
                if (isMobile && onClose) onClose();
              }}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all relative group ${
                active
                  ? "text-white bg-blue-600 shadow-md shadow-blue-600/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.href === "/admin/admission/notifications" && unreadCount > 0 && (
                <span className="min-w-5 h-5 px-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 99 ? "99+" : unreadCount}
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
              onClick={() => {
                if (isMobile && onClose) onClose();
              }}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all"
            >
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span>Finance Panel</span>
            </Link>
            <Link
              href="/admin/super/dashboard"
              onClick={() => {
                if (isMobile && onClose) onClose();
              }}
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
    </div>
  );

  return (
    <>
      {/* Desktop static sidebar */}
      <aside className="hidden lg:flex fixed top-0 left-0 h-screen w-[220px] bg-[#0B132B] flex-col z-40 border-r border-slate-800">
        {renderSidebarContent(false)}
      </aside>

      {/* Mobile off-canvas drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm"
              onClick={onClose}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-[250px] max-w-[80vw] h-full bg-[#0B132B] flex flex-col z-10 shadow-2xl border-r border-slate-800"
            >
              {renderSidebarContent(true)}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
