"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Cookie,
  ShieldCheck,
  Lock,
  BarChart3,
  Ban,
  X,
  SlidersHorizontal,
  Check,
} from "lucide-react";
import { usePathname } from "next/navigation";

export default function CookieConsentBanner() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);

  useEffect(() => {
    // Only show on public pages, not on dashboard areas
    if (pathname.startsWith("/admin") || pathname.startsWith("/student")) {
      setVisible(false);
      setShowPreferences(false);
      return;
    }

    try {
      const consent = localStorage.getItem("mtb_cookie_consent");
      if (!consent) {
        // Delay display slightly to avoid layout shift / LCP interference
        const timer = setTimeout(() => setVisible(true), 1500);
        return () => clearTimeout(timer);
      } else {
        setAnalyticsEnabled(consent === "accepted");
      }
    } catch {
      // Ignore storage errors
    }
  }, [pathname]);

  const handleChoice = useCallback((choice: "accepted" | "declined") => {
    try {
      localStorage.setItem("mtb_cookie_consent", choice);
      window.dispatchEvent(
        new CustomEvent("mtb_cookie_consent_changed", { detail: choice })
      );
    } catch (e) {
      console.warn("Could not save cookie consent choice:", e);
    }
    setAnalyticsEnabled(choice === "accepted");
    setShowPreferences(false);
    setVisible(false);
  }, []);

  const handleSavePreferences = () => {
    const choice = analyticsEnabled ? "accepted" : "declined";
    handleChoice(choice);
  };

  // Handle escape key to close preferences or banner
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showPreferences) {
          setShowPreferences(false);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showPreferences]);

  if (!visible) return null;

  return (
    <>
      {/* Main Cookie Banner */}
      <div
        role="region"
        aria-label="Cookie consent banner"
        className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-lg z-50 animate-in fade-in slide-in-from-bottom-4 duration-300"
      >
        <div className="p-5 rounded-2xl bg-[#0B1528]/95 border border-[#D4AF37]/30 shadow-2xl backdrop-blur-md text-slate-200">
          <div className="flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/25 flex items-center justify-center text-[#D4AF37] shrink-0 mt-0.5">
              <Cookie className="w-4.5 h-4.5" aria-hidden="true" />
            </div>

            <div className="flex-1 space-y-2 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" aria-hidden="true" />
                  <span>Cookie Preferences</span>
                </h3>
                <button
                  type="button"
                  onClick={() => handleChoice("declined")}
                  className="text-slate-400 hover:text-white p-1 rounded transition-colors cursor-pointer"
                  aria-label="Close and reject non-essential cookies"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                We use strictly necessary cookies for authentication and platform security. We also use optional Google Analytics to assess public website navigation. We never use advertising pixels or behavioral trackers.
              </p>

              <div className="pt-2 flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleChoice("accepted")}
                  className="px-3.5 py-1.5 rounded-lg bg-[#D4AF37] hover:bg-[#E8C84A] text-slate-950 font-bold text-xs shadow-sm transition-all cursor-pointer"
                >
                  Accept All
                </button>

                <button
                  type="button"
                  onClick={() => handleChoice("declined")}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium text-xs border border-slate-700 transition-all cursor-pointer"
                >
                  Reject All
                </button>

                <button
                  type="button"
                  onClick={() => setShowPreferences(true)}
                  aria-haspopup="dialog"
                  aria-expanded={showPreferences}
                  className="px-3 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-[#D4AF37] hover:text-[#E8C84A] font-medium text-xs border border-[#D4AF37]/30 transition-all inline-flex items-center gap-1 cursor-pointer"
                >
                  <SlidersHorizontal className="w-3 h-3" aria-hidden="true" />
                  <span>Manage Preferences</span>
                </button>

                <Link
                  href="/cookie-policy"
                  className="text-xs text-slate-400 hover:text-[#D4AF37] underline font-medium ml-auto"
                >
                  Cookie Policy
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Manage Preferences Modal */}
      {showPreferences && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="cookie-preferences-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="w-full max-w-lg max-h-[90vh] flex flex-col rounded-2xl bg-[#0B1528] border border-[#D4AF37]/30 shadow-2xl text-slate-200 overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between gap-3 bg-[#070D18]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/25 flex items-center justify-center text-[#D4AF37]">
                  <SlidersHorizontal className="w-4 h-4" aria-hidden="true" />
                </div>
                <div>
                  <h2
                    id="cookie-preferences-title"
                    className="text-sm sm:text-base font-bold text-white"
                  >
                    Manage Cookie Preferences
                  </h2>
                  <p className="text-xs text-slate-400">
                    Customize your storage and analytics settings
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowPreferences(false)}
                className="text-slate-400 hover:text-white p-1 rounded transition-colors cursor-pointer"
                aria-label="Close preferences modal"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs sm:text-sm">
              {/* Category A: Strictly Necessary */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-[#D4AF37]" aria-hidden="true" />
                    <span className="font-bold text-white">Strictly Necessary</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30">
                    Always Active
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Required for core functionality, secure authentication sessions (Supabase), user logins, and platform security. These cannot be disabled.
                </p>
              </div>

              {/* Category B: Analytics */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-blue-400" aria-hidden="true" />
                    <span className="font-bold text-white">Analytics (Google Analytics 4)</span>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={analyticsEnabled}
                      onChange={(e) => setAnalyticsEnabled(e.target.checked)}
                      className="sr-only peer"
                      aria-label="Toggle Google Analytics"
                    />
                    <div className="w-10 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#D4AF37]" />
                  </label>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Helps us understand public website traffic and navigation trends without collecting sensitive personal information, passports, or academic applications.
                </p>
              </div>

              {/* Category C: Advertising / Marketing */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2 opacity-75">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Ban className="w-4 h-4 text-red-400" aria-hidden="true" />
                    <span className="font-bold text-white">Advertising &amp; Marketing</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-800 text-slate-400 border border-slate-700">
                    Not Used
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  MtishbiScholars does not use advertising pixels, cross-site trackers, or commercial marketing cookies.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-[#070D18] flex items-center justify-between gap-2 flex-wrap">
              <Link
                href="/cookie-policy"
                className="text-xs text-slate-400 hover:text-[#D4AF37] underline"
              >
                Read Cookie Policy
              </Link>

              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => setShowPreferences(false)}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSavePreferences}
                  className="px-4 py-1.5 rounded-lg bg-[#D4AF37] hover:bg-[#E8C84A] text-slate-950 font-bold text-xs shadow-sm transition-all inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Save Preferences</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
