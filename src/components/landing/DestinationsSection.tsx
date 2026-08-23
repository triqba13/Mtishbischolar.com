"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import {
  Globe,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Sparkles,
  Award,
  BookOpen,
  X,
  CheckCircle2,
} from "lucide-react";
import { DESTINATIONS, Destination } from "@/data/destinationsData";

export default function DestinationsSection() {
  // Only 5 popular countries on the landing page
  const popularDestinations = DESTINATIONS.filter((d) => d.popular).slice(0, 5);
  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = direction === "left" ? -400 : 400;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  return (
    <section id="destinations" className="py-16 bg-slate-900 text-white relative overflow-hidden">
      {/* Glow decorations */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-10 xl:px-16 relative z-10">

        {/* ── Section Header & Controls ── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 bg-[#D4AF37]/15 border border-[#D4AF37]/30 rounded-full px-4 py-1.5 mb-3">
              <Globe className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span className="text-[#D4AF37] text-xs font-semibold tracking-wider uppercase">
                Study Destinations
              </span>
            </div>
            <h2
              className="text-2xl md:text-4xl font-black text-white leading-tight"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Popular Countries for{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#B8960C]">
                African Students
              </span>
            </h2>
            <p className="text-slate-400 text-sm md:text-base mt-2 max-w-xl">
              Explore top study destinations with guaranteed scholarships, world-class universities, and easy visa assistance.
            </p>
          </motion.div>

          {/* Right — Action & Scroll buttons */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="hidden sm:flex items-center gap-2">
              <button
                onClick={() => scroll("left")}
                aria-label="Previous destination"
                className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 hover:border-[#D4AF37] flex items-center justify-center text-slate-300 hover:text-white transition-all"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => scroll("right")}
                aria-label="Next destination"
                className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 hover:border-[#D4AF37] flex items-center justify-center text-slate-300 hover:text-white transition-all"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <Link
              href="/destinations"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[#D4AF37] to-[#B8960C] text-[#0F172A] font-bold px-5 py-2.5 rounded-xl hover:shadow-lg hover:shadow-[#D4AF37]/20 transition-all text-sm shrink-0"
            >
              View All Countries
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* ── Horizontal Scrollable Cards ── */}
        <div
          ref={scrollRef}
          className="flex gap-6 overflow-x-auto pb-6 scrollbar-none snap-x snap-mandatory"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {popularDestinations.map((dest, index) => (
            <motion.div
              key={dest.id}
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="w-[300px] sm:w-[340px] md:w-[380px] shrink-0 snap-start group bg-slate-800/80 border border-slate-700/80 hover:border-[#D4AF37]/50 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl hover:shadow-[#D4AF37]/10 transition-all duration-300 flex flex-col cursor-pointer"
              onClick={() => setSelectedDestination(dest)}
            >
              {/* Image banner */}
              <div className="relative h-48 sm:h-52 w-full overflow-hidden">
                <Image
                  src={dest.image}
                  alt={dest.country}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 640px) 300px, 380px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/30 to-transparent" />

                {/* Flag & Name Badge */}
                <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-md border border-slate-700/80 px-3 py-1.5 rounded-full flex items-center gap-2">
                  <span className="text-xl">{dest.flag}</span>
                  <span className="text-white font-bold text-sm">{dest.country}</span>
                </div>

                {/* Scholarship Badge */}
                <div className="absolute bottom-3 right-4 bg-[#D4AF37] text-[#0F172A] text-xs font-black px-3 py-1 rounded-md shadow-md">
                  {dest.scholarshipMax}
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3
                    className="text-lg font-bold text-white mb-2 group-hover:text-[#D4AF37] transition-colors"
                    style={{ fontFamily: "var(--font-heading)" }}
                  >
                    {dest.tagline}
                  </h3>
                  <p className="text-slate-400 text-xs line-clamp-2 leading-relaxed mb-4">
                    {dest.description}
                  </p>
                </div>

                {/* Footer details */}
                <div className="border-t border-slate-700/60 pt-4 flex items-center justify-between text-xs text-slate-300">
                  <div className="flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-[#D4AF37]" />
                    <span>{dest.universitiesCount}</span>
                  </div>

                  <button className="text-[#D4AF37] font-semibold hover:underline flex items-center gap-1">
                    Explore Details &rarr;
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom indicator */}
        <div className="flex justify-center mt-4">
          <Link
            href="/destinations"
            className="text-xs text-slate-400 hover:text-[#D4AF37] flex items-center gap-1 border-b border-slate-700 hover:border-[#D4AF37] pb-0.5 transition-all"
          >
            Showing 5 popular destinations &bull; View all 10+ countries available &rarr;
          </Link>
        </div>

      </div>

      {/* ── Quick Country Preview Modal ── */}
      {selectedDestination && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 text-white relative shadow-2xl space-y-6"
          >
            <button
              onClick={() => setSelectedDestination(null)}
              className="absolute top-5 right-5 w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-2">
              <span className="text-4xl">{selectedDestination.flag}</span>
              <div>
                <h3 className="text-2xl font-black text-white">{selectedDestination.country}</h3>
                <p className="text-xs text-[#D4AF37] font-bold">{selectedDestination.scholarshipMax}</p>
              </div>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed">{selectedDestination.description}</p>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <h4 className="text-xs font-bold text-[#D4AF37] uppercase">Key Highlights</h4>
              {selectedDestination.highlights.map((h, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs text-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0" />
                  <span>{h}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-800">
              <Link
                href="/destinations"
                className="bg-gradient-to-r from-[#D4AF37] to-[#B8960C] text-[#0F172A] font-bold px-6 py-2.5 rounded-xl hover:shadow-lg transition-all text-xs flex items-center gap-2"
              >
                <span>View All Partner Universities in {selectedDestination.country}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        </div>
      )}
    </section>
  );
}
