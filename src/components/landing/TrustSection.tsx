"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

/* ── Ticker updates ── */
const updates = [
  "🎓 MtishbiScholars now partners with 50+ universities across 10 countries",
  "📢 New intakes open for China, India & Malaysia — Apply before deadline",
  "🏆 98% of our students receive their visa successfully",
  "✈️ Over 100 students successfully placed in universities abroad",
  "🌍 Study destinations: China · India · UK · Poland · Malaysia · UAE · Canada · Spain · Cyprus · Mauritius",
  "📋 Scholarship opportunities available for qualifying students — enquire today",
];

/* ── Countries & Courses ── */
const countryCourses: Record<string, string[]> = {
  China: [
    "Bachelor of Medicine (MBBS)",
    "Bachelor of Computer Science",
    "Bachelor of Business Administration",
    "Bachelor of Electrical Engineering",
    "Bachelor of Chemical Engineering",
    "Bachelor of Accounting",
    "BA in Chinese Language & Literature",
    "Master of Business Administration (MBA)",
    "Master of Computer Science",
    "PhD in Engineering",
  ],
  India: [
    "Bachelor of Medicine (MBBS)",
    "Bachelor in Engineering (B.Tech)",
    "Bachelor of Business Administration",
    "Bachelor of Computer Applications",
    "Master of Technology (M.Tech)",
    "MBA — Indian Business Schools",
    "Bachelor of Science",
    "PhD Programs",
    "Diploma in Hotel Management",
  ],
  "United Kingdom": [
    "BSc Computer Science",
    "LLB Law",
    "Bachelor of Engineering",
    "MBA — UK Business Schools",
    "MSc Data Science",
    "Bachelor of Medicine (MBBS)",
    "MSc Artificial Intelligence",
    "PhD Research Programs",
  ],
  Malaysia: [
    "Bachelor of Engineering Technology",
    "Bachelor of Business Administration",
    "Bachelor of Computer Science",
    "Bachelor of Accounting",
    "Bachelor of Architecture",
    "Master of Business Administration",
    "PhD in Science",
  ],
  Canada: [
    "Bachelor of Computer Science",
    "Bachelor of Engineering",
    "Master of Business Administration",
    "Master of Science",
    "PhD Programs",
  ],
  Poland: [
    "Bachelor of Medicine (MBBS)",
    "Bachelor of Engineering",
    "Bachelor of Business Administration",
    "Master of International Relations",
    "PhD Programs",
  ],
  Cyprus: [
    "Bachelor of Business Administration",
    "Bachelor of Computer Science",
    "Master of Business Administration",
    "Bachelor of Engineering",
  ],
  UAE: [
    "Bachelor of Business Administration",
    "Bachelor of Engineering",
    "MBA — Dubai Schools",
    "Master of Finance",
    "Bachelor of Architecture",
  ],
  Spain: [
    "Bachelor of Business Administration",
    "Bachelor of Arts",
    "Master of International Business",
    "Bachelor of Engineering",
    "PhD Programs",
  ],
  Mauritius: [
    "Bachelor of Business Administration",
    "Bachelor of Engineering",
    "Master of Business Administration",
    "Bachelor of Tourism & Hospitality",
  ],
};

const allCountries = Object.keys(countryCourses).sort();

