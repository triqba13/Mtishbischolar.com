"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function FinanceIndexPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/finance/dashboard");
  }, [router]);

  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
