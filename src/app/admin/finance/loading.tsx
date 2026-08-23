export default function FinanceLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Banner Skeleton */}
      <div className="h-32 bg-slate-200/80 rounded-3xl w-full" />

      {/* Metric Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 bg-slate-200/80 rounded-2xl p-5" />
        ))}
      </div>

      {/* Table / Card Skeleton */}
      <div className="h-96 bg-slate-200/80 rounded-2xl w-full" />
    </div>
  );
}
