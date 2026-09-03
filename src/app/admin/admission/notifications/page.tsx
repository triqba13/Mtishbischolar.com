"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Home,
  Bell,
  FileText,
  FolderOpen,
  Globe,
  Upload,
  CheckCircle2,
  ChevronRight,
  RefreshCw,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Check,
  Search,
  Filter,
  Trash2,
} from "lucide-react";
import { useAdminAuth } from "@/components/admin/AdminAuthProvider";
import { createClient } from "@/lib/supabase/client";
import { getAdmissionNotifPrefs, isNotificationAllowed } from "@/lib/notifications/prefs";

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  link?: string | null;
  created_at: string;
  recipient?: any;
}

const TYPE_ICON_MAP: Record<string, any> = {
  application: {
    icon: FileText,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-100/80 dark:bg-blue-900/40 border border-blue-200/50 dark:border-blue-700/50",
  },
  document: {
    icon: FolderOpen,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-100/80 dark:bg-amber-900/40 border border-amber-200/50 dark:border-amber-700/50",
  },
  passport: {
    icon: Globe,
    color: "text-teal-600 dark:text-teal-400",
    bg: "bg-teal-100/80 dark:bg-teal-900/40 border border-teal-200/50 dark:border-teal-700/50",
  },
  visa: {
    icon: Globe,
    color: "text-indigo-600 dark:text-indigo-400",
    bg: "bg-indigo-100/80 dark:bg-indigo-900/40 border border-indigo-200/50 dark:border-indigo-700/50",
  },
  system: {
    icon: CheckCircle2,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-100/80 dark:bg-emerald-900/40 border border-emerald-200/50 dark:border-emerald-700/50",
  },
  general: {
    icon: Bell,
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-100/80 dark:bg-purple-900/40 border border-purple-200/50 dark:border-purple-700/50",
  },
};

