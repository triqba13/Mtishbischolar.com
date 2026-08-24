"use client";

import { motion } from "framer-motion";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  MessageSquare,
  ArrowRight,
} from "lucide-react";

const contactChannels = [
  {
    icon: Phone,
    label: "Call Us",
    value: "+255 764 488 687",
    href: "tel:+255764488687",
    sub: "Mon–Sat, 8am–6pm EAT",
    desc: "Direct telephone line for student inquiries and urgent consultations.",
    color: "bg-blue-50 text-blue-600",
    borderHover: "hover:border-blue-200",
  },
  {
    icon: Mail,
    label: "Email Us",
    value: "info@mtishbischolar.com",
    href: "mailto:info@mtishbischolar.com",
    sub: "We reply within 24 hours",
    desc: "Official inquiries, admissions questions, and general communication.",
    color: "bg-green-50 text-green-600",
    borderHover: "hover:border-green-200",
  },
  {
    icon: MapPin,
    label: "Visit Us",
    value: "Dar es Salaam, Tanzania",
    href: "#map",
    sub: "Office appointment required",
    desc: "In-person advisory sessions and verified document consultations.",
    color: "bg-amber-50 text-amber-600",
    borderHover: "hover:border-amber-200",
  },
];

export default function ContactSection() {
  return (
    <section id="contact" className="py-16 md:py-20 bg-white relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#D4AF37]/30 to-transparent" />
      <div className="absolute top-20 right-20 w-80 h-80 bg-[#D4AF37]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="container-wide section-padding relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12 md:mb-16"
        >
          <div className="inline-flex items-center gap-2 bg-[#D4AF37]/10 border border-[#D4AF37]/25 rounded-full px-4 py-1.5 mb-4">
            <MessageSquare className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span className="text-[#B8960C] text-xs font-semibold tracking-wider uppercase">
              Contact Us
            </span>
          </div>
          <h2
            className="text-3xl md:text-5xl font-black text-[#0F172A] mb-4 leading-tight"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Start Your{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] to-[#B8960C]">
              Journey Today
            </span>
          </h2>
          <p className="text-slate-600 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            Reach out directly for assistance. Our advisors are ready to guide you
            step by step toward your international education goals.
          </p>
        </motion.div>

        {/* ── Top Grid: 3 Contact Channels ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {contactChannels.map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                className={`flex flex-col justify-between p-6 md:p-8 rounded-3xl bg-slate-50 border border-slate-100 ${item.borderHover} hover:shadow-lg transition-all duration-300 group`}
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div
                      className={`w-12 h-12 rounded-2xl ${item.color} flex items-center justify-center shadow-xs`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      {item.label}
                    </span>
                  </div>

                  <a
                    href={item.href}
                    className="block text-lg md:text-xl font-extrabold text-[#0F172A] hover:text-[#B8960C] transition-colors mb-2 break-words"
                  >
                    {item.value}
                  </a>

                  <p className="text-xs font-semibold text-emerald-700 mb-2">
                    {item.sub}
                  </p>

                  <p className="text-xs text-slate-500 leading-relaxed">
                    {item.desc}
                  </p>
                </div>

                <div className="pt-5 mt-5 border-t border-slate-200/60 flex items-center text-xs font-bold text-slate-700 group-hover:text-[#B8960C] transition-colors">
                  <span>Connect with an Advisor</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* ── Middle Grid: Business Hours (7 cols) & WhatsApp (5 cols) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-12 items-stretch">
          {/* Business Hours */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="lg:col-span-7 flex flex-col justify-between p-6 md:p-8 rounded-3xl bg-white border border-slate-200/80 shadow-md shadow-slate-100"
          >
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3
                    className="text-base md:text-lg font-bold text-[#0B1953]"
                    style={{ fontFamily: "var(--font-heading)" }}
                  >
                    Our business hours:
                  </h3>
                  <p className="text-xs text-slate-500">Official operating schedule (East Africa Time)</p>
                </div>
              </div>

              <div className="bg-[#FDF2F2] border border-[#F87171]/40 rounded-2xl p-5 text-center space-y-2 text-sm text-[#0F172A] shadow-xs">
                <p className="text-slate-800 font-medium">
                  Mon-Fri , 8 A.M to 5 P.M (eastern Africa time)
                </p>
                <p className="text-slate-800 font-medium">
                  Saturday , 8 A.M to 1 P.M (eastern Africa time)
                </p>
                <p className="font-extrabold text-[#0B1953] pt-1 text-sm md:text-base leading-snug">
                  MtishbiScholars is available in Weekend &amp; National holidays Upon special appointments
                </p>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 text-center mt-4">
              Appointments can be scheduled ahead for tailored one-on-one university advisory sessions.
            </p>
          </motion.div>

          {/* WhatsApp Direct Connect */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="lg:col-span-5 flex flex-col justify-between p-6 md:p-8 rounded-3xl bg-gradient-to-br from-[#25D366]/10 to-[#25D366]/5 border border-[#25D366]/25 shadow-md shadow-emerald-500/5"
          >
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">💬</span>
                <div>
                  <h3
                    className="text-lg font-bold text-slate-900"
                    style={{ fontFamily: "var(--font-heading)" }}
                  >
                    WhatsApp Us Directly
                  </h3>
                  <p className="text-xs text-emerald-800 font-medium">+255 764 488 687</p>
                </div>
              </div>

              <p className="text-xs md:text-sm text-slate-600 leading-relaxed mb-6">
                Prefer a quick chat? Send a message on WhatsApp for fast responses regarding university admissions, scholarship evaluations, and document requirements.
              </p>
            </div>

            <a
              href="https://wa.me/255764488687"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2.5 bg-[#25D366] text-white text-sm font-bold px-6 py-3.5 rounded-2xl hover:bg-[#20b95a] hover:shadow-lg hover:shadow-[#25D366]/25 transition-all duration-200"
            >
              <span>Open WhatsApp &rarr;</span>
            </a>
          </motion.div>
        </div>

        {/* ── Bottom: Google Maps Location ── */}
        <motion.div
          id="map"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.35 }}
          className="rounded-3xl bg-slate-50 border border-slate-200/80 p-6 md:p-8 shadow-md"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#D4AF37]" />
              <h3
                className="text-base md:text-lg font-bold text-[#0F172A]"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Find Our Office — Dar es Salaam, Tanzania
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-medium">Visiting hours by confirmed appointment</span>
          </div>

          <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-inner" style={{ height: "380px" }}>
            <iframe
              title="MtishbiScholars Office Location"
              src="https://maps.google.com/maps?q=667F%2BFP%2C+Dar+es+Salaam&t=&z=16&ie=UTF8&iwloc=&output=embed"
              width="100%"
              height="380"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
