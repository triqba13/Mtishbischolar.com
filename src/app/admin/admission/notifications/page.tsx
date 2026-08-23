"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Home, Bell, FileText, FolderOpen, Globe, Upload, CheckCircle2, ChevronRight, RefreshCw, AlertTriangle } from "lucide-react";
import { useAdminAuth } from "@/components/admin/AdminAuthProvider";
import { createClient } from "@/lib/supabase/client";

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  time: string;
  read: boolean;
  link: string | null;
  created_at: string;
}

const TYPE_ICON_MAP: Record<string, any> = {
  application: { icon: FileText, color: "text-blue-500", bg: "bg-blue-50" },
  document: { icon: FolderOpen, color: "text-orange-500", bg: "bg-orange-50" },
  comment: { icon: Bell, color: "text-purple-500", bg: "bg-purple-50" },
  passport: { icon: Globe, color: "text-teal-500", bg: "bg-teal-50" },
  university: { icon: Upload, color: "text-indigo-500", bg: "bg-indigo-50" },
  system: { icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50" },
};

export default function NotificationsPage() {
  const { loading: authLoading } = useAdminAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
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

      setNotifications(json.notifications || []);
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
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (session?.access_token) headers["Authorization"] = `Bearer ${session.access_token}`;

      await fetch("/api/admin/admission/notifications", {
        method: "POST",
        headers,
        body: JSON.stringify({ action: "mark_all_read" }),
      });
    } catch (err) {
      console.error("Mark all read error:", err);
    }
  };

  const markSingleRead = async (id: string) => {
    try {
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (session?.access_token) headers["Authorization"] = `Bearer ${session.access_token}`;

      await fetch("/api/admin/admission/notifications", {
        method: "POST",
        headers,
        body: JSON.stringify({ action: "mark_read", id }),
      });
    } catch (err) {
      console.error("Mark single read error:", err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

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
          <span className="text-slate-600 font-medium">Notifications</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
            {unreadCount > 0 ? (
              <p className="text-slate-500 text-sm mt-1">{unreadCount} unread notifications</p>
            ) : (
              <p className="text-slate-500 text-sm mt-1">All notifications caught up.</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadNotifications}
              disabled={loading}
              className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 shadow-sm transition-all cursor-pointer disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-400 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-sm font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
              >
                Mark all as read
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

      <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-50">
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <RefreshCw className="w-5 h-5 animate-spin text-blue-600 mx-auto mb-2" />
            <p className="text-sm">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Bell className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No notifications found.</p>
          </div>
        ) : (
          notifications.map((n) => {
            const conf = TYPE_ICON_MAP[n.type] || TYPE_ICON_MAP.system;
            const Icon = conf.icon;
            return (
              <div
                key={n.id}
                className={`flex items-start gap-4 px-5 py-4 hover:bg-slate-50/50 transition-colors cursor-pointer ${
                  !n.read ? "bg-blue-50/30" : ""
                }`}
                onClick={() => markSingleRead(n.id)}
              >
                <div className={`w-10 h-10 rounded-xl ${conf.bg} flex items-center justify-center shrink-0`}>
                  <Icon className={`w-5 h-5 ${conf.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-800">{n.title}</p>
                    {!n.read && <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />}
                  </div>
                  <p className="text-sm text-slate-600 mt-0.5">{n.message}</p>
                  <p className="text-xs text-slate-400 mt-1">{n.time}</p>
                </div>
                {n.link && (
                  <Link
                    href={n.link}
                    className="text-xs font-semibold text-blue-600 hover:underline shrink-0"
                  >
                    View
                  </Link>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
