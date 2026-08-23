"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Quote, Play, Pause, Volume2, VolumeX } from "lucide-react";

// ── Video categories from public/videos ──
const videoGroups = [
  {
    id: "student",
    label: "Student Stories",
    icon: "🎓",
    videos: [
      {
        src: "/videos/student testimony/WhatsApp Video 2026-08-04 at 18.00.0.mp4",
        caption: "Student Testimony",
        description: "Hear directly from our students about their journey abroad.",
      },
      {
        src: "/videos/student testimony/WhatsApp Video 2026-08-04 at 18.00.06.mp4",
        caption: "Life on Campus",
        description: "A student shares what university life is really like.",
      },
      {
        src: "/videos/student testimony/WhatsApp Video 2026-08-04 at 18.00.9.mp4",
        caption: "My Experience",
        description: "From application to arrival — a student's full story.",
      },
    ],
  },
  {
    id: "parent",
    label: "Parent Testimonials",
    icon: "👨‍👩‍👧",
    videos: [
      {
        src: "/videos/parent testimony/parent testimony (1).mp4",
        caption: "A Parent's Perspective",
        description: "A parent shares their experience trusting MtishbiScholars.",
      },
    ],
  },
  {
    id: "campus",
    label: "Campus Arrivals",
    icon: "🏛️",
    videos: [
      {
        src: "/videos/campus arrivals/WhatsApp Video 2026-08-04 at 18.00.05.mp4",
        caption: "Arriving at Campus",
        description: "Our students arriving and settling into university life.",
      },
    ],
  },
  {
    id: "office",
    label: "Consultations",
    icon: "🤝",
    videos: [
      {
        src: "/videos/office- consulations/WhatsApp Video 2026-08-04 at 18.00.05.mp4",
        caption: "Office Consultation",
        description: "How we guide students step by step in our office.",
      },
      {
        src: "/videos/office- consulations/WhatsApp Video 2026-08-04 at 18.00.08.mp4",
        caption: "Application Session",
        description: "Our team helping students with their university applications.",
      },
    ],
  },
  {
    id: "airport",
    label: "Airport Send-offs",
    icon: "✈️",
    videos: [
      {
        src: "/videos/airport testimony/WhatsApp Video 2026-08-04 at 18.17.5.mp4",
        caption: "Airport Send-off",
        description: "Students departing for their universities abroad.",
      },
      {
        src: "/videos/airport testimony/WhatsApp Video 2026-08-04 at 18.17.57.mp4",
        caption: "Farewell Moments",
        description: "Emotional and exciting moments before the journey begins.",
      },
      {
        src: "/videos/airport testimony/WhatsApp Video 2026-08-04 at 18.17.8.mp4",
        caption: "Bon Voyage!",
        description: "MtishbiScholars students ready to fly to their dream universities.",
      },
    ],
  },
  {
    id: "school",
    label: "School Visits",
    icon: "🏫",
    videos: [
      {
        src: "/videos/school visits/WhatsApp Video 2026-08-04 at 18.00..mp4",
        caption: "School Outreach",
        description: "MtishbiScholars visiting schools to guide future students.",
      },
      {
        src: "/videos/school visits/WhatsApp Video 2026-08-04 at 18.00.01.mp4",
        caption: "Career Talk",
        description: "Inspiring students about international education opportunities.",
      },
      {
        src: "/videos/school visits/WhatsApp Video 2026-08-04 at 18.00.07.mp4",
        caption: "Q&A Session",
        description: "Students asking questions about studying abroad.",
      },
      {
        src: "/videos/school visits/WhatsApp Video 2026-08-04 at 18.00.08.mp4",
        caption: "Presentation Day",
        description: "Our team presenting scholarship opportunities at a school.",
      },
    ],
  },
];

