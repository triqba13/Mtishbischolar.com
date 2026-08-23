"use client";

import { useState } from "react";
import Link from "next/link";
import { Home, Bell, FileText, FolderOpen, Globe, Upload, CheckCircle2, ChevronRight } from "lucide-react";

const NOTIFICATIONS = [
  { icon: FileText, color: "text-blue-500", bg: "bg-blue-50", title: "New Application Submitted", message: "New application submitted by Amina Ali", time: "5 minutes ago", read: false },
  { icon: FolderOpen, color: "text-orange-500", bg: "bg-orange-50", title: "Document Uploaded", message: "Document uploaded by Tariq Hamza (Academic Transcript)", time: "15 minutes ago", read: false },
  { icon: Bell, color: "text-purple-500", bg: "bg-purple-50", title: "Student Reply", message: "Student replied to your comment — John Mwita", time: "30 minutes ago", read: false },
  { icon: Globe, color: "text-teal-500", bg: "bg-teal-50", title: "Passport Assistance Request", message: "Passport assistance request from Neema Said", time: "1 hour ago", read: true },
  { icon: Upload, color: "text-indigo-500", bg: "bg-indigo-50", title: "University Response", message: "University response received for APP-00120", time: "2 hours ago", read: true },
  { icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50", title: "Application Completed", message: "Application APP-00117 has been completed successfully", time: "3 hours ago", read: true },
  { icon: FileText, color: "text-blue-500", bg: "bg-blue-50", title: "New Application", message: "New application submitted by Fatma Salum", time: "4 hours ago", read: true },
  { icon: FolderOpen, color: "text-orange-500", bg: "bg-orange-50", title: "Document Uploaded", message: "Daniel Kayombo uploaded Passport Photo", time: "5 hours ago", read: true },
];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(NOTIFICATIONS);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2">
          <Home className="w-3.5 h-3.5" />
          <ChevronRight className="w-3 h-3" />
          <Link href="/admin/admission/dashboard" className="hover:text-blue-600">Dashboard</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-600 font-medium">Notifications</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
            {unreadCount > 0 && (
              <p className="text-slate-500 text-sm mt-1">{unreadCount} unread notifications</p>
            )}
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="text-sm font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer">
              Mark all as read
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-50">
        {notifications.map((n, i) => (
          <div
            key={i}
            className={`flex items-start gap-4 px-5 py-4 hover:bg-slate-50/50 transition-colors cursor-pointer ${!n.read ? "bg-blue-50/30" : ""}`}
            onClick={() => setNotifications((prev) => prev.map((item, idx) => idx === i ? { ...item, read: true } : item))}
          >
            <div className={`w-10 h-10 rounded-xl ${n.bg} flex items-center justify-center shrink-0`}>
              <n.icon className={`w-5 h-5 ${n.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-slate-800">{n.title}</p>
                {!n.read && (
                  <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                )}
              </div>
              <p className="text-sm text-slate-600 mt-0.5">{n.message}</p>
              <p className="text-xs text-slate-400 mt-1">{n.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
