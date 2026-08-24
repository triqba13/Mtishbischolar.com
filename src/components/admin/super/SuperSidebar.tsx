"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ShieldAlert, FileText, DollarSign, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAdminAuth } from "@/components/admin/AdminAuthProvider";

interface SuperSidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

export default function SuperSidebar({ mobileOpen, onClose }: SuperSidebarProps) {
  const pathname = usePathname();
  const { logout } = useAdminAuth();

  const renderContent = (isMobile = false) => (
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
              Mtishbi<span className="text-indigo-400">Scholars</span>
            </p>
            <p className="text-slate-400 text-[10px] font-semibold mt-1 tracking-wider uppercase">
              Super Admin
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

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        <Link
          href="/admin/super/dashboard"
          onClick={() => {
            if (isMobile && onClose) onClose();
          }}
          className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all relative ${
            pathname === "/admin/super/dashboard"
              ? "text-white bg-indigo-600 shadow-md shadow-indigo-600/30"
              : "text-slate-400 hover:text-white hover:bg-slate-800/50"
          }`}
        >
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>Overview</span>
        </Link>
        <Link
          href="/admin/admission/dashboard"
          onClick={() => {
            if (isMobile && onClose) onClose();
          }}
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all"
        >
          <FileText className="w-4 h-4 shrink-0" />
          <span>Admission Panel</span>
        </Link>
        <Link
          href="/admin/finance/dashboard"
          onClick={() => {
            if (isMobile && onClose) onClose();
          }}
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all"
        >
          <DollarSign className="w-4 h-4 shrink-0" />
          <span>Finance Panel</span>
        </Link>
      </nav>

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
      <aside className="hidden lg:flex fixed top-0 left-0 h-screen w-[220px] bg-[#0B132B] flex-col z-40 border-r border-slate-800">
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
