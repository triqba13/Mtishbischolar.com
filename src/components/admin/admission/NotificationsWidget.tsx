import Link from "next/link";
import { FileText, FolderOpen, Globe, Upload, Bell } from "lucide-react";

const NOTIFICATIONS = [
  {
    icon: FileText,
    color: "text-blue-500",
    bg: "bg-blue-50",
    message: "New application submitted by Amina Ali",
    time: "5 minutes ago",
  },
  {
    icon: FolderOpen,
    color: "text-orange-500",
    bg: "bg-orange-50",
    message: "Document uploaded by Tariq Hamza (Transcript)",
    time: "15 minutes ago",
  },
  {
    icon: Bell,
    color: "text-purple-500",
    bg: "bg-purple-50",
    message: "Student replied to your comment — John Mwita",
    time: "30 minutes ago",
  },
  {
    icon: Globe,
    color: "text-teal-500",
    bg: "bg-teal-50",
    message: "Passport assistance request from Neema Said",
    time: "1 hour ago",
  },
  {
    icon: Upload,
    color: "text-indigo-500",
    bg: "bg-indigo-50",
    message: "University response received for APP-00120",
    time: "2 hours ago",
  },
];

export default function NotificationsWidget() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-800 text-base">Notifications</h3>
        <button className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer">
          Mark all as read
        </button>
      </div>

      <div className="space-y-3">
        {NOTIFICATIONS.map((n, i) => (
          <div key={i} className="flex items-start gap-3 pb-3 border-b border-slate-50 last:border-0 last:pb-0">
            <div className={`w-8 h-8 rounded-lg ${n.bg} flex items-center justify-center shrink-0 mt-0.5`}>
              <n.icon className={`w-4 h-4 ${n.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-700 leading-snug">{n.message}</p>
              <p className="text-[11px] text-slate-400 mt-1">{n.time}</p>
            </div>
          </div>
        ))}
      </div>

      <Link
        href="/admin/admission/notifications"
        className="block text-center text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline mt-4 pt-3 border-t border-slate-100"
      >
        View all notifications
      </Link>
    </div>
  );
}
