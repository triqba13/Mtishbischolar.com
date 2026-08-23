"use client";

import Link from "next/link";
import { Home, Search, UserPlus, Eye, ChevronRight } from "lucide-react";

const STUDENTS = [
  { name: "Tariq Hamza Ahmad", email: "tariq@email.com", phone: "+255 712 345 678", applications: 3, joined: "10 Aug 2026" },
  { name: "Amina Ali", email: "amina@email.com", phone: "+255 754 123 456", applications: 1, joined: "12 Aug 2026" },
  { name: "John Mwita", email: "john@email.com", phone: "+255 765 987 654", applications: 2, joined: "15 Aug 2026" },
  { name: "Neema Said", email: "neema@email.com", phone: "+255 712 555 888", applications: 1, joined: "18 Aug 2026" },
  { name: "David Mushi", email: "david@email.com", phone: "+255 754 321 987", applications: 1, joined: "20 Aug 2026" },
  { name: "Fatma Salum", email: "fatma@email.com", phone: "+255 765 444 333", applications: 2, joined: "21 Aug 2026" },
  { name: "Daniel Kayombo", email: "daniel@email.com", phone: "+255 712 777 666", applications: 1, joined: "22 Aug 2026" },
  { name: "Peter John", email: "peter@email.com", phone: "+255 754 888 999", applications: 1, joined: "23 Aug 2026" },
];

export default function StudentsPage() {
  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2">
          <Home className="w-3.5 h-3.5" />
          <ChevronRight className="w-3 h-3" />
          <Link href="/admin/admission/dashboard" className="hover:text-blue-600">Dashboard</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-600 font-medium">Students</span>
        </div>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">Students</h1>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 shadow-md shadow-blue-600/20 transition-all cursor-pointer">
            <UserPlus className="w-4 h-4" />
            Add Student
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200">
        <div className="px-5 py-4 border-b border-slate-100">
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search students..." className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
          </div>
        </div>

        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100">
              {["Name", "Email", "Phone", "Applications", "Joined", "Action"].map((h) => (
                <th key={h} className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide px-5 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {STUDENTS.map((s, i) => (
              <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50 last:border-0">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                      {s.name.charAt(0)}
                    </div>
                    <span className="text-sm font-medium text-slate-800">{s.name}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-sm text-slate-600">{s.email}</td>
                <td className="px-5 py-3.5 text-sm text-slate-600">{s.phone}</td>
                <td className="px-5 py-3.5">
                  <span className="text-xs font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{s.applications} apps</span>
                </td>
                <td className="px-5 py-3.5 text-xs text-slate-500">{s.joined}</td>
                <td className="px-5 py-3.5">
                  <button className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 transition-all cursor-pointer">
                    <Eye className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-5 py-3 border-t border-slate-100">
          <p className="text-xs text-slate-500">Showing 1 to {STUDENTS.length} of {STUDENTS.length} students</p>
        </div>
      </div>
    </div>
  );
}
