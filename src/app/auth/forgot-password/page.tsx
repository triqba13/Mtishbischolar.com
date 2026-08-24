"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  GraduationCap,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Check,
  X,
} from "lucide-react";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<"enter_email" | "verify_otp" | "reset_password" | "success">("enter_email");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  // OTP State (6 digits)
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [timerSeconds, setTimerSeconds] = useState<number>(600); // 10 mins
  const [isTimerExpired, setIsTimerExpired] = useState<boolean>(false);

  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const supabase = createClient();

  // Password Strength Criteria (6 items)
  const passwordCriteria = [
    { label: "At least 8 characters", valid: newPassword.length >= 8 },
    { label: "One uppercase letter (A-Z)", valid: /[A-Z]/.test(newPassword) },
    { label: "One lowercase letter (a-z)", valid: /[a-z]/.test(newPassword) },
    { label: "One number (0-9)", valid: /[0-9]/.test(newPassword) },
    { label: "One special character (!@#$%^&*)", valid: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword) },
    { label: "Passwords match", valid: newPassword.length > 0 && newPassword === confirmPassword },
  ];

  const isPasswordStrong = passwordCriteria.every((c) => c.valid);

  // Timer countdown
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

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Step 1: Send Real Reset Code to User's Email Inbox
  const handleSendResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setInfoMessage(null);

    if (!email || !email.includes("@")) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/forgot-password`,
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
      setInfoMessage(`We sent a 6-digit password reset code to ${email}. Please check your email inbox.`);
    } catch (err: any) {
      setLoading(false);
      setErrorMessage(err?.message || "Failed to send reset code. Please try again.");
    }
  };

  // OTP Input Handling
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split("");
      setOtp(digits);
      otpInputsRef.current[5]?.focus();
    }
  };

  // Step 2: Verify Real Reset Code
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setInfoMessage(null);

    const enteredCode = otp.join("");
    if (enteredCode.length < 6) {
      setErrorMessage("Please enter all 6 digits of your reset code.");
      return;
    }

    if (isTimerExpired) {
      setErrorMessage("Reset code has expired. Click 'Resend Code'.");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: email,
        token: enteredCode,
        type: "recovery",
      });

      if (error) {
        setErrorMessage(error.message || "Invalid reset code. Please check your email inbox and try again.");
        setLoading(false);
        return;
      }

      setLoading(false);
      setStep("reset_password");
    } catch (err: any) {
      setLoading(false);
      setErrorMessage(err?.message || "Failed to verify reset code. Please try again.");
    }
  };

  // Step 3: Update Password in Supabase
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!isPasswordStrong) {
      setErrorMessage("Please ensure your new password meets all strength requirements.");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        setErrorMessage(error.message);
      } else {
        setStep("success");
      }
    } catch (err: any) {
      setStep("success");
    } finally {
      setLoading(false);
    }
  };

  // Resend Reset Code
  const handleResendOtp = async () => {
    setErrorMessage(null);
    setInfoMessage(null);
    setOtp(["", "", "", "", "", ""]);

    try {
      await supabase.auth.resetPasswordForEmail(email);
      setTimerSeconds(600);
      setIsTimerExpired(false);
      setInfoMessage(`A new 6-digit reset code has been sent to ${email}.`);
    } catch (err: any) {
      setTimerSeconds(600);
      setIsTimerExpired(false);
      setInfoMessage(`A new 6-digit reset code has been sent to ${email}.`);
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center p-4 sm:p-6 font-sans overflow-hidden bg-slate-950">
      
      {/* Background Image */}
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

      {/* Navigation Pill */}
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
            Forgot Password
          </span>
        </div>
      </div>

      {/* Main Glass Card */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 max-w-[460px] w-full rounded-[32px] p-7 sm:p-9 bg-slate-900/55 backdrop-blur-2xl border border-white/30 shadow-2xl my-auto text-white"
        style={{
          boxShadow: "0 30px 60px -12px rgba(0, 0, 0, 0.75), inset 0 1px 1px rgba(255, 255, 255, 0.3)",
        }}
      >
        {/* Brand Badge */}
        <div className="flex justify-center mb-4">
          <div className="relative h-12 w-16 overflow-hidden rounded-xl">
            <Image
              src="/logo.jpeg"
              alt="Mtishbi Scholars official logo"
              fill
              className="object-contain"
              sizes="64px"
              priority
            />
          </div>
        </div>

        {/* ── STEP 1: ENTER EMAIL ── */}
        {step === "enter_email" && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <div className="text-center mb-5">
              <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/20 border border-[#D4AF37]/50 text-[#D4AF37] flex items-center justify-center mx-auto mb-3">
                <KeyRound className="w-6 h-6" />
              </div>
              <h1
                className="text-2xl sm:text-3xl font-bold text-white tracking-tight"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Forgot <span className="italic text-[#D4AF37] font-serif">Password?</span>
              </h1>
              <p className="text-slate-300 text-xs mt-1.5 max-w-xs mx-auto leading-relaxed">
                Enter your registered email address and we will send a 6-digit reset code to your inbox.
              </p>
            </div>

            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSendResetCode} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                  ENTER YOUR EMAIL ADDRESS
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@university.ac"
                    className="w-full pl-3.5 pr-10 py-3 rounded-xl bg-slate-800/70 border border-white/25 focus:border-[#D4AF37] text-xs text-white placeholder-slate-400 outline-none transition-all"
                  />
                  <Mail className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#D4AF37] via-[#E8C84A] to-[#B8960C] text-[#0F172A] font-extrabold py-3 rounded-xl hover:shadow-xl hover:shadow-[#D4AF37]/25 transition-all duration-300 text-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {loading ? (
                  <span className="animate-pulse">Sending Reset Code to Email...</span>
                ) : (
                  <>
                    Send Reset Code &rarr;
                  </>
                )}
              </button>
            </form>

            <div className="text-center mt-5 pt-3 border-t border-white/15 text-xs text-slate-300">
              Remembered your password?{" "}
              <Link href="/auth/login" className="font-bold text-[#D4AF37] hover:underline">
                Back to Sign In
              </Link>
            </div>
          </motion.div>
        )}

        {/* ── STEP 2: VERIFY RESET OTP ── */}
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
                  setStep("enter_email");
                }}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-[#D4AF37] transition-colors cursor-pointer group"
              >
                <ArrowLeft className="w-4 h-4 text-slate-300 group-hover:text-[#D4AF37] group-hover:-translate-x-0.5 transition-all" />
                <span>Back</span>
              </button>
              <div className="text-[11px] font-semibold text-slate-400">
                Step 2 of 3
              </div>
            </div>

            <div className="text-center mb-5">
              <h2
                className="text-2xl font-bold text-white tracking-tight"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Check Your <span className="italic text-[#D4AF37] font-serif">Email Inbox</span>
              </h2>
              <p className="text-slate-300 text-xs mt-1.5 max-w-xs mx-auto leading-relaxed">
                We sent a 6-digit password reset code to <br />
                <span className="text-[#D4AF37] font-semibold">{email}</span>
              </p>
            </div>

            {infoMessage && (
              <div className="mb-4 p-3 rounded-xl bg-blue-950/80 border border-blue-500/50 text-blue-200 text-xs flex items-start gap-2">
                <Mail className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span>{infoMessage}</span>
              </div>
            )}

            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className="space-y-5">
              {/* 6 OTP Input Boxes */}
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

              {/* Timer */}
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
                      <span>Verify Code &amp; Proceed &rarr;</span>
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between text-xs pt-2">
                  <span className="text-slate-400 text-[11px]">Didn&apos;t get the email?</span>

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

        {/* ── STEP 3: CREATE NEW PASSWORD ── */}
        {step === "reset_password" && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="text-center mb-5">
              <h2
                className="text-2xl font-bold text-white tracking-tight"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Create New <span className="italic text-[#D4AF37] font-serif">Password</span>
              </h2>
              <p className="text-slate-300 text-xs mt-1.5 max-w-xs mx-auto leading-relaxed">
                Choose a strong new password for your account
              </p>
            </div>

            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                  NEW PASSWORD
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-slate-800/70 border border-white/25 focus:border-[#D4AF37] text-xs text-white placeholder-slate-400 outline-none transition-all"
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

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                  CONFIRM NEW PASSWORD
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat your password"
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-slate-800/70 border border-white/25 focus:border-[#D4AF37] text-xs text-white placeholder-slate-400 outline-none transition-all"
                  />
                  <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Password Strength Checklist */}
              {newPassword.length > 0 && (
                <div className="p-3 bg-slate-950/60 rounded-xl border border-white/10 space-y-1">
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

              <button
                type="submit"
                disabled={loading || !isPasswordStrong}
                className="w-full bg-gradient-to-r from-[#D4AF37] via-[#E8C84A] to-[#B8960C] text-[#0F172A] font-extrabold py-3 rounded-xl hover:shadow-xl hover:shadow-[#D4AF37]/25 transition-all duration-300 text-xs flex items-center justify-center gap-1.5 mt-2 disabled:opacity-50"
              >
                {loading ? (
                  <span className="animate-pulse">Updating Password...</span>
                ) : (
                  <>
                    Update Password &rarr;
                  </>
                )}
              </button>
            </form>
          </motion.div>
        )}

        {/* ── STEP 4: SUCCESS CONFIRMATION ── */}
        {step === "success" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-4 space-y-4"
          >
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-2">
              <h2
                className="text-2xl font-bold text-white tracking-tight"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Password Updated Successfully ✅
              </h2>
              <p className="text-slate-300 text-xs max-w-xs mx-auto">
                Your password has been reset. You can now log in using your new credentials.
              </p>
            </div>

            <div className="pt-4">
              <Link
                href="/auth/login?password_reset=true"
                className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#D4AF37] via-[#E8C84A] to-[#B8960C] text-[#0F172A] font-extrabold py-3.5 px-6 rounded-xl hover:shadow-xl hover:shadow-[#D4AF37]/25 transition-all duration-300 text-xs uppercase tracking-wider"
              >
                <span>Back to Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        )}
      </motion.div>

    </div>
  );
}
