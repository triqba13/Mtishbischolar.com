"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { Home, ChevronRight, ExternalLink, RefreshCw, Search, Building2, AlertTriangle } from "lucide-react";
import { useAdminAuth } from "@/components/admin/AdminAuthProvider";
import { createClient } from "@/lib/supabase/client";

export interface UniversityItem {
  id: string;
  name: string;
  country: string;
  location: string;
  active: number;
  scholarship: string;
  accreditation: string;
}

export default function UniversitiesPage() {
  const { loading: authLoading } = useAdminAuth();
  const [universities, setUniversities] = useState<UniversityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("All Countries");

  const loadUniversities = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      const res = await fetch("/api/admin/admission/universities", {
        headers,
        credentials: "include",
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to load universities.");
      }

      setUniversities(json.universities || []);
    } catch (err: any) {
      console.error("[UniversitiesPage] Error fetching universities:", err);
      setError(err.message || "Failed to load universities.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) {
      loadUniversities();
    }
  }, [authLoading, loadUniversities]);

  const countries = useMemo(() => {
    return ["All Countries", ...Array.from(new Set(universities.map((u) => u.country).filter(Boolean)))];
  }, [universities]);

  const filtered = useMemo(() => {
    return universities.filter((u) => {
      const matchSearch =
        !search.trim() ||
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.location.toLowerCase().includes(search.toLowerCase()) ||
        u.country.toLowerCase().includes(search.toLowerCase());

      const matchCountry = selectedCountry === "All Countries" || u.country === selectedCountry;

      return matchSearch && matchCountry;
    });
  }, [universities, search, selectedCountry]);

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2">
          <Home className="w-3.5 h-3.5" />
          <ChevronRight className="w-3 h-3" />
          <Link href="/admin/admission/dashboard" className="hover:text-blue-600">
            Dashboard
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-600 font-medium">Universities</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Universities</h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-0.5 sm:mt-1">Active university partnerships and real application counts.</p>
          </div>
          <button
            onClick={loadUniversities}
            disabled={loading}
            className="self-start sm:self-auto flex items-center gap-2 px-3 sm:px-3.5 py-2 sm:py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-600 hover:bg-slate-50 shadow-sm transition-all cursor-pointer disabled:opacity-60"
            title="Refresh universities"
          >
            <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 ${loading ? "animate-spin" : ""}`} />
            <span className="text-xs font-semibold">Refresh</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
          <button
            onClick={loadUniversities}
            className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-white p-3 sm:p-4 rounded-2xl border border-slate-200">
        <div className="relative flex-1 min-w-0 sm:min-w-[200px] sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search university or country..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
        <select
          value={selectedCountry}
          onChange={(e) => setSelectedCountry(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
        >
          {countries.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-3 bg-white rounded-2xl border border-slate-200">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
          <p className="text-sm font-medium">Loading partner universities...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
          <Building2 className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No partner universities found matching criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
          {filtered.map((u) => (
            <div
              key={u.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-lg">
                  {u.name.charAt(0)}
                </div>
                <span className="text-[11px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                  {u.country}
                </span>
              </div>
              <h3 className="font-semibold text-slate-800 text-sm">{u.name}</h3>
              <p className="text-xs text-slate-500 mt-0.5">{u.location}</p>
              <p className="text-[11px] text-emerald-600 font-medium mt-0.5">{u.scholarship}</p>
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                <div>
                  <p className="text-[11px] text-slate-400 font-semibold">Active Applications</p>
                  <p className="text-lg font-bold text-slate-800">{u.active}</p>
                </div>
                <Link
                  href={`/admin/admission/applications?search=${encodeURIComponent(u.name)}`}
                  className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                >
                  View Apps <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
