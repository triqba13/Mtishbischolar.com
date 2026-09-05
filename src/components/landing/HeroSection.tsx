"use client";

import { useRef, useEffect, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Globe } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import AnimatedCounter from "@/components/landing/AnimatedCounter";

const stats = [
  { value: 50, suffix: "+", label: "Partner Universities" },
  { value: 20, suffix: "+", label: "Study Destinations" },
  { value: 50, suffix: "+", label: "Scholarships" },
  { value: 98, suffix: "%", label: "Success Rate" },
];

const heroSlides = [
  {
    src: "/videos/images/MTISHB101.jpg.jpeg",
    alt: "Mtishbi Scholars - Academic Consultation & Leadership",
    position: "object-center sm:object-[center_20%]",
  },
  {
    src: "/videos/images/MTISHB64.jpg.jpeg",
    alt: "Mtishbi Scholars - Direct University Admissions",
    position: "object-[center_42%]",
  },
  {
    src: "/videos/images/MTISHB65.jpg.jpeg",
    alt: "Mtishbi Scholars - Student Pathway Support",
    position: "object-[center_38%]",
  },
  {
    src: "/videos/images/tutu1.jpeg",
    alt: "Mtishbi Scholars - International Students 1",
    position: "object-center sm:object-[center_30%]",
  },
  {
    src: "/videos/images/tutu2.jpeg",
    alt: "Mtishbi Scholars - International Students 2",
    position: "object-center sm:object-[center_30%]",
  },
  {
    src: "/videos/images/tutu3.jpeg",
    alt: "Mtishbi Scholars - International Students 3",
    position: "object-center sm:object-[center_30%]",
  },
];

