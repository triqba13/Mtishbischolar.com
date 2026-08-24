"use client";

import { motion } from "framer-motion";
import { Award, Clock, DollarSign, BookOpen, ArrowRight } from "lucide-react";

const scholarships = [
  {
    name: "CSC Full Scholarship",
    country: "China 🇨🇳",
    type: "Full Scholarship",
    coverage: ["Tuition", "Accommodation", "Monthly Stipend", "Insurance"],
    deadline: "March 2025",
    level: ["Bachelor's", "Master's", "PhD"],
    color: "from-red-500 to-rose-600",
    badge: "Full Funding",
    badgeColor: "bg-red-100 text-red-700",
  },
  {
    name: "Commonwealth Scholarship",
    country: "United Kingdom 🇬🇧",
    type: "Full Scholarship",
    coverage: ["Tuition", "Flights", "Living Allowance", "Thesis Support"],
    deadline: "December 2024",
    level: ["Master's", "PhD"],
    color: "from-blue-500 to-indigo-600",
    badge: "Full Funding",
    badgeColor: "bg-blue-100 text-blue-700",
  },
  {
    name: "ICCR Scholarship",
    country: "India 🇮🇳",
    type: "Full Scholarship",
    coverage: ["Tuition", "Accommodation", "Monthly Stipend"],
    deadline: "April 2025",
    level: ["Bachelor's", "Master's"],
    color: "from-orange-500 to-amber-600",
    badge: "Full Funding",
    badgeColor: "bg-orange-100 text-orange-700",
  },
  {
    name: "MtishbiScholars Merit Award",
    country: "Tanzania 🇹🇿",
    type: "Partial Scholarship",
    coverage: ["Application Fees", "Visa Support", "Counseling"],
    deadline: "Rolling Basis",
    level: ["Bachelor's", "Master's", "PhD"],
    color: "from-[#D4AF37] to-[#B8960C]",
    badge: "Our Own",
    badgeColor: "bg-amber-100 text-amber-700",
  },
  {
    name: "Egyptian Government Scholarship",
    country: "Egypt 🇪🇬",
    type: "Full Scholarship",
    coverage: ["Tuition", "Accommodation", "Arabic Courses"],
    deadline: "February 2025",
    level: ["Bachelor's", "Master's"],
    color: "from-emerald-500 to-teal-600",
    badge: "Government",
    badgeColor: "bg-emerald-100 text-emerald-700",
  },
  {
    name: "Malaysian Government Scholarship",
    country: "Malaysia 🇲🇾",
    type: "Partial Scholarship",
    coverage: ["Tuition Subsidy", "Health Insurance"],
    deadline: "May 2025",
    level: ["Bachelor's", "Master's"],
    color: "from-cyan-500 to-sky-600",
    badge: "Government",
    badgeColor: "bg-cyan-100 text-cyan-700",
  },
];

export default function ScholarshipsSection() {
  return (
    <section id="scholarships" className="py-24 bg-white relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#D4AF37]/30 to-transparent" />
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#D4AF37]/30 to-transparent" />

      <div className="container-wide section-padding relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 bg-[#D4AF37]/10 border border-[#D4AF37]/25 rounded-full px-4 py-1.5 mb-5">
            <Award className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span className="text-[#B8960C] text-xs font-semibold tracking-wider uppercase">
              Scholarships
            </span>
          </div>
          <h2
            className="text-3xl md:text-5xl font-black text-[#0F172A] mb-4 leading-tight"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Funding Your{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] to-[#B8960C]">
              Dream Education
            </span>
          </h2>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto">
            We identify and help you apply for the scholarships best suited to your
            academic profile and financial situation.
          </p>
        </motion.div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {scholarships.map((s, i) => (
            <motion.div
              key={s.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ y: -5 }}
              className="group bg-white rounded-2xl border border-slate-100 hover:border-[#D4AF37]/40 shadow-sm hover:shadow-xl hover:shadow-[#D4AF37]/10 transition-all duration-300 overflow-hidden"
            >
              {/* Top gradient bar */}
              <div className={`h-1.5 bg-gradient-to-r ${s.color}`} />

              <div className="p-6">
                {/* Badge + Country */}
                <div className="flex items-center justify-between mb-4">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${s.badgeColor}`}>
                    {s.badge}
                  </span>
                  <span className="text-xs text-slate-500">{s.country}</span>
                </div>

                {/* Name */}
                <h3
                  className="text-base font-black text-[#0F172A] mb-1 group-hover:text-[#B8960C] transition-colors"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  {s.name}
                </h3>
                <p className="text-slate-400 text-xs mb-4">{s.type}</p>

                {/* Coverage */}
                <div className="mb-4">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Covers
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {s.coverage.map((c) => (
                      <span
                        key={c}
                        className="text-[10px] font-medium bg-slate-50 border border-slate-100 text-slate-600 px-2 py-0.5 rounded-full"
                      >
                        ✓ {c}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Level tags */}
                <div className="flex flex-wrap gap-1.5 mb-5">
                  {s.level.map((l) => (
                    <span
                      key={l}
                      className="text-[10px] font-semibold bg-[#D4AF37]/10 text-[#B8960C] px-2 py-0.5 rounded-full"
                    >
                      {l}
                    </span>
                  ))}
                </div>

                {/* Deadline */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                    <Clock className="w-3 h-3" />
                    <span>Deadline: <strong className="text-slate-700">{s.deadline}</strong></span>
                  </div>
                  <button className="text-[#D4AF37] text-xs font-semibold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    Apply <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-14 bg-gradient-to-br from-[#0F172A] to-[#1E293B] rounded-3xl p-10 border border-white/5"
        >
          <Award className="w-10 h-10 text-[#D4AF37] mx-auto mb-4" />
          <h3
            className="text-2xl md:text-3xl font-black text-white mb-3"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Not Sure Which Scholarship Fits You?
          </h3>
          <p className="text-white/60 max-w-lg mx-auto mb-6">
            Our scholarship advisors analyze your profile and match you with the best
            opportunities — completely free of charge.
          </p>
          <a
            href="#contact"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-[#D4AF37] to-[#E8C84A] text-[#0F172A] font-bold px-8 py-3.5 rounded-2xl hover:shadow-2xl hover:shadow-[#D4AF37]/30 transition-all duration-300 hover:-translate-y-1"
          >
            Get Free Scholarship Assessment
            <ArrowRight className="w-4 h-4" />
          </a>
        </motion.div>
      </div>
    </section>
  );
}