function VideoCard({ src, caption, description, index }: {
  src: string; caption: string; description: string; index: number;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (playing) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setPlaying(!playing);
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    videoRef.current.muted = !muted;
    setMuted(!muted);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.07, duration: 0.4 }}
      className="group relative rounded-2xl overflow-hidden bg-[#0F172A] border border-white/10 hover:border-[#D4AF37]/40 shadow-lg hover:shadow-2xl hover:shadow-[#D4AF37]/10 transition-all duration-300 cursor-pointer"
      style={{ aspectRatio: "9/16", maxHeight: "320px" }}
      onClick={togglePlay}
    >
      {/* Video */}
      <video
        ref={videoRef}
        src={src}
        muted={muted}
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        onEnded={() => setPlaying(false)}
      />

      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent z-10" />

      {/* Play/Pause button */}
      <div className={`absolute inset-0 z-20 flex items-center justify-center transition-opacity duration-200 ${playing ? "opacity-0 group-hover:opacity-100" : "opacity-100"}`}>
        <div className="w-12 h-12 rounded-full bg-[#D4AF37]/90 backdrop-blur-sm flex items-center justify-center shadow-xl">
          {playing
            ? <Pause className="w-5 h-5 text-[#0F172A] fill-[#0F172A]" />
            : <Play className="w-5 h-5 text-[#0F172A] fill-[#0F172A] ml-0.5" />
          }
        </div>
      </div>

      {/* Mute button */}
      <button
        onClick={toggleMute}
        className="absolute top-3 right-3 z-30 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
      >
        {muted
          ? <VolumeX className="w-3.5 h-3.5 text-white" />
          : <Volume2 className="w-3.5 h-3.5 text-white" />
        }
      </button>

      {/* Caption */}
      <div className="absolute bottom-0 left-0 right-0 z-20 p-3">
        <p className="text-white font-semibold text-xs leading-tight">{caption}</p>
        <p className="text-white/50 text-[10px] mt-0.5 leading-snug">{description}</p>
      </div>
    </motion.div>
  );
}

export default function TestimonialsSection() {
  const [activeGroup, setActiveGroup] = useState("student");
  const group = videoGroups.find((g) => g.id === activeGroup)!;

  return (
    <section id="testimonials" className="py-16 bg-[#0F172A] relative overflow-hidden">
      {/* Top divider */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37]/30 to-transparent" />
      <div className="absolute top-32 left-10 w-48 h-48 bg-[#D4AF37]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-32 right-10 w-48 h-48 bg-[#D4AF37]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-10 xl:px-16 relative z-10">
        {/* Header row */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 bg-[#D4AF37]/10 border border-[#D4AF37]/25 rounded-full px-4 py-1.5 mb-4">
              <Quote className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span className="text-[#D4AF37] text-xs font-semibold tracking-wider uppercase">
                Real Stories
              </span>
            </div>
            <h2
              className="text-2xl md:text-3xl font-black text-white leading-tight"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              See It for{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] via-[#E8C84A] to-[#D4AF37]">
                Yourself
              </span>
            </h2>
            <p className="text-white/40 text-sm mt-1">
              Real moments captured — students, parents & campuses.
            </p>
          </motion.div>

          {/* Category tabs */}
          <div className="flex flex-wrap gap-2">
            {videoGroups.map((g) => (
              <button
                key={g.id}
                onClick={() => setActiveGroup(g.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200
                  ${activeGroup === g.id
                    ? "bg-[#D4AF37] text-[#0F172A] border-[#D4AF37]"
                    : "bg-white/5 text-white/60 border-white/10 hover:border-[#D4AF37]/40 hover:text-white"
                  }`}
              >
                <span>{g.icon}</span> {g.label}
              </button>
            ))}
          </div>
        </div>

        {/* Video Grid */}
        <motion.div
          key={activeGroup}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3"
        >
          {group.videos.map((v, i) => (
            <VideoCard key={v.src} {...v} index={i} />
          ))}


        </motion.div>
      </div>
    </section>
  );
}
