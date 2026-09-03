"use client";

import { useRef, useEffect } from "react";
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
  const videoRef = useRef<HTMLVideoElement>(null);
  const { scrollYProgress } = useScroll({ target: ref });
  const videoScale = useTransform(scrollYProgress, [0, 1], [1, 1.15]);
  const textY = useTransform(scrollYProgress, [0, 1], [0, 80]);

  // Robust video autoplay for all devices (including iOS Safari & Android Low Power Mode)
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Explicitly enforce muted and playsinline at the DOM property level
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.setAttribute("muted", "");
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "true");

    const startPlayback = () => {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.log("[HeroSection] Autoplay waiting for touch gesture:", err);
          // If iOS Low Power Mode blocks programmatic autoplay, immediately play on first touch or scroll
          const onFirstInteraction = () => {
            if (videoRef.current) {
              videoRef.current.play().catch(() => {});
            }
            window.removeEventListener("touchstart", onFirstInteraction);
            window.removeEventListener("pointerdown", onFirstInteraction);
            window.removeEventListener("scroll", onFirstInteraction);
          };

          window.addEventListener("touchstart", onFirstInteraction, { passive: true, once: true });
          window.addEventListener("pointerdown", onFirstInteraction, { passive: true, once: true });
          window.addEventListener("scroll", onFirstInteraction, { passive: true, once: true });
        });
      }
    };

    startPlayback();

    // Re-trigger play if tab becomes visible
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible" && videoRef.current) {
        videoRef.current.play().catch(() => {});
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  return (
    <section
      id="home"
      ref={ref}
      className="relative min-h-screen flex items-center overflow-hidden"
    >
      {/* ── Video Background ─────────────────── */}
      <motion.div
        style={{ scale: videoScale }}
        className="absolute inset-0 z-0 pointer-events-none select-none"
      >
        {/* Fallback gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0F172A] via-[#1a2744] to-[#0d1f3c]" />

        {/* Merged hero background video */}
        <video
          ref={videoRef}
          id="hero-video"
          className="absolute inset-0 w-full h-full object-cover opacity-85 pointer-events-none select-none"
          autoPlay
          muted
          loop
          playsInline
          // @ts-ignore
          webkit-playsinline="true"
          preload="auto"
          poster="/videos/hero_poster.webp"
          aria-hidden="true"
        >
          <source media="(max-width: 768px)" src="/videos/hero_bg_mobile.mp4" type="video/mp4" />
          <source media="(max-width: 1280px)" src="/videos/hero_bg_720p.mp4" type="video/mp4" />
          <source src="/videos/hero_bg.mp4" type="video/mp4" />
        </video>

        {/* Overlay: light gradient so text stays readable */}
        <div className="absolute inset-0 hero-gradient pointer-events-none" />
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
      <div className="relative z-10 container-wide section-padding w-full pt-20 sm:pt-24 md:pt-32 pb-10 sm:pb-16">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          {/* Left: Text */}
          <motion.div style={{ y: textY }}>
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 bg-[#D4AF37]/15 border border-[#D4AF37]/30 rounded-full px-3 sm:px-4 py-1 sm:py-1.5 mb-4 sm:mb-6"
            >
              <Globe className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span className="text-[#D4AF37] text-[10px] sm:text-xs font-semibold tracking-wider uppercase">
                Tanzania&apos;s #1 Study Abroad Platform
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl xl:text-7xl font-black text-white leading-[1.1] tracking-tight mb-4 sm:mb-6"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Your Pathway to{" "}
              <span className="relative inline-block">
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
              className="text-white/75 text-sm sm:text-base md:text-lg lg:text-xl leading-relaxed mb-6 sm:mb-8 max-w-xl"
            >
              From university applications to offer letters, we manage your
              entire international admission journey on one secure platform.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-2.5 sm:gap-4"
            >
              <Link
                href="/auth/register"
                className="group inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#D4AF37] to-[#E8C84A] text-[#0F172A] font-bold px-5 sm:px-7 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl hover:shadow-2xl hover:shadow-[#D4AF37]/30 transition-all duration-300 hover:-translate-y-0.5 text-xs sm:text-base text-center"
              >
                Start Your Journey
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a
                href="#universities"
                className="inline-flex items-center justify-center gap-2 border border-white/20 text-white font-semibold px-5 sm:px-7 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl hover:border-[#D4AF37]/50 hover:bg-white/5 transition-all duration-300 text-xs sm:text-base text-center"
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
              className="glass rounded-xl px-2.5 py-2 sm:py-2.5 text-center border border-white/10 flex flex-col justify-center min-h-[54px] sm:min-h-[62px] backdrop-blur-md bg-white/[0.04]"
            >
              <div
                className="text-lg sm:text-xl font-black text-white leading-none"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                <AnimatedCounter end={stat.value} suffix={stat.suffix} delay={0.8 + i * 0.1} />
              </div>
              <div className="text-white/70 text-[10px] sm:text-[11px] font-medium mt-1 leading-tight line-clamp-1">
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
          <span className="text-slate-300 text-[10px] tracking-widest uppercase font-medium">Scroll</span>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-4 h-7 border border-white/30 rounded-full flex items-start justify-center pt-1"
          >
            <div className="w-1 h-1.5 bg-[#D4AF37] rounded-full" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
