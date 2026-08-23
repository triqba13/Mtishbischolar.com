import Sidebar from "@/components/admin/admission/Sidebar";
import Header from "@/components/admin/admission/Header";
import { AdminAuthProvider } from "@/components/admin/AdminAuthProvider";

export default function AdmissionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminAuthProvider>
      <div className="min-h-screen admin-root-layout bg-[#F8FAFC] transition-colors duration-200">
        <Sidebar />
        <Header />
        <main className="ml-[220px] pt-16 min-h-screen">
          <div className="p-6">{children}</div>
        </main>
      </div>
    </AdminAuthProvider>
  );
}

