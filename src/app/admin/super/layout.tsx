import { AdminAuthProvider } from "@/components/admin/AdminAuthProvider";
import AdminLayoutShell from "@/components/admin/AdminLayoutShell";
import SuperSidebar from "@/components/admin/super/SuperSidebar";

export default function SuperLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminAuthProvider>
      <AdminLayoutShell
        headerTitle="Super Admin Control"
        sidebar={<SuperSidebar />}
      >
        {children}
      </AdminLayoutShell>
    </AdminAuthProvider>
  );
}
