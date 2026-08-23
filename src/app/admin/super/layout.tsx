import { AdminAuthProvider } from '@/components/admin/AdminAuthProvider';
import Link from 'next/link';
import { ShieldAlert, GraduationCap, Users, DollarSign, FileText } from 'lucide-react';
import Header from '@/components/admin/admission/Header';

export default function SuperLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminAuthProvider>
      <div className="min-h-screen bg-[#F8FAFC]">
        {/* Super Admin Sidebar */}
        <aside className="fixed top-0 left-0 h-screen w-[220px] bg-[#0B132B] flex flex-col z-50 border-r border-slate-800">
          <div className="flex items-center gap-2.5 px-5 py-5 border-b border-slate-800">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shrink-0 shadow-md shadow-indigo-600/30">
              <ShieldAlert className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <p className="text-white font-extrabold text-sm leading-none">
                Mtishbi<span className="text-indigo-400">Scholar</span>
              </p>
              <p className="text-slate-400 text-[10px] font-semibold mt-1 tracking-wider uppercase">Super Admin</p>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
            <Link
              href="/admin/super/dashboard"
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 shadow-md shadow-indigo-600/30"
            >
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>Overview</span>
            </Link>
            <Link
              href="/admin/admission/dashboard"
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:text-white hover:bg-slate-800/50"
            >
              <FileText className="w-4 h-4 shrink-0" />
              <span>Admission Panel</span>
            </Link>
            <Link
              href="/admin/finance/dashboard"
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:text-white hover:bg-slate-800/50"
            >
              <DollarSign className="w-4 h-4 shrink-0" />
              <span>Finance Panel</span>
            </Link>
          </nav>
        </aside>

        <Header title="Super Admin Control" />
        <main className="ml-[220px] pt-16 min-h-screen">
          <div className="p-6">{children}</div>
        </main>
      </div>
    </AdminAuthProvider>
  );
}
