"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Clock, ShieldAlert, LogOut, CheckCircle2 } from "lucide-react";

interface SessionTimeoutContextType {
  lastActive: number;
  resetTimer: () => void;
  isWarningShowing: boolean;
  secondsRemaining: number;
}

const SessionTimeoutContext = createContext<SessionTimeoutContextType>({
  lastActive: Date.now(),
  resetTimer: () => {},
  isWarningShowing: false,
  secondsRemaining: 60,
});

export const useSessionTimeout = () => useContext(SessionTimeoutContext);

interface SessionTimeoutProviderProps {
  children: React.ReactNode;
  portalType: "student" | "admin";
  timeoutMinutes?: number; // Total idle duration, default 10 minutes
  warningSeconds?: number; // Warning countdown duration before timeout, default 60 seconds
}

export default function SessionTimeoutProvider({
  children,
  portalType,
  timeoutMinutes = 10,
  warningSeconds = 60,
}: SessionTimeoutProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const TOTAL_TIMEOUT_MS = timeoutMinutes * 60 * 1000;
  const WARNING_MS = warningSeconds * 1000;
  const WARNING_THRESHOLD_MS = TOTAL_TIMEOUT_MS - WARNING_MS;
  const STORAGE_KEY = `mtb_last_activity_${portalType}`;

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(warningSeconds);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const lastActivityRef = useRef<number>(Date.now());
  const lastSyncTimeRef = useRef<number>(Date.now());
  const isWarningShowingRef = useRef<boolean>(false);
  isWarningShowingRef.current = showWarning;

  // Read latest active timestamp from memory and localStorage (multi-tab sync)
  const getLatestActivity = useCallback((): number => {
    try {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = parseInt(stored, 10);
          if (!isNaN(parsed) && parsed > lastActivityRef.current) {
            lastActivityRef.current = parsed;
          }
        }
      }
    } catch {
      // Ignore localStorage errors
    }
    return lastActivityRef.current;
  }, [STORAGE_KEY]);

  // Update activity timestamp
  const recordActivity = useCallback(
    (forceSync = false) => {
      // Do not silently dismiss warning with passive mouse movements
      if (isWarningShowingRef.current && !forceSync) return;

      const now = Date.now();
      lastActivityRef.current = now;

      // Throttle localStorage updates to once every 2.5 seconds to avoid performance overhead
      if (forceSync || now - lastSyncTimeRef.current > 2500) {
        lastSyncTimeRef.current = now;
        try {
          if (typeof window !== "undefined") {
            localStorage.setItem(STORAGE_KEY, now.toString());
          }
        } catch {
          // Ignore localStorage errors
        }
      }
    },
    [STORAGE_KEY]
  );

  // Perform logout and redirect with reason
  const handleLogout = useCallback(
    async (reason = "timeout") => {
      if (isLoggingOut) return;
      setIsLoggingOut(true);
      setShowWarning(false);

      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.error("Session timeout signout error:", err);
      } finally {
        try {
          if (typeof window !== "undefined") {
            localStorage.removeItem(STORAGE_KEY);
          }
        } catch {
          // Ignore
        }

        const loginUrl =
          portalType === "admin"
            ? `/admin/login?reason=${reason}`
            : `/auth/login?reason=${reason}`;

        window.location.href = loginUrl;
      }
    },
    [isLoggingOut, portalType, STORAGE_KEY, supabase]
  );

  // Reset timer manually (e.g. user clicks 'Stay Logged In')
  const resetTimer = useCallback(() => {
    recordActivity(true);
    setShowWarning(false);
    setSecondsRemaining(warningSeconds);

    // Refresh auth session silently to keep access token fresh
    supabase.auth.getSession().catch(() => {});
  }, [recordActivity, warningSeconds, supabase]);

  // Check authentication status & route eligibility
  useEffect(() => {
    // Exempt login/register routes
    if (
      pathname?.startsWith("/admin/login") ||
      pathname?.startsWith("/auth/") ||
      pathname === "/"
    ) {
      setIsAuthenticated(false);
      return;
    }

    let isMounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;
      if (session?.user) {
        setIsAuthenticated(true);
        recordActivity(true);
      } else {
        setIsAuthenticated(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      if (session?.user) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        setShowWarning(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [pathname, supabase, recordActivity]);

  // Activity listeners on user interaction
  useEffect(() => {
    if (!isAuthenticated) return;

    const onUserActivity = () => {
      recordActivity(false);
    };

    const events = [
      "mousemove",
      "mousedown",
      "keydown",
      "touchstart",
      "scroll",
      "wheel",
      "click",
    ];

    events.forEach((event) => {
      window.addEventListener(event, onUserActivity, { passive: true });
    });

    // Multi-tab storage sync listener
    const onStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        const val = parseInt(e.newValue, 10);
        if (!isNaN(val)) {
          lastActivityRef.current = val;
          const elapsed = Date.now() - val;
          if (elapsed < WARNING_THRESHOLD_MS) {
            setShowWarning(false);
          }
        }
      }
    };

    window.addEventListener("storage", onStorageChange);

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, onUserActivity);
      });
      window.removeEventListener("storage", onStorageChange);
    };
  }, [isAuthenticated, recordActivity, STORAGE_KEY, WARNING_THRESHOLD_MS]);

  // Periodic heartbeat & visibility change timer
  useEffect(() => {
    if (!isAuthenticated || isLoggingOut) return;

    const checkInactivity = () => {
      const now = Date.now();
      const lastActive = getLatestActivity();
      const elapsed = now - lastActive;

      // 1. Session completely timed out
      if (elapsed >= TOTAL_TIMEOUT_MS) {
        handleLogout("timeout");
        return;
      }

      // 2. Warning period active
      if (elapsed >= WARNING_THRESHOLD_MS) {
        const remainingMs = TOTAL_TIMEOUT_MS - elapsed;
        const remainingSec = Math.max(0, Math.ceil(remainingMs / 1000));
        setSecondsRemaining(remainingSec);
        setShowWarning(true);
      } else {
        // 3. User was active in another tab or active recently
        if (isWarningShowingRef.current) {
          setShowWarning(false);
        }
      }
    };

    // Run check every second
    const interval = setInterval(checkInactivity, 1000);

    // Immediate check on tab focus or visibility change
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkInactivity();
      }
    };

    const onWindowFocus = () => {
      checkInactivity();
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("focus", onWindowFocus);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("focus", onWindowFocus);
    };
  }, [
    isAuthenticated,
    isLoggingOut,
    TOTAL_TIMEOUT_MS,
    WARNING_THRESHOLD_MS,
    getLatestActivity,
    handleLogout,
  ]);

  return (
    <SessionTimeoutContext.Provider
      value={{
        lastActive: lastActivityRef.current,
        resetTimer,
        isWarningShowing: showWarning,
        secondsRemaining,
      }}
    >
      {children}

      {/* Session Inactivity Warning Modal */}
      {showWarning && !isLoggingOut && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="session-timeout-title"
          className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-7 text-center transition-all duration-200">
            {/* Top decorative badge */}
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 shadow-inner">
              <Clock className="h-7 w-7 animate-pulse" />
            </div>

            {/* Modal Heading */}
            <h2
              id="session-timeout-title"
              className="text-xl font-bold text-slate-900 dark:text-white tracking-tight"
            >
              Session Timeout Warning
            </h2>

            {/* Message Body */}
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              You have been inactive for an extended period. For your security,
              your session will automatically expire in:
            </p>

            {/* Countdown Display Card */}
            <div className="my-5 flex items-center justify-center">
              <div
                className={`flex items-center gap-3 px-5 py-3 rounded-xl border transition-all duration-300 ${
                  secondsRemaining <= 20
                    ? "bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 animate-pulse"
                    : "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/50 text-amber-700 dark:text-amber-300"
                }`}
              >
                <ShieldAlert className="h-5 w-5 shrink-0" />
                <span className="text-2xl font-mono font-bold tracking-wider">
                  00:{String(secondsRemaining).padStart(2, "0")}
                </span>
                <span className="text-xs uppercase font-semibold tracking-wide opacity-80">
                  {secondsRemaining === 1 ? "second" : "seconds"}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              Any unsaved progress may be lost if your session expires.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col-reverse sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => handleLogout("manual")}
                className="w-full sm:w-1/2 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 font-medium text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400"
              >
                <LogOut className="h-4 w-4" />
                <span>Log Out</span>
              </button>

              <button
                type="button"
                onClick={resetTimer}
                autoFocus
                className="w-full sm:w-1/2 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Stay Logged In</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </SessionTimeoutContext.Provider>
  );
}
