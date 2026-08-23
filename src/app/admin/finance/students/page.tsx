"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Users,
  Search,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Eye,
  X,
  User,
  RefreshCw,
  Mail,
  Phone,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export interface StudentProfileFinancial {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  created_at: string;
  payments: Array<{
    id: string;
    amount: number;
    currency: string;
    payment_method: string;
    transaction_ref?: string | null;
    status: string;
    created_at: string;
  }>;
}

export default function FinanceStudentsPage() {
  const [students, setStudents] = useState<StudentProfileFinancial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Selected Student Modal State
  const [selectedStudent, setSelectedStudent] = useState<StudentProfileFinancial | null>(null);

  const supabase = useMemo(() => createClient(), []);

  const loadStudents = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);

    try {
      // Fetch student profiles and payments in parallel
      const [profilesRes, paymentsFetchRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, first_name, last_name, email, phone, created_at")
          .eq("role", "student")
          .order("created_at", { ascending: false }),
        fetch("/api/admin/finance/payments")
          .then((r) => r.json())
          .catch((err) => ({ success: false, error: err.message })),
      ]);

      if (profilesRes.error) {
        console.error("Finance Students Profiles Supabase Error:", {
          message: profilesRes.error.message,
          details: profilesRes.error.details,
          hint: profilesRes.error.hint,
          code: profilesRes.error.code,
        });
        throw profilesRes.error;
      }

      const profilesData = profilesRes.data || [];
      const paymentsData = (paymentsFetchRes.success ? paymentsFetchRes.data : []) || [];

      // Map payments to their respective students
      const paymentsByStudent = new Map<string, any[]>();
      paymentsData.forEach((p: any) => {
        const list = paymentsByStudent.get(p.student_id) || [];
        list.push(p);
        paymentsByStudent.set(p.student_id, list);
      });

      const merged: StudentProfileFinancial[] = profilesData.map((prof) => ({
        ...prof,
        payments: paymentsByStudent.get(prof.id) || [],
      }));

      setStudents(merged);
    } catch (err: any) {
      console.error("Finance Students Error:", {
        message: err?.message || "Unknown error",
        details: err?.details || null,
        hint: err?.hint || null,
        code: err?.code || null,
      });
      setError("Unable to load student financial records.");
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadStudents(true);
  }, [loadStudents]);

  // Filtered Students List
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const fullName = [s.first_name, s.last_name].filter(Boolean).join(" ");
      const email = s.email || "";
      const id = s.id || "";

      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          fullName.toLowerCase().includes(q) ||
          email.toLowerCase().includes(q) ||
          id.toLowerCase().includes(q);
        if (!matches) return false;
      }

      // 2. Status Filter
      const hasApproved = s.payments.some((p) => (p.status || "").toLowerCase() === "approved");
      const hasPending = s.payments.some((p) => {
        const st = (p.status || "").toLowerCase();
        return st === "pending" || st === "submitted" || st === "under review";
      });
      const isUnpaid = s.payments.length === 0;

      if (statusFilter === "approved" && !hasApproved) return false;
      if (statusFilter === "pending" && !hasPending) return false;
      if (statusFilter === "unpaid" && !isUnpaid) return false;

      return true;
    });
  }, [students, searchQuery, statusFilter]);

  // Financial Counters
  const totalStudentsCount = students.length;
  const paidStudentsCount = useMemo(
    () =>
      students.filter((s) =>
        s.payments.some((p) => (p.status || "").toLowerCase() === "approved")
      ).length,
    [students]
  );
  const pendingStudentsCount = useMemo(
    () =>
      students.filter((s) =>
        s.payments.some((p) => {
          const st = (p.status || "").toLowerCase();
          return st === "pending" || st === "submitted" || st === "under review";
        })
      ).length,
    [students]
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-700/50">
        <div>
          <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-semibold mb-2">
            <Users className="w-3.5 h-3.5" />
            <span>Student Financial Profiles</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Student Payment Records
          </h1>
          <p className="text-slate-300 text-sm mt-1">
            Financial status, payment history, and collection metrics per student.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadStudents(true)}
          disabled={loading}
          className="self-start md:self-auto inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-all cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh List</span>
        </button>
      </div>

      {/* Mini KPI summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Students</p>
          <p className="text-2xl font-black text-slate-800 mt-1">{totalStudentsCount}</p>
          <p className="text-xs text-slate-400 mt-1">Registered student accounts</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Paid &amp; Approved</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">{paidStudentsCount}</p>
          <p className="text-xs text-slate-400 mt-1">Cleared for university applications</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Verification</p>
          <p className="text-2xl font-black text-amber-600 mt-1">{pendingStudentsCount}</p>
          <p className="text-xs text-slate-400 mt-1">Awaiting finance officer action</p>
        </div>
      </div>

      {/* Main Students Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Header & Filter Controls */}
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-800">Students Directory</h2>
            <p className="text-xs text-slate-400">Financial overview and transaction history per student</p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Search */}
            <div className="relative min-w-[220px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search name, email, ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 placeholder-slate-400 outline-none focus:border-emerald-500 focus:bg-white transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="all">All Payment Statuses</option>
              <option value="approved">Paid &amp; Approved</option>
              <option value="pending">Pending Verification</option>
              <option value="unpaid">Unpaid (No Records)</option>
            </select>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="m-5 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center justify-between">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => loadStudents(true)}
              className="px-3 py-1 bg-red-600 text-white font-bold rounded-lg text-xs hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Student</th>
                <th className="py-3.5 px-4">Contact Info</th>
                <th className="py-3.5 px-4">Payment Status</th>
                <th className="py-3.5 px-4">Total Paid</th>
                <th className="py-3.5 px-4">Latest Payment</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading student records...
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <p className="font-semibold text-slate-500 text-sm">No student records found.</p>
                    <p className="text-xs text-slate-400 mt-1">Try adjusting your search or filters.</p>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s) => {
                  const fullName = [s.first_name, s.last_name].filter(Boolean).join(" ") || "Student";
                  const initials = (s.first_name?.[0] || "") + (s.last_name?.[0] || "") || "ST";

                  const approvedPayments = s.payments.filter(
                    (p) => (p.status || "").toLowerCase() === "approved"
                  );
                  const totalPaid = approvedPayments.reduce(
                    (acc, p) => acc + (Number(p.amount) || 0),
                    0
                  );

                  const hasApproved = approvedPayments.length > 0;
                  const hasPending = s.payments.some((p) => {
                    const st = (p.status || "").toLowerCase();
                    return st === "pending" || st === "submitted" || st === "under review";
                  });
                  const hasRejected = s.payments.some(
                    (p) => (p.status || "").toLowerCase() === "rejected"
                  );

                  const latestPayment = s.payments[0];

                  return (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center border border-slate-200">
                            {initials.toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800">{fullName}</p>
                            <p className="text-[10px] text-slate-400 font-mono">ID: {s.id.slice(0, 8)}...</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="font-medium text-slate-700">{s.email || "No email"}</p>
                        <p className="text-[11px] text-slate-400">{s.phone || "No phone"}</p>
                      </td>

                      <td className="py-3.5 px-4">
                        {hasApproved ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Approved</span>
                          </span>
                        ) : hasPending ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800">
                            <Clock className="w-3 h-3" />
                            <span>Pending Review</span>
                          </span>
                        ) : hasRejected ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-red-100 text-red-800">
                            <ShieldAlert className="w-3 h-3" />
                            <span>Rejected</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-600">
                            <span>Unpaid</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {totalPaid > 0 ? `TSh ${totalPaid.toLocaleString()}` : "TSh 0"}
                      </td>

                      <td className="py-3.5 px-4 text-slate-600">
                        {latestPayment ? (
                          <div>
                            <p className="font-semibold text-slate-800">
                              {latestPayment.currency || "TSh"} {Number(latestPayment.amount || 50000).toLocaleString()}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {new Date(latestPayment.created_at).toLocaleDateString()} • {latestPayment.payment_method}
                            </p>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">No payments</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedStudent(s)}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 font-bold text-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer border border-slate-200 hover:border-emerald-300"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Financial Record</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── STUDENT FINANCIAL DETAIL MODAL ── */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    {[selectedStudent.first_name, selectedStudent.last_name].filter(Boolean).join(" ") || "Student"}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Student UUID: <span className="font-mono text-slate-600">{selectedStudent.id}</span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs">
              {/* 1. Student Contact Info */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  Contact Information
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 text-slate-700">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-semibold">{selectedStudent.email || "No email"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-semibold">{selectedStudent.phone || "No phone"}</span>
                  </div>
                </div>
              </div>

              {/* 2. Financial Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 bg-emerald-50 border border-emerald-100 rounded-xl">
                  <p className="text-[10px] font-bold text-emerald-800 uppercase">Total Paid</p>
                  <p className="text-base font-black text-emerald-700 mt-1">
                    TSh{" "}
                    {selectedStudent.payments
                      .filter((p) => (p.status || "").toLowerCase() === "approved")
                      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
                      .toLocaleString()}
                  </p>
                </div>

                <div className="p-3.5 bg-blue-50 border border-blue-100 rounded-xl">
                  <p className="text-[10px] font-bold text-blue-800 uppercase">Approved</p>
                  <p className="text-base font-black text-blue-700 mt-1">
                    {selectedStudent.payments.filter((p) => (p.status || "").toLowerCase() === "approved").length}
                  </p>
                </div>

                <div className="p-3.5 bg-amber-50 border border-amber-100 rounded-xl">
                  <p className="text-[10px] font-bold text-amber-800 uppercase">Pending</p>
                  <p className="text-base font-black text-amber-700 mt-1">
                    {
                      selectedStudent.payments.filter((p) => {
                        const st = (p.status || "").toLowerCase();
                        return st === "pending" || st === "submitted" || st === "under review";
                      }).length
                    }
                  </p>
                </div>

                <div className="p-3.5 bg-red-50 border border-red-100 rounded-xl">
                  <p className="text-[10px] font-bold text-red-800 uppercase">Rejected</p>
                  <p className="text-base font-black text-red-700 mt-1">
                    {selectedStudent.payments.filter((p) => (p.status || "").toLowerCase() === "rejected").length}
                  </p>
                </div>
              </div>

              {/* 3. Transaction History */}
              <div className="space-y-3">
                <p className="text-xs font-bold text-slate-800">Payment Transaction History</p>

                {selectedStudent.payments.length === 0 ? (
                  <p className="text-slate-400 italic text-center py-6">
                    No payment transactions recorded for this student.
                  </p>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase text-[10px]">
                        <tr>
                          <th className="py-2.5 px-3">Date</th>
                          <th className="py-2.5 px-3">Amount</th>
                          <th className="py-2.5 px-3">Method</th>
                          <th className="py-2.5 px-3">Ref</th>
                          <th className="py-2.5 px-3 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedStudent.payments.map((p) => {
                          const s = (p.status || "").toLowerCase();
                          const isApproved = s === "approved";
                          const isRejected = s === "rejected";

                          return (
                            <tr key={p.id} className="hover:bg-slate-50/60">
                              <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                                {new Date(p.created_at).toLocaleDateString()}
                              </td>
                              <td className="py-2.5 px-3 font-bold text-slate-900">
                                {p.currency || "TSh"} {Number(p.amount || 50000).toLocaleString()}
                              </td>
                              <td className="py-2.5 px-3 text-slate-600">{p.payment_method}</td>
                              <td className="py-2.5 px-3 font-mono text-[10px] text-slate-400">
                                {p.transaction_ref || "N/A"}
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                <span
                                  className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-extrabold ${
                                    isApproved
                                      ? "bg-emerald-100 text-emerald-800"
                                      : isRejected
                                      ? "bg-red-100 text-red-800"
                                      : "bg-amber-100 text-amber-800"
                                  }`}
                                >
                                  {p.status}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
