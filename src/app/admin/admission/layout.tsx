"use client";

import Sidebar from "@/components/admin/admission/Sidebar";
import AdminLayoutShell from "@/components/admin/AdminLayoutShell";
import { AdminAuthProvider } from "@/components/admin/AdminAuthProvider";

export default function AdmissionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminAuthProvider>
      <AdminLayoutShell
        headerTitle="Admission Management"
        sidebar={<Sidebar />}
      >
        {children}
      </AdminLayoutShell>
    </AdminAuthProvider>
  );
}

