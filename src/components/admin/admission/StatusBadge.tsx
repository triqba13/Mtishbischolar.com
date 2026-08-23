interface StatusBadgeProps {
  status: string;
  size?: "sm" | "md";
}

const STATUS_CONFIG: Record<string, { bg: string; text: string; dot: string }> = {
  "New": { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  "Ready for Review": { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  "Documents Pending": { bg: "bg-orange-50", text: "text-orange-700", dot: "bg-orange-500" },
  "Under Review": { bg: "bg-yellow-50", text: "text-yellow-700", dot: "bg-yellow-500" },
  "University Processing": { bg: "bg-purple-50", text: "text-purple-700", dot: "bg-purple-500" },
  "University Approved": { bg: "bg-teal-50", text: "text-teal-700", dot: "bg-teal-500" },
  "Submitted to University": { bg: "bg-indigo-50", text: "text-indigo-700", dot: "bg-indigo-500" },
  "Visa Processing": { bg: "bg-cyan-50", text: "text-cyan-700", dot: "bg-cyan-500" },
  "Visa Approved": { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500" },
  "Completed": { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-600" },
  "Rejected": { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
  "Approved": { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500" },
  "Pending": { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  "Processing": { bg: "bg-purple-50", text: "text-purple-700", dot: "bg-purple-500" },
  "Verified": { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
};

export default function StatusBadge({ status, size = "sm" }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? {
    bg: "bg-slate-100",
    text: "text-slate-600",
    dot: "bg-slate-400",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium ${config.bg} ${config.text} ${size === "sm" ? "text-[11px]" : "text-xs"}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot} shrink-0`} />
      {status}
    </span>
  );
}
