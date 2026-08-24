"use client";

import { useState, useEffect, Suspense } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  GraduationCap,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

// Google Icon SVG
const GoogleIcon = () => (
  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.26v3.15C3.26 21.3 7.36 24 12 24z"
    />
    <path
      fill="#FBBC05"
      d="M5.28 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.26C.46 8.23 0 10.06 0 12s.46 3.77 1.26 5.39l4.02-3.15z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.94 1.19 15.23 0 12 0 7.36 0 3.26 2.7 1.26 6.61l4.02 3.15c.95-2.85 3.6-4.96 6.72-4.96z"
    />
  </svg>
);

function LoginContent() {
  const searchParams = useSearchParams();
  const verified = searchParams.get("verified");
  const passwordReset = searchParams.get("password_reset");
  const authError = searchParams.get("error");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(
    authError === "unauthorized"
      ? "Authentication required. Please sign in to access your Student Dashboard."
      : authError
      ? authError
      : null
  );
  const [successMessage, setSuccessMessage] = useState<string | null>(
    verified === "true"
      ? "Congratulations! Your account has been verified successfully. You can now sign in below."
      : passwordReset === "true"
      ? "Password updated successfully! Please sign in with your new password."
      : null
  );

  const [form, setForm] = useState({
    email: "",
    password: "",
    rememberMe: true,
  });

  // Load remembered email on mount if previously saved
  useEffect(() => {
    try {
      const savedEmail = localStorage.getItem("mtishbi_remember_email");
      if (savedEmail) {
        setForm((prev) => ({
          ...prev,
          email: savedEmail,
          rememberMe: true,
        }));
      }
    } catch (e) {
      console.error("Failed to read remembered email from localStorage:", e);
    }
  }, []);

  const supabase = createClient();

  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setErrorMessage(error.message);
      }
    } catch (err: any) {
      setErrorMessage("Failed to initiate Google authentication. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const [showOfficerPortalLink, setShowOfficerPortalLink] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setShowOfficerPortalLink(false);
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: form.email.trim(),
        password: form.password,
      });

      if (error) {
        if (error.message.includes("Invalid login")) {
          setErrorMessage("Invalid email or password. If you registered using Google, please click 'Continue with Google' above.");
        } else {
          setErrorMessage(error.message || "Invalid email address or password. Please try again.");
        }
        return;
      }

      if (!data?.user || !data?.session) {
        setErrorMessage("Authentication failed. No valid user session was returned.");
        return;
      }

      // Query role strictly from public.profiles
      const { data: profile, error: profileErr } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .maybeSingle();

      const role = profile?.role;

      // Handle non-student administrative roles
      if (
        role === "admission_officer" ||
        role === "finance_officer" ||
        role === "super_admin"
      ) {
        await supabase.auth.signOut();
        setShowOfficerPortalLink(true);
        setErrorMessage(
          "Student portal access denied. This account is assigned to an administrative role. Please use the Officer Portal."
        );
        return;
      }

      // Handle missing or invalid roles
      if (!role || role !== "student") {
        await supabase.auth.signOut();
        setErrorMessage(
          "Authorization error: User profile does not have a valid student role. Please contact support."
        );
        return;
      }

      // Manage Remember Me email persistence (never store raw passwords)
      try {
        if (form.rememberMe) {
          localStorage.setItem("mtishbi_remember_email", form.email.trim());
        } else {
          localStorage.removeItem("mtishbi_remember_email");
        }
      } catch (e) {
        console.error("Failed to update remembered email in localStorage:", e);
      }

      setSuccessMessage("Login successful! Redirecting to student portal...");
      setTimeout(() => {
        window.location.href = `/student/dashboard?welcome=true&email=${encodeURIComponent(form.email.trim())}`;
      }, 800);
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred during sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center p-4 sm:p-6 font-sans overflow-hidden bg-slate-950">
      
      {/* ── Background Image with 85% Opacity ── */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/videos/images/university.jpg"
          alt="University Campus Background"
          fill
          priority
          className="object-cover opacity-85 scale-105"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0F172A]/50 via-[#0F172A]/30 to-[#0F172A]/60" />
      </div>

      {/* ── Top Floating Navigation Pill ── */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-30">
        <div className="bg-slate-900/70 backdrop-blur-xl border border-white/25 px-4 py-1.5 rounded-full flex items-center gap-3 text-xs shadow-2xl text-white">
          <Link href="/" className="hover:text-[#D4AF37] transition-colors font-medium px-2 py-1">
            Home
          </Link>
          <span className="text-white/20">&bull;</span>
          <span className="bg-[#D4AF37] text-[#0F172A] font-bold px-3 py-1 rounded-full">
            Login
          </span>
          <span className="text-white/20">&bull;</span>
          <Link href="/auth/register" className="hover:text-[#D4AF37] transition-colors font-medium px-2 py-1">
            Sign Up
          </Link>
        </div>
      </div>

      {/* ── Centered Glass Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 max-w-[440px] w-full rounded-[32px] p-7 sm:p-9 bg-slate-900/55 backdrop-blur-2xl border border-white/30 shadow-2xl my-auto text-white"
        style={{
          boxShadow: "0 30px 60px -12px rgba(0, 0, 0, 0.75), inset 0 1px 1px rgba(255, 255, 255, 0.3)",
        }}
      >
        {/* Top Brand Badge */}
        <div className="flex justify-center mb-4">
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
        </div>

        {/* Title */}
        <div className="text-center mb-5">
          <h1
            className="text-2xl sm:text-3xl font-bold text-white tracking-tight"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Welcome <span className="italic text-[#D4AF37] font-serif">Back</span>
          </h1>
          <p className="text-slate-300 text-xs mt-1.5 max-w-xs mx-auto leading-relaxed">
            Sign in to access your student portal and track applications
          </p>
        </div>

        {/* Status Alerts */}
        {errorMessage && (
          <div className="mb-4 p-3.5 rounded-2xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs space-y-2.5">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{errorMessage}</span>
            </div>
            {showOfficerPortalLink && (
              <div className="pt-1">
                <Link
                  href="/admin/login"
                  className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 bg-red-900/60 hover:bg-red-800/80 border border-red-400/40 text-white font-bold rounded-xl transition-all shadow-xs text-xs"
                >
                  <span>Go to Officer Portal</span>
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </Link>
              </div>
            )}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-950/90 border border-emerald-500/60 text-emerald-200 text-xs flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Continue with Google */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full bg-white/15 hover:bg-white/25 border border-white/25 hover:border-white/50 text-white font-semibold py-2.5 px-4 rounded-2xl text-xs transition-all flex items-center justify-center gap-2.5 shadow-md mb-4 disabled:opacity-50"
        >
          <GoogleIcon />
          <span>Continue with Google</span>
        </button>

        {/* Divider */}
        <div className="relative flex items-center justify-center mb-4">
          <div className="border-t border-white/20 w-full" />
          <span className="bg-slate-900/90 px-3 text-[10px] uppercase font-bold tracking-widest text-slate-300 shrink-0">
            OR SIGN IN WITH EMAIL
          </span>
          <div className="border-t border-white/20 w-full" />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Email Address */}
          <div>
            <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
              EMAIL ADDRESS OR STUDENT ID
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
                placeholder="student@university.ac or MT-2026-XXXX"
                className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-slate-800/70 border border-white/25 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/30 text-xs text-white placeholder-slate-400 outline-none transition-all"
              />
              <Mail className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                PASSWORD
              </label>
              <Link href="/auth/forgot-password" className="text-[11px] text-[#D4AF37] hover:underline font-semibold">
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
                className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-slate-800/70 border border-white/25 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/30 text-xs text-white placeholder-slate-400 outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember Me Checkbox */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="remember"
              checked={form.rememberMe}
              onChange={(e) => setForm({ ...form, rememberMe: e.target.checked })}
              className="w-3.5 h-3.5 rounded bg-slate-800 border-white/30 text-[#D4AF37] focus:ring-0 cursor-pointer"
            />
            <label htmlFor="remember" className="text-[11px] text-slate-300 cursor-pointer">
              Remember me on this device
            </label>
          </div>

          {/* Sign In Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#D4AF37] via-[#E8C84A] to-[#B8960C] text-[#0F172A] font-extrabold py-3 rounded-xl hover:shadow-xl hover:shadow-[#D4AF37]/25 transition-all duration-300 hover:scale-[1.01] text-xs flex items-center justify-center gap-1.5 mt-2 disabled:opacity-50"
          >
            {loading ? (
              <span className="animate-pulse">Authenticating...</span>
            ) : (
              <>
                <span>Sign In to Student Portal</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </>
            )}
          </button>
        </form>

        {/* Switcher Link */}
        <div className="text-center mt-4 pt-3 border-t border-white/15 text-xs text-slate-300">
          Don&apos;t have an account?{" "}
          <Link href="/auth/register" className="font-bold text-[#D4AF37] hover:underline">
            Sign up here
          </Link>
        </div>
      </motion.div>

    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