export default function TrustSection() {
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [countryOpen, setCountryOpen] = useState(false);
  const [courseOpen, setCourseOpen] = useState(false);
  const router = useRouter();

  const courses = selectedCountry ? countryCourses[selectedCountry] ?? [] : [];

  const handleCountrySelect = (c: string) => {
    setSelectedCountry(c);
    setSelectedCourse("");
    setCountryOpen(false);
  };

  const handleCourseSelect = (c: string) => {
    setSelectedCourse(c);
    setCourseOpen(false);
  };

  const handleGo = () => {
    if (selectedCountry && selectedCourse) router.push("#contact");
  };

  return (
    <section className="relative bg-[#0F172A] border-b border-white/8 z-20" style={{ minHeight: 0 }}>
      <div className="flex flex-col md:flex-row items-stretch min-h-0">

        {/* ── LEFT: Updates Tab + Ticker ── */}
        <div className="flex items-stretch shrink-0 h-11 md:h-20 lg:h-24 border-b md:border-b-0 border-white/8">
          {/* Tab label */}
          <div className="flex items-center justify-center px-3.5 sm:px-5 bg-[#1E293B] border-r border-white/10 shrink-0">
            <span className="text-white/70 text-[10px] font-bold uppercase tracking-[0.15em] whitespace-nowrap"
              style={{ writingMode: "horizontal-tb" }}>
              Updates
            </span>
          </div>

          {/* Ticker */}
          <div className="flex items-center overflow-hidden flex-1 md:w-[min(55vw,680px)]">
            <div className="flex animate-marquee whitespace-nowrap">
              {[...updates, ...updates].map((u, i) => (
                <span key={i} className="inline-flex items-center gap-3 px-4 sm:px-6 text-white/80 text-xs">
                  {u}
                  <span className="text-[#D4AF37]/40 text-base leading-none">·</span>
                </span>
              ))}
            </div>
          </div>

          {/* All updates link */}
          <div className="hidden lg:flex items-center px-4 border-l border-white/8 shrink-0">
            <a href="#contact" className="text-[#D4AF37] text-[10px] font-semibold whitespace-nowrap hover:text-[#E8C84A] transition-colors flex items-center gap-1">
              All updates <ArrowRight className="w-2.5 h-2.5" />
            </a>
          </div>
        </div>

        {/* ── Divider ── */}
        <div className="hidden md:block w-px bg-white/10 shrink-0" />

        {/* ── RIGHT: Courses Tab + Dropdowns ── */}
        <div className="flex items-stretch flex-1 min-w-0 h-12 md:h-20 lg:h-24">
          {/* Tab label */}
          <div className="flex items-center justify-center px-3 sm:px-4 bg-gradient-to-r from-[#7B1113] to-[#9B1B1E] border-r border-white/10 shrink-0">
            <span className="text-white/90 text-[10px] font-bold uppercase tracking-[0.15em] whitespace-nowrap">
              Courses
            </span>
          </div>

          {/* Dropdowns */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-1 px-2 sm:px-4 min-w-0">

            {/* Country dropdown */}
            <div className="relative flex-1 min-w-0 max-w-none md:max-w-[220px]">
              <button
                type="button"
                aria-label="Select Country"
                onClick={() => { setCountryOpen(!countryOpen); setCourseOpen(false); }}
                className="w-full flex items-center justify-between bg-white/8 hover:bg-white/12 border border-white/15 hover:border-[#D4AF37]/40 rounded-lg px-2.5 sm:px-3 py-1.5 sm:py-2 text-left transition-all duration-200"
              >
                <span className={`text-[11px] sm:text-xs truncate ${selectedCountry ? "text-white font-medium" : "text-white/40"}`}>
                  {selectedCountry || "Select country"}
                </span>
                <ChevronDown className={`w-3 h-3 text-white/40 ml-1 shrink-0 transition-transform ${countryOpen ? "rotate-180" : ""}`} />
              </button>

              <AnimatePresence>
                {countryOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scaleY: 0.95 }}
                    animate={{ opacity: 1, y: 0, scaleY: 1 }}
                    exit={{ opacity: 0, y: -6, scaleY: 0.95 }}
                    transition={{ duration: 0.12 }}
                    className="absolute top-full left-0 right-0 mt-1 bg-[#1E293B] border border-white/15 rounded-xl shadow-2xl z-[50] max-h-52 overflow-y-auto"
                  >
                    {allCountries.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => handleCountrySelect(c)}
                        className={`w-full text-left px-3 py-2 text-xs transition-colors hover:bg-[#D4AF37]/15 hover:text-[#D4AF37]
                          ${selectedCountry === c ? "bg-[#D4AF37]/20 text-[#D4AF37] font-semibold" : "text-white/75"}`}
                      >
                        {c}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Course dropdown */}
            <div className="relative flex-1 min-w-0 max-w-none md:max-w-[280px]">
              <button
                type="button"
                aria-label="Select Course"
                onClick={() => { if (selectedCountry) { setCourseOpen(!courseOpen); setCountryOpen(false); } }}
                disabled={!selectedCountry}
                className={`w-full flex items-center justify-between border rounded-lg px-2.5 sm:px-3 py-1.5 sm:py-2 text-left transition-all duration-200
                  ${selectedCountry
                    ? "bg-white/8 hover:bg-white/12 border-white/15 hover:border-[#D4AF37]/40 cursor-pointer"
                    : "bg-white/4 border-white/8 cursor-not-allowed opacity-40"
                  }`}
              >
                <span className={`text-[11px] sm:text-xs truncate ${selectedCourse ? "text-white font-medium" : "text-white/40"}`}>
                  {selectedCourse || "Select course"}
                </span>
                <ChevronDown className={`w-3 h-3 text-white/40 ml-1 shrink-0 transition-transform ${courseOpen ? "rotate-180" : ""}`} />
              </button>

              <AnimatePresence>
                {courseOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scaleY: 0.95 }}
                    animate={{ opacity: 1, y: 0, scaleY: 1 }}
                    exit={{ opacity: 0, y: -6, scaleY: 0.95 }}
                    transition={{ duration: 0.12 }}
                    className="absolute top-full left-0 right-0 mt-1 bg-[#1E293B] border border-white/15 rounded-xl shadow-2xl z-[50] max-h-56 overflow-y-auto"
                  >
                    {courses.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => handleCourseSelect(c)}
                        className={`w-full text-left px-3 py-2 text-xs transition-colors hover:bg-[#D4AF37]/15 hover:text-[#D4AF37]
                          ${selectedCourse === c ? "bg-[#D4AF37]/20 text-[#D4AF37] font-semibold" : "text-white/75"}`}
                      >
                        {c}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Go button */}
            <button
              type="button"
              aria-label="Search Programs"
              onClick={handleGo}
              disabled={!selectedCountry || !selectedCourse}
              className={`shrink-0 px-3.5 sm:px-5 py-1.5 sm:py-2 rounded-lg text-xs font-bold transition-all duration-200
                ${selectedCountry && selectedCourse
                  ? "bg-[#D4AF37] text-[#0F172A] hover:bg-[#E8C84A] hover:shadow-lg hover:shadow-[#D4AF37]/25"
                  : "bg-white/10 text-white/30 cursor-not-allowed"
                }`}
            >
              Go
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
