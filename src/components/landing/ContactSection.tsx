"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  MessageSquare,
  CheckCircle,
} from "lucide-react";

const contactInfo = [
  {
    icon: Phone,
    label: "Call Us",
    value: "+91 9537 784873",
    sub: "Mon–Sat, 8am–6pm EAT",
    color: "bg-blue-50 text-blue-600",
  },
  {
    icon: Mail,
    label: "Email Us",
    value: "info@mtishbischolar.com",
    sub: "We reply within 24 hours",
    color: "bg-green-50 text-green-600",
  },
  {
    icon: MapPin,
    label: "Visit Us",
    value: "Dar es Salaam, Tanzania",
    sub: "Office appointment required",
    color: "bg-amber-50 text-amber-600",
  },
];

const services = [
  "University Admission",
  "Scholarship Guidance",
  "Visa Support",
  "Document Assistance",
  "Passport Application",
  "Career Guidance",
];

export default function ContactSection() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    service: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In production this would call an API
    setSubmitted(true);
  };

  return (
    <section id="contact" className="py-14 bg-white relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#D4AF37]/30 to-transparent" />
      <div className="absolute top-20 right-20 w-80 h-80 bg-[#D4AF37]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="container-wide section-padding relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 bg-[#D4AF37]/10 border border-[#D4AF37]/25 rounded-full px-4 py-1.5 mb-5">
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
          <p className="text-slate-600 text-lg max-w-2xl mx-auto">
            Reach out for a free consultation. Our advisors are ready to guide you
            step by step toward your international education dream.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-[1fr_1.5fr] gap-12 items-start">
          {/* Left — Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="grid grid-cols-1 gap-3 mb-6">
              {contactInfo.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-[#D4AF37]/30 transition-all"
                  >
                    <div className={`w-10 h-10 rounded-xl ${item.color} flex items-center justify-center shrink-0`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-0.5">
                        {item.label}
                      </p>
                      <p className="text-sm font-bold text-[#0F172A]">{item.value}</p>
                      <p className="text-xs text-slate-400">{item.sub}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── Business Hours (matching user requested design) ── */}
            <div className="mb-6">
              <h4
                className="text-base md:text-lg font-bold text-[#0B1953] mb-2"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Our business hours:
              </h4>
              <div className="bg-[#FDF2F2] border border-[#F87171]/40 rounded-xl p-4 text-center space-y-1.5 text-sm text-[#0F172A] shadow-sm">
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

            {/* Social / WhatsApp */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-[#25D366]/10 to-[#25D366]/5 border border-[#25D366]/20">
              <p className="text-sm font-bold text-slate-800 mb-2">💬 WhatsApp Us</p>
              <p className="text-xs text-slate-500 mb-3">
                Prefer a quick chat? Message us on WhatsApp for fast responses.
              </p>
              <a
                href="https://wa.me/255XXXXXXXXX"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#25D366] text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-[#20b95a] transition-all"
              >
                Open WhatsApp →
              </a>
            </div>
          </motion.div>

          {/* Right — Form */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            {submitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center text-center p-12 rounded-3xl bg-gradient-to-br from-[#0F172A] to-[#1E293B] border border-[#D4AF37]/20 min-h-[400px]"
              >
                <CheckCircle className="w-16 h-16 text-[#D4AF37] mb-5" />
                <h3
                  className="text-2xl font-black text-white mb-3"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  Message Sent! 🎉
                </h3>
                <p className="text-white/60 max-w-sm">
                  Thank you, <strong className="text-white">{form.name}</strong>! Our advisors will
                  reach out within 24 hours to schedule your free consultation.
                </p>
              </motion.div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 p-8 space-y-5"
              >
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="John Mwamba"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 outline-none text-sm text-[#0F172A] placeholder-slate-300 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="you@example.com"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 outline-none text-sm text-[#0F172A] placeholder-slate-300 transition-all"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="+255 7XX XXX XXX"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 outline-none text-sm text-[#0F172A] placeholder-slate-300 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                      Service Needed
                    </label>
                    <select
                      value={form.service}
                      onChange={(e) => setForm({ ...form, service: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 outline-none text-sm text-slate-600 transition-all bg-white"
                    >
                      <option value="">Select a service…</option>
                      {services.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                    Your Message
                  </label>
                  <textarea
                    rows={4}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="Tell us about your education goals, desired country, program, etc."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 outline-none text-sm text-[#0F172A] placeholder-slate-300 transition-all resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#D4AF37] to-[#E8C84A] text-[#0F172A] font-bold py-4 rounded-xl hover:shadow-xl hover:shadow-[#D4AF37]/30 transition-all duration-300 hover:-translate-y-0.5 text-base"
                >
                  <Send className="w-4 h-4" />
                  Send Message — It's Free!
                </button>

                <p className="text-center text-xs text-slate-400">
                  By submitting, you agree to our privacy policy. No spam, ever.
                </p>
              </form>
            )}
          </motion.div>
        </div>
      </div>

      {/* ── Google Maps ── */}
      <div className="container-wide section-padding pb-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-4 h-4 text-[#D4AF37]" />
            <h3
              className="text-base font-bold text-[#0F172A]"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Find Our Office — Dar es Salaam, Tanzania
            </h3>
          </div>
          <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-lg" style={{ height: "380px" }}>
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
          <p className="text-xs text-slate-400 mt-2 text-center">
            MtishbiScholars HQ &mdash; 667F+FP Dar es Salaam, Tanzania &nbsp;|&nbsp; Branch: Rajkot, India
          </p>
        </motion.div>
      </div>
    </section>
  );
}
