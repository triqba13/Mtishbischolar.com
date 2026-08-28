"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AdminIndexPage() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function checkAuthAndRedirect() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.replace("/admin/login");
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();

        const role = profile?.role;
        if (role === "super_admin") {
          router.replace("/admin/super/dashboard");
        } else if (role === "finance_officer") {
          router.replace("/admin/finance/dashboard");
        } else if (role === "admission_officer") {
          router.replace("/admin/admission/dashboard");
        } else {
          router.replace("/admin/login");
        }
      } catch (err) {
        console.error("Admin redirect error:", err);
        router.replace("/admin/login");
      }
    }

    checkAuthAndRedirect();
  }, [router, supabase]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B1528] text-white">
      <div className="text-center space-y-3">
        <div className="w-10 h-10 border-3 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-400 font-semibold tracking-wider uppercase">
          Redirecting to Admin Portal...
        </p>
      </div>
    </div>
  );
}
