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
      <div className="min-h-screen bg-[#F8FAFC]">
        <Sidebar />
        <Header />
        <main className="ml-[220px] pt-16 min-h-screen">
          <div className="p-6">{children}</div>
        </main>
      </div>
    </AdminAuthProvider>
  );
}

