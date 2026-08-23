"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";

type ThemeMode = "light" | "dark" | "system";

interface FinanceThemeContextType {
  theme: ThemeMode;
  effectiveTheme: "light" | "dark";
  setTheme: (mode: ThemeMode) => void;
}

const FinanceThemeContext = createContext<FinanceThemeContextType>({
  theme: "light",
  effectiveTheme: "light",
  setTheme: () => {},
});

export function FinanceThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>("light");
  const [effectiveTheme, setEffectiveTheme] = useState<"light" | "dark">("light");

  // Apply theme to DOM
  const applyTheme = useCallback((mode: ThemeMode) => {
    if (typeof window === "undefined") return;
    const root = document.documentElement;

    let isDark = false;
    if (mode === "dark") {
      isDark = true;
    } else if (mode === "light") {
      isDark = false;
    } else {
      // System
      isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    }

    if (isDark) {
      root.classList.add("dark");
      setEffectiveTheme("dark");
    } else {
      root.classList.remove("dark");
      setEffectiveTheme("light");
    }
  }, []);

  // Update theme setting & persist
  const setTheme = useCallback((newTheme: ThemeMode) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem("mtb_theme", newTheme);
      window.dispatchEvent(new CustomEvent("mtb_theme_change", { detail: newTheme }));
    } catch {}
    applyTheme(newTheme);
  }, [applyTheme]);

  // Initialize on client mount
  useEffect(() => {
    try {
      const savedTheme = (localStorage.getItem("mtb_theme") as ThemeMode) || "light";
      if (savedTheme === "dark" || savedTheme === "light" || savedTheme === "system") {
        setThemeState(savedTheme);
        applyTheme(savedTheme);
      } else {
        setThemeState("light");
        applyTheme("light");
      }
    } catch {
      setThemeState("light");
      applyTheme("light");
    }
  }, [applyTheme]);

  // Listen to OS theme changes when in "system" mode
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = () => {
      const currentStored = (localStorage.getItem("mtb_theme") as ThemeMode) || theme;
      if (currentStored === "system") {
        applyTheme("system");
      }
    };

    mediaQuery.addEventListener("change", handleChange);

    // Listen to custom cross-tab or cross-component theme events
    const handleCustomChange = (e: Event) => {
      const customEvent = e as CustomEvent<ThemeMode>;
      if (customEvent.detail) {
        setThemeState(customEvent.detail);
        applyTheme(customEvent.detail);
      }
    };
    window.addEventListener("mtb_theme_change", handleCustomChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
      window.removeEventListener("mtb_theme_change", handleCustomChange);
    };
  }, [theme, applyTheme]);

  return (
    <FinanceThemeContext.Provider value={{ theme, effectiveTheme, setTheme }}>
      <div className="finance-portal min-h-screen transition-colors duration-200">
        {children}
      </div>
    </FinanceThemeContext.Provider>
  );
}

export function useFinanceTheme() {
  return useContext(FinanceThemeContext);
}
