"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Globe, BookOpen, Award } from "lucide-react";
import Link from "next/link";
import AnimatedCounter from "@/components/landing/AnimatedCounter";


const stats = [
  { value: 50, suffix: "+", label: "Partner Universities" },
  { value: 20, suffix: "+", label: "Study Destinations" },
  { value: 50, suffix: "+", label: "Scholarships" },
  { value: 98, suffix: "%", label: "Success Rate" },
];

export default function HeroSection() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref });
  const videoScale = useTransform(scrollYProgress, [0, 1], [1, 1.15]);
  const textY = useTransform(scrollYProgress, [0, 1], [0, 80]);

  return (
    <section
      id="home"
      ref={ref}
      className="relative min-h-screen flex items-center overflow-hidden"
    >
      {/* ── Video Background ─────────────────── */}
      <motion.div
        style={{ scale: videoScale }}
        className="absolute inset-0 z-0"
      >
        {/* Fallback gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0F172A] via-[#1a2744] to-[#0d1f3c]" />

        {/* Merged hero background video */}
        <video
          id="hero-video"
          className="absolute inset-0 w-full h-full object-cover opacity-85"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden="true"
          src="/videos/hero_bg.mp4"
        />

        {/* Overlay — light gradient so text stays readable */}
        <div className="absolute inset-0 hero-gradient" />
      </motion.div>

      {/* ── Floating Particles ───────────────── */}
      {/* Pre-seeded values to avoid SSR/client hydration mismatch */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {[
          { w:2.1,h:2.1,l:12,t:23,o:0.2,dur:5,del:0.5 },
          { w:3.2,h:3.2,l:28,t:67,o:0.3,dur:6,del:1.2 },
          { w:1.5,h:1.5,l:45,t:12,o:0.15,dur:4,del:0 },
          { w:2.8,h:2.8,l:60,t:80,o:0.25,dur:7,del:2 },
          { w:4.0,h:4.0,l:75,t:35,o:0.2,dur:5,del:0.8 },
          { w:1.8,h:1.8,l:88,t:55,o:0.35,dur:4,del:1.5 },
          { w:2.5,h:2.5,l:6,t:90,o:0.12,dur:6,del:0.3 },
          { w:3.5,h:3.5,l:33,t:44,o:0.28,dur:5,del:2.2 },
          { w:1.2,h:1.2,l:50,t:70,o:0.18,dur:7,del:1.0 },
          { w:2.0,h:2.0,l:68,t:20,o:0.22,dur:4,del:0.7 },
          { w:3.0,h:3.0,l:82,t:88,o:0.3,dur:6,del:1.8 },
          { w:1.7,h:1.7,l:18,t:52,o:0.14,dur:5,del:2.5 },
          { w:4.5,h:4.5,l:92,t:10,o:0.2,dur:7,del:0.2 },
          { w:2.3,h:2.3,l:38,t:30,o:0.32,dur:4,del:1.3 },
          { w:1.4,h:1.4,l:55,t:95,o:0.16,dur:6,del:0.9 },
          { w:3.8,h:3.8,l:70,t:60,o:0.24,dur:5,del:2.1 },
          { w:2.6,h:2.6,l:8,t:40,o:0.28,dur:7,del:1.6 },
          { w:1.9,h:1.9,l:22,t:75,o:0.2,dur:4,del:0.4 },
          { w:4.2,h:4.2,l:48,t:18,o:0.18,dur:6,del:1.1 },
          { w:2.4,h:2.4,l:95,t:50,o:0.26,dur:5,del:2.8 },
        ].map((p, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-[#D4AF37]"
            style={{
              width: p.w,
              height: p.h,
              left: `${p.l}%`,
              top: `${p.t}%`,
              opacity: p.o,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [p.o * 0.5, p.o, p.o * 0.5],
            }}
            transition={{
              duration: p.dur,
              repeat: Infinity,
              delay: p.del,
            }}
          />
        ))}
      </div>


      {/* ── Content ──────────────────────────── */}
      <div className="relative z-10 container-wide section-padding w-full pt-32 pb-20">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left — Text */}
          <motion.div style={{ y: textY }}>
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 bg-[#D4AF37]/15 border border-[#D4AF37]/30 rounded-full px-4 py-1.5 mb-8"
            >
              <Globe className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span className="text-[#D4AF37] text-xs font-semibold tracking-wider uppercase">
                Tanzania's #1 Study Abroad Platform
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black text-white leading-[1.05] tracking-tight mb-6"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Your Pathway to{" "}
              <span className="relative">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] via-[#E8C84A] to-[#D4AF37]">
                  Global Education
                </span>
                <motion.span
                  className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-[#D4AF37] to-transparent"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 1, duration: 0.8 }}
                />
              </span>
            </motion.h1>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-white/70 text-lg md:text-xl leading-relaxed mb-10 max-w-xl"
            >
              From university applications to offer letters, we manage your
              entire international admission journey on one secure platform.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex flex-wrap gap-4"
            >
              <Link
                href="/auth/register"
                className="group inline-flex items-center gap-2 bg-gradient-to-r from-[#D4AF37] to-[#E8C84A] text-[#0F172A] font-bold px-8 py-4 rounded-2xl hover:shadow-2xl hover:shadow-[#D4AF37]/30 transition-all duration-300 hover:-translate-y-1 text-base"
              >
                Start Your Journey
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a
                href="#universities"
                className="inline-flex items-center gap-2 border border-white/20 text-white font-semibold px-8 py-4 rounded-2xl hover:border-[#D4AF37]/50 hover:bg-white/5 transition-all duration-300 text-base"
              >
                Explore Universities
              </a>
            </motion.div>
          </motion.div>

          {/* Right — Stats Cards */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="hidden lg:grid grid-cols-2 gap-4"
          >
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + i * 0.1 }}
                whileHover={{ y: -4, scale: 1.02 }}
                className="glass rounded-2xl p-6 border border-white/10 hover:border-[#D4AF37]/30 transition-all duration-300"
              >
                <div className="text-3xl font-black text-white mb-1" style={{ fontFamily: "var(--font-heading)" }}>
                  <AnimatedCounter
                    end={stat.value}
                    suffix={stat.suffix}
                    delay={1 + i * 0.15}
                  />
                </div>
                <div className="text-white/60 text-sm">{stat.label}</div>
                <div className="mt-3 h-0.5 bg-gradient-to-r from-[#D4AF37] to-transparent rounded-full" />
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Mobile Stats Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="lg:hidden mt-12 grid grid-cols-2 gap-3"
        >
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              className="glass rounded-xl p-4 text-center border border-white/10"
            >
              <div className="text-2xl font-black text-white" style={{ fontFamily: "var(--font-heading)" }}>
                <AnimatedCounter end={stat.value} suffix={stat.suffix} delay={1 + i * 0.1} />
              </div>
              <div className="text-white/60 text-xs mt-1">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span className="text-white/40 text-xs tracking-widest uppercase">Scroll</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-5 h-8 border border-white/20 rounded-full flex items-start justify-center pt-1.5"
          >
            <div className="w-1 h-2 bg-[#D4AF37] rounded-full" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
