"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowLeft,
  GraduationCap,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Shield,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState({
    email: "",
    password: "",
    rememberMe: true,
  });

  const supabase = createClient();

  // Load remembered email and check session timeout query param on mount
  useEffect(() => {
    try {
      const savedEmail = localStorage.getItem("mtishbi_admin_remember_email");
      if (savedEmail) {
        setForm((prev) => ({
          ...prev,
          email: savedEmail,
          rememberMe: true,
        }));
      }

      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        if (params.get("reason") === "timeout") {
          setError("Your session has expired due to 10 minutes of inactivity. Please sign in again.");
        }
      }
    } catch (e) {
      console.error("Failed to read parameters on mount:", e);
    }
  }, []);

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    const email = form.email.trim();
    const password = form.password;

    try {
      // 1. Authenticate with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError || !authData.user) {
        setError(
          authError?.message === "Invalid login credentials"
            ? "Invalid email or password. Please verify your officer credentials."
            : authError?.message || "Failed to sign in. Please try again."
        );
        setLoading(false);
        return;
      }

      const user = authData.user;

      // 2. Query public.profiles using authenticated user's ID
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, email, first_name, last_name, role")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError || !profile) {
        await supabase.auth.signOut();
        setError("Officer profile not found. Please contact the system administrator.");
        setLoading(false);
        return;
      }

      const role = profile.role;

      // 3. Verify Role Authorization
      if (role === "student") {
        // Immediate sign out if student attempts to log in to admin portal
        await supabase.auth.signOut();
        setError("Access Denied: Student accounts are not authorized to access the Admin Portal.");
        setLoading(false);
        return;
      }

      if (!role || !["super_admin", "admission_officer", "finance_officer"].includes(role)) {
        await supabase.auth.signOut();
        setError("Unauthorized role. Please contact the system administrator.");
        setLoading(false);
        return;
      }

      // 4. Remember Me Handling (store email only)
      try {
        if (form.rememberMe) {
          localStorage.setItem("mtishbi_admin_remember_email", email);
        } else {
          localStorage.removeItem("mtishbi_admin_remember_email");
        }
      } catch (e) {
        console.error("Failed to update localStorage:", e);
      }

      const officerName = [profile.first_name, profile.last_name].filter(Boolean).join(" ");
      setSuccess(officerName ? `Welcome, ${officerName}` : "Welcome");

      // 5. Role-based Redirect
      setTimeout(() => {
        if (role === "admission_officer") {
          window.location.href = "/admin/admission/dashboard";
        } else if (role === "finance_officer") {
          window.location.href = "/admin/finance/dashboard";
        } else if (role === "super_admin") {
          window.location.href = "/admin/super/dashboard";
        } else {
          window.location.href = "/admin/admission/dashboard";
        }
      }, 600);

    } catch (err: any) {
      console.error("Admin login error:", err);
      setError(err.message || "An unexpected error occurred during authentication.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center p-4 sm:p-6 font-sans overflow-hidden bg-slate-950">
      {/* ── Background Image with Glass Overlay ── */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/videos/images/university.jpg"
          alt="University Campus Background"
          fill
          priority
          className="object-cover opacity-85 scale-105"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0F172A]/55 via-[#0B132B]/45 to-[#0F172A]/70" />
      </div>

      {/* ── Top Left "Back" Button ── */}
      <div className="fixed top-6 left-6 z-30">
        <button
          onClick={handleBack}
          type="button"
          className="bg-slate-900/75 hover:bg-slate-900/95 backdrop-blur-xl border border-white/20 hover:border-white/40 px-3.5 py-1.5 rounded-full flex items-center gap-2 text-xs font-semibold text-white shadow-xl hover:shadow-2xl transition-all duration-200 cursor-pointer active:scale-95 group"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-blue-400 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back</span>
        </button>
      </div>

      {/* ── Top Floating Navigation Pill (Home Alone) ── */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-30">
        <div className="bg-slate-900/75 backdrop-blur-xl border border-white/25 px-5 py-1.5 rounded-full flex items-center gap-2 text-xs shadow-2xl text-white">
          <Link
            href="/"
            className="hover:text-blue-400 transition-colors font-medium px-2 py-0.5"
          >
            Home
          </Link>
        </div>
      </div>

      {/* ── Centered Glass Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 max-w-[440px] w-full rounded-[32px] p-7 sm:p-9 bg-slate-900/60 backdrop-blur-2xl border border-white/30 shadow-2xl my-auto text-white"
        style={{
          boxShadow:
            "0 30px 60px -12px rgba(0, 0, 0, 0.75), inset 0 1px 1px rgba(255, 255, 255, 0.3)",
        }}
      >
        {/* Top Brand Badge */}
        <div className="flex justify-center mb-4">
          <div className="flex flex-col items-center gap-2">
            <div className="relative h-12 w-16 overflow-hidden rounded-xl">
              <Image
                src="/logo.png"
                alt="Mtishbi Scholars official logo"
                fill
                className="object-contain"
                sizes="64px"
                priority
              />
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider bg-blue-500/30 text-blue-200 px-2.5 py-0.5 rounded-full border border-blue-400/30">
              Admin Portal
            </span>
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-6">
          <h1
            className="text-2xl sm:text-3xl font-bold text-white tracking-tight"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Welcome <span className="italic text-blue-400 font-serif">Back</span>
          </h1>
          <p className="text-slate-300 text-xs mt-1.5 max-w-xs mx-auto leading-relaxed">
            Sign in to access the officer portal and manage applications
          </p>
        </div>

        {/* Status Alerts */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Address */}
          <div>
            <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              EMAIL ADDRESS OR OFFICER ID
            </label>
            <div className="relative">
              <input
                type="text"
                id="email"
                name="username"
                autoComplete="username"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="officer@mtishbischolar.com"
                className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-slate-800/70 border border-white/25 focus:border-blue-400 focus:ring-1 focus:ring-blue-400/30 text-xs text-white placeholder-slate-400 outline-none transition-all"
              />
              <Mail className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                PASSWORD
              </label>
              <Link
                href="/auth/forgot-password"
                className="text-[11px] text-blue-400 hover:underline font-semibold"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                autoComplete="current-password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••••••"
                className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-slate-800/70 border border-white/25 focus:border-blue-400 focus:ring-1 focus:ring-blue-400/30 text-xs text-white placeholder-slate-400 outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember Me */}
          <div className="flex items-center pt-0.5">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.rememberMe}
                onChange={(e) => setForm({ ...form, rememberMe: e.target.checked })}
                className="w-4 h-4 rounded border-white/30 bg-slate-800/80 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 focus:ring-1 cursor-pointer accent-blue-600"
              />
              <span className="text-xs text-slate-300">Remember me on this device</span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl text-sm shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 transition-all duration-200 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <span className="flex items-center gap-1.5">
                <span>Sign In to Admin Portal</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </span>
            )}
          </button>
        </form>

        {/* Footer Note */}
        <div className="mt-6 pt-4 border-t border-white/15 flex items-center justify-center gap-2 text-slate-400 text-xs">
          <Shield className="w-3.5 h-3.5 text-blue-400" />
          <span>Authorized Officer Access Only</span>
        </div>
      </motion.div>
    </div>
  );
}
