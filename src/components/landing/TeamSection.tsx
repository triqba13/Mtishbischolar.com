"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { GraduationCap, MapPin, Globe, Users, Award, Quote } from "lucide-react";

const highlights = [
  { icon: MapPin, text: "Headquartered in Dar Es Salaam, Tanzania" },
  { icon: Globe, text: "Branch office in Rajkot, India" },
  { icon: Users, text: "Pan-African international student recruiting firm" },
  { icon: Award, text: "Collaborators across India's North, East & South zones" },
];

/* ── VVX Student Testimonials ─────────────────────────────── */
const testimonials = [
  {
    name: "Justina Francis",
    quote:
      "My sincere gratitude to Mtishbi Scholars for giving me awareness about Indian universities' various scholarships; the endless efforts and guidance are superb. I appreciate their trust and integrity throughout the entire process to India.",
    color: "from-[#D4AF37] to-[#B8960C]",
    delay: 0,
  },
  {
    name: "Jacob Stanford Joel",
    quote:
      "Last year, I had the privilege of meeting up with Mtishbi Scholars with an ambition to study abroad. Mtishbi Scholars assisted me in the various parts, from application filing to the departure modalities. Today, I am studying at my dream University (JAIN University), and I like it here.",
    color: "from-[#1E40AF] to-[#3B82F6]",
    delay: 0.3,
  },
  {
    name: "Glory Osmund Mlowe",
    quote:
      "Studying in India is like a dream come true for me. I am studying what I like the most. Thanks to Mtishbi Scholars, who assisted me through the University Selection Process, Scholarship Application, and flight ticketing until the last arrangements for my arrival on campus.",
    color: "from-[#059669] to-[#10B981]",
    delay: 0.6,
  },
];

/* ── Card animation variants ── */
const cardVariants = (delay: number) => ({
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.4, delay },
});

export default function TeamSection() {
  return (
    <section id="team" className="py-14 bg-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#D4AF37]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

      <div className="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-10 xl:px-16 relative z-10">

        {/* ── Section badge ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-8"
        >
          <div className="inline-flex items-center gap-2 bg-[#D4AF37]/10 border border-[#D4AF37]/25 rounded-full px-4 py-1.5 mb-3">
            <Users className="w-3.5 h-3.5 text-[#B8960C]" />
            <span className="text-[#B8960C] text-xs font-semibold tracking-wider uppercase">Meet the Team</span>
          </div>
          <h2
            className="text-2xl md:text-3xl font-black text-[#0F172A] leading-tight"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            The People Behind{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] to-[#B8960C]">
              MtishbiScholars
            </span>
          </h2>
        </motion.div>

        {/* ── President Feature Row ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row gap-8 items-center bg-gradient-to-br from-slate-50 to-white border border-slate-100 rounded-3xl p-6 md:p-8 mb-10 shadow-sm"
        >
          {/* LEFT — Company info */}
          <div className="flex-1 min-w-0">
            <p className="text-[#D4AF37] text-xs font-bold uppercase tracking-widest mb-2">
              President&apos;s Message
            </p>
            <h3
              className="text-xl md:text-2xl font-black text-[#0F172A] mb-4 leading-snug"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Committed to World-Class Education for Every African Student
            </h3>
            <p className="text-slate-500 text-sm leading-relaxed mb-5">
              At MtishbiScholars, we are committed to offering our students a unique platform where
              they can learn, explore, and discover their full potential through world-class education
              offered by different scholarship schemes in universities across the globe.
            </p>
            <p className="text-slate-500 text-sm leading-relaxed mb-6">
              MtishbiScholars is a Pan-African international student recruiting firm specializing in
              education and training. Founded to bring international education to the doorsteps of
              students, we guide, mentor and prepare the good youth of today to become better leaders
              of tomorrow.
            </p>

            {/* Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {highlights.map((h, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center shrink-0 mt-0.5">
                    <h.icon className="w-3.5 h-3.5 text-[#B8960C]" />
                  </div>
                  <p className="text-slate-600 text-xs leading-snug">{h.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT — President photo */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="shrink-0"
          >
            <div className="relative w-52 h-64 md:w-56 md:h-72 rounded-2xl overflow-hidden border-4 border-[#D4AF37]/20 shadow-xl shadow-[#D4AF37]/10">
              <Image
                src="/videos/images/mtishbischolar president.jpg"
                alt="MtishbiScholars President"
                fill
                className="object-cover object-top"
                sizes="224px"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#0F172A]/90 to-transparent p-4">
                <p className="text-white font-bold text-sm" style={{ fontFamily: "var(--font-heading)" }}>
                  MtishbiScholars President
                </p>
                <p className="text-[#D4AF37] text-xs">Founder &amp; President</p>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* ── What Do Our Students Have to Say? ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-5"
        >
          <div className="inline-flex items-center gap-2 bg-[#D4AF37]/10 border border-[#D4AF37]/25 rounded-full px-4 py-1.5 mb-2">
            <Quote className="w-3.5 h-3.5 text-[#B8960C]" />
            <span className="text-[#B8960C] text-xs font-semibold tracking-wider uppercase">Student Voices</span>
          </div>
          <h3
            className="text-xl md:text-2xl font-black text-[#0F172A]"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            What Do Our{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] to-[#B8960C]">
              Students Have to Say?
            </span>
          </h3>
        </motion.div>

        {/* ── Testimonial Cards ── */}
        <div className="flex flex-col md:flex-row gap-5">
          {testimonials.map((t) => (
            <motion.div
              key={t.name}
              {...cardVariants(t.delay)}
              whileHover={{ y: -4 }}
              className="flex-1 bg-gradient-to-br from-slate-50 to-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200"
            >
              {/* Quote icon */}
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${t.color} flex items-center justify-center mb-4`}>
                <Quote className="w-4 h-4 text-white" />
              </div>

              {/* Quote text */}
              <p className="text-slate-600 text-sm leading-relaxed mb-5 italic">
                &ldquo;{t.quote}&rdquo;
              </p>

              {/* Name */}
              <div className="flex items-center gap-3 border-t border-slate-100 pt-4">
                <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center shrink-0`}>
                  <span className="text-white text-xs font-black">
                    {t.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </span>
                </div>
                <div>
                  <p className="text-[#0F172A] font-bold text-sm">{t.name}</p>
                  <p className="text-[#B8960C] text-xs">MtishbiScholars Student</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
