"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Bell,
  CheckCircle2,
  Clock,
  CheckCheck,
  Search,
  Filter,
  DollarSign,
  AlertCircle,
  RefreshCw,
  X,
  Mail,
  MailOpen,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAdminAuth } from "@/components/admin/AdminAuthProvider";

export interface DbNotificationItem {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export default function FinanceNotificationsPage() {
  const { user } = useAdminAuth();
  const [notifications, setNotifications] = useState<DbNotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<"all" | "unread">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const supabase = useMemo(() => createClient(), []);

  const loadNotifications = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      // Fetch notifications
      const { data, error: notifError } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false });

      if (notifError) throw notifError;
      setNotifications((data as DbNotificationItem[]) || []);
    } catch (err: any) {
      console.error("Finance Notifications Error:", {
        message: err?.message || "Unknown error",
        details: err?.details || null,
        hint: err?.hint || null,
        code: err?.code || null,
      });
      setError("Unable to load notifications.");
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();

    const channel = supabase
      .channel("finance-notifications-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications" },
        () => {
          loadNotifications(false);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  // Mark single notification as read
  const handleMarkAsRead = async (id: string) => {
    try {
      const { error: patchError } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", id);

      if (patchError) throw patchError;

      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (err: any) {
      console.error("Error marking notification read:", err);
    }
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
    if (unreadIds.length === 0) return;

    try {
      const { error: patchError } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .in("id", unreadIds);

      if (patchError) throw patchError;

      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err: any) {
      console.error("Error marking all read:", err);
    }
  };

  // Filtered Notifications
  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      if (filterMode === "unread" && n.is_read) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          n.title.toLowerCase().includes(q) ||
          n.message.toLowerCase().includes(q) ||
          n.type.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [notifications, filterMode, searchQuery]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-700/50">
        <div>
          <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-semibold mb-2">
            <Bell className="w-3.5 h-3.5" />
            <span>Finance Alerts &amp; Activity</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Notifications Center
          </h1>
          <p className="text-slate-300 text-sm mt-1">
            System notices, payment submissions, and verification alerts.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => loadNotifications(true)}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllAsRead}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/30 transition-all cursor-pointer"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Mark All Read</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Notifications Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Controls */}
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-bold text-slate-800">Inbox</h2>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-extrabold">
                {unreadCount} unread
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Search */}
            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search notices..."
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

            {/* Filter */}
            <div className="flex items-center rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setFilterMode("all")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  filterMode === "all" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500"
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setFilterMode("unread")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  filterMode === "unread" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500"
                }`}
              >
                Unread
              </button>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="m-5 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center justify-between">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => loadNotifications(true)}
              className="px-3 py-1 bg-red-600 text-white font-bold rounded-lg text-xs"
            >
              Retry
            </button>
          </div>
        )}

        {/* List Content */}
        <div className="divide-y divide-slate-100">
          {loading ? (
            <div className="py-12 text-center text-slate-400">
              <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Loading notifications...
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <MailOpen className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="font-bold text-slate-600 text-sm">No notifications to display</p>
              <p className="text-xs text-slate-400">You're completely up to date.</p>
            </div>
          ) : (
            filteredNotifications.map((n) => (
              <div
                key={n.id}
                className={`p-4 sm:p-5 flex items-start justify-between gap-4 transition-colors ${
                  !n.is_read ? "bg-emerald-50/40" : "hover:bg-slate-50/60"
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      !n.is_read
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    <DollarSign className="w-4.5 h-4.5" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-extrabold text-slate-900">{n.title}</p>
                      {!n.is_read && (
                        <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{n.message}</p>
                    <p className="text-[10px] text-slate-400">
                      {new Date(n.created_at).toLocaleString()} • Type: {n.type}
                    </p>
                  </div>
                </div>

                {!n.is_read && (
                  <button
                    type="button"
                    onClick={() => handleMarkAsRead(n.id)}
                    className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 text-[11px] font-bold rounded-lg border border-slate-200 transition-colors shrink-0 cursor-pointer"
                  >
                    Mark Read
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
