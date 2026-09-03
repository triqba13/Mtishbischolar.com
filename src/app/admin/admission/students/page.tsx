"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { Home, Search, UserPlus, Eye, ChevronRight, RefreshCw, AlertTriangle } from "lucide-react";
import { useAdminAuth } from "@/components/admin/AdminAuthProvider";
import { createClient } from "@/lib/supabase/client";

export interface StudentListItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatarUrl?: string | null;
  applications: number;
  joined: string;
  initial: string;
}

function StudentAvatar({
  name,
  avatarUrl,
  initial,
}: {
  name: string;
  avatarUrl?: string | null;
  initial: string;
}) {
  const [imgError, setImgError] = useState(false);

  if (avatarUrl && !imgError) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        onError={() => setImgError(true)}
        className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700 shadow-2xs shrink-0"
      />
    );
  }

  return (
    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-xs shrink-0">
      {initial}
    </div>
  );
}

export default function StudentsPage() {
  const { loading: authLoading } = useAdminAuth();
  const [students, setStudents] = useState<StudentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const loadStudents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      const res = await fetch("/api/admin/admission/students", {
        headers,
        credentials: "include",
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to load students.");
      }

      setStudents(json.students || []);
    } catch (err: any) {
      console.error("[StudentsPage] Error fetching students:", err);
      setError(err.message || "Failed to load students.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) {
      loadStudents();
    }
  }, [authLoading, loadStudents]);

  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;
    const q = searchQuery.toLowerCase().trim();
    return students.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.phone.toLowerCase().includes(q)
    );
  }, [students, searchQuery]);

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2">
          <Home className="w-3.5 h-3.5" />
          <ChevronRight className="w-3 h-3" />
          <Link href="/admin/admission/dashboard" className="hover:text-blue-600">
            Dashboard
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-600 font-medium">Students</span>
        </div>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">Students</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={loadStudents}
              disabled={loading}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 shadow-sm transition-all cursor-pointer disabled:opacity-60"
              title="Refresh students"
            >
              <RefreshCw className={`w-4 h-4 text-slate-400 ${loading ? "animate-spin" : ""}`} />
              <span className="text-xs font-semibold">Refresh</span>
            </button>
            <Link
              href="/admin/admission/applications"
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 shadow-md shadow-blue-600/20 transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              Add Student
            </Link>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
          <button
            onClick={loadStudents}
            className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200">
        <div className="px-5 py-4 border-b border-slate-100">
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>
        </div>

        {/* ── Mobile Student Cards (Shown on screens < md) ── */}
        <div className="block md:hidden divide-y divide-slate-100">
          {loading ? (
            <div className="px-5 py-10 text-center text-sm text-slate-400">
              <div className="flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                <span>Loading student records...</span>
              </div>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-slate-400">
              {searchQuery ? "No students matching your search." : "No registered students found in the database."}
            </div>
          ) : (
            filteredStudents.map((s) => (
              <div key={`mobile-${s.id}`} className="p-4 space-y-3 hover:bg-slate-50/50 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <StudentAvatar name={s.name} avatarUrl={s.avatarUrl} initial={s.initial} />
                    <div className="min-w-0">
                      <Link
                        href={`/admin/admission/applications?search=${encodeURIComponent(s.email)}`}
                        className="text-sm font-bold text-slate-900 hover:text-blue-600 block truncate transition-colors"
                      >
                        {s.name}
                      </Link>
                      <p className="text-[11px] text-slate-500 truncate">{s.email}</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full shrink-0 border border-blue-200/50">
                    {s.applications} {s.applications === 1 ? "app" : "apps"}
                  </span>
                </div>

                <div className="bg-slate-50/80 rounded-xl p-2.5 space-y-1 text-xs text-slate-600 border border-slate-100">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-400 font-medium">Phone:</span>
                    <span className="font-semibold text-slate-800">{s.phone || "—"}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/50 text-[11px]">
                    <span className="text-slate-400">Joined Date:</span>
                    <span className="text-slate-500">{s.joined}</span>
                  </div>
                </div>

                <Link
                  href={`/admin/admission/applications?search=${encodeURIComponent(s.email)}`}
                  className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200/70 hover:border-transparent font-bold text-xs shadow-xs transition-all cursor-pointer"
                >
                  <Eye className="w-4 h-4" />
                  <span>View Student Applications</span>
                </Link>
              </div>
            ))
          )}
        </div>

        {/* ── Desktop Table (Shown on screens >= md) ── */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                {["Name", "Email", "Phone", "Applications", "Joined", "Action"].map((h) => (
                  <th
                    key={h}
                    className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide px-5 py-3"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-sm text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                      Loading student records...
                    </div>
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-sm text-slate-400">
                    {searchQuery ? "No students matching your search." : "No registered students found in the database."}
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s) => (
                  <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50/50 last:border-0 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <StudentAvatar name={s.name} avatarUrl={s.avatarUrl} initial={s.initial} />
                        <Link
                          href={`/admin/admission/applications?search=${encodeURIComponent(s.email)}`}
                          className="text-sm font-medium text-slate-800 hover:text-blue-600 transition-colors"
                        >
                          {s.name}
                        </Link>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-600">{s.email}</td>
                    <td className="px-5 py-3.5 text-sm text-slate-600">{s.phone}</td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                        {s.applications} {s.applications === 1 ? "app" : "apps"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-500">{s.joined}</td>
                    <td className="px-5 py-3.5">
                      <Link
                        href={`/admin/admission/applications?search=${encodeURIComponent(s.email)}`}
                        className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 transition-all cursor-pointer"
                        title="View student applications"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-3 border-t border-slate-100">
          <p className="text-xs text-slate-500">
            Showing {filteredStudents.length > 0 ? 1 : 0} to {filteredStudents.length} of {filteredStudents.length} students
          </p>
        </div>
      </div>
    </div>
  );
}
