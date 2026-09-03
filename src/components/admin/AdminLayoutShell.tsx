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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const pathname = usePathname();

  // Load persisted collapse state
  useEffect(() => {
    try {
      const saved = localStorage.getItem("mtb_admin_sidebar_collapsed");
      if (saved === "true") {
        setSidebarCollapsed(true);
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const toggleSidebarCollapsed = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("mtb_admin_sidebar_collapsed", String(next));
      } catch {
        // Ignore localStorage errors
      }
      return next;
    });
  };

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
    <div className="admin-portal min-h-screen bg-[#F8FAFC] text-slate-900 transition-colors duration-200">
      {/* Sidebar (Desktop static + Mobile off-canvas drawer) */}
      {React.isValidElement(sidebar)
        ? React.cloneElement(sidebar as React.ReactElement<any>, {
            mobileOpen: sidebarOpen,
            onClose: () => setSidebarOpen(false),
            collapsed: sidebarCollapsed,
            onToggleCollapse: toggleSidebarCollapsed,
          })
        : sidebar}

      {/* Header */}
      <Header
        title={headerTitle}
        onMenuClick={() => setSidebarOpen(true)}
        sidebarCollapsed={sidebarCollapsed}
      />

      {/* Main Content */}
      <main
        className={`transition-all duration-300 ease-in-out ${
          sidebarCollapsed ? "lg:ml-20" : "lg:ml-[220px]"
        } pt-16 min-h-screen`}
      >
        <div className="p-3 sm:p-5 md:p-6 max-w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
