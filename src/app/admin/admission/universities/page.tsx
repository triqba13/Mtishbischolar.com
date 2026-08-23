import Link from "next/link";
import { Home, ChevronRight, ExternalLink } from "lucide-react";

const UNIVERSITIES = [
  { name: "SRM University AP", country: "India", location: "Andhra Pradesh, India", active: 9, accreditation: "NAAC A+" },
  { name: "Parul University", country: "India", location: "Vadodara, Gujarat", active: 5, accreditation: "NAAC A++" },
  { name: "X University", country: "UK", location: "London, UK", active: 3, accreditation: "QAA Approved" },
  { name: "Manipal University", country: "India", location: "Manipal, Karnataka", active: 4, accreditation: "NAAC A+" },
  { name: "LU University", country: "UK", location: "London, UK", active: 2, accreditation: "QAA Approved" },
  { name: "Parul University", country: "India", location: "Vadodara, Gujarat", active: 4, accreditation: "NAAC A++" },
  { name: "USM Malaysia", country: "Malaysia", location: "Penang, Malaysia", active: 3, accreditation: "MQA Approved" },
];

export default function UniversitiesPage() {
  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2">
          <Home className="w-3.5 h-3.5" />
          <ChevronRight className="w-3 h-3" />
          <Link href="/admin/admission/dashboard" className="hover:text-blue-600">Dashboard</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-600 font-medium">Universities</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Universities</h1>
        <p className="text-slate-500 text-sm mt-1">Active university partnerships and application counts.</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {UNIVERSITIES.map((u, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-lg">
                {u.name.charAt(0)}
              </div>
              <span className="text-[11px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{u.country}</span>
            </div>
            <h3 className="font-semibold text-slate-800 text-sm">{u.name}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{u.location}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">{u.accreditation}</p>
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
              <div>
                <p className="text-[11px] text-slate-400 font-semibold">Active Applications</p>
                <p className="text-lg font-bold text-slate-800">{u.active}</p>
              </div>
              <button className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer">
                View <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