export default function NotificationsPage() {
  const { loading: authLoading } = useAdminAuth();
  const [activeTab, setActiveTab] = useState<"incoming" | "outgoing">("incoming");
  const [incoming, setIncoming] = useState<NotificationItem[]>([]);
  const [outgoing, setOutgoing] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [search, setSearch] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearSuccess, setClearSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadNotifications = useCallback(async () => {
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

      const res = await fetch("/api/admin/admission/notifications", {
        headers,
        credentials: "include",
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to load notifications.");
      }

      const clearedAtStr = typeof window !== "undefined" ? localStorage.getItem("admission_notifications_cleared_at") : null;
      const clearedAt = clearedAtStr ? new Date(clearedAtStr).getTime() : 0;
      const prefs = getAdmissionNotifPrefs();

      const rawIncoming: NotificationItem[] = json.incoming || [];
      const rawOutgoing: NotificationItem[] = json.outgoing || [];

      const filteredIncoming = rawIncoming
        .filter((n) => new Date(n.created_at).getTime() > clearedAt)
        .filter((n) => isNotificationAllowed(n, prefs));

      const filteredOutgoing = rawOutgoing
        .filter((n) => new Date(n.created_at).getTime() > clearedAt)
        .filter((n) => isNotificationAllowed(n, prefs));

      setIncoming(filteredIncoming);
      setOutgoing(filteredOutgoing);
      setUnreadCount(filteredIncoming.filter((n) => !n.is_read).length);
    } catch (err: any) {
      console.error("[NotificationsPage] Error:", err);
      setError(err.message || "Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) {
      loadNotifications();
    }

    const onPrefsChange = () => loadNotifications();
    window.addEventListener("mtb_notif_prefs_change", onPrefsChange);
    return () => {
      window.removeEventListener("mtb_notif_prefs_change", onPrefsChange);
    };
  }, [authLoading, loadNotifications]);

  const markAllRead = async () => {
    try {
      setIncoming((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);

      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (session?.access_token) headers["Authorization"] = `Bearer ${session.access_token}`;

      await fetch("/api/admin/admission/notifications", {
        method: "PATCH",
        headers,
        body: JSON.stringify({ markAllRead: true }),
      });
    } catch (err) {
      console.error("Mark all read error:", err);
    }
  };

  const markSingleRead = async (id: string) => {
    try {
      setIncoming((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));

      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (session?.access_token) headers["Authorization"] = `Bearer ${session.access_token}`;

      await fetch("/api/admin/admission/notifications", {
        method: "PATCH",
        headers,
        body: JSON.stringify({ notificationId: id }),
      });
    } catch (err) {
      console.error("Mark single read error:", err);
    }
  };

  const handleClearAll = async () => {
    try {
      setClearing(true);
      setError(null);
      setClearSuccess(null);

      if (typeof window !== "undefined") {
        localStorage.setItem("admission_notifications_cleared_at", new Date().toISOString());
      }

      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (session?.access_token) headers["Authorization"] = `Bearer ${session.access_token}`;

      try {
        await fetch("/api/admin/admission/notifications", {
          method: "DELETE",
          headers,
          credentials: "include",
        });
      } catch (e) {
        console.warn("Server delete:", e);
      }

      setIncoming([]);
      setOutgoing([]);
      setUnreadCount(0);
      setShowClearConfirm(false);
      setClearSuccess("All admission notifications have been cleared successfully.");
      setTimeout(() => setClearSuccess(null), 4000);
    } catch (err: any) {
      console.error("[NotificationsPage] Clear error:", err);
      setError(err.message || "Failed to clear notifications.");
    } finally {
      setClearing(false);
    }
  };

  const currentList = activeTab === "incoming" ? incoming : outgoing;

  const filteredList = useMemo(() => {
    return currentList.filter((item) => {
      const matchType = typeFilter === "all" || item.type === typeFilter;
      const matchSearch =
        !search.trim() ||
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.message.toLowerCase().includes(search.toLowerCase());

      return matchType && matchSearch;
    });
  }, [currentList, typeFilter, search]);

  const formatTime = (ts?: string) => {
    if (!ts) return "Just now";
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return new Date(ts).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2">
          <Home className="w-3.5 h-3.5" />
          <ChevronRight className="w-3 h-3" />
          <Link href="/admin/admission/dashboard" className="hover:text-blue-600 transition-colors">
            Dashboard
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-600 dark:text-slate-300 font-medium">Notification Center</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Bell className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <span>Admission Notification Center</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1">
              Track incoming student submissions and outgoing admission alerts.
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {/* Refresh Button */}
            <button
              type="button"
              onClick={loadNotifications}
              disabled={loading || clearing}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/80 shadow-xs transition-all cursor-pointer disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-400 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>

            {/* Clear All Notifications Button (Admission Desk Only) */}
            <button
              type="button"
              onClick={() => setShowClearConfirm(true)}
              disabled={loading || clearing || (incoming.length === 0 && outgoing.length === 0)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/50 rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              title="Clear all admission notifications"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All</span>
            </button>

            {unreadCount > 0 && activeTab === "incoming" && (
              <button
                type="button"
                onClick={markAllRead}
                disabled={loading || clearing}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-60"
              >
                Mark All as Read ({unreadCount})
              </button>
            )}
          </div>
        </div>
      </div>

      {clearSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 flex items-center gap-3 animate-in fade-in duration-150">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <p className="text-sm font-medium">{clearSuccess}</p>
        </div>
      )}

      {/* Clear Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full shadow-2xl space-y-4 text-center animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Clear All Admission Notifications?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                This action will clear notification alerts on the Admission Desk. Student portal notifications will remain completely untouched and intact.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                disabled={clearing}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                disabled={clearing}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {clearing && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{clearing ? "Clearing..." : "Clear Notifications"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
          <button
            onClick={loadNotifications}
            className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Tabs Switcher: Incoming vs Outgoing */}
      <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-200/80 dark:bg-slate-800/90 p-1.5 rounded-2xl border border-slate-300/70 dark:border-slate-700 max-w-fit">
        <button
          onClick={() => {
            setActiveTab("incoming");
            setSearch("");
          }}
          className={`flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
            activeTab === "incoming"
              ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200/80 dark:border-slate-700"
              : "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <ArrowDownLeft className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span>Incoming Submissions (Students)</span>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-500 text-white animate-pulse">
              {unreadCount}
            </span>
          )}
        </button>

        <button
          onClick={() => {
            setActiveTab("outgoing");
            setSearch("");
          }}
          className={`flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
            activeTab === "outgoing"
              ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200/80 dark:border-slate-700"
              : "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <ArrowUpRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Outgoing Sent Alerts</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-300 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
            {outgoing.length}
          </span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          {["all", "application", "document", "passport", "visa"].map((type) => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                typeFilter === type
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
              }`}
            >
              {type === "all" ? "All Types" : type}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notification message..."
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:border-blue-600 outline-none transition-colors"
          />
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-16 text-center text-slate-400">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading notifications...
          </div>
        ) : filteredList.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <Bell className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            No notifications found in this view.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredList.map((item) => {
              const typeCfg = TYPE_ICON_MAP[item.type] || TYPE_ICON_MAP.general;
              const IconComp = typeCfg.icon;
              const isUnread = !item.is_read && activeTab === "incoming";

              return (
                <div
                  key={item.id}
                  className={`p-4 sm:p-5 flex items-start justify-between gap-4 transition-colors ${
                    isUnread
                      ? "bg-blue-50/70 dark:bg-blue-950/40 hover:bg-blue-100/60 dark:hover:bg-blue-900/30 border-l-4 border-l-blue-600"
                      : "bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                  }`}
                >
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl ${typeCfg.bg} flex items-center justify-center shrink-0 mt-0.5`}
                    >
                      <IconComp className={`w-4.5 h-4.5 ${typeCfg.color}`} />
                    </div>

                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white leading-snug">
                          {item.title}
                        </h4>
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {item.type}
                        </span>
                        {isUnread && (
                          <span className="w-2 h-2 rounded-full bg-blue-600" />
                        )}
                      </div>

                      <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-normal">
                        {item.message}
                      </p>

                      <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                        <span>{formatTime(item.created_at)}</span>
                        {item.recipient && (
                          <span>
                            • Sent to: {item.recipient.first_name} {item.recipient.last_name} ({item.recipient.email})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {isUnread && (
                      <button
                        type="button"
                        onClick={() => markSingleRead(item.id)}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 border border-blue-200 dark:border-blue-800 transition-colors cursor-pointer shadow-2xs"
                        title="Mark as read"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
