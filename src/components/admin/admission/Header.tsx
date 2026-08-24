"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { Search, Bell, ChevronDown, LogOut, User, ShieldCheck, Menu } from "lucide-react";
import { useAdminAuth } from "@/components/admin/AdminAuthProvider";
import { createClient } from "@/lib/supabase/client";

interface HeaderProps {
  title?: string;
  onMenuClick?: () => void;
}

export default function Header({ title, onMenuClick }: HeaderProps) {
  const [searchValue, setSearchValue] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { fullName, roleLabel, avatarLetter, logout, profile } = useAdminAuth();

  useEffect(() => {
    async function fetchUnreadCount() {
      try {
        const supabase = createClient();
        const { count, error } = await supabase
          .from("notifications")
          .select("*", { count: "exact", head: true })
          .eq("is_read", false);
        if (!error && count !== null) {
          setUnreadCount(count);
        }
      } catch (err) {
        console.warn("Failed to fetch notification count:", err);
      }
    }
    fetchUnreadCount();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="fixed top-0 left-0 lg:left-[220px] right-0 h-16 bg-white border-b border-slate-200 flex items-center px-3 sm:px-6 gap-2.5 sm:gap-4 z-40">
      {/* Mobile Menu Button */}
      {onMenuClick && (
        <button
          type="button"
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer shrink-0"
          aria-label="Open sidebar menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      )}

      {/* Search */}
      <div className="flex-1 max-w-xs sm:max-w-sm relative min-w-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="w-full pl-9 pr-3 sm:pr-4 py-1.5 sm:py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
        />
      </div>

      <div className="flex-1" />

      {/* Notifications */}
      <Link
        href="/admin/admission/notifications"
        className="relative w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer shrink-0"
      >
        <Bell className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-4.5 sm:h-4.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </Link>

      {/* Profile Dropdown */}
      <div className="relative shrink-0" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2 pl-2 sm:pl-3 pr-1.5 sm:pr-2 py-1.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all cursor-pointer"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0">
            {avatarLetter}
          </div>
          <div className="text-left hidden md:block">
            <p className="text-sm font-semibold text-slate-800 leading-none truncate max-w-[120px]">{fullName}</p>
            <p className="text-[11px] text-slate-500 mt-0.5 truncate">{roleLabel}</p>
          </div>
          <ChevronDown
            className={`w-3.5 h-3.5 text-slate-400 transition-transform shrink-0 ${
              dropdownOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="px-4 py-2.5 border-b border-slate-100">
              <p className="text-xs font-bold text-slate-800 truncate">{fullName}</p>
              <p className="text-[11px] text-slate-500 truncate">{profile?.email}</p>
              <div className="mt-1.5 inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md text-[10px] font-bold">
                <ShieldCheck className="w-3 h-3 text-blue-600" />
                <span>{roleLabel}</span>
              </div>
            </div>

            <div className="py-1">
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  logout();
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors cursor-pointer text-left"
              >
                <LogOut className="w-4 h-4 text-red-500" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

