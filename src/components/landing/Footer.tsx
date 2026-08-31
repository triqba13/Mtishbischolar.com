"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Mail, Phone, MapPin, Heart, ExternalLink, Headphones, ArrowRight } from "lucide-react";
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
    href: "#",
    image: "/images/facebook-logo.png",
  },
  {
    name: "TikTok",
    href: "#",
    image: "/images/tiktok-logo.png",
  },
  {
    name: "Instagram",
    href: "#",
    image: "/images/instagram-logo.png",
  },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[#0A1020] text-white relative overflow-hidden">
      {/* Top gold line */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />

      {/* Decorations */}
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#D4AF37]/3 rounded-full -translate-x-1/2 translate-y-1/2 blur-3xl pointer-events-none" />
      <div className="absolute top-0 right-0 w-72 h-72 bg-[#D4AF37]/3 rounded-full translate-x-1/2 -translate-y-1/2 blur-3xl pointer-events-none" />

      <div className="container-wide section-padding relative z-10">
        {/* Main Footer Content */}
        <div className="py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-3 mb-3 inline-flex" aria-label="Mtishbi Scholars Home">
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
                <div className="text-white/30 text-[10px] tracking-widest uppercase mt-1">
                  Your Pathway to Global Education
                </div>
              </div>
            </Link>
            {/* Tagline from VVX */}
            <p className="text-[#D4AF37]/80 text-xs italic mb-4 tracking-wide">
              &lsquo;Springboard to your education&rsquo;
            </p>
            {/* Mission Statement from VVX */}
            <p className="text-white/50 text-sm leading-relaxed max-w-sm mb-6">
              Our mission is to connect students&apos; skills, performance, and aspirations
              with the greatest available career opportunities and tailor services to those
              interested in studying abroad.
            </p>

            {/* Contact mini */}
            <div className="space-y-3">
              <div>
                <a
                  href="mailto:info@mtishbischolar.com"
                  className="flex items-center gap-2.5 text-white/70 hover:text-[#D4AF37] text-sm transition-colors group"
                >
                  <Mail className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                  <span className="font-semibold">info@mtishbischolar.com</span>
                </a>
                <p className="text-white/40 text-[11px] ml-6">
                  General inquiries, admissions &amp; scholarships
                </p>
              </div>

              <div>
                <a
                  href="mailto:support@mtishbischolar.com"
                  className="flex items-center gap-2.5 text-white/70 hover:text-[#D4AF37] text-sm transition-colors group"
                >
                  <Headphones className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <span className="font-semibold">support@mtishbischolar.com</span>
                </a>
                <p className="text-white/40 text-[11px] ml-6">
                  24/7 technical &amp; account support
                </p>
              </div>

              <div className="pt-1">
                <a
                  href="tel:+255764488687"
                  className="flex items-center gap-2.5 text-white/70 hover:text-[#D4AF37] text-sm transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                  <span>+255 764 488 687</span>
                </a>
              </div>

              <div className="flex items-center gap-2.5 text-white/50 text-sm">
                <MapPin className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                <span>Dar es Salaam, Tanzania</span>
              </div>
            </div>

            {/* Social Media Links */}
            <div className="mt-5 pt-4 border-t border-white/10">
              <p className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-2.5">
                Follow Us
              </p>
              <div className="flex items-center gap-3">
                {socialLinks.map((social) => (
                  <a
                    key={social.name}
                    href={social.href}
                    aria-label={social.name}
                    className="relative w-9 h-9 rounded-xl overflow-hidden shadow-md hover:opacity-90 transition-all cursor-pointer hover:scale-110 shrink-0 border border-white/10"
                  >
                    <Image
                      src={social.image}
                      alt={`${social.name} logo`}
                      fill
                      className="object-cover"
                      sizes="36px"
                      unoptimized
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
                      className="text-white/50 text-sm hover:text-[#D4AF37] transition-colors flex items-center gap-1 group"
                    >
                      <span className="w-0 group-hover:w-2 h-px bg-[#D4AF37] transition-all duration-200" />
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter */}
        <div className="py-8 border-t border-white/5">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h4
                className="text-base font-bold text-white mb-1"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Stay Updated on Scholarships & Opportunities
              </h4>
              <p className="text-white/40 text-sm">
                Get monthly scholarship alerts and study abroad tips directly in your inbox.
              </p>
            </div>
            <form
              className="flex w-full md:w-auto gap-2"
              onSubmit={(e) => e.preventDefault()}
            >
              <input
                type="email"
                placeholder="Enter your email"
                aria-label="Enter your email address"
                className="flex-1 md:w-64 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-[#D4AF37]/50 outline-none text-white text-sm placeholder-white/20 transition-all"
              />
              <button
                type="submit"
                aria-label="Subscribe to newsletter"
                className="px-5 py-2.5 bg-[#D4AF37] text-[#0F172A] font-bold rounded-xl text-sm hover:bg-[#E8C84A] transition-all shrink-0"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="py-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white/30 text-xs">
            © {year} MtishbiScholars. All rights reserved. Made with{" "}
            <Heart className="w-3 h-3 text-[#D4AF37] inline" /> in Tanzania.
          </p>
          <div className="flex items-center gap-4">
            <Link href="/privacy-policy" className="text-white/30 hover:text-[#D4AF37] text-xs transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms-of-service" className="text-white/30 hover:text-[#D4AF37] text-xs transition-colors">
              Terms of Service
            </Link>
            <Link href="/cookie-policy" className="text-white/30 hover:text-[#D4AF37] text-xs transition-colors">
              Cookie Policy
            </Link>
            <Link
              href="/admin/login"
              className="text-[#D4AF37] text-xs font-semibold hover:text-[#E8C84A] transition-colors inline-flex items-center gap-1"
            >
              <span>Admin Login</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
