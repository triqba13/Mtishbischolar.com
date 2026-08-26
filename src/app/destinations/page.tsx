"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { DESTINATIONS, Destination } from "@/data/destinationsData";
import { getCountryFlag } from "@/components/landing/DestinationsSection";
import { createClient } from "@/lib/supabase/client";
import {
  Globe,
  Search,
  GraduationCap,
  Award,
  CheckCircle2,
  DollarSign,
  BookOpen,
  Building2,
  X,
  Send,
  Loader2,
  AlertCircle,
  MapPin,
  Sparkles,
} from "lucide-react";

interface LiveUniversity {
  id: string;
  name: string;
  country: string;
  city: string;
  scholarship?: string;
  description?: string;
  image?: string;
  courses: {
    id: string;
    title: string;
    level: string;
    duration: string;
    tuition_fee: number;
    currency: string;
  }[];
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

export default function DestinationsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<Destination | null>(null);
  const [applyModalCountry, setApplyModalCountry] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [submittedApply, setSubmittedApply] = useState(false);
  const [liveUnis, setLiveUnis] = useState<LiveUniversity[]>([]);
  const [loadingUnis, setLoadingUnis] = useState(true);
  const [errorUnis, setErrorUnis] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session?.user || null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user || null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    async function loadLiveData() {
      try {
        setLoadingUnis(true);
        setErrorUnis(null);
        const supabase = createClient();

        const { data: unisData, error: uErr } = await supabase
          .from("universities")
          .select("*")
          .order("name", { ascending: true });

        if (uErr) {
          throw new Error("Unable to load universities. Please try again.");
        }

        const { data: coursesData } = await supabase
          .from("courses")
          .select("*")
          .order("title", { ascending: true });

        const coursesMap: Record<string, any[]> = {};
        if (coursesData) {
          coursesData.forEach((c) => {
            if (!coursesMap[c.university_id]) {
              coursesMap[c.university_id] = [];
            }
            coursesMap[c.university_id].push(c);
          });
        }

        const formatted: LiveUniversity[] = (unisData || []).map((u) => ({
          id: u.id,
          name: u.name,
          country: u.country,
          city: u.city || u.location || "",
          scholarship: cleanScholarshipLabel(u.scholarship),
          description: u.description || "",
          image: u.image || "/videos/images/india.jpg",
          courses: coursesMap[u.id] || [],
        }));

        setLiveUnis(formatted);
      } catch (err: any) {
        setErrorUnis(err.message || "Failed to load live data.");
      } finally {
        setLoadingUnis(false);
      }
    }

