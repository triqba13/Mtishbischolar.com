"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Header from "@/components/admin/admission/Header";

interface AdminLayoutShellProps {
  children: React.ReactNode;
  headerTitle?: string;
  sidebar: React.ReactElement<{
    mobileOpen?: boolean;
    onClose?: () => void;
  }>;
}

export default function AdminLayoutShell({
  children,
  headerTitle,
  sidebar,
}: AdminLayoutShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  // Close mobile sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Lock body scroll on mobile when sidebar drawer is open
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 transition-colors duration-200">
      {/* Sidebar (Desktop static + Mobile off-canvas drawer) */}
      {sidebar &&
        React.cloneElement(sidebar, {
          mobileOpen: sidebarOpen,
          onClose: () => setSidebarOpen(false),
        })}

      {/* Header */}
      <Header
        title={headerTitle}
        onMenuClick={() => setSidebarOpen(true)}
      />

      {/* Main Content */}
      <main className="ml-0 lg:ml-[220px] pt-16 min-h-screen">
        <div className="p-3 sm:p-5 md:p-6 max-w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
