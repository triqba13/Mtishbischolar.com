"use client";

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
}

export default function FinanceSidebar({ mobileOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { logout, role } = useAdminAuth();

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

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
              Mtishbi<span className="text-emerald-400">Scholars</span>
            </p>
            <p className="text-slate-400 text-[10px] font-semibold mt-1 tracking-wider uppercase">
              Finance Panel
            </p>
          </div>
        </div>
        {isMobile && onClose && (
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            aria-label="Close menu"
          >
            ✕
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {financeNavItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => {
                if (isMobile && onClose) onClose();
              }}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all relative group ${
                active
                  ? "text-white bg-emerald-600 shadow-md shadow-emerald-600/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="flex-1">{item.label}</span>
            </Link>
          );
        })}

        {/* Super Admin Switcher Shortcut */}
        {role === "super_admin" && (
          <div className="pt-4 mt-4 border-t border-slate-800 space-y-1">
            <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Switch Panel
            </p>
            <Link
              href="/admin/admission/dashboard"
              onClick={() => {
                if (isMobile && onClose) onClose();
              }}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all"
            >
              <Users className="w-4 h-4 text-blue-400" />
              <span>Admission Panel</span>
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
          type="button"
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