export default function HeroSection() {
  const ref = useRef<HTMLDivElement>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loadedSlides, setLoadedSlides] = useState<number[]>([0]);

  const { scrollYProgress } = useScroll({ target: ref });
  const textY = useTransform(scrollYProgress, [0, 1], [0, 40]);

  // Slideshow rotation: First slide (MTISHB101) stays 10 seconds, others stay 5.5s
  useEffect(() => {
    const duration = currentSlide === 0 ? 10000 : 5500;
    const timer = setTimeout(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, duration);
    return () => clearTimeout(timer);
  }, [currentSlide]);

  // Preload next upcoming slide before rotation so initial LCP is never delayed by background downloads
  useEffect(() => {
    const nextIndex = (currentSlide + 1) % heroSlides.length;
    const preloadTimer = setTimeout(() => {
      setLoadedSlides((prev) => (prev.includes(nextIndex) ? prev : [...prev, nextIndex]));
    }, 2000);
    return () => clearTimeout(preloadTimer);
  }, [currentSlide]);

  return (
    <section
      id="home"
      ref={ref}
      className="relative min-h-screen flex items-center overflow-hidden bg-slate-950"
    >
      {/* ── Dynamic Image Slideshow Background (Progressive & High-Speed) ─────────────────── */}
      <div className="absolute inset-0 z-0 pointer-events-none select-none overflow-hidden">
        {heroSlides.map((slide, index) => {
          if (!loadedSlides.includes(index)) return null;
          return (
            <div
              key={slide.src}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                index === currentSlide
                  ? "opacity-100 z-10"
                  : "opacity-0 z-0"
              }`}
            >
              <Image
                src={slide.src}
                alt={slide.alt}
                fill
                priority={index === 0}
                sizes="100vw"
                quality={80}
                className={`object-cover ${slide.position || "object-center"}`}
              />
            </div>
          );
        })}

        {/* Uniform, light overlay across whole screen: no dark side fade, picha zinaonekana wazi kabisa */}
        <div className="absolute inset-0 bg-slate-950/20 pointer-events-none z-20" />
      </div>

      {/* ── Floating Subtle Particles (CSS-only for zero mobile TBT blocking) ───────────────── */}
      <div className="hidden sm:block absolute inset-0 z-10 overflow-hidden pointer-events-none">
        {[
          { w:2.1,h:2.1,l:12,t:23,o:0.2,dur:4 },
          { w:3.2,h:3.2,l:28,t:67,o:0.3,dur:5 },
          { w:1.5,h:1.5,l:45,t:12,o:0.15,dur:3 },
          { w:2.8,h:2.8,l:60,t:80,o:0.25,dur:6 },
          { w:4.0,h:4.0,l:75,t:35,o:0.2,dur:4 },
          { w:1.8,h:1.8,l:88,t:55,o:0.35,dur:5 },
          { w:2.5,h:2.5,l:6,t:90,o:0.12,dur:4 },
          { w:3.5,h:3.5,l:33,t:44,o:0.28,dur:6 },
          { w:1.2,h:1.2,l:50,t:70,o:0.18,dur:5 },
          { w:2.0,h:2.0,l:68,t:20,o:0.22,dur:4 },
          { w:3.0,h:3.0,l:82,t:88,o:0.3,dur:5 },
          { w:1.7,h:1.7,l:18,t:52,o:0.14,dur:4 },
        ].map((p, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-[#D4AF37] animate-pulse"
            style={{
              width: p.w,
              height: p.h,
              left: `${p.l}%`,
              top: `${p.t}%`,
              opacity: p.o,
              animationDuration: `${p.dur}s`,
            }}
          />
        ))}
      </div>

      {/* ── Content ──────────────────────────── */}
      <div className="relative z-20 container-wide section-padding w-full pt-20 sm:pt-24 md:pt-32 pb-10 sm:pb-16">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          {/* Left: Text */}
          <motion.div style={{ y: textY }}>
            {/* Badge */}
            <div
              className="inline-flex items-center gap-2 bg-[#D4AF37]/25 border border-[#D4AF37]/50 rounded-full px-3.5 sm:px-4 py-1 sm:py-1.5 mb-4 sm:mb-6 shadow-md shadow-black/30 backdrop-blur-xs"
            >
              <Globe className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span className="text-[#F4D968] text-[10px] sm:text-xs font-bold tracking-wider uppercase drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
                Tanzania&apos;s #1 Study Abroad Platform
              </span>
            </div>

            {/* Headline - Instant Paint for optimal LCP */}
            <h1
              className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl xl:text-7xl font-black text-white leading-[1.1] tracking-tight mb-4 sm:mb-6 drop-shadow-[0_3px_12px_rgba(0,0,0,0.85)]"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Your Pathway to{" "}
              <span className="relative inline-block">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] via-[#F4D968] to-[#D4AF37] drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                  Global Education
                </span>
                <span
                  className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-[#D4AF37] to-transparent"
                />
              </span>
            </h1>

            {/* Description - Zero Render Delay LCP Element */}
            <p
              className="text-white text-sm sm:text-base md:text-lg lg:text-xl leading-relaxed mb-6 sm:mb-8 max-w-xl font-medium drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]"
            >
              From university applications to offer letters, we manage your
              entire international admission journey on one secure platform.
            </p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-2.5 sm:gap-4"
            >
              <Link
                href="/auth/register"
                className="group inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#D4AF37] to-[#E8C84A] text-[#0F172A] font-extrabold px-5 sm:px-7 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl hover:shadow-2xl hover:shadow-[#D4AF37]/40 transition-all duration-300 hover:-translate-y-0.5 text-xs sm:text-base text-center shadow-lg shadow-black/30"
              >
                Start Your Journey
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a
                href="#universities"
                className="inline-flex items-center justify-center gap-2 bg-black/40 border border-white/30 text-white font-semibold px-5 sm:px-7 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl hover:border-[#D4AF37]/70 hover:bg-black/60 transition-all duration-300 text-xs sm:text-base text-center backdrop-blur-md shadow-md shadow-black/30"
              >
                Explore Universities
              </a>
            </motion.div>
          </motion.div>

          {/* Right: Desktop Stats Cards */}
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
                className="bg-black/40 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:border-[#D4AF37]/60 hover:bg-black/60 transition-all duration-300 shadow-xl shadow-black/40"
              >
                <div className="text-3xl font-black text-white mb-1 drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]" style={{ fontFamily: "var(--font-heading)" }}>
                  <AnimatedCounter
                    end={stat.value}
                    suffix={stat.suffix}
                    delay={1 + i * 0.15}
                  />
                </div>
                <div className="text-white/90 text-sm font-medium drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">{stat.label}</div>
                <div className="mt-3 h-0.5 bg-gradient-to-r from-[#D4AF37] to-transparent rounded-full" />
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Mobile Stats Bar - Compact & Sleek */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="lg:hidden mt-6 sm:mt-8 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5"
        >
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              className="bg-black/45 rounded-xl px-2.5 py-2 sm:py-2.5 text-center border border-white/20 flex flex-col justify-center min-h-[54px] sm:min-h-[62px] backdrop-blur-md shadow-lg shadow-black/30"
            >
              <div
                className="text-lg sm:text-xl font-black text-white leading-none drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                <AnimatedCounter end={stat.value} suffix={stat.suffix} delay={0.8 + i * 0.1} />
              </div>
              <div className="text-white/90 text-[10px] sm:text-[11px] font-medium mt-1 leading-tight line-clamp-1 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="hidden sm:flex absolute bottom-6 left-1/2 -translate-x-1/2 flex-col items-center gap-1.5 pointer-events-none"
        >
          <span className="text-slate-200 text-[10px] tracking-widest uppercase font-semibold drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">Scroll</span>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-4 h-7 border border-white/40 rounded-full flex items-start justify-center pt-1 shadow-md shadow-black/40"
          >
            <div className="w-1 h-1.5 bg-[#D4AF37] rounded-full" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
