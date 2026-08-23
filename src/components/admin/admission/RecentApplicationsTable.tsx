import Link from "next/link";
import StatusBadge from "./StatusBadge";
import { Eye } from "lucide-react";

const RECENT_APPLICATIONS = [
  { id: "APP-00124", student: "Tariq Hamza", university: "SRM University AP", course: "BSc Computer Science", status: "Ready for Review", submitted: "26 Aug 2026" },
  { id: "APP-00123", student: "Amina Ali", university: "Parul University", course: "BBA", status: "New", submitted: "26 Aug 2026" },
  { id: "APP-00122", student: "John Mwita", university: "X University", course: "BSc IT", status: "Documents Pending", submitted: "25 Aug 2026" },
  { id: "APP-00121", student: "Neema Said", university: "Manipal University", course: "BSc Data Science", status: "University Processing", submitted: "24 Aug 2026" },
  { id: "APP-00120", student: "David Mushi", university: "SRM University AP", course: "BCom", status: "University Approved", submitted: "23 Aug 2026" },
];

export default function RecentApplicationsTable() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <h3 className="font-semibold text-slate-800 text-base">Recent Applications</h3>
        <Link
          href="/admin/admission/applications"
          className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
        >
          View All
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100">
              {["Application ID", "Student", "University", "Course", "Status", "Submitted", "Action"].map((h) => (
                <th key={h} className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide px-5 py-3">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {RECENT_APPLICATIONS.map((app, i) => (
              <tr key={app.id} className={`border-b border-slate-50 hover:bg-slate-50/50 transition-colors ${i === RECENT_APPLICATIONS.length - 1 ? "border-b-0" : ""}`}>
                <td className="px-5 py-3.5 text-xs font-mono font-medium text-slate-700">{app.id}</td>
                <td className="px-5 py-3.5 text-sm font-medium text-slate-800">{app.student}</td>
                <td className="px-5 py-3.5 text-sm text-slate-600">{app.university}</td>
                <td className="px-5 py-3.5 text-sm text-slate-600">{app.course}</td>
                <td className="px-5 py-3.5">
                  <StatusBadge status={app.status} />
                </td>
                <td className="px-5 py-3.5 text-xs text-slate-500">{app.submitted}</td>
                <td className="px-5 py-3.5">
                  <Link
                    href={`/admin/admission/applications/${app.id}`}
                    className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 transition-all cursor-pointer"
                  >
                    <Eye className="w-4 h-4" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
