import Link from "next/link";
import { FileText, FolderOpen, Building2, Globe, MessageCircle, ArrowRight } from "lucide-react";

export interface TaskItem {
  label: string;
  count: number;
  href: string;
}

interface PendingTasksProps {
  tasks?: TaskItem[];
}

export default function PendingTasks({ tasks }: PendingTasksProps) {
  const dynamicTasks = [
    {
      icon: FileText,
      label: "Review Applications",
      count: tasks?.find((t) => t.label === "Review Applications")?.count ?? 0,
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
      count: tasks?.find((t) => t.label === "Review Pending Documents")?.count ?? 0,
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
      count: tasks?.find((t) => t.label === "Follow up University Cases")?.count ?? 0,
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
      count: tasks?.find((t) => t.label === "Passport Requests")?.count ?? 0,
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
      count: tasks?.find((t) => t.label === "Student Replies / Comments")?.count ?? 0,
      href: "/admin/admission/notifications",
      color: "text-pink-500",
      bg: "bg-pink-50",
      countBg: "bg-pink-100 text-pink-700",
      btnHref: "/admin/admission/notifications",
      btnLabel: "View",
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-800 text-base">Pending Tasks</h3>
        <span className="text-xs font-semibold bg-red-50 text-red-600 px-2.5 py-1 rounded-full">
          {dynamicTasks.reduce((acc, t) => acc + t.count, 0)} Action Items
        </span>
      </div>

      <div className="space-y-3">
        {dynamicTasks.map((task) => (
          <div
            key={task.label}
            className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg ${task.bg} flex items-center justify-center shrink-0`}>
                <task.icon className={`w-4 h-4 ${task.color}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700">{task.label}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${task.countBg}`}>
                {task.count}
              </span>
              <Link
                href={task.btnHref}
                className="text-xs font-semibold text-slate-500 hover:text-blue-600 flex items-center gap-0.5 transition-colors"
              >
                {task.btnLabel}
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
