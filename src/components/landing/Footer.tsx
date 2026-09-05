"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Mail, Phone, MapPin, Heart, Headphones, ArrowRight, ShieldCheck, Lock } from "lucide-react";
import Link from "next/link";

const footerLinks = {
  Services: [
    { label: "University Admission", href: "#services" },
    { label: "Scholarship Guidance", href: "#scholarships" },
    { label: "Visa Support", href: "#services" },
    { label: "Document Assistance", href: "#services" },
    { label: "Career Guidance", href: "#services" },
  ],
  Destinations: [
    { label: "Study in UK", href: "#destinations" },
    { label: "Study in India", href: "#destinations" },
    { label: "Study in China", href: "#destinations" },
    { label: "Study in Malaysia", href: "#destinations" },
    { label: "Study in Egypt", href: "#destinations" },
  ],
  Company: [
    { label: "About Us", href: "#" },
    { label: "How It Works", href: "#services" },
    { label: "Success Stories", href: "#" },
    { label: "Blog", href: "#" },
    { label: "Contact", href: "#contact" },
  ],
};

const socialLinks = [
  {
    name: "Facebook",
    href: "https://www.facebook.com/profile.php?id=100087644192638",
    image: "/images/facebook-logo.png?v=2",
  },
  {
    name: "TikTok",
    href: "https://www.tiktok.com/@mtishbi.scholars",
    image: "/images/tiktok-logo.png?v=2",
  },
  {
    name: "Instagram",
    href: "https://www.instagram.com/mtishbischolars?igsi=MXA0bmg2b2psMWs2cg%3D%3D&utm_source=qr",
    image: "/images/instagram-logo.png?v=2",
  },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[#0A1020] text-white relative overflow-hidden">
      {/* Top gold accent line */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />

      {/* Ambient background glows */}
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#D4AF37]/5 rounded-full -translate-x-1/2 translate-y-1/2 blur-3xl pointer-events-none" />
      <div className="absolute top-0 right-0 w-72 h-72 bg-[#D4AF37]/5 rounded-full translate-x-1/2 -translate-y-1/2 blur-3xl pointer-events-none" />

      <div className="container-wide section-padding relative z-10">
        {/* Main Footer Content */}
        <div className="py-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand & Contact (Col 1-2) */}
          <div className="lg:col-span-2 space-y-5">
            <Link href="/" className="flex items-center gap-3 inline-flex" aria-label="Mtishbi Scholars Home">
              <div className="relative h-12 w-16 overflow-hidden rounded-xl">
                <Image
                  src="/logo.png"
                  alt="Mtishbi Scholars official logo"
                  fill
                  className="object-contain"
                  sizes="64px"
                />
              </div>
              <div>
                <span
                  className="text-white font-extrabold text-lg leading-none"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  Mtishbi<span className="text-[#D4AF37]">Scholars</span>
                </span>
                <div className="text-slate-300 text-[10px] tracking-widest uppercase mt-1 font-medium">
                  Your Pathway to Global Education
                </div>
              </div>
            </Link>

            <p className="text-[#D4AF37] text-xs italic tracking-wide font-medium">
              &lsquo;Springboard to your education&rsquo;
            </p>

            <p className="text-slate-300 text-sm leading-relaxed max-w-sm">
              Our mission is to connect students&apos; skills, performance, and aspirations
              with the greatest available career opportunities and tailor services to those
              interested in studying abroad.
            </p>

            {/* Contact details */}
            <div className="space-y-3 pt-2">
              <div>
                <a
                  href="mailto:info@mtishbischolar.com"
                  className="flex items-center gap-2.5 text-slate-200 hover:text-[#D4AF37] text-sm transition-colors group"
                >
                  <Mail className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                  <span className="font-semibold">info@mtishbischolar.com</span>
                </a>
                <p className="text-slate-300 text-[11px] ml-6">
                  General inquiries, admissions &amp; scholarships
                </p>
              </div>

              <div>
                <a
                  href="mailto:support@mtishbischolar.com"
                  className="flex items-center gap-2.5 text-slate-200 hover:text-[#D4AF37] text-sm transition-colors group"
                >
                  <Headphones className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <span className="font-semibold">support@mtishbischolar.com</span>
                </a>
                <p className="text-slate-300 text-[11px] ml-6">
                  24/7 technical &amp; account support
                </p>
              </div>

              <div>
                <a
                  href="tel:+255764488687"
                  className="flex items-center gap-2.5 text-slate-200 hover:text-[#D4AF37] text-sm transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                  <span>+255 764 488 687</span>
                </a>
              </div>

              <div className="flex items-center gap-2.5 text-slate-300 text-sm">
                <MapPin className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                <span>Dar es Salaam, Tanzania</span>
              </div>
            </div>

            {/* Social Media Links */}
            <div className="pt-3">
              <p className="text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2.5">
                Follow Us
              </p>
              <div className="flex items-center gap-3">
                {socialLinks.map((social) => (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.name}
                    className="relative w-9 h-9 rounded-xl overflow-hidden shadow-md hover:opacity-90 transition-all cursor-pointer hover:scale-110 shrink-0 border border-white/10 bg-slate-900 flex items-center justify-center"
                  >
                    <img
                      src={social.image}
                      alt={`${social.name} logo`}
                      className="w-full h-full object-cover"
                      loading="eager"
                    />
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([group, links]) => (
            <div key={group}>
              <h4
                className="text-sm font-bold text-white mb-4 tracking-wide"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {group}
              </h4>
              <ul className="space-y-2.5">
                {links.map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      className="text-slate-300 text-sm hover:text-[#D4AF37] transition-colors flex items-center gap-1 group"
                    >
                      <span className="w-0 group-hover:w-2 h-px bg-[#D4AF37] transition-all duration-200" />
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>

              {/* Staff Portal Badge inside Company column */}
              {group === "Company" && (
                <div className="mt-8 p-4 rounded-2xl bg-gradient-to-b from-white/[0.06] to-white/[0.02] border border-[#D4AF37]/20 shadow-lg relative overflow-hidden">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-6 h-6 rounded-lg bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
                    </div>
                    <span className="text-xs font-bold text-white tracking-wide">Staff &amp; Admin</span>
                  </div>
                  <p className="text-[11px] text-slate-300 mb-3 leading-snug">
                    Access administrative desks and admission officer tools.
                  </p>
                  <Link
                    href="/admin/login"
                    className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-[#D4AF37] hover:bg-[#E8C84A] text-[#0A1020] text-xs font-extrabold transition-all shadow-md group"
                  >
                    <Lock className="w-3 h-3 text-[#0A1020]" />
                    <span>Admin Login</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="py-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-slate-300 text-xs text-center sm:text-left">
            © {year} MtishbiScholars. All rights reserved. Made with{" "}
            <Heart className="w-3 h-3 text-[#D4AF37] inline" /> in Tanzania.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
            <Link href="/privacy-policy" className="text-slate-300 hover:text-[#D4AF37] transition-colors">
              Privacy Policy
            </Link>
            <span className="text-white/20">•</span>
            <Link href="/terms-of-service" className="text-slate-300 hover:text-[#D4AF37] transition-colors">
              Terms of Service
            </Link>
            <span className="text-white/20">•</span>
            <Link href="/cookie-policy" className="text-slate-300 hover:text-[#D4AF37] transition-colors">
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
