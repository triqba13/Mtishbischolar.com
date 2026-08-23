import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: string | number;
  change: string;
  changeUp: boolean;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  subtitle?: string;
  breakdown?: { label: string; value: number }[];
}

export default function KpiCard({
  title,
  value,
  change,
  changeUp,
  icon: Icon,
  iconBg,
  iconColor,
  subtitle,
  breakdown,
}: KpiCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{title}</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{value}</p>
        </div>
        <div className={`w-11 h-11 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
      </div>

      {breakdown ? (
        <div className="space-y-1 mt-2">
          {breakdown.map((b) => (
            <div key={b.label} className="flex items-center justify-between">
              <span className="text-[11px] text-slate-500 truncate">{b.label}</span>
              <span className="text-[11px] font-semibold text-slate-700">{b.value}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-center gap-1.5">
          {changeUp ? (
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
          ) : (
            <TrendingDown className="w-3.5 h-3.5 text-red-500" />
          )}
          <span className={`text-xs font-semibold ${changeUp ? "text-emerald-600" : "text-red-500"}`}>
            {change}
          </span>
          <span className="text-xs text-slate-400">from last 7 days</span>
        </div>
      )}

      {subtitle && (
        <p className="text-[11px] text-slate-400 mt-1">{subtitle}</p>
      )}
    </div>
  );
}
