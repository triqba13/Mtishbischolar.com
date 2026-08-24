"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  Menu,
  X,
  ChevronDown,
  Globe,
  BookOpen,
  Phone,
} from "lucide-react";
import Link from "next/link";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Services", href: "/services" },
  { label: "Universities", href: "/#universities" },
  { label: "Destinations", href: "/destinations" },
  { label: "Our Team", href: "/#team" },
  { label: "FAQ", href: "/#faq" },
  { label: "Contact", href: "/#contact" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <>
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-[#0B192C]/95 backdrop-blur-xl shadow-xl shadow-slate-950/40 border-b border-slate-800/80"
            : "bg-[#0B192C]/90 backdrop-blur-md border-b border-slate-800/60 shadow-md"
        }`}
      >
        <div className="container-wide section-padding">
          <div className="relative flex items-center h-16">

            {/* Logo — kushoto kabisa */}
            <Link href="/" className="flex items-center gap-2.5 group shrink-0" aria-label="Mtishbi Scholars Home">
              <div className="relative h-10 w-12 overflow-hidden rounded-lg">
                <Image
                  src="/logo.png"
                  alt="Mtishbi Scholars official logo"
                  fill
                  className="object-contain"
                  sizes="48px"
                  priority
                />
              </div>
              <div className="flex flex-col">
                <span
                  className="text-white font-extrabold text-base leading-none tracking-tight"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  Mtishbi<span className="text-[#D4AF37]">Scholars</span>
                </span>
              </div>
            </Link>

            {/* Nav links — katikati kabisa */}
            <div className="hidden lg:flex items-center gap-0.5 absolute left-1/2 -translate-x-1/2">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => {
                    if (link.href === "/" && typeof window !== "undefined" && window.location.pathname === "/") {
                      e.preventDefault();
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }
                  }}
                  className="text-white/80 hover:text-[#D4AF37] px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-white/5 whitespace-nowrap"
                >
                  {link.label}
                </a>
              ))}
            </div>

            {/* CTA Buttons — kulia kabisa */}
            <div className="hidden lg:flex items-center gap-2 ml-auto shrink-0">
              <Link
                href="/auth/login"
                className="text-white/80 hover:text-[#D4AF37] text-sm font-medium transition-colors px-3 py-1.5"
              >
                Login
              </Link>
              <Link
                href="/auth/register"
                className="bg-gradient-to-r from-[#D4AF37] to-[#E8C84A] text-[#0F172A] text-xs font-bold px-4 py-2 rounded-lg hover:shadow-lg hover:shadow-[#D4AF37]/25 transition-all duration-300 hover:-translate-y-0.5 whitespace-nowrap"
              >
                Start Your Journey
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden text-white p-2 rounded-lg hover:bg-white/10 transition-colors ml-auto"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav-drawer"
            >
              {mobileOpen ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-[100] lg:hidden flex justify-end" id="mobile-nav-drawer">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, x: "100%" }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-[320px] sm:max-w-sm h-full bg-[#0B192C] border-l border-slate-800 shadow-2xl p-6 flex flex-col z-10 overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-8 mt-2">
                <div className="flex items-center gap-2.5">
                  <div className="relative h-10 w-12 overflow-hidden rounded-lg">
                    <Image
                      src="/logo.png"
                      alt="Mtishbi Scholars official logo"
                      fill
                      className="object-contain"
                      sizes="48px"
                    />
                  </div>
                  <span
                    className="text-white font-extrabold text-lg leading-none"
                    style={{ fontFamily: "var(--font-heading)" }}
                  >
                    Mtishbi<span className="text-[#D4AF37]">Scholars</span>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="text-white/70 hover:text-white p-2 rounded-lg hover:bg-white/10"
                  aria-label="Close menu"
                >
                  <X size={20} aria-hidden="true" />
                </button>
              </div>

              <nav className="flex flex-col gap-2 flex-1">
                {navLinks.map((link, i) => (
                  <motion.a
                    key={link.href}
                    href={link.href}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={(e) => {
                      setMobileOpen(false);
                      if (link.href === "/" && typeof window !== "undefined" && window.location.pathname === "/") {
                        e.preventDefault();
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }
                    }}
                    className="text-white/85 hover:text-[#D4AF37] hover:bg-white/5 px-4 py-3 rounded-xl text-base font-medium transition-all"
                  >
                    {link.label}
                  </motion.a>
                ))}
              </nav>

              <div className="flex flex-col gap-3 mt-8">
                <Link
                  href="/auth/login"
                  onClick={() => setMobileOpen(false)}
                  className="text-center border border-white/20 text-white py-3 rounded-xl font-medium hover:border-[#D4AF37]/50 transition-all"
                >
                  Login
                </Link>
                <Link
                  href="/auth/register"
                  onClick={() => setMobileOpen(false)}
                  className="text-center bg-gradient-to-r from-[#D4AF37] to-[#E8C84A] text-[#0F172A] py-3 rounded-xl font-bold hover:shadow-lg transition-all"
                >
                  Start Your Journey
                </Link>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
