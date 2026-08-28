"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdmissionIndexPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/admission/dashboard");
  }, [router]);

  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
