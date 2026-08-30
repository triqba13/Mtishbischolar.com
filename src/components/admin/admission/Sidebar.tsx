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
  ChevronLeft,
  ChevronRight,
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
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function Sidebar({
  mobileOpen,
  onClose,
  collapsed = false,
  onToggleCollapse,
}: SidebarProps) {
  const pathname = usePathname();
  const { logout, role } = useAdminAuth();
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [passportOpen, setPassportOpen] = useState(
    pathname.includes("/passport") || pathname.includes("/visa")
  );

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
        console.warn("Failed to fetch notification count for sidebar:", err);
      }
    }
    fetchUnreadCount();

    const interval = setInterval(fetchUnreadCount, 15000);
    return () => clearInterval(interval);
  }, [pathname]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  const renderSidebarContent = (isMobile = false) => (
    <div className="flex flex-col h-full justify-between">
      <div>
        {/* Logo */}
        <div
          className={`flex items-center ${
            !isMobile && collapsed ? "justify-center px-2 py-4" : "justify-between px-4 py-4"
          } border-b border-slate-800 transition-all duration-200`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative h-9 w-11 shrink-0 overflow-hidden rounded-lg">
              <Image
                src="/logo.png"
                alt="Mtishbi Scholars official logo"
                fill
                className="object-contain"
                sizes="44px"
              />
            </div>
            {(isMobile || !collapsed) && (
              <div className="overflow-hidden transition-all duration-200">
                <p className="text-white font-extrabold text-sm leading-none whitespace-nowrap">
                  Mtishbi<span className="text-blue-400">Scholars</span>
                </p>
                <p className="text-slate-400 text-[10px] font-semibold mt-1 tracking-wider uppercase whitespace-nowrap">
                  {role === "super_admin" ? "Super Admin" : "Admission Panel"}
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
              className={`w-full py-1.5 px-2.5 rounded-xl bg-slate-800/70 hover:bg-blue-600/30 text-slate-300 hover:text-white border border-slate-700/60 transition-all duration-200 flex items-center cursor-pointer ${
                collapsed ? "justify-center" : "justify-between"
              }`}
              title={collapsed ? "Show Sidebar (-->)" : "Hide Sidebar (<--)"}
            >
              <span className={`text-[11px] font-semibold text-slate-300 ${collapsed ? "hidden" : "block"}`}>
                Hide Sidebar
              </span>
              {collapsed ? (
                <ChevronRight className="w-4 h-4 text-blue-400" />
              ) : (
                <ChevronLeft className="w-4 h-4 text-slate-400" />
              )}
            </button>
          </div>
        )}

        {/* Nav */}
        <nav className="overflow-y-auto py-2 px-3 space-y-1">
          {navItems.map((item) => {
            if (item.children) {
              const isChildActive = pathname.includes("/passport") || pathname.includes("/visa");
              return (
                <div key={item.label} className="relative group">
                  <button
                    type="button"
                    onClick={() => setPassportOpen(!passportOpen)}
                    className={`w-full flex items-center ${
                      !isMobile && collapsed ? "justify-center px-2 py-2.5" : "justify-between px-3 py-2.5"
                    } rounded-xl text-sm font-semibold transition-all ${
                      isChildActive
                        ? "text-white bg-slate-800/80"
                        : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <item.icon className="w-4 h-4 text-blue-400 shrink-0" />
                      {(isMobile || !collapsed) && <span>{item.label}</span>}
                    </div>
                    {(isMobile || !collapsed) && (
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                          passportOpen ? "rotate-180" : ""
                        }`}
                      />
                    )}
                  </button>

                  {/* Desktop Hover Tooltip when sidebar is collapsed */}
                  {!isMobile && collapsed && (
                    <div className="hidden lg:group-hover:flex flex-col absolute left-full top-0 ml-3 bg-slate-900 text-white text-xs font-bold rounded-lg shadow-xl border border-slate-700/80 z-50 py-1.5 px-1 min-w-[130px] animate-in fade-in duration-150">
                      <span className="px-2 py-1 text-[10px] text-slate-400 uppercase tracking-wider border-b border-slate-800">
                        {item.label}
                      </span>
                      {item.children.map((sub) => (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          className={`px-2.5 py-1.5 rounded-md text-xs font-semibold hover:bg-slate-800 transition-colors ${
                            isActive(sub.href) ? "text-blue-400 font-bold" : "text-slate-300"
                          }`}
                        >
                          {sub.label}
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* Submenu for Expanded Sidebar */}
                  {(isMobile || !collapsed) && (
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
                  )}
                </div>
              );
            }

            const active = isActive(item.href);
            const Icon = item.icon;

            return (
              <div key={item.href} className="relative group">
                <Link
                  key={item.href}
                  href={item.href!}
                  onClick={() => {
                    if (isMobile && onClose) onClose();
                  }}
                  className={`flex items-center ${
                    !isMobile && collapsed ? "justify-center px-2 py-2.5" : "gap-2.5 px-3 py-2.5"
                  } rounded-xl text-sm font-semibold transition-all relative ${
                    active
                      ? "text-white bg-blue-600 shadow-md shadow-blue-600/30"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                  }`}
                >
                  <div className="relative shrink-0 flex items-center justify-center">
                    <Icon className="w-4 h-4" />
                    {!isMobile && collapsed && item.href === "/admin/admission/notifications" && unreadCount > 0 && (
                      <span className="absolute -top-1.5 -right-2 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-[#0B132B]">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </div>
                  {(isMobile || !collapsed) && (
                    <>
                      <span className="flex-1 whitespace-nowrap">{item.label}</span>
                      {item.href === "/admin/admission/notifications" && unreadCount > 0 && (
                        <span className="min-w-5 h-5 px-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
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
                    {item.href === "/admin/admission/notifications" && unreadCount > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full bg-red-500 text-white text-[10px] font-bold">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Super Admin Switcher Shortcuts */}
          {role === "super_admin" && (
            <div className="pt-3 mt-3 border-t border-slate-800 space-y-1">
              {(isMobile || !collapsed) && (
                <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Management Panels
                </p>
              )}
              <div className="relative group">
                <Link
                  href="/admin/finance/dashboard"
                  onClick={() => {
                    if (isMobile && onClose) onClose();
                  }}
                  className={`flex items-center ${
                    !isMobile && collapsed ? "justify-center px-2 py-2" : "gap-2.5 px-3 py-2"
                  } rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all`}
                >
                  <DollarSign className="w-4 h-4 text-emerald-400 shrink-0" />
                  {(isMobile || !collapsed) && <span>Finance Panel</span>}
                </Link>
                {!isMobile && collapsed && (
                  <div className="hidden lg:group-hover:flex absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg shadow-xl border border-slate-700/80 whitespace-nowrap z-50 pointer-events-none items-center gap-1.5 animate-in fade-in duration-150">
                    <span>Finance Panel</span>
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
