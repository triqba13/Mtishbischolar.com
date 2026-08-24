"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  GraduationCap,
  Award,
  FileCheck,
  Globe2,
  IdCard,
  Briefcase,
  Users,
  ArrowRight,
} from "lucide-react";

const services = [
  {
    id: "university-admission",
    icon: GraduationCap,
    title: "University Admission Support",
    description:
      "Expert guidance through every step — from choosing the right university to receiving your offer letter.",
    color: "from-blue-500 to-blue-700",
    bg: "bg-blue-50",
  },
  {
    id: "scholarship-guidance",
    icon: Award,
    title: "Scholarship Guidance",
    description:
      "We identify scholarship opportunities that match your academic profile and financial needs.",
    color: "from-[#D4AF37] to-[#B8960C]",
    bg: "bg-amber-50",
  },
  {
    id: "document-assistance",
    icon: FileCheck,
    title: "Document Assistance",
    description:
      "We help you prepare, verify, and submit all required academic documents accurately.",
    color: "from-green-500 to-emerald-700",
    bg: "bg-green-50",
  },
  {
    id: "visa-support",
    icon: Globe2,
    title: "Visa Support",
    description:
      "Complete guidance on student visa applications, interviews, and embassy requirements.",
    color: "from-purple-500 to-purple-700",
    bg: "bg-purple-50",
  },
  {
    id: "student-connect",
    icon: Users,
    title: "Student Connect (Campus Network)",
    description:
      "Talk directly via WhatsApp with Tanzanian & African scholars studying abroad in India, UK, China, and Germany.",
    color: "from-emerald-500 to-teal-700",
    bg: "bg-emerald-50",
  },
  {
    id: "passport-assistance",
    icon: IdCard,
    title: "Passport Assistance",
    description:
      "Need a passport? We assist you through the application process from start to finish.",
    color: "from-red-500 to-rose-700",
    bg: "bg-red-50",
  },
  {
    id: "career-guidance",
    icon: Briefcase,
    title: "Career Guidance",
    description:
      "Post-graduation career planning and mentoring to help you succeed globally.",
    color: "from-cyan-500 to-cyan-700",
    bg: "bg-cyan-50",
  },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

export default function ServicesSection() {
  return (
    <section id="services" className="py-14 bg-white relative overflow-hidden scroll-mt-20 md:scroll-mt-24">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#D4AF37]/5 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#0F172A]/3 rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />

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
            <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" aria-hidden="true" />
            <span className="text-[#996515] text-xs font-semibold tracking-wider uppercase">
              What We Offer
            </span>
          </div>
          <h2
            className="text-3xl md:text-5xl font-black text-[#0F172A] mb-4 leading-tight"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Everything You Need to{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] to-[#B8960C]">
              Study Abroad
            </span>
          </h2>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto">
            We provide end-to-end support for your international education
            journey — from the first application to graduation.
          </p>
        </motion.div>

        {/* Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {services.map((service) => {
            const Icon = service.icon;
            return (
              <motion.div key={service.id} variants={cardVariants} whileHover={{ y: -6, scale: 1.02 }}>
                <Link
                  href={`/services#${service.id}`}
                  className="group relative block h-full bg-white rounded-2xl p-7 border border-slate-100 hover:border-[#D4AF37]/40 shadow-sm hover:shadow-xl hover:shadow-[#D4AF37]/10 transition-all duration-300"
                >
                  {/* Icon */}
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${service.color} flex items-center justify-center mb-5 shadow-md group-hover:scale-110 transition-transform duration-300`}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>

                  {/* Content */}
                  <h3
                    className="text-lg font-bold text-[#0F172A] mb-3 group-hover:text-[#B8960C] transition-colors"
                    style={{ fontFamily: "var(--font-heading)" }}
                  >
                    {service.title}
                  </h3>
                  <p className="text-slate-500 text-sm leading-relaxed mb-6">
                    {service.description}
                  </p>

                  {/* Learn More link */}
                  <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-extrabold uppercase tracking-wider group-hover:text-emerald-700 transition-colors">
                    <span>Learn More</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>

                  {/* Corner decoration */}
                  <div className="absolute top-0 right-0 w-20 h-20 overflow-hidden rounded-2xl pointer-events-none">
                    <div
                      className={`absolute -top-10 -right-10 w-20 h-20 rounded-full bg-gradient-to-br ${service.color} opacity-5 group-hover:opacity-15 transition-opacity`}
                    />
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>

        {/* View All Services CTA Banner */}
        <div className="mt-12 text-center">
          <Link
            href="/services"
            className="inline-flex items-center gap-2 bg-[#0F172A] hover:bg-[#1E293B] text-white font-bold px-7 py-3.5 rounded-xl border border-slate-700 hover:border-[#D4AF37] transition-all text-sm shadow-md"
          >
            Explore Detailed Breakdown of All Services
            <ArrowRight className="w-4 h-4 text-[#D4AF37]" />
          </Link>
        </div>
      </div>
    </section>
  );
}
