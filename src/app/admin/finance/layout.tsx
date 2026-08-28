"use client";

import { AdminAuthProvider } from "@/components/admin/AdminAuthProvider";
import AdminLayoutShell from "@/components/admin/AdminLayoutShell";
import FinanceSidebar from "@/components/admin/finance/Sidebar";
import { FinanceThemeProvider } from "@/components/admin/finance/FinanceThemeProvider";

export default function FinanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminAuthProvider>
      <FinanceThemeProvider>
        <AdminLayoutShell
          headerTitle="Finance Management"
          sidebar={<FinanceSidebar />}
        >
          {children}
        </AdminLayoutShell>
      </FinanceThemeProvider>
    </AdminAuthProvider>
  );
}
