import { AdminAuthProvider } from "@/components/admin/AdminAuthProvider";
import Header from "@/components/admin/admission/Header";
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
        <div className="min-h-screen bg-[#F8FAFC]">
          <FinanceSidebar />
          <Header title="Finance Management" />
          <main className="ml-[220px] pt-16 min-h-screen">
            <div className="p-6">{children}</div>
          </main>
        </div>
      </FinanceThemeProvider>
    </AdminAuthProvider>
  );
}
