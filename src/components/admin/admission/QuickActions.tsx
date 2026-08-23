import Link from "next/link";
import { FileText, FolderOpen, Globe, Building2, UserPlus } from "lucide-react";

const ACTIONS = [
  { icon: FileText, label: "Review Applications", href: "/admin/admission/applications?tab=ready", color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200 hover:bg-emerald-100" },
  { icon: FolderOpen, label: "Review Documents", href: "/admin/admission/documents?tab=pending", color: "text-orange-600", bg: "bg-orange-50 border-orange-200 hover:bg-orange-100" },
  { icon: Globe, label: "Passport Requests", href: "/admin/admission/passport", color: "text-teal-600", bg: "bg-teal-50 border-teal-200 hover:bg-teal-100" },
  { icon: Building2, label: "University Applications", href: "/admin/admission/applications?tab=university", color: "text-purple-600", bg: "bg-purple-50 border-purple-200 hover:bg-purple-100" },
  { icon: UserPlus, label: "Add Student", href: "/admin/admission/students/new", color: "text-blue-600", bg: "bg-blue-50 border-blue-200 hover:bg-blue-100" },
];

export default function QuickActions() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <h3 className="font-semibold text-slate-800 text-base mb-4">Quick Actions</h3>
      <div className="space-y-2.5">
        {ACTIONS.map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl border transition-all ${action.bg}`}
          >
            <div className={`w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm border border-white`}>
              <action.icon className={`w-4 h-4 ${action.color}`} />
            </div>
            <span className={`text-sm font-medium ${action.color}`}>{action.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
