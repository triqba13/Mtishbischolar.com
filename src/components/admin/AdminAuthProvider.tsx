"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

export interface OfficerProfile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: 'super_admin' | 'admission_officer' | 'finance_officer' | 'student';
  phone: string | null;
  avatar_url: string | null;
}

interface AdminAuthContextType {
  user: User | null;
  profile: OfficerProfile | null;
  loading: boolean;
  role: string | null;
  fullName: string;
  avatarLetter: string;
  roleLabel: string;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType>({
  user: null,
  profile: null,
  loading: true,
  role: null,
  fullName: 'Admin Officer',
  avatarLetter: 'A',
  roleLabel: 'Officer',
  logout: async () => {},
  refreshProfile: async () => {},
});

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<OfficerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  const fetchOfficerProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      setUser(user);

      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name, role, phone, avatar_url')
        .eq('id', user.id)
        .maybeSingle();

      if (error || !data) {
        console.error('Error fetching officer profile:', error);
      } else {
        setProfile(data as OfficerProfile);
      }
    } catch (err) {
      console.error('Unexpected error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Immediate admin theme loader
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("mtishbi_admin_theme") || "light";
      const root = document.documentElement;
      root.classList.remove("theme-dark", "theme-gold-dark");
      if (savedTheme === "dark") {
        root.classList.add("theme-dark");
        root.setAttribute("data-theme", "dark");
      } else if (savedTheme === "gold_dark") {
        root.classList.add("theme-gold-dark");
        root.setAttribute("data-theme", "gold_dark");
      } else if (savedTheme === "system") {
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        if (prefersDark) {
          root.classList.add("theme-dark");
          root.setAttribute("data-theme", "dark");
        } else {
          root.removeAttribute("data-theme");
        }
      } else {
        root.removeAttribute("data-theme");
      }
    }

    fetchOfficerProfile();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchOfficerProfile();
      } else {
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Real-time Officer Presence Heartbeat (every 45 seconds & on tab focus)
  useEffect(() => {
    if (!user?.id) return;

    const sendHeartbeat = async () => {
      try {
        await supabase
          .from("profiles")
          .update({ last_seen_at: new Date().toISOString() })
          .eq("id", user.id);
      } catch (err) {
        // Non-fatal heartbeat warning
      }
    };

    // Immediate heartbeat on mount
    sendHeartbeat();

    // Periodic heartbeat every 45s
    const interval = setInterval(sendHeartbeat, 45000);

    // Heartbeat when officer refocuses tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        sendHeartbeat();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [user?.id]);

  const logout = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    window.location.href = "/admin/login";
  };

  const role = profile?.role || null;
  const fullName = profile
    ? [profile.first_name, profile.last_name].filter(Boolean).join(" ") ||
      profile.email ||
      "Officer"
    : "Admin Officer";

  const avatarLetter = fullName.slice(0, 1).toUpperCase() || "A";

  let roleLabel = "Officer";
  if (role === "super_admin") roleLabel = "Super Admin";
  else if (role === "admission_officer") roleLabel = "Admission Officer";
  else if (role === "finance_officer") roleLabel = "Finance Officer";

  return (
    <AdminAuthContext.Provider
      value={{
        user,
        profile,
        loading,
        role,
        fullName,
        avatarLetter,
        roleLabel,
        logout,
        refreshProfile: fetchOfficerProfile,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  return useContext(AdminAuthContext);
}