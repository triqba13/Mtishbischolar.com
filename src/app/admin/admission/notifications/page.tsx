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
} from "lucide-react";
import { useAdminAuth } from "@/components/admin/AdminAuthProvider";
import { createClient } from "@/lib/supabase/client";

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
  application: { icon: FileText, color: "text-blue-500", bg: "bg-blue-50" },
  document: { icon: FolderOpen, color: "text-orange-500", bg: "bg-orange-50" },
  passport: { icon: Globe, color: "text-teal-500", bg: "bg-teal-50" },
  visa: { icon: Globe, color: "text-indigo-500", bg: "bg-indigo-50" },
  system: { icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50" },
  general: { icon: Bell, color: "text-purple-500", bg: "bg-purple-50" },
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

      setIncoming(json.incoming || []);
      setOutgoing(json.outgoing || []);
      setUnreadCount(json.unreadCount || 0);
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
          <Link href="/admin/admission/dashboard" className="hover:text-blue-600">
            Dashboard
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-600 font-medium">Notification Center</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Bell className="w-6 h-6 text-blue-600" />
              <span>Admission Notification Center</span>
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-1">
              Track incoming student submissions and outgoing admission alerts.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadNotifications}
              disabled={loading}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 shadow-xs transition-all cursor-pointer disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-400 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>

            {unreadCount > 0 && activeTab === "incoming" && (
              <button
                onClick={markAllRead}
                className="px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl border border-blue-200 transition-colors cursor-pointer"
              >
                Mark All as Read ({unreadCount})
              </button>
            )}
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
            onClick={loadNotifications}
            className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Tabs Switcher: Incoming vs Outgoing */}
      <div className="flex items-center gap-2 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/80 max-w-fit">
        <button
          onClick={() => {
            setActiveTab("incoming");
            setSearch("");
          }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
            activeTab === "incoming"
              ? "bg-white text-blue-600 shadow-sm border border-slate-200/60"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <ArrowDownLeft className="w-4 h-4 text-blue-600" />
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
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
            activeTab === "outgoing"
              ? "bg-white text-blue-600 shadow-sm border border-slate-200/60"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <ArrowUpRight className="w-4 h-4 text-emerald-600" />
          <span>Outgoing Sent Alerts</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-200 text-slate-700">
            {outgoing.length}
          </span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {["all", "application", "document", "passport", "visa"].map((type) => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                typeFilter === type
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
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
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-600 outline-none transition-colors"
          />
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-16 text-center text-slate-400">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading notifications...
          </div>
        ) : filteredList.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            No notifications found in this view.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredList.map((item) => {
              const typeCfg = TYPE_ICON_MAP[item.type] || TYPE_ICON_MAP.general;
              const IconComp = typeCfg.icon;

              return (
                <div
                  key={item.id}
                  className={`p-4 sm:p-5 flex items-start justify-between gap-4 transition-colors ${
                    !item.is_read && activeTab === "incoming"
                      ? "bg-blue-50/40 hover:bg-blue-50/60"
                      : "hover:bg-slate-50/70"
                  }`}
                >
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl ${typeCfg.bg} flex items-center justify-center shrink-0 mt-0.5`}
                    >
                      <IconComp className={`w-4.5 h-4.5 ${typeCfg.color}`} />
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-bold text-xs sm:text-sm text-slate-900 leading-snug">
                          {item.title}
                        </h4>
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.2 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                          {item.type}
                        </span>
                        {!item.is_read && activeTab === "incoming" && (
                          <span className="w-2 h-2 rounded-full bg-blue-600" />
                        )}
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed">{item.message}</p>

                      <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-400 font-medium">
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
                    {!item.is_read && activeTab === "incoming" && (
                      <button
                        type="button"
                        onClick={() => markSingleRead(item.id)}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-blue-600 bg-white hover:bg-blue-50 border border-blue-200 transition-colors cursor-pointer shadow-2xs"
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
