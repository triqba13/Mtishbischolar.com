"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  GraduationCap,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  RefreshCw,
  ArrowRight,
  ArrowLeft,
  Check,
  X,
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

export default function RegisterPage() {
  const [step, setStep] = useState<"register" | "verify_otp" | "verified_success">("register");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  // Form State
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    acceptTerms: true,
  });

  // OTP State (6 digits)
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [timerSeconds, setTimerSeconds] = useState<number>(600); // 10 minutes
  const [isTimerExpired, setIsTimerExpired] = useState<boolean>(false);

  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const supabase = createClient();

  // Password Strength Rules (6 items)
  const passwordCriteria = [
    { label: "At least 8 characters", valid: form.password.length >= 8 },
    { label: "One uppercase letter (A-Z)", valid: /[A-Z]/.test(form.password) },
    { label: "One lowercase letter (a-z)", valid: /[a-z]/.test(form.password) },
    { label: "One number (0-9)", valid: /[0-9]/.test(form.password) },
    { label: "One special character (!@#$%^&*)", valid: /[!@#$%^&*(),.?":{}|<>]/.test(form.password) },
    { label: "Passwords match", valid: form.password.length > 0 && form.password === form.confirmPassword },
  ];

  const isPasswordStrong = passwordCriteria.every((c) => c.valid);

  // Countdown timer for OTP expiration
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === "verify_otp" && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            setIsTimerExpired(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, timerSeconds]);

  // Check for redirected message (e.g. after profile deletion)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("deleted") === "true") {
        setInfoMessage("Your profile and associated student data have been permanently deleted. You can now create a new profile.");
      }
    }
  }, []);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Step 1: Send Real Email Verification via Supabase
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setInfoMessage(null);

    if (!isPasswordStrong) {
      setErrorMessage("Please ensure your password meets all 6 strength criteria below.");
      return;
    }

    setLoading(true);

    try {
      // Real Supabase Auth SignUp which sends confirmation email to user's mailbox
      const { data, error } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.password,
        options: {
          data: {
            first_name: form.firstName.trim(),
            last_name: form.lastName.trim(),
            full_name: `${form.firstName.trim()} ${form.lastName.trim()}`.trim(),
          },
        },
      });

      if (error) {
        setErrorMessage(error.message);
        setLoading(false);
        return;
      }

      setLoading(false);
      setTimerSeconds(600);
      setIsTimerExpired(false);
      setStep("verify_otp");
      setInfoMessage(`We sent a 6-digit verification code to ${form.email}. Check your email inbox or spam folder.`);
    } catch (err: any) {
      setLoading(false);
      setErrorMessage(err?.message || "Failed to create account. Please try again.");
    }
  };

  // OTP Input Handler
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto-focus next input box
    if (value && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  // Handle Paste for 6-digit OTP code copied from Email
  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split("");
      setOtp(digits);
      otpInputsRef.current[5]?.focus();
    }
  };

  // Step 2: Verify Real OTP Code with Supabase
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setInfoMessage(null);

    const enteredCode = otp.join("");

    if (enteredCode.length < 6) {
      setErrorMessage("Please enter all 6 digits of the verification code sent to your email.");
      return;
    }

    if (isTimerExpired) {
      setErrorMessage("Verification code has expired. Please click 'Resend Code'.");
      return;
    }

    setLoading(true);

    try {
      // Verify Real OTP with Supabase
      const { data, error } = await supabase.auth.verifyOtp({
        email: form.email.trim(),
        token: enteredCode,
        type: "signup",
      });

      if (error) {
        setErrorMessage(error.message || "Invalid verification code. Please check your email inbox and try again.");
        setLoading(false);
        return;
      }

      // Explicitly update user metadata
      if (data?.user) {
        try {
          await supabase.auth.updateUser({
            data: {
              first_name: form.firstName.trim(),
              last_name: form.lastName.trim(),
              full_name: `${form.firstName.trim()} ${form.lastName.trim()}`.trim(),
            },
          });
        } catch {}
      }

      // Explicitly upsert public.profiles record with the registered names
      if (data?.user?.id) {
        try {
          await supabase
            .from("profiles")
            .upsert({
              id: data.user.id,
              email: form.email.trim(),
              first_name: form.firstName.trim(),
              last_name: form.lastName.trim(),
              role: "student",
              updated_at: new Date().toISOString(),
            });
        } catch (profileErr) {
          console.error("Error creating/updating profile after OTP verification:", profileErr);
        }
      }

      setLoading(false);
      setStep("verified_success");

      // Redirect directly to Student Dashboard
      const studentName = `${form.firstName.trim()} ${form.lastName.trim()}`.trim() || "Student";
      const targetUrl = `/student/dashboard?welcome=true&email=${encodeURIComponent(form.email)}&name=${encodeURIComponent(studentName)}`;
      setTimeout(() => {
        window.location.href = targetUrl;
      }, 1200);
    } catch (err: any) {
      setLoading(false);
      setErrorMessage(err?.message || "Failed to verify code. Please try again.");
    }
  };

  // Resend Real Verification Code
  const handleResendOtp = async () => {
    setErrorMessage(null);
    setInfoMessage(null);
    setOtp(["", "", "", "", "", ""]);

    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: form.email,
      });

      if (error) {
        setErrorMessage(error.message);
      } else {
        setTimerSeconds(600);
        setIsTimerExpired(false);
        setInfoMessage(`A new 6-digit code has been sent to ${form.email}. Check your email.`);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to resend verification code.");
    }
  };

  // Google OAuth
  const handleGoogleSignUp = async () => {
    setErrorMessage(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) setErrorMessage(error.message);
    } catch (err: any) {
      setErrorMessage("Failed to connect to Google OAuth.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center p-4 sm:p-6 font-sans overflow-hidden bg-slate-950">
      
      {/* Background Image with 85% Opacity */}
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

      {/* Top Floating Navigation Pill */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-30">
        <div className="bg-slate-900/70 backdrop-blur-xl border border-white/25 px-4 py-1.5 rounded-full flex items-center gap-3 text-xs shadow-2xl text-white">
          <Link href="/" className="hover:text-[#D4AF37] transition-colors font-medium px-2 py-1">
            Home
          </Link>
          <span className="text-white/20">&bull;</span>
          <Link href="/auth/login" className="hover:text-[#D4AF37] transition-colors font-medium px-2 py-1">
            Login
          </Link>
          <span className="text-white/20">&bull;</span>
          <span className="bg-[#D4AF37] text-[#0F172A] font-bold px-3 py-1 rounded-full">
            Sign Up
          </span>
        </div>
      </div>

      {/* Main Glass Card Container */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 max-w-[480px] w-full rounded-[32px] p-7 sm:p-9 bg-slate-900/55 backdrop-blur-2xl border border-white/30 shadow-2xl my-auto text-white"
        style={{
          boxShadow: "0 30px 60px -12px rgba(0, 0, 0, 0.75), inset 0 1px 1px rgba(255, 255, 255, 0.3)",
        }}
      >
        {/* Brand Badge */}
        <div className="flex justify-center mb-4">
          <div className="inline-flex items-center gap-2 bg-[#D4AF37]/20 border border-[#D4AF37]/40 px-3.5 py-1.5 rounded-xl">
            <div className="w-5 h-5 rounded-md bg-[#D4AF37] flex items-center justify-center">
              <GraduationCap className="w-3.5 h-3.5 text-[#0F172A]" />
            </div>
            <span
              className="text-white font-extrabold text-sm tracking-wide"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Mtishbi<span className="text-[#D4AF37]">Scholar</span>
            </span>
          </div>
        </div>

        {/* ── STEP 1: REGISTER FORM ── */}
        {step === "register" && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <div className="text-center mb-5">
              <h1
                className="text-2xl sm:text-3xl font-bold text-white tracking-tight"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Create Your <span className="italic text-[#D4AF37] font-serif">Account</span>
              </h1>
              <p className="text-slate-300 text-xs mt-1.5 max-w-xs mx-auto leading-relaxed">
                Join thousands of students building their future worldwide
              </p>
            </div>

            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleGoogleSignUp}
              disabled={loading}
              className="w-full bg-white/15 hover:bg-white/25 border border-white/25 hover:border-white/50 text-white font-semibold py-2.5 px-4 rounded-2xl text-xs transition-all flex items-center justify-center gap-2.5 shadow-md mb-4 disabled:opacity-50"
            >
              <GoogleIcon />
              <span>Continue with Google</span>
            </button>

            <div className="relative flex items-center justify-center mb-4">
              <div className="border-t border-white/20 w-full" />
              <span className="bg-slate-900/90 px-3 text-[10px] uppercase font-bold tracking-widest text-slate-300 shrink-0">
                OR SIGN UP WITH EMAIL
              </span>
              <div className="border-t border-white/20 w-full" />
            </div>

            <form onSubmit={handleCreateAccount} className="space-y-3">
              {/* First Name & Last Name */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                    FIRST NAME
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={form.firstName}
                      onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                      placeholder="e.g. Alex"
                      className="w-full pl-3.5 pr-8 py-2 rounded-xl bg-slate-800/70 border border-white/25 focus:border-[#D4AF37] text-xs text-white placeholder-slate-400 outline-none transition-all"
                    />
                    <User className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                    LAST NAME
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={form.lastName}
                      onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                      placeholder="e.g. Osmund"
                      className="w-full pl-3.5 pr-8 py-2 rounded-xl bg-slate-800/70 border border-white/25 focus:border-[#D4AF37] text-xs text-white placeholder-slate-400 outline-none transition-all"
                    />
                    <User className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                  EMAIL ADDRESS
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="student@university.ac"
                    className="w-full pl-3.5 pr-10 py-2 rounded-xl bg-slate-800/70 border border-white/25 focus:border-[#D4AF37] text-xs text-white placeholder-slate-400 outline-none transition-all"
                  />
                  <Mail className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                  PASSWORD
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="Min. 8 characters"
                    className="w-full pl-3.5 pr-10 py-2 rounded-xl bg-slate-800/70 border border-white/25 focus:border-[#D4AF37] text-xs text-white placeholder-slate-400 outline-none transition-all"
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

              {/* Confirm Password */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                  CONFIRM PASSWORD
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={form.confirmPassword}
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                    placeholder="Repeat your password"
                    className="w-full pl-3.5 pr-10 py-2 rounded-xl bg-slate-800/70 border border-white/25 focus:border-[#D4AF37] text-xs text-white placeholder-slate-400 outline-none transition-all"
                  />
                  <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Password Strength Checklist */}
              {form.password.length > 0 && (
                <div className="p-3 bg-slate-950/60 rounded-xl border border-white/10 space-y-1 mt-1">
                  <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">
                    PASSWORD STRENGTH REQUIREMENTS:
                  </p>
                  <div className="grid grid-cols-2 gap-1 text-[11px]">
                    {passwordCriteria.map((c, i) => (
                      <div
                        key={i}
                        className={`flex items-center gap-1.5 ${
                          c.valid ? "text-emerald-400" : "text-slate-400"
                        }`}
                      >
                        {c.valid ? (
                          <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                        ) : (
                          <X className="w-3 h-3 text-slate-500 shrink-0" />
                        )}
                        <span className="truncate">{c.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Terms Checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="terms"
                  required
                  checked={form.acceptTerms}
                  onChange={(e) => setForm({ ...form, acceptTerms: e.target.checked })}
                  className="w-3.5 h-3.5 rounded bg-slate-800 border-white/30 text-[#D4AF37] focus:ring-0 cursor-pointer"
                />
                <label htmlFor="terms" className="text-[11px] text-slate-300 cursor-pointer">
                  I agree to the <span className="text-[#D4AF37] font-semibold underline">Terms &amp; Conditions</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !isPasswordStrong}
                className="w-full bg-gradient-to-r from-[#D4AF37] via-[#E8C84A] to-[#B8960C] text-[#0F172A] font-extrabold py-3 rounded-xl hover:shadow-xl hover:shadow-[#D4AF37]/25 transition-all duration-300 hover:scale-[1.01] text-xs flex items-center justify-center gap-1.5 mt-2 disabled:opacity-50"
              >
                {loading ? (
                  <span className="animate-pulse">Sending Verification Code to Email...</span>
                ) : (
                  <>
                    Create Account &rarr;
                  </>
                )}
              </button>
            </form>

            <div className="text-center mt-4 pt-3 border-t border-white/15 text-xs text-slate-300">
              Already have an account?{" "}
              <Link href="/auth/login" className="font-bold text-[#D4AF37] hover:underline">
                Sign in here
              </Link>
            </div>
          </motion.div>
        )}

        {/* ── STEP 2: REAL 6-DIGIT OTP VERIFICATION SCREEN ── */}
        {step === "verify_otp" && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            {/* Top Back Navigation Arrow */}
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={() => {
                  setErrorMessage(null);
                  setInfoMessage(null);
                  setStep("register");
                }}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-[#D4AF37] transition-colors cursor-pointer group"
              >
                <ArrowLeft className="w-4 h-4 text-slate-300 group-hover:text-[#D4AF37] group-hover:-translate-x-0.5 transition-all" />
                <span>Back</span>
              </button>
              <div className="text-[11px] font-semibold text-slate-400">
                Step 2 of 2
              </div>
            </div>

            <div className="text-center mb-5">
              <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/20 border border-[#D4AF37]/50 text-[#D4AF37] flex items-center justify-center mx-auto mb-3">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h2
                className="text-2xl font-bold text-white tracking-tight"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Check Your <span className="italic text-[#D4AF37] font-serif">Email Inbox</span>
              </h2>
              <p className="text-slate-300 text-xs mt-1.5 max-w-xs mx-auto leading-relaxed">
                We sent a 6-digit verification code to <br />
                <span className="text-[#D4AF37] font-semibold">{form.email}</span>
              </p>
            </div>

            {/* Info Message */}
            {infoMessage && (
              <div className="mb-4 p-3 rounded-xl bg-blue-950/80 border border-blue-500/50 text-blue-200 text-xs flex items-start gap-2">
                <Mail className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span>{infoMessage}</span>
              </div>
            )}

            {/* Error Message Alert */}
            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className="space-y-5">
              {/* 6 OTP Input Boxes (Supports Paste) */}
              <div className="flex items-center justify-center gap-2 sm:gap-2.5">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      otpInputsRef.current[index] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    onPaste={handleOtpPaste}
                    className="w-11 h-12 sm:w-12 sm:h-14 text-center text-xl font-bold rounded-xl bg-slate-800/80 border-2 border-white/25 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/30 text-white outline-none transition-all"
                  />
                ))}
              </div>

              {/* Countdown Timer */}
              <div className="text-center text-xs">
                {isTimerExpired ? (
                  <p className="text-red-400 font-semibold flex items-center justify-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Code Expired! Click below to resend a new code.
                  </p>
                ) : (
                  <p className="text-slate-300">
                    Code expires in:{" "}
                    <span className="font-mono text-[#D4AF37] font-bold text-sm">
                      {formatTimer(timerSeconds)}
                    </span>
                  </p>
                )}
              </div>

              {/* Submit & Resend Buttons */}
              <div className="space-y-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-[#D4AF37] via-[#E8C84A] to-[#B8960C] text-[#0F172A] font-extrabold py-3 rounded-xl hover:shadow-xl hover:shadow-[#D4AF37]/25 transition-all duration-300 text-xs flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <span className="animate-pulse">Verifying Code...</span>
                  ) : (
                    <>
                      <span>Verify Email &amp; Complete Registration</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between text-xs pt-2">
                  <span className="text-slate-400 text-[11px]">Didn&apos;t receive the code?</span>

                  <button
                    type="button"
                    onClick={handleResendOtp}
                    className="text-[#D4AF37] hover:underline font-semibold flex items-center gap-1"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Resend Code to Email</span>
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        )}

        {/* ── STEP 3: VERIFICATION SUCCESS SCREEN ── */}
        {step === "verified_success" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-4 space-y-4"
          >
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-2">
              <span className="text-3xl">🎉</span>
              <h2
                className="text-2xl font-bold text-white tracking-tight"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Congratulations!
              </h2>
              <p className="text-emerald-400 font-semibold text-sm">
                Your account has been verified successfully.
              </p>
              <p className="text-slate-300 text-xs max-w-xs mx-auto">
                Your account is ready! Redirecting you directly to your Student Dashboard...
              </p>
            </div>

            <div className="pt-4">
              <Link
                href={`/student/dashboard?welcome=true&email=${encodeURIComponent(form.email)}&name=${encodeURIComponent(`${form.firstName} ${form.lastName}`.trim())}`}
                className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#D4AF37] via-[#E8C84A] to-[#B8960C] text-[#0F172A] font-extrabold py-3.5 px-6 rounded-xl hover:shadow-xl hover:shadow-[#D4AF37]/25 transition-all duration-300 text-xs uppercase tracking-wider"
              >
                <span>Enter Student Dashboard &rarr;</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        )}
      </motion.div>

    </div>
  );
}
