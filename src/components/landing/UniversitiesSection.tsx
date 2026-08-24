"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GraduationCap, Loader2, AlertCircle, Lock, ArrowRight } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface UniversityWithCourses {
  id: string;
  name: string;
  country: string;
  city: string;
  flag: string;
  scholarship: string;
  description: string;
  image: string;
  courses: string[];
}

function cleanScholarshipLabel(label?: string | null): string {
  if (!label) return "Scholarship Available";
  const trimmed = label.trim();
  if (
    /guaranteed/i.test(trimmed) ||
    /(?:50%|100%|\d+%).*scholarship/i.test(trimmed) ||
    /scholarship.*(?:50%|100%|\d+%)/i.test(trimmed) ||
    /flat\s*50%/i.test(trimmed) ||
    /50%.*waiver/i.test(trimmed)
  ) {
    return "Scholarship Guaranteed";
  }
  return trimmed;
}

export default function UniversitiesSection() {
  const [dbUniversities, setDbUniversities] = useState<UniversityWithCourses[]>([]);
  const [countries, setCountries] = useState<string[]>([]);
  const [activeCountry, setActiveCountry] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        const supabase = createClient();
        const { data: unisData, error: unisErr } = await supabase
          .from("universities")
          .select("*")
          .order("name", { ascending: true });

        if (unisErr) {
          throw new Error("Unable to load universities. Please try again.");
        }

        const { data: coursesData } = await supabase
          .from("courses")
          .select("*")
          .order("title", { ascending: true });

        const coursesByUni: Record<string, string[]> = {};
        if (coursesData) {
          coursesData.forEach((c: any) => {
            if (!coursesByUni[c.university_id]) {
              coursesByUni[c.university_id] = [];
            }
            coursesByUni[c.university_id].push(c.title);
          });
        }

        const formatted: UniversityWithCourses[] = (unisData || []).map((u: any) => ({
          id: u.id,
          name: u.name,
          country: u.country || "Other",
          city: u.city || u.location || "",
          flag: u.flag || "🌐",
          scholarship: cleanScholarshipLabel(u.scholarship),
          description: u.description || "",
          image: u.image || "/videos/images/india.jpg",
          courses: coursesByUni[u.id] || [],
        }));

        setDbUniversities(formatted);

        // Group unique countries
        const uniqueCountries = Array.from(new Set(formatted.map((u) => u.country))).filter(Boolean);
        setCountries(uniqueCountries);
        if (uniqueCountries.length > 0) {
          setActiveCountry(uniqueCountries[0]);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load universities from database.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const currentUniversities = dbUniversities.filter(
    (u) => u.country.toLowerCase() === activeCountry.toLowerCase()
  );

  // Maximum 3 universities displayed per country on the landing page
  const displayedUniversities = currentUniversities.slice(0, 3);
  const remainingCount = currentUniversities.length - displayedUniversities.length;

  return (
    <section id="universities" className="py-12 bg-slate-50 relative overflow-hidden">
      <div className="absolute top-20 left-10 w-72 h-72 bg-[#D4AF37]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 right-10 w-72 h-72 bg-[#0F172A]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="container-wide section-padding relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 bg-[#D4AF37]/10 border border-[#D4AF37]/25 rounded-full px-4 py-1.5 mb-5">
            <GraduationCap className="w-3.5 h-3.5 text-[#B8960C]" />
            <span className="text-[#B8960C] text-xs font-semibold tracking-wider uppercase">
              Featured University Partners
            </span>
          </div>
          <h2
            className="text-3xl md:text-4xl font-black text-[#0F172A] mb-3 leading-tight"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Accredited Universities,{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] to-[#B8960C]">
              Direct Admissions
            </span>
          </h2>
          <p className="text-slate-500 text-base max-w-2xl mx-auto">
            Explore featured accredited partner universities. Log in to your Student Dashboard to access all institutions and submit applications.
          </p>
        </motion.div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#B8960C]" />
            <p className="text-sm font-medium">Loading universities from database...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="max-w-md mx-auto bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl p-4 text-center space-y-2 mb-10">
            <AlertCircle className="w-6 h-6 text-rose-500 mx-auto" />
            <p className="text-sm font-semibold">{error}</p>
          </div>
        )}

        {/* Content */}
        {!loading && !error && (
          <>
            {/* ── Country Tabs ── */}
            <div className="flex flex-wrap justify-center gap-2 mb-10">
              {countries.map((country) => (
                <button
                  key={country}
                  onClick={() => setActiveCountry(country)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 border ${
                    activeCountry.toLowerCase() === country.toLowerCase()
                      ? "bg-[#0F172A] text-white border-[#0F172A] shadow-md"
                      : "bg-white text-slate-600 border-slate-200 hover:border-[#D4AF37]/60 hover:text-[#B8960C]"
                  }`}
                >
                  {country}
                </button>
              ))}
            </div>

            {/* Empty State for Country */}
            {currentUniversities.length === 0 && (
              <div className="text-center py-12 bg-white border border-emerald-200/80 rounded-3xl p-8 max-w-md mx-auto space-y-2">
                <GraduationCap className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
                <p className="text-emerald-950 font-black text-base uppercase tracking-wider">APPLICATION AVAILABLE</p>
                <p className="text-slate-600 text-xs">Apply through the Student Dashboard to continue your application.</p>
              </div>
            )}

            {/* ── University Cards (Max 3 Displayed) ── */}
            {displayedUniversities.length > 0 && (
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeCountry}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {displayedUniversities.map((uni, i) => (
                      <motion.div
                        key={uni.id}
                        initial={{ opacity: 0, scale: 0.97 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className="bg-white rounded-2xl p-6 border border-slate-100 hover:border-[#D4AF37]/40 shadow-sm hover:shadow-xl hover:shadow-[#D4AF37]/8 transition-all duration-300 group flex flex-col justify-between"
                      >
                        <div>
                          {/* Top */}
                          <div className="flex items-start justify-between mb-4">
                            <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center">
                              <GraduationCap className="w-5 h-5 text-[#B8960C]" />
                            </div>
                            <span className="text-[10px] font-bold bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full uppercase tracking-wide">
                              Verified Partner
                            </span>
                          </div>

                          <h3
                            className="text-base font-black text-[#0F172A] mb-1 group-hover:text-[#B8960C] transition-colors"
                            style={{ fontFamily: "var(--font-heading)" }}
                          >
                            {uni.name}
                          </h3>

                          <p className="text-slate-500 text-xs mb-3 flex items-center gap-1 font-medium">
                            📍 {uni.city}, {uni.country}
                          </p>

                          <p className="text-[#D4AF37] text-xs font-semibold mb-4">
                            ✦ {uni.scholarship}
                          </p>

                          {/* Programs */}
                          <div className="mb-4">
                            <p className="text-[11px] font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                              {uni.courses.length > 0 ? `Available Courses (${uni.courses.length}):` : "APPLICATION AVAILABLE"}
                            </p>
                            {uni.courses.length > 0 ? (
                              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                                {uni.courses.slice(0, 5).map((p) => (
                                  <span
                                    key={p}
                                    className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-medium"
                                  >
                                    {p}
                                  </span>
                                ))}
                                {uni.courses.length > 5 && (
                                  <span className="text-[10px] bg-amber-50 text-[#B8960C] border border-amber-200 px-2 py-0.5 rounded-full font-bold">
                                    +{uni.courses.length - 5} more
                                  </span>
                                )}
                              </div>
                            ) : (
                              <p className="text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg p-2 font-medium">
                                Apply through the Student Dashboard to continue your university application.
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-2">
                          <span className="text-[#D4AF37] text-xs font-bold">Featured Partner</span>
                          <Link
                            href="/destinations"
                            className="text-xs text-[#0F172A] font-semibold hover:text-[#B8960C] transition-colors flex items-center gap-1"
                          >
                            Explore Programs →
                          </Link>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Banner for remaining universities */}
                  {remainingCount > 0 && (
                    <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-5 border border-slate-700 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
                          <Lock className="w-5 h-5 text-amber-400" />
                        </div>
                        <div>
                          <p className="font-extrabold text-sm text-slate-100">
                            +{remainingCount} More Accredited Universities in {activeCountry} Available!
                          </p>
                          <p className="text-slate-400 text-xs mt-0.5">
                            Log in to your Student Dashboard to view all {currentUniversities.length} partner institutions, full course catalogs, and submit your application.
                          </p>
                        </div>
                      </div>

                      <Link
                        href="/auth/login"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold px-5 py-2.5 rounded-xl transition-all shadow-md shrink-0 flex items-center justify-center gap-1.5"
                      >
                        <span>Log In to View All Universities ({currentUniversities.length})</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            )}
          </>
        )}

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-10"
        >
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 bg-[#0F172A] text-white font-semibold px-8 py-3.5 rounded-2xl hover:bg-[#1E293B] hover:shadow-xl transition-all duration-300 text-sm"
          >
            Apply Through Student Portal &rarr;
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