    loadLiveData();
  }, []);

  const handleApplyAction = (countryName: string) => {
    if (currentUser) {
      router.push(`/student/dashboard?country=${encodeURIComponent(countryName)}`);
    } else {
      setApplyModalCountry(countryName);
    }
  };

  const filteredDestinations = DESTINATIONS.filter((d) => {
    const q = searchQuery.toLowerCase();
    const matchingUnis = liveUnis.filter((u) => u.country.toLowerCase() === d.country.toLowerCase());
    return (
      d.country.toLowerCase().includes(q) ||
      d.tagline.toLowerCase().includes(q) ||
      d.description.toLowerCase().includes(q) ||
      matchingUnis.some(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.courses.some((c) => c.title.toLowerCase().includes(q))
      )
    );
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-emerald-600 selection:text-white">
      <Navbar />

      {/* ── Page Header ── */}
      <section className="pt-28 pb-16 relative overflow-hidden bg-gradient-to-b from-emerald-100/70 via-emerald-50/40 to-slate-50 border-b border-emerald-100">
        <div className="absolute top-0 right-1/3 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-10 xl:px-16 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-emerald-600/10 border border-emerald-600/25 rounded-full px-4 py-1.5 mb-4 shadow-2xs">
              <Globe className="w-4 h-4 text-emerald-600" />
              <span className="text-emerald-700 text-xs font-black tracking-wider uppercase">
                Study Abroad Destinations
              </span>
            </div>

            <h1
              className="text-3xl md:text-5xl font-black text-slate-900 leading-tight mb-4 tracking-tight"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Explore Live Opportunities Across{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-800">
                Global Destinations
              </span>
            </h1>

            <p className="text-slate-600 text-base md:text-lg mb-8 leading-relaxed font-normal">
              Find accredited partner universities, live courses, tuition fees, and guaranteed scholarship opportunities for African students.
            </p>

            {/* Search Input */}
            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by country, university, or course (e.g. India, Vistula, Computer Science)..."
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white border border-slate-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 text-slate-800 placeholder-slate-400 text-sm outline-none transition-all shadow-lg shadow-emerald-950/5"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700 font-bold"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Main Destinations Grid ── */}
      <main className="flex-1 py-12 max-w-[1440px] mx-auto px-4 md:px-6 lg:px-10 xl:px-16 w-full">
        {loadingUnis && (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            <p className="text-sm font-semibold">Loading live destinations from database...</p>
          </div>
        )}

        {errorUnis && !loadingUnis && (
          <div className="max-w-md mx-auto bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl p-4 text-center space-y-2 my-8">
            <AlertCircle className="w-6 h-6 text-rose-500 mx-auto" />
            <p className="text-sm font-semibold">{errorUnis}</p>
          </div>
        )}

        {!loadingUnis && !errorUnis && (
          <>
            <div className="flex items-center justify-between mb-8">
              <p className="text-slate-600 text-sm font-medium">
                Showing <span className="text-slate-900 font-extrabold">{filteredDestinations.length}</span> countries available
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredDestinations.map((dest, i) => {
                const unisInDest = liveUnis.filter(
                  (u) => u.country.toLowerCase() === dest.country.toLowerCase()
                );

                return (
                  <motion.div
                    key={dest.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    id={dest.id}
                    className="bg-white border border-emerald-100 hover:border-emerald-400 rounded-3xl overflow-hidden shadow-xl shadow-emerald-950/5 hover:shadow-2xl transition-all duration-300 flex flex-col group"
                  >
                    {/* Image Header — Country Flag as main background */}
                    <div className="relative h-56 w-full overflow-hidden">
                      <Image
                        src={getCountryFlag(dest.country)}
                        alt={`${dest.country} flag`}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-slate-950/20" />

                      {/* Country Badge */}
                      <div className="absolute top-4 left-4 bg-slate-900/85 backdrop-blur-md border border-slate-700/80 px-3.5 py-1.5 rounded-full flex items-center gap-2 shadow-sm">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" aria-hidden="true" />
                        <span className="text-white font-extrabold text-base">{dest.country}</span>
                      </div>

                      {/* Scholarship Tag */}
                      <div className="absolute bottom-4 right-4 bg-emerald-600 text-white font-extrabold text-xs px-3.5 py-1.5 rounded-lg shadow-lg z-10">
                        {dest.scholarshipMax}
                      </div>
                    </div>

                    {/* Body */}
                    <div className="p-6 flex-1 flex flex-col justify-between">
                      <div>
                        <h3
                          className="text-xl font-bold text-slate-900 mb-2 leading-snug group-hover:text-emerald-700 transition-colors"
                          style={{ fontFamily: "var(--font-heading)" }}
                        >
                          {dest.tagline}
                        </h3>
                        <p className="text-slate-600 text-xs leading-relaxed mb-6 font-normal">
                          {dest.description}
                        </p>

                        {/* Highlights checklist */}
                        <div className="space-y-2 mb-6">
                          {dest.highlights.map((h, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-xs text-slate-700 font-medium">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                              <span>{h}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="border-t border-slate-100 pt-5 space-y-3">
                        <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                          <span className="flex items-center gap-1.5 font-bold text-slate-700">
                            <Building2 className="w-4 h-4 text-emerald-600" />
                            {unisInDest.length} Live Universities
                          </span>
                          <span className="flex items-center gap-1.5 font-bold text-slate-800">
                            <DollarSign className="w-4 h-4 text-emerald-600" />
                            {dest.avgTuition}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => setSelectedCountry(dest)}
                            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold py-2.5 rounded-xl border border-slate-200 text-xs transition-all flex items-center justify-center gap-1.5"
                          >
                            <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                            <span>View Courses</span>
                          </button>

                          <button
                            onClick={() => handleApplyAction(dest.country)}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-2.5 rounded-xl hover:shadow-lg transition-all text-xs flex items-center justify-center gap-1 shadow-md shadow-emerald-600/20 cursor-pointer"
                          >
                            <span>Apply Now &rarr;</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </>
        )}
      </main>

      {/* ── Detailed Country & University Modal ── */}
      <AnimatePresence>
        {selectedCountry && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-emerald-100 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-10 text-slate-800 relative shadow-2xl space-y-8"
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedCountry(null)}
                className="absolute top-6 right-6 w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-all z-10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
                <div className="flex items-center gap-4">
                  <div className="relative w-12 h-8 rounded-lg overflow-hidden border border-slate-200 shadow-md shrink-0">
                    <Image
                      src={getCountryFlag(selectedCountry.country)}
                      alt={`${selectedCountry.country} flag`}
                      fill
                      className="object-cover"
                      sizes="48px"
                    />
                  </div>
                  <div>
                    <h2
                      className="text-3xl font-black text-slate-900"
                      style={{ fontFamily: "var(--font-heading)" }}
                    >
                      Study in {selectedCountry.country}
                    </h2>
                    <p className="text-emerald-700 text-sm font-extrabold mt-1">
                      {cleanScholarshipLabel(selectedCountry.scholarshipMax)} &bull; Live Partner Institutions
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    const countryName = selectedCountry.country;
                    setSelectedCountry(null);
                    handleApplyAction(countryName);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-6 py-3 rounded-xl hover:shadow-xl transition-all text-sm shrink-0 self-start sm:self-auto shadow-md shadow-emerald-600/20 cursor-pointer"
                >
                  Start Application for {selectedCountry.country} &rarr;
                </button>
              </div>

              {/* Description */}
              <div className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100">
                <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                  {selectedCountry.description}
                </p>
              </div>

              {/* Partner Universities List from Supabase */}
              <div className="space-y-4">
                <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-emerald-600" />
                  <span>Live Partner Universities &amp; Programmes</span>
                </h3>

                {(() => {
                  const countryUnis = liveUnis.filter(
                    (u) => u.country.toLowerCase() === selectedCountry.country.toLowerCase()
                  );

                  if (countryUnis.length === 0) {
                    return (
                      <div className="text-center py-8 bg-emerald-50/60 border border-emerald-200 rounded-2xl p-6 space-y-1.5">
                        <Building2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                        <p className="text-emerald-950 font-black text-sm uppercase tracking-wider">APPLICATION AVAILABLE</p>
                        <p className="text-slate-600 text-xs font-medium">Apply through the Student Dashboard to continue your application.</p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-4">
                      {countryUnis.map((uni) => (
                        <div
                          key={uni.id}
                          className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 md:p-6 space-y-4"
                        >
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200/60 pb-4">
                            <div>
                              <h4 className="text-lg font-bold text-slate-900">{uni.name}</h4>
                              <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                                <span>{uni.city}, {uni.country}</span>
                              </p>
                            </div>
                            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-extrabold rounded-full w-fit">
                              {cleanScholarshipLabel(uni.scholarship)}
                            </span>
                          </div>

                          {/* Courses Offered */}
                          <div>
                            <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                              {uni.courses.length > 0 ? `Offered Courses (${uni.courses.length}):` : "APPLICATION AVAILABLE"}
                            </p>
                            {uni.courses.length > 0 ? (
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                {uni.courses.map((c) => (
                                  <div
                                    key={c.id}
                                    className="bg-white p-3 rounded-xl border border-emerald-100 shadow-2xs flex flex-col justify-between"
                                  >
                                    <div>
                                      <p className="text-xs font-bold text-slate-900">{c.title}</p>
                                      <p className="text-[11px] text-slate-500">{c.level} &bull; {c.duration}</p>
                                    </div>
                                    <p className="text-[11px] font-extrabold text-emerald-700 mt-2">
                                      ${c.tuition_fee} {c.currency}/yr
                                    </p>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl p-3 font-medium">
                                Apply through the Student Dashboard to continue your university application.
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

              {/* Bottom CTA */}
              <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-xs text-slate-600 text-center sm:text-left">
                  Ready to start your application process for <strong className="text-slate-900">{selectedCountry.country}</strong>?
                </p>
                <button
                  onClick={() => {
                    const countryName = selectedCountry.country;
                    setSelectedCountry(null);
                    handleApplyAction(countryName);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-6 py-3 rounded-xl shadow-md transition-all text-xs shrink-0 cursor-pointer"
                >
                  Apply to {selectedCountry.country} Now &rarr;
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Student Portal Login Requirement Modal ── */}
      <AnimatePresence>
        {applyModalCountry && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-emerald-100 rounded-3xl max-w-md w-full p-6 md:p-8 text-slate-800 relative shadow-2xl space-y-6 text-center"
            >
              <button
                onClick={() => setApplyModalCountry(null)}
                className="absolute top-5 right-5 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-3xl flex items-center justify-center mx-auto shadow-md">
                <GraduationCap className="w-8 h-8 text-emerald-600" />
              </div>

              <div className="space-y-2">
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-[11px] font-extrabold rounded-full uppercase tracking-wider">
                  Student Portal Login Required
                </span>
                <h3 className="text-2xl font-black text-slate-900">
                  Apply for {applyModalCountry}
                </h3>
                <p className="text-slate-600 text-xs leading-relaxed">
                  To complete your official university application for <strong className="text-emerald-700 font-bold">{applyModalCountry}</strong>, you need to log in to your <strong>MtishbiScholars Student Dashboard</strong>.
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-left space-y-2 text-xs">
                <p className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                  <span>Student Dashboard Features:</span>
                </p>
                <ul className="space-y-1.5 text-slate-600 text-[11px]">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>10-Step Guided University Application Wizard</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Select up to 3 Partner Universities by Priority</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Real-time Offer Letter &amp; Scholarship Tracking</span>
                  </li>
                </ul>
              </div>

              <div className="space-y-2 pt-2">
                <Link
                  href={`/auth/login?redirect=${encodeURIComponent('/student/dashboard?country=' + applyModalCountry)}`}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3.5 rounded-xl shadow-lg shadow-emerald-600/20 transition-all text-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Log In to Student Dashboard &rarr;</span>
                </Link>

                <Link
                  href={`/auth/register?country=${encodeURIComponent(applyModalCountry)}`}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold py-3 rounded-xl border border-slate-200 transition-all text-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Create New Student Account</span>
                </Link>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}
