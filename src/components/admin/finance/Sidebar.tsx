"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  DollarSign,
  Users,
  BarChart3,
  Bell,
  ShieldCheck,
  Settings,
  LogOut,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAdminAuth } from "@/components/admin/AdminAuthProvider";

const financeNavItems = [
  { href: "/admin/finance/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/finance/payments", icon: DollarSign, label: "Payments & Fees" },
  { href: "/admin/finance/students", icon: Users, label: "Students" },
  { href: "/admin/finance/reports", icon: BarChart3, label: "Reports" },
  { href: "/admin/finance/notifications", icon: Bell, label: "Notifications" },
  { href: "/admin/finance/audit-logs", icon: ShieldCheck, label: "Audit Logs" },
  { href: "/admin/finance/settings", icon: Settings, label: "Settings" },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function FinanceSidebar({
  mobileOpen,
  onClose,
  collapsed = false,
  onToggleCollapse,
}: SidebarProps) {
  const pathname = usePathname();
  const { logout, role } = useAdminAuth();
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    async function fetchUnreadCount() {
      try {
        const res = await fetch("/api/admin/notifications");
        if (res.ok) {
          const json = await res.json();
          if (json.success && typeof json.unreadCount === "number") {
            setUnreadCount(json.unreadCount);
          }
        }
      } catch (err) {
        console.warn("Failed to fetch finance notification count:", err);
      }
    }
    fetchUnreadCount();

    const interval = setInterval(fetchUnreadCount, 15000);
    return () => clearInterval(interval);
  }, [pathname]);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  const renderSidebarContent = (isMobile = false) => (
    <div className="flex flex-col h-full justify-between">
      <div>
        {/* Logo */}
        <div
          className={`h-16 flex items-center ${
            !isMobile && collapsed ? "justify-center px-2" : "justify-between px-5"
          } border-b border-slate-800 shrink-0 transition-all duration-200`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative h-8 w-10 shrink-0 overflow-hidden rounded-lg">
              <Image
                src="/logo.png"
                alt="Mtishbi Scholars official logo"
                fill
                className="object-contain"
                sizes="40px"
              />
            </div>
            {(isMobile || !collapsed) && (
              <div className="overflow-hidden transition-all duration-200">
                <p className="text-white font-extrabold text-sm leading-none whitespace-nowrap">
                  Mtishbi<span className="text-emerald-400">Scholars</span>
                </p>
                <p className="text-slate-400 text-[10px] font-semibold mt-1 tracking-wider uppercase whitespace-nowrap">
                  Finance Panel
                </p>
              </div>
            )}
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

        {/* Desktop Hide / Show Sidebar Toggle Button (<-- / -->) */}
        {!isMobile && (
          <div className="hidden lg:flex items-center justify-center p-3 pb-1">
            <button
              type="button"
              onClick={onToggleCollapse}
              className={`w-full py-1.5 px-2.5 rounded-xl bg-slate-800/70 hover:bg-emerald-600/30 text-slate-300 hover:text-white border border-slate-700/60 transition-all duration-200 flex items-center cursor-pointer ${
                collapsed ? "justify-center" : "justify-between"
              }`}
              title={collapsed ? "Show Sidebar (-->)" : "Hide Sidebar (<--)"}
            >
              <span className={`text-[11px] font-semibold text-slate-300 ${collapsed ? "hidden" : "block"}`}>
                Hide Sidebar
              </span>
              {collapsed ? (
                <ChevronRight className="w-4 h-4 text-emerald-400" />
              ) : (
                <ChevronLeft className="w-4 h-4 text-slate-400" />
              )}
            </button>
          </div>
        )}

        {/* Nav */}
        <nav className="overflow-y-auto py-2 px-3 space-y-1">
          {financeNavItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            const isNotifItem = item.href === "/admin/finance/notifications";

            return (
              <div key={item.href} className="relative group">
                <Link
                  href={item.href}
                  onClick={() => {
                    if (isMobile && onClose) onClose();
                  }}
                  className={`flex items-center ${
                    !isMobile && collapsed ? "justify-center px-2 py-2.5" : "gap-2.5 px-3 py-2.5"
                  } rounded-xl text-sm font-semibold transition-all relative ${
                    active
                      ? "text-white bg-emerald-600 shadow-md shadow-emerald-600/30"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                  }`}
                >
                  <div className="relative shrink-0 flex items-center justify-center">
                    <Icon className="w-4 h-4" />
                    {!isMobile && collapsed && isNotifItem && unreadCount > 0 && (
                      <span className="absolute -top-1.5 -right-2 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-[#0B132B] animate-pulse">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </div>
                  {(isMobile || !collapsed) && (
                    <>
                      <span className="flex-1 whitespace-nowrap">{item.label}</span>
                      {isNotifItem && unreadCount > 0 && (
                        <span className="min-w-5 h-5 px-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                          {unreadCount > 99 ? "99+" : unreadCount}
                        </span>
                      )}
                    </>
                  )}
                </Link>

                {/* Desktop Hover Tooltip when sidebar is collapsed */}
                {!isMobile && collapsed && (
                  <div className="hidden lg:group-hover:flex absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg shadow-xl border border-slate-700/80 whitespace-nowrap z-50 pointer-events-none items-center gap-1.5 animate-in fade-in duration-150">
                    <span>{item.label}</span>
                    {isNotifItem && unreadCount > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full bg-red-500 text-white text-[10px] font-bold">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Super Admin Switcher Shortcut */}
          {role === "super_admin" && (
            <div className="pt-3 mt-3 border-t border-slate-800 space-y-1">
              {(isMobile || !collapsed) && (
                <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Switch Panel
                </p>
              )}
              <div className="relative group">
                <Link
                  href="/admin/admission/dashboard"
                  onClick={() => {
                    if (isMobile && onClose) onClose();
                  }}
                  className={`flex items-center ${
                    !isMobile && collapsed ? "justify-center px-2 py-2" : "gap-2.5 px-3 py-2"
                  } rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all`}
                >
                  <Users className="w-4 h-4 text-blue-400 shrink-0" />
                  {(isMobile || !collapsed) && <span>Admission Panel</span>}
                </Link>
                {!isMobile && collapsed && (
                  <div className="hidden lg:group-hover:flex absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg shadow-xl border border-slate-700/80 whitespace-nowrap z-50 pointer-events-none items-center gap-1.5 animate-in fade-in duration-150">
                    <span>Admission Panel</span>
                  </div>
                )}
              </div>

              <div className="relative group">
                <Link
                  href="/admin/super/dashboard"
                  onClick={() => {
                    if (isMobile && onClose) onClose();
                  }}
                  className={`flex items-center ${
                    !isMobile && collapsed ? "justify-center px-2 py-2" : "gap-2.5 px-3 py-2"
                  } rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all`}
                >
                  <ShieldAlert className="w-4 h-4 text-indigo-400 shrink-0" />
                  {(isMobile || !collapsed) && <span>Super Admin Overview</span>}
                </Link>
                {!isMobile && collapsed && (
                  <div className="hidden lg:group-hover:flex absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg shadow-xl border border-slate-700/80 whitespace-nowrap z-50 pointer-events-none items-center gap-1.5 animate-in fade-in duration-150">
                    <span>Super Admin Overview</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </nav>
      </div>

      {/* Logout */}
      <div className="p-3 border-t border-slate-800">
        <div className="relative group">
          <button
            type="button"
            onClick={logout}
            className={`w-full flex items-center ${
              !isMobile && collapsed ? "justify-center px-2 py-2.5" : "gap-2.5 px-3 py-2.5"
            } rounded-xl text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all font-semibold cursor-pointer`}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {(isMobile || !collapsed) && <span>Logout</span>}
          </button>
          {!isMobile && collapsed && (
            <div className="hidden lg:group-hover:flex absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg shadow-xl border border-slate-700/80 whitespace-nowrap z-50 pointer-events-none items-center gap-1.5 animate-in fade-in duration-150">
              <span>Logout</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop static sidebar */}
      <aside
        className={`hidden lg:flex fixed top-0 left-0 h-screen ${
          collapsed ? "w-20" : "w-[220px]"
        } bg-[#0B132B] flex-col z-40 border-r border-slate-800 transition-all duration-300 ease-in-out`}
      >
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
