import Link from "next/link";
import { FileText, FolderOpen, Building2, Globe, MessageCircle, ArrowRight } from "lucide-react";

const TASKS = [
  {
    icon: FileText,
    label: "Review Applications",
    count: 8,
    href: "/admin/admission/applications?tab=ready",
    color: "text-blue-500",
    bg: "bg-blue-50",
    countBg: "bg-blue-100 text-blue-700",
    btnHref: "/admin/admission/applications?tab=ready",
    btnLabel: "Review",
  },
  {
    icon: FolderOpen,
    label: "Review Pending Documents",
    count: 7,
    href: "/admin/admission/documents?tab=pending",
    color: "text-orange-500",
    bg: "bg-orange-50",
    countBg: "bg-orange-100 text-orange-700",
    btnHref: "/admin/admission/documents?tab=pending",
    btnLabel: "Review",
  },
  {
    icon: Building2,
    label: "Follow up University Cases",
    count: 5,
    href: "/admin/admission/applications?tab=university",
    color: "text-purple-500",
    bg: "bg-purple-50",
    countBg: "bg-purple-100 text-purple-700",
    btnHref: "/admin/admission/applications?tab=university",
    btnLabel: "View",
  },
  {
    icon: Globe,
    label: "Passport Requests",
    count: 3,
    href: "/admin/admission/passport",
    color: "text-teal-500",
    bg: "bg-teal-50",
    countBg: "bg-teal-100 text-teal-700",
    btnHref: "/admin/admission/passport",
    btnLabel: "View",
  },
  {
    icon: MessageCircle,
    label: "Student Replies / Comments",
    count: 4,
    href: "/admin/admission/notifications",
    color: "text-pink-500",
    bg: "bg-pink-50",
    countBg: "bg-pink-100 text-pink-700",
    btnHref: "/admin/admission/notifications",
    btnLabel: "View",
  },
];

export default function PendingTasks() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <h3 className="font-semibold text-slate-800 text-base mb-4">Pending Tasks</h3>
      <div className="space-y-2.5">
        {TASKS.map((task) => (
          <div key={task.label} className="flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-slate-50 transition-colors">
            <div className={`w-8 h-8 rounded-lg ${task.bg} flex items-center justify-center shrink-0`}>
              <task.icon className={`w-4 h-4 ${task.color}`} />
            </div>
            <span className="text-sm text-slate-700 flex-1">{task.label}</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${task.countBg}`}>
              {task.count}
            </span>
            <Link
              href={task.btnHref}
              className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:gap-2 transition-all cursor-pointer"
            >
              {task.btnLabel}
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
