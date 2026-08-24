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
  { label: "Home", href: "/#home" },
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
                  src="/logo.jpeg"
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
                  Mtishbi<span className="text-[#D4AF37]">Scholar</span>
                </span>
              </div>
            </Link>

            {/* Nav links — katikati kabisa */}
            <div className="hidden lg:flex items-center gap-0.5 absolute left-1/2 -translate-x-1/2">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
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
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden text-white p-2 rounded-lg hover:bg-white/10 transition-colors ml-auto"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-40 lg:hidden"
          >
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <div className="absolute right-0 top-0 bottom-0 w-80 bg-[#0F172A] shadow-2xl p-6 flex flex-col">
              <div className="flex items-center justify-between mb-8 mt-2">
                <div className="flex items-center gap-2.5">
                  <div className="relative h-10 w-12 overflow-hidden rounded-lg">
                    <Image
                      src="/logo.jpeg"
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
                    Mtishbi<span className="text-[#D4AF37]">Scholar</span>
                  </span>
                </div>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="text-white/70 hover:text-white p-2"
                  aria-label="Close menu"
                >
                  <X size={20} />
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
                    onClick={() => setMobileOpen(false)}
                    className="text-white/80 hover:text-[#D4AF37] hover:bg-white/5 px-4 py-3 rounded-xl text-base font-medium transition-all"
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
