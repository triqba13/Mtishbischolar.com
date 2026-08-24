"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileCheck, Megaphone, GraduationCap,
  Award, Star,
  Handshake, BarChart2, Shield, Plane, ChevronDown, HelpCircle
} from "lucide-react";

// ── FAQ Data from MtishbiScholar_FAQ_Section_Detailed_Specification ──
const faqCategories = [
  {
    id: "visa",
    title: "Visa",
    icon: FileCheck,
    color: "from-blue-500 to-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
    iconColor: "text-blue-600",
    questions: [
      {
        q: "What documents are required when applying for a student visa?",
        a: "Requirements depend on the destination country. Students normally require a valid passport, admission letter, academic certificates, financial documents, visa application forms and any additional embassy requirements.",
      },
      {
        q: "How long does the student visa application process usually take?",
        a: "Processing time depends on the embassy and destination country. MtishbiScholars guides students through preparation and submission to ensure the fastest possible outcome.",
      },
      {
        q: "Can MtishbiScholars assist with visa preparation?",
        a: "Yes. MtishbiScholars provides guidance on required documents, application procedures and interview preparation to maximise your chances of approval.",
      },
      {
        q: "What happens if my visa application is delayed or rejected?",
        a: "MtishbiScholars helps students understand the reason for the delay or rejection, prepare improvements and follow the appropriate next steps.",
      },
      {
        q: "Can my visa be extended while studying abroad?",
        a: "Visa extension depends on the host country regulations. Students receive guidance on the required process from our experienced team.",
      },
    ],
  },
  {
    id: "admission",
    title: "Admission",
    icon: GraduationCap,
    color: "from-emerald-500 to-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    iconColor: "text-emerald-600",
    questions: [
      {
        q: "What is the process for applying to a university through MtishbiScholars?",
        a: "Students create an account, complete their profile, upload required documents, select universities and submit applications through the platform. Our team guides you at every step.",
      },
      {
        q: "Which countries can I apply to?",
        a: "MtishbiScholars supports placements in China, India, Cyprus, Poland, Malaysia, UAE, Canada, Spain, UK and Mauritius.",
      },
      {
        q: "How long does admission processing take?",
        a: "Processing time depends on the university, program and intake period. Our team keeps you updated throughout the process.",
      },
      {
        q: "Can MtishbiScholars help select the right course?",
        a: "Yes. Students receive expert guidance based on their academic background and career goals to ensure the best match.",
      },
      {
        q: "Are English proficiency tests always required?",
        a: "Requirements depend on the university and country. Some institutions offer English-medium programs without requiring IELTS/TOEFL. Our advisors will clarify this for your chosen destination.",
      },
    ],
  },
  {
    id: "scholarship",
    title: "Scholarship",
    icon: Award,
    color: "from-amber-500 to-yellow-500",
    bg: "bg-amber-50",
    border: "border-amber-200",
    iconColor: "text-amber-600",
    questions: [
      {
        q: "Does MtishbiScholars provide scholarship opportunities?",
        a: "MtishbiScholars connects students with available scholarship opportunities from partner universities and organizations — including tuition scholarships and fee waivers at partner institutions.",
      },
      {
        q: "What are scholarship requirements?",
        a: "Requirements depend on each scholarship but may include academic performance, achievements and other criteria. Our team will assess your eligibility.",
      },
      {
        q: "How can I apply for scholarships?",
        a: "Students submit their academic information and documents, then MtishbiScholars helps identify and apply for suitable scholarship opportunities.",
      },
      {
        q: "Are full and partial scholarships available?",
        a: "Both full and partial scholarships are available depending on the university and scholarship program. Many of our partner universities offer substantial fee reductions.",
      },
      {
        q: "When should students apply?",
        a: "Students should apply early because scholarship deadlines vary by university and intake season. Contact us to know the next available intake.",
      },
    ],
  },
  {
    id: "predeparture",
    title: "Pre-departure",
    icon: Plane,
    color: "from-sky-500 to-cyan-500",
    bg: "bg-sky-50",
    border: "border-sky-200",
    iconColor: "text-sky-600",
    questions: [
      {
        q: "What support is provided before travelling?",
        a: "Students receive comprehensive guidance about travel preparation, cultural adaptation, academic expectations and important departure information.",
      },
      {
        q: "Will students receive travel guidance?",
        a: "Yes. Students receive full preparation guidance before leaving for their destination — including packing advice, airport procedures and arrival support.",
      },
      {
        q: "Can family members participate in preparation sessions?",
        a: "Yes. Family involvement is encouraged. We believe keeping parents informed makes the transition smoother for everyone.",
      },
    ],
  },

  {
    id: "security",
    title: "Security",
    icon: Shield,
    color: "from-red-500 to-rose-600",
    bg: "bg-red-50",
    border: "border-red-200",
    iconColor: "text-red-600",
    questions: [
      {
        q: "How does MtishbiScholars protect student information?",
        a: "Student information is protected using secure authentication, controlled access and data protection practices. Your documents are only shared with authorized parties.",
      },
      {
        q: "Who can access student documents?",
        a: "Only authorised MtishbiScholars staff members with appropriate permissions can access student information and documents.",
      },
      {
        q: "Is my payment information secure?",
        a: "Yes. All financial transactions are processed through secure, encrypted payment systems. MtishbiScholars does not store card details.",
      },
    ],
  },

  {
    id: "opportunity",
    title: "Opportunity",
    icon: Star,
    color: "from-orange-500 to-amber-600",
    bg: "bg-orange-50",
    border: "border-orange-200",
    iconColor: "text-orange-600",
    questions: [
      {
        q: "What unique opportunities does studying abroad provide?",
        a: "International education opens doors to global networks, diverse career paths, personal growth and exposure to different cultures and industries.",
      },
      {
        q: "Can students switch programs or universities after enrolling?",
        a: "Changes are possible in some cases depending on university policies. MtishbiScholars advises students on the best course of action.",
      },
    ],
  },
  {
    id: "partnership",
    title: "Partnership",
    icon: Handshake,
    color: "from-pink-500 to-rose-500",
    bg: "bg-pink-50",
    border: "border-pink-200",
    iconColor: "text-pink-600",
    questions: [
      {
        q: "How does MtishbiScholars partner with universities?",
        a: "MtishbiScholars establishes formal agreements with universities ensuring verified admissions, scholarship schemes and direct support channels.",
      },
      {
        q: "Can agents or institutions partner with MtishbiScholars?",
        a: "Yes. MtishbiScholars welcomes collaboration with education agents, schools and institutions. Contact us to discuss partnership opportunities.",
      },
    ],
  },
  {
    id: "monitoring",
    title: "Monitoring",
    icon: BarChart2,
    color: "from-slate-500 to-gray-600",
    bg: "bg-slate-50",
    border: "border-slate-200",
    iconColor: "text-slate-600",
    questions: [
      {
        q: "How does MtishbiScholars monitor student progress?",
        a: "MtishbiScholars maintains communication with students and universities to track academic progress, attendance and welfare throughout the study period.",
      },
      {
        q: "What happens if a student faces difficulties while studying abroad?",
        a: "Students can contact MtishbiScholars support at any time. We coordinate with the university and relevant authorities to resolve issues.",
      },
    ],
  },
  {
    id: "exhibition",
    title: "Exhibition",
    icon: Megaphone,
    color: "from-lime-500 to-green-500",
    bg: "bg-lime-50",
    border: "border-lime-200",
    iconColor: "text-lime-700",
    questions: [
      {
        q: "Does MtishbiScholars participate in education exhibitions?",
        a: "Yes. MtishbiScholars participates in education fairs and exhibitions to connect directly with prospective students and families.",
      },
      {
        q: "How can I attend an MtishbiScholars event?",
        a: "Follow our social media pages and website announcements for upcoming events, open days and education exhibitions near you.",
      },
    ],
  },
];

