"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  DollarSign,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Search,
  Eye,
  Check,
  X,
  AlertCircle,
  RefreshCw,
  FileText,
  User,
  CreditCard,
  ExternalLink,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAdminAuth } from "@/components/admin/AdminAuthProvider";

export interface DbPaymentWithStudent {
  id: string;
  student_id: string;
  application_id?: string | null;
  amount: number;
  currency: string;
  payment_method: string;
  transaction_ref?: string | null;
  payment_proof_url?: string | null;
  payment_type?: string | null;
  status: "Pending" | "Submitted" | "Under Review" | "Approved" | "Rejected" | string;
  verified_by?: string | null;
  verified_at?: string | null;
  rejection_reason?: string | null;
  created_at: string;
  student?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    phone: string | null;
  } | null;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface TabCounts {
  all: number;
  pending: number;
  approved: number;
  rejected: number;
  approvedAmount?: number;
}

export default function FinancePaymentsPage() {
  const { user } = useAdminAuth();
  const [payments, setPayments] = useState<DbPaymentWithStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [methodFilter, setMethodFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");

  // Server-Side Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize] = useState<number>(10);
  const [paginationInfo, setPaginationInfo] = useState<PaginationMeta>({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });

  // Server-Side Tab Counts State
  const [tabCounts, setTabCounts] = useState<TabCounts>({
    all: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    approvedAmount: 0,
  });

  // Review Modal State
  const [selectedPayment, setSelectedPayment] = useState<DbPaymentWithStudent | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Reject Dialog State
  const [rejectPromptOpen, setRejectPromptOpen] = useState(false);
  const [rejectionReasonInput, setRejectionReasonInput] = useState("");

  // Receipt Preview Signed URL
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [receiptLoading, setReceiptLoading] = useState(false);

  const supabase = useMemo(() => createClient(), []);

  // 350ms search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
      setCurrentPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch paginated payments from secure API endpoint
  const loadPayments = useCallback(async (showLoadingState = true) => {
    if (showLoadingState) setLoading(true);
    setFetchError(null);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const headers: Record<string, string> = {};
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      const params = new URLSearchParams();
      params.set("page", String(currentPage));
      params.set("pageSize", String(pageSize));

      if (statusFilter && statusFilter !== "all") {
        params.set("status", statusFilter);
      }
      if (methodFilter && methodFilter !== "all") {
        params.set("paymentMethod", methodFilter);
      }
      if (debouncedSearch) {
        params.set("search", debouncedSearch);
      }
      if (dateFilter && dateFilter !== "all") {
        params.set("dateRange", dateFilter);
      }

      const res = await fetch(`/api/admin/finance/payments?${params.toString()}`, {
        headers,
        credentials: "include",
      });
      const result = await res.json();

      if (!res.ok || !result.success) {
        console.error("Finance Payments API Error:", {
          message: result.error || "Failed to load payments",
          status: res.status,
        });
        setFetchError("Unable to load payment records. Please try again.");
      } else {
        setPayments((result.data as DbPaymentWithStudent[]) || []);
        if (result.pagination) {
          setPaginationInfo(result.pagination);
        }
        if (result.counts) {
          setTabCounts(result.counts);
        }
      }
    } catch (err: any) {
      console.error("Finance Payments Fetch Error:", err);
      setFetchError("Unable to load payment records. Please try again.");
    } finally {
      if (showLoadingState) setLoading(false);
    }
  }, [currentPage, pageSize, statusFilter, methodFilter, debouncedSearch, dateFilter, supabase]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  // Supabase Realtime subscription to refresh current page on database changes
  useEffect(() => {
    const channel = supabase
      .channel("finance-payments-page-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "payments" },
        () => {
          loadPayments(false);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, loadPayments]);

  // Generate signed receipt URL when opening review modal
  useEffect(() => {
    if (!selectedPayment?.id || !selectedPayment?.payment_proof_url) {
      setReceiptUrl(null);
      return;
    }

    let isMounted = true;
    async function fetchReceiptUrl() {
      if (!selectedPayment?.id || !selectedPayment?.payment_proof_url) return;
      setReceiptLoading(true);
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const headers: Record<string, string> = {};
        if (session?.access_token) {
          headers["Authorization"] = `Bearer ${session.access_token}`;
        }

        const res = await fetch(
          `/api/admin/finance/payment-receipt?paymentId=${encodeURIComponent(selectedPayment.id)}`,
          { headers, credentials: "include" }
        );
        const data = await res.json();
        if (isMounted) {
          if (res.ok && data.success && data.url) {
            setReceiptUrl(data.url);
          } else {
            setReceiptUrl(null);
          }
        }
      } catch {
        if (isMounted) setReceiptUrl(null);
      } finally {
        if (isMounted) setReceiptLoading(false);
      }
    }

    fetchReceiptUrl();
    return () => {
      isMounted = false;
    };
  }, [selectedPayment, supabase]);

  const handleOpenReceipt = async () => {
    if (receiptUrl) {
      window.open(receiptUrl, "_blank", "noopener,noreferrer");
      return;
    }
    if (!selectedPayment?.id || !selectedPayment?.payment_proof_url) {
      alert("Receipt file is no longer available. Please ask the student to re-upload the receipt.");
      return;
    }
    setReceiptLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const headers: Record<string, string> = {};
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      const res = await fetch(
        `/api/admin/finance/payment-receipt?paymentId=${encodeURIComponent(selectedPayment.id)}`,
        { headers, credentials: "include" }
      );
      const data = await res.json();
      if (res.ok && data.success && data.url) {
        setReceiptUrl(data.url);
        window.open(data.url, "_blank", "noopener,noreferrer");
      } else {
        alert(
          data.error ||
            "Receipt file is no longer available. Please ask the student to re-upload the receipt."
        );
      }
    } catch {
      alert("Receipt file is no longer available. Please ask the student to re-upload the receipt.");
    } finally {
      setReceiptLoading(false);
    }
  };

  // Filter Handler with Page Reset
  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const handleMethodFilterChange = (method: string) => {
    setMethodFilter(method);
    setCurrentPage(1);
  };

  const handleDateFilterChange = (date: string) => {
    setDateFilter(date);
    setCurrentPage(1);
  };

  // Open Review Modal
  const handleOpenReview = (payment: DbPaymentWithStudent) => {
    setSelectedPayment(payment);
    setActionFeedback(null);
    setRejectPromptOpen(false);
    setRejectionReasonInput("");
    setReviewModalOpen(true);
  };

  // Close Review Modal
  const handleCloseReview = () => {
    setReviewModalOpen(false);
    setSelectedPayment(null);
    setActionFeedback(null);
    setRejectPromptOpen(false);
    setRejectionReasonInput("");
  };

  // Perform Approval or Rejection Action via Secure Server API
  const handleExecutePaymentAction = async (
    action: "approve" | "reject",
    rejectionReason?: string
  ) => {
    if (!selectedPayment) return;
    setActionLoading(true);
    setActionFeedback(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      const res = await fetch("/api/admin/finance/payment-action", {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({
          paymentId: selectedPayment.id,
          action,
          rejectionReason: rejectionReason || undefined,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to process payment verification.");
      }

      setActionFeedback({
        type: "success",
        text:
          action === "approve"
            ? "Payment successfully approved! The student can now start university applications."
            : "Payment has been marked as Rejected.",
      });

      // Refresh payment list immediately
      await loadPayments(false);

      // Update currently viewed payment in modal
      setSelectedPayment((prev) =>
        prev
          ? {
              ...prev,
              status: action === "approve" ? "Approved" : "Rejected",
              verified_by: user?.id || null,
              verified_at: new Date().toISOString(),
              rejection_reason: action === "reject" ? rejectionReason || null : null,
            }
          : null
      );

      setRejectPromptOpen(false);
      setRejectionReasonInput("");
    } catch (err: any) {
      console.error("Action error:", err);
      setActionFeedback({
        type: "error",
        text: err.message || "An error occurred while updating payment.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Calculate Result Window
  const total = paginationInfo.total;
  const startItem = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = total === 0 ? 0 : Math.min(currentPage * pageSize, total);

  // Available payment methods for dropdown
  const commonMethods = ["Mobile Money", "Bank Transfer", "Cash"];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-700/50">
        <div>
          <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-semibold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Payments &amp; Fee Management</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Payments Verification Queue
          </h1>
          <p className="text-slate-300 text-sm mt-1">
            Review, verify, and approve student file opening and university tuition fees.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadPayments(true)}
          disabled={loading}
          className="self-start md:self-auto inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-all cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Metrics Row (5 KPIs - Database Derived) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Payments */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Payments</p>
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-800 mt-2">{tabCounts.all}</p>
          <p className="text-xs text-slate-400 mt-1">All payment submissions</p>
        </div>

        {/* Pending Review */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Review</p>
            <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-600 mt-2">{tabCounts.pending}</p>
          <p className="text-xs text-slate-400 mt-1">Awaiting verification</p>
        </div>

        {/* Approved Payments */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Approved</p>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-600 mt-2">{tabCounts.approved}</p>
          <p className="text-xs text-slate-400 mt-1">Verified &amp; cleared</p>
        </div>

        {/* Rejected Payments */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Rejected</p>
            <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center text-red-600">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-red-600 mt-2">{tabCounts.rejected}</p>
          <p className="text-xs text-slate-400 mt-1">Declined payments</p>
        </div>

        {/* Total Amount Received */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Amount Received</p>
            <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 font-bold text-xs">
              TZS
            </div>
          </div>
          <p className="text-xl font-black text-purple-700 mt-2 truncate">
            TSh {Number(tabCounts.approvedAmount || 0).toLocaleString()}
          </p>
          <p className="text-xs text-slate-400 mt-1">Approved revenue</p>
        </div>
      </div>

      {/* Payment Verification Queue Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Header with Title & Filter Controls */}
        <div className="p-5 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-800">Payment Verification Queue</h2>
            <p className="text-xs text-slate-400">
              Review and authorize student application file-opening fee payments
            </p>
          </div>

          {/* Compact Filter Toolbar */}
          <div className="flex items-center flex-wrap gap-2.5">
            {/* Search Input */}
            <div className="relative min-w-[200px] flex-1 sm:flex-initial">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search name, ref, email..."
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
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => handleStatusFilterChange(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="all">All Statuses ({tabCounts.all})</option>
                <option value="pending">Pending Review ({tabCounts.pending})</option>
                <option value="approved">Approved ({tabCounts.approved})</option>
                <option value="rejected">Rejected ({tabCounts.rejected})</option>
              </select>
            </div>

            {/* Method Filter */}
            <div className="relative">
              <select
                value={methodFilter}
                onChange={(e) => handleMethodFilterChange(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="all">All Methods</option>
                {commonMethods.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Filter */}
            <div className="relative">
              <select
                value={dateFilter}
                onChange={(e) => handleDateFilterChange(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="all">All Dates</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {fetchError && (
          <div className="m-5 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{fetchError}</span>
            </div>
            <button
              type="button"
              onClick={() => loadPayments(true)}
              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer"
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
                <th className="py-3.5 px-4">Type / Purpose</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4">Method / Ref</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading payments from database...
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <p className="font-semibold text-slate-500 text-sm">
                      No payment records found in database.
                    </p>
                    {debouncedSearch || statusFilter !== "all" || methodFilter !== "all" || dateFilter !== "all" ? (
                      <p className="text-xs text-slate-400 mt-1">
                        Try resetting your search query or filters.
                      </p>
                    ) : null}
                  </td>
                </tr>
              ) : (
                payments.map((p) => {
                  const studentName = p.student
                    ? [p.student.first_name, p.student.last_name].filter(Boolean).join(" ") ||
                      p.student.email ||
                      "Student"
                    : "Student";

                  const s = (p.status || "").toLowerCase();
                  const isApproved = s === "approved" || s === "verified" || s === "completed";
                  const isPending = s === "pending" || s === "submitted" || s === "under review";

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-800">{studentName}</p>
                        <p className="text-[11px] text-slate-400 truncate max-w-[180px]">
                          {p.student?.email || p.student_id}
                        </p>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700">
                        {p.payment_type || "MtishbiScholar File Opening Fee"}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {p.currency || "TSh"} {Number(p.amount || 50000).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <p className="font-semibold">{p.payment_method || "Bank Transfer"}</p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          {p.transaction_ref || "No ref"}
                        </p>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                            isApproved
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              : isPending
                              ? "bg-amber-100 text-amber-800 border border-amber-200"
                              : "bg-red-100 text-red-800 border border-red-200"
                          }`}
                        >
                          {p.status || "Pending"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                        {p.created_at ? new Date(p.created_at).toLocaleDateString() : "N/A"}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenReview(p)}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 font-bold text-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer border border-slate-200 hover:border-emerald-300"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Review</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Server-Side Pagination Footer */}
        <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Showing <span className="font-bold text-slate-800">{startItem}</span> to{" "}
            <span className="font-bold text-slate-800">{endItem}</span> of{" "}
            <span className="font-bold text-slate-800">{total}</span> results
          </div>

          <div className="flex items-center gap-1.5 self-center sm:self-auto">
            {/* Previous Button */}
            <button
              type="button"
              disabled={!paginationInfo.hasPrevPage || loading}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-bold text-xs text-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>

            {/* Page Number Pills */}
            {Array.from({ length: paginationInfo.totalPages }, (_, i) => i + 1)
              .slice(Math.max(0, currentPage - 3), Math.min(paginationInfo.totalPages, currentPage + 2))
              .map((pageNum) => (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-8 h-8 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                    currentPage === pageNum
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {pageNum}
                </button>
              ))}

            {/* Next Button */}
            <button
              type="button"
              disabled={!paginationInfo.hasNextPage || loading}
              onClick={() => setCurrentPage((p) => Math.min(paginationInfo.totalPages, p + 1))}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-bold text-xs text-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ── PAYMENT REVIEW MODAL ── */}
      {reviewModalOpen && selectedPayment && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Payment Review &amp; Authorization
                  </h3>
                  <p className="text-xs text-slate-400">
                    Record ID: <span className="font-mono text-slate-600">{selectedPayment.id.slice(0, 8)}...</span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCloseReview}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              {/* Feedback Banner */}
              {actionFeedback && (
                <div
                  className={`p-3.5 rounded-2xl flex items-center gap-2 font-bold ${
                    actionFeedback.type === "success"
                      ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                      : "bg-red-50 border border-red-200 text-red-700"
                  }`}
                >
                  {actionFeedback.type === "success" ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{actionFeedback.text}</span>
                </div>
              )}

              {/* 1. Student Information Card */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-3 h-3" />
                  <span>Student Information</span>
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Full Legal Name</span>
                    <span className="font-bold text-slate-900 text-sm">
                      {selectedPayment.student
                        ? [selectedPayment.student.first_name, selectedPayment.student.last_name]
                            .filter(Boolean)
                            .join(" ") || "Not specified"
                        : "Not specified"}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px]">Registered Email</span>
                    <span className="font-bold text-slate-900 truncate block">
                      {selectedPayment.student?.email || "Not specified"}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px]">Phone Number</span>
                    <span className="font-bold text-slate-900">
                      {selectedPayment.student?.phone || "Not provided"}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px]">Student ID</span>
                    <span className="font-mono font-bold text-slate-900 text-[11px] truncate block">
                      {selectedPayment.student_id}
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. Payment Details Card */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <CreditCard className="w-3 h-3" />
                  <span>Payment Details</span>
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Purpose</span>
                    <span className="font-bold text-slate-900">
                      {selectedPayment.payment_type || "MtishbiScholar File Opening Fee"}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px]">Amount</span>
                    <span className="font-extrabold text-emerald-700 text-sm">
                      {selectedPayment.currency || "TSh"}{" "}
                      {Number(selectedPayment.amount || 50000).toLocaleString()}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px]">Payment Method</span>
                    <span className="font-bold text-slate-900">
                      {selectedPayment.payment_method || "Bank Transfer"}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px]">Transaction Reference</span>
                    <span className="font-mono font-bold text-slate-900">
                      {selectedPayment.transaction_ref || "No reference provided"}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px]">Submission Date</span>
                    <span className="font-bold text-slate-900">
                      {selectedPayment.created_at
                        ? new Date(selectedPayment.created_at).toLocaleString()
                        : "N/A"}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px]">Current Status</span>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold mt-0.5 ${
                        (selectedPayment.status || "").toLowerCase() === "approved"
                          ? "bg-emerald-100 text-emerald-800"
                          : (selectedPayment.status || "").toLowerCase() === "rejected"
                          ? "bg-red-100 text-red-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {selectedPayment.status}
                    </span>
                  </div>
                </div>

                {selectedPayment.rejection_reason && (
                  <div className="pt-2 border-t border-slate-200/80">
                    <span className="text-red-600 block text-[11px] font-bold">Rejection Reason:</span>
                    <p className="text-slate-700 font-medium mt-0.5">{selectedPayment.rejection_reason}</p>
                  </div>
                )}

                {selectedPayment.verified_at && (
                  <div className="pt-2 border-t border-slate-200/80 text-[11px] text-slate-500">
                    Verified on: {new Date(selectedPayment.verified_at).toLocaleString()}
                  </div>
                )}
              </div>

              {/* 3. Receipt / Document Preview */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2.5">
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3 h-3" />
                  <span>Payment Proof / Receipt Document</span>
                </p>

                {selectedPayment?.payment_proof_url ? (
                  <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-xs">Payment Receipt File</p>
                        <p className="text-[10px] text-slate-400">Authenticated student submission</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleOpenReceipt}
                      disabled={receiptLoading}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      {receiptLoading ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Opening...</span>
                        </>
                      ) : (
                        <>
                          <span>View Receipt</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <p className="text-slate-400 italic text-[11px]">
                    No receipt file uploaded with this payment record.
                  </p>
                )}
              </div>

              {/* 4. Reject Prompt Area */}
              {rejectPromptOpen && (
                <div className="p-4 rounded-2xl bg-red-50/80 border border-red-200 space-y-3">
                  <p className="text-xs font-bold text-red-800 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <span>Provide Rejection Reason</span>
                  </p>
                  <p className="text-[11px] text-red-700 leading-relaxed">
                    This reason will be visible to the student and recorded in the audit trail.
                  </p>

                  <textarea
                    rows={3}
                    placeholder="e.g. Transaction reference does not match bank records, unreadable receipt file..."
                    value={rejectionReasonInput}
                    onChange={(e) => setRejectionReasonInput(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-white border border-red-200 text-xs text-slate-800 outline-none focus:border-red-500"
                  />

                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setRejectPromptOpen(false);
                        setRejectionReasonInput("");
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={actionLoading || !rejectionReasonInput.trim()}
                      onClick={() => handleExecutePaymentAction("reject", rejectionReasonInput)}
                      className="px-4 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {actionLoading ? "Rejecting..." : "Confirm Rejection"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleCloseReview}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-colors cursor-pointer"
              >
                Close
              </button>

              <div className="flex items-center gap-2">
                {/* Reject Button */}
                {!rejectPromptOpen && (
                  <button
                    type="button"
                    disabled={actionLoading || (selectedPayment.status || "").toLowerCase() === "rejected"}
                    onClick={() => setRejectPromptOpen(true)}
                    className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-extrabold text-xs rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Reject Payment
                  </button>
                )}

                {/* Approve Button */}
                {!rejectPromptOpen && (
                  <button
                    type="button"
                    disabled={actionLoading || (selectedPayment.status || "").toLowerCase() === "approved"}
                    onClick={() => handleExecutePaymentAction("approve")}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>{actionLoading ? "Processing..." : "Approve Payment"}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
