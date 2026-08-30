"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ShieldAlert, FileText, DollarSign, LogOut, ChevronLeft, ChevronRight, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAdminAuth } from "@/components/admin/AdminAuthProvider";

interface SuperSidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function SuperSidebar({
  mobileOpen,
  onClose,
  collapsed = false,
  onToggleCollapse,
}: SuperSidebarProps) {
  const pathname = usePathname();
  const { logout } = useAdminAuth();

  const renderContent = (isMobile = false) => (
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
                  Mtishbi<span className="text-indigo-400">Scholars</span>
                </p>
                <p className="text-slate-400 text-[10px] font-semibold mt-1 tracking-wider uppercase whitespace-nowrap">
                  Super Admin
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
              className={`w-full py-1.5 px-2.5 rounded-xl bg-slate-800/70 hover:bg-indigo-600/30 text-slate-300 hover:text-white border border-slate-700/60 transition-all duration-200 flex items-center cursor-pointer ${
                collapsed ? "justify-center" : "justify-between"
              }`}
              title={collapsed ? "Show Sidebar (-->)" : "Hide Sidebar (<--)"}
            >
              <span className={`text-[11px] font-semibold text-slate-300 ${collapsed ? "hidden" : "block"}`}>
                Hide Sidebar
              </span>
              {collapsed ? (
                <ChevronRight className="w-4 h-4 text-indigo-400" />
              ) : (
                <ChevronLeft className="w-4 h-4 text-slate-400" />
              )}
            </button>
          </div>
        )}

        <nav className="overflow-y-auto py-2 px-3 space-y-1">
          <div className="relative group">
            <Link
              href="/admin/super/dashboard"
              onClick={() => {
                if (isMobile && onClose) onClose();
              }}
              className={`flex items-center ${
                !isMobile && collapsed ? "justify-center px-2 py-2.5" : "gap-2.5 px-3 py-2.5"
              } rounded-xl text-sm font-semibold transition-all relative ${
                pathname === "/admin/super/dashboard"
                  ? "text-white bg-indigo-600 shadow-md shadow-indigo-600/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              }`}
            >
              <ShieldAlert className="w-4 h-4 shrink-0" />
              {(isMobile || !collapsed) && <span>Overview</span>}
            </Link>
            {!isMobile && collapsed && (
              <div className="hidden lg:group-hover:flex absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg shadow-xl border border-slate-700/80 whitespace-nowrap z-50 pointer-events-none items-center gap-1.5 animate-in fade-in duration-150">
                <span>Overview</span>
              </div>
            )}
          </div>

          <div className="relative group">
            <Link
              href="/admin/admission/dashboard"
              onClick={() => {
                if (isMobile && onClose) onClose();
              }}
              className={`flex items-center ${
                !isMobile && collapsed ? "justify-center px-2 py-2.5" : "gap-2.5 px-3 py-2.5"
              } rounded-xl text-sm font-semibold text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all`}
            >
              <FileText className="w-4 h-4 shrink-0" />
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
              href="/admin/finance/dashboard"
              onClick={() => {
                if (isMobile && onClose) onClose();
              }}
              className={`flex items-center ${
                !isMobile && collapsed ? "justify-center px-2 py-2.5" : "gap-2.5 px-3 py-2.5"
              } rounded-xl text-sm font-semibold text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all`}
            >
              <DollarSign className="w-4 h-4 shrink-0" />
              {(isMobile || !collapsed) && <span>Finance Panel</span>}
            </Link>
            {!isMobile && collapsed && (
              <div className="hidden lg:group-hover:flex absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg shadow-xl border border-slate-700/80 whitespace-nowrap z-50 pointer-events-none items-center gap-1.5 animate-in fade-in duration-150">
                <span>Finance Panel</span>
              </div>
            )}
          </div>
        </nav>
      </div>

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
      <aside
        className={`hidden lg:flex fixed top-0 left-0 h-screen ${
          collapsed ? "w-20" : "w-[220px]"
        } bg-[#0B132B] flex-col z-40 border-r border-slate-800 transition-all duration-300 ease-in-out`}
      >
        {renderContent(false)}
      </aside>

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
              {renderContent(true)}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