function FAQItem({ q, a, index }: { q: string; a: string; index: number }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="border border-slate-200 rounded-xl overflow-hidden"
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-label={q}
        className="w-full flex items-center justify-between p-5 text-left bg-white hover:bg-slate-50 transition-colors"
      >
        <span className="text-[#0F172A] font-semibold text-sm pr-4">{q}</span>
        <ChevronDown
          className={`w-4 h-4 text-[#D4AF37] shrink-0 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 text-slate-500 text-sm leading-relaxed bg-white border-t border-slate-100">
              {a}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function FaqSection() {
  const [activeId, setActiveId] = useState("visa");
  const active = faqCategories.find((c) => c.id === activeId)!;

  return (
    <section id="faq" className="py-14 bg-slate-50 relative overflow-hidden">
      <div className="absolute top-20 left-10 w-64 h-64 bg-[#D4AF37]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 right-10 w-64 h-64 bg-[#0F172A]/5 rounded-full blur-3xl pointer-events-none" />

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
            <HelpCircle className="w-3.5 h-3.5 text-[#B8960C]" />
            <span className="text-[#B8960C] text-xs font-semibold tracking-wider uppercase">
              FAQs
            </span>
          </div>
          <h2
            className="text-3xl md:text-4xl font-black text-[#0F172A] mb-3 leading-tight"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Frequently Asked{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] to-[#B8960C]">
              Questions
            </span>
          </h2>
          <p className="text-slate-500 text-base max-w-xl mx-auto">
            Everything you need to know — click a category to explore answers.
          </p>
        </motion.div>

        {/* ── Category Cards Grid ── */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 mb-10">
          {faqCategories.map((cat) => {
            const Icon = cat.icon;
            const isActive = cat.id === activeId;
            return (
              <motion.button
                key={cat.id}
                type="button"
                aria-label={`View ${cat.title} FAQs`}
                whileHover={{ y: -3, scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setActiveId(cat.id)}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all duration-200 cursor-pointer
                  ${isActive
                    ? `bg-gradient-to-br ${cat.color} border-transparent shadow-lg text-white`
                    : `bg-white border-slate-200 hover:border-[#D4AF37]/40 text-slate-600 hover:shadow-md`
                  }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center
                  ${isActive ? "bg-white/20" : cat.bg}`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? "text-white" : cat.iconColor}`} />
                </div>
                <span className={`text-[11px] font-semibold text-center leading-tight
                  ${isActive ? "text-white" : "text-slate-600"}`}>
                  {cat.title}
                </span>
              </motion.button>
            );
          })}
        </div>

        {/* ── Active Category + Accordion ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeId}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
          >
            {/* Category title bar */}
            <div className={`flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r ${active.color} mb-5`}>
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                <active.icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-white font-black text-base" style={{ fontFamily: "var(--font-heading)" }}>
                  {active.title}
                </div>
                <div className="text-white/70 text-xs">
                  {active.questions.length} question{active.questions.length > 1 ? "s" : ""}
                </div>
              </div>
            </div>

            {/* Accordion */}
            <div className="space-y-3">
              {active.questions.map((item, i) => (
                <FAQItem key={i} q={item.q} a={item.a} index={i} />
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
