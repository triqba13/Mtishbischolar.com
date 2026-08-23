import Link from "next/link";
import { FileText, FolderOpen, Globe, Upload, Bell } from "lucide-react";

export interface NotificationItem {
  id?: string;
  icon?: any;
  color?: string;
  bg?: string;
  title?: string;
  message: string;
  time?: string;
  created_at?: string;
  is_read?: boolean;
}

interface NotificationsWidgetProps {
  notifications?: NotificationItem[];
  onMarkAllRead?: () => void;
}

export default function NotificationsWidget({ notifications = [], onMarkAllRead }: NotificationsWidgetProps) {
  const formatTime = (ts?: string) => {
    if (!ts) return "Just now";
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-800 text-base">Notifications</h3>
        {notifications.some((n) => !n.is_read) && onMarkAllRead && (
          <button
            onClick={onMarkAllRead}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
          >
            Mark all as read
          </button>
        )}
      </div>

      <div className="space-y-3">
        {notifications.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">No new notifications.</p>
        ) : (
          notifications.slice(0, 5).map((n, i) => (
            <div key={n.id || i} className="flex items-start gap-3 pb-3 border-b border-slate-50 last:border-0 last:pb-0">
              <div className={`w-8 h-8 rounded-lg ${n.bg || "bg-blue-50"} flex items-center justify-center shrink-0 mt-0.5`}>
                <Bell className={`w-4 h-4 ${n.color || "text-blue-500"}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-700 leading-snug">{n.message || n.title}</p>
                <p className="text-[11px] text-slate-400 mt-1">{n.time || formatTime(n.created_at)}</p>
              </div>
            </div>
          ))
        )}
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
