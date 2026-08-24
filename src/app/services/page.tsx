"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { SERVICES_DATA, ServiceDetail } from "@/data/servicesData";
import { createClient } from "@/lib/supabase/client";
import {
  GraduationCap,
  Award,
  FileCheck,
  Globe2,
  IdCard,
  Briefcase,
  Users,
  CheckCircle2,
  ArrowRight,
  ChevronDown,
  HelpCircle,
  Send,
  X,
  Sparkles,
  Layers,
  UserCheck,
  Lock,
} from "lucide-react";

// Map icon strings to Lucide components
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  GraduationCap,
  Award,
  FileCheck,
  Globe2,
  IdCard,
  Briefcase,
  Users,
};

export default function ServicesPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>("all");
  const [requestServiceModal, setRequestServiceModal] = useState<string | null>(null);
  const [accountRequiredService, setAccountRequiredService] = useState<{ id: string; title: string } | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [submittedInquiry, setSubmittedInquiry] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session?.user || null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user || null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleServiceAction = (service: ServiceDetail) => {
    if (!currentUser) {
      setAccountRequiredService({ id: service.id, title: service.title });
    } else {
      router.push(`/student/dashboard?service=${encodeURIComponent(service.id)}`);
    }
  };

  const displayedServices =
    activeTab === "all"
      ? SERVICES_DATA
      : SERVICES_DATA.filter((s) => s.id === activeTab);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-emerald-600 selection:text-white">
      <Navbar />

      {/* ── Page Hero (Light Green & Clean White Theme) ── */}
      <section className="pt-28 pb-16 relative overflow-hidden bg-gradient-to-b from-emerald-100/70 via-emerald-50/40 to-slate-50 border-b border-emerald-100">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-teal-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-10 xl:px-16 relative z-10 text-center max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-emerald-600/10 border border-emerald-600/25 rounded-full px-4 py-1.5 mb-4 shadow-2xs">
            <Layers className="w-4 h-4 text-emerald-600" />
            <span className="text-emerald-700 text-xs font-black tracking-wider uppercase">
              What We Offer
            </span>
          </div>

          <h1
            className="text-3xl md:text-5xl font-black text-slate-900 leading-tight mb-4 tracking-tight"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Comprehensive Services for Your{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-800">
              Study Abroad Journey
            </span>
          </h1>

          <p className="text-slate-600 text-base md:text-lg mb-8 leading-relaxed font-normal">
            From university selection and guaranteed 50% scholarships to document verification, visa support, and career mentoring — we handle every single step.
          </p>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 max-w-4xl mx-auto">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all ${activeTab === "all"
                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/25 ring-2 ring-emerald-600/20"
                : "bg-white border border-slate-200 text-slate-700 hover:border-emerald-500 hover:text-emerald-700 shadow-2xs"
                }`}
            >
              All 6 Services
            </button>
            {SERVICES_DATA.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveTab(s.id)}
                className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all ${activeTab === s.id
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/25 ring-2 ring-emerald-600/20"
                  : "bg-white border border-slate-200 text-slate-700 hover:border-emerald-500 hover:text-emerald-700 shadow-2xs"
                  }`}
              >
                {s.title}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Main Services Content ── */}
      <main className="flex-1 py-12 max-w-[1440px] mx-auto px-4 md:px-6 lg:px-10 xl:px-16 w-full space-y-12">
        {displayedServices.map((service, index) => {
          const IconComponent = iconMap[service.iconName] || GraduationCap;
          return (
            <motion.section
              key={service.id}
              id={service.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-white border border-emerald-100 rounded-3xl p-6 md:p-10 shadow-xl shadow-emerald-950/5 relative overflow-hidden"
            >
              {/* Top Accent Gradient (Light Green Gradient) */}
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600" />

              {/* Service Title Bar */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 pb-6 mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center shadow-lg shadow-emerald-600/20 shrink-0">
                    <IconComponent className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h2
                      className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight"
                      style={{ fontFamily: "var(--font-heading)" }}
                    >
                      {service.title}
                    </h2>
                    <p className="text-emerald-700 text-xs font-bold mt-1">
                      {service.subtitle}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleServiceAction(service)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-6 py-3 rounded-xl shadow-md shadow-emerald-600/25 transition-all text-sm shrink-0 self-start md:self-auto flex items-center gap-2 cursor-pointer"
                >
                  <span>Apply for {service.title}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Grid Content */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column — Overview & Key Benefits */}
                <div className="lg:col-span-6 space-y-6">
                  <div className="p-5 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-2">
                    <h3 className="text-xs font-black text-emerald-800 uppercase tracking-wider">
                      Overview
                    </h3>
                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                      {service.overview}
                    </p>
                  </div>

                  <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-5 space-y-3 shadow-2xs">
                    <h3 className="text-xs font-black text-emerald-900 uppercase tracking-wider">
                      Key Student Benefits
                    </h3>
                    {service.benefits.map((b, i) => (
                      <div key={i} className="flex items-start gap-2.5 text-xs text-slate-800 font-medium">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{b}</span>
                      </div>
                    ))}
                  </div>

                  {/* Required Documents */}
                  <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-5 space-y-3 shadow-2xs">
                    <h3 className="text-xs font-black text-emerald-900 uppercase tracking-wider">
                      Document Checklist Required
                    </h3>
                    {service.requirements.map((r, i) => (
                      <div key={i} className="flex items-start gap-2.5 text-xs text-slate-800 font-medium">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                        <span>{r}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right Column — Process Flow & FAQ */}
                <div className="lg:col-span-6 space-y-6">
                  {/* Step-by-Step Timeline */}
                  <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 shadow-2xs">
                    <h3 className="text-xs font-black text-emerald-800 uppercase tracking-wider mb-4">
                      How It Works &mdash; Step by Step Process
                    </h3>
                    <div className="space-y-4">
                      {service.processSteps.map((step, idx) => (
                        <div key={idx} className="flex items-start gap-3 border-b border-slate-200/60 pb-3 last:border-0 last:pb-0">
                          <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 text-xs font-black shadow-xs">
                            {idx + 1}
                          </div>
                          <div>
                            <p className="text-xs font-extrabold text-slate-900">{step.title}</p>
                            <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">{step.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Service FAQs */}
                  {service.faq && service.faq.length > 0 && (
                    <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-3 shadow-2xs">
                      <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <HelpCircle className="w-4 h-4 text-emerald-600" />
                        Frequently Asked Questions
                      </h3>
                      {service.faq.map((item, idx) => (
                        <div key={idx} className="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-100 space-y-1">
                          <p className="text-xs font-extrabold text-emerald-950">Q: {item.q}</p>
                          <p className="text-[11px] text-slate-700 leading-relaxed">A: {item.a}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Service Card Bottom CTA */}
              <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/80 -mx-6 -mb-6 md:-mx-10 md:-mb-10 p-6 md:px-10 rounded-b-3xl">
                <p className="text-xs text-slate-600 text-center sm:text-left font-medium">
                  Need custom assistance with <strong className="text-slate-900 font-extrabold">{service.title}</strong>? Our counselors are ready to help.
                </p>
                <button
                  onClick={() => handleServiceAction(service)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-6 py-2.5 rounded-xl shadow-md shadow-emerald-600/20 transition-all text-xs shrink-0 flex items-center gap-2 cursor-pointer"
                >
                  <span>Get Started Now</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.section>
          );
        })}
      </main>

      {/* ── Account Required Modal ── */}
      <AnimatePresence>
        {accountRequiredService && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white border border-emerald-100 rounded-3xl max-w-md w-full p-6 md:p-8 text-slate-800 relative shadow-2xl"
            >
              <button
                onClick={() => setAccountRequiredService(null)}
                className="absolute top-5 right-5 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-all cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center space-y-4">
                <div className="w-14 h-14 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-center text-emerald-600 mx-auto shadow-xs">
                  <UserCheck className="w-7 h-7" />
                </div>

                <div>
                  <span className="text-[11px] font-extrabold text-emerald-700 uppercase tracking-wider">
                    {accountRequiredService.title}
                  </span>
                  <h3
                    className="text-2xl font-black text-slate-900 mt-1 tracking-tight"
                    style={{ fontFamily: "var(--font-heading)" }}
                  >
                    Account Required
                  </h3>
                </div>

                <p className="text-slate-600 text-sm leading-relaxed font-normal">
                  Please create an account or log in to continue with this service application. Your account allows you to submit applications, upload documents, track your application status, and receive updates from MtishbiScholar.
                </p>

                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                  <Link
                    href={`/auth/register?service=${encodeURIComponent(accountRequiredService.id)}`}
                    className="flex-1 inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3.5 px-5 rounded-xl shadow-md shadow-emerald-600/25 hover:shadow-lg transition-all text-sm text-center cursor-pointer"
                  >
                    <span>Create Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  <Link
                    href={`/auth/login?redirect=${encodeURIComponent('/services#' + accountRequiredService.id)}`}
                    className="inline-flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-3.5 px-6 rounded-xl border border-slate-200 transition-all text-sm text-center cursor-pointer"
                  >
                    <span>Login</span>
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Service Inquiry Modal (Light Green & White Theme) ── */}
      <AnimatePresence>
        {requestServiceModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-emerald-100 rounded-3xl max-w-md w-full p-6 md:p-8 text-slate-800 relative shadow-2xl"
            >
              <button
                onClick={() => {
                  setRequestServiceModal(null);
                  setSubmittedInquiry(false);
                }}
                className="absolute top-5 right-5 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-all"
              >
                <X className="w-5 h-5" />
              </button>

              {submittedInquiry ? (
                <div className="text-center py-8 space-y-4">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-md">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900">Inquiry Received! 🎉</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Thank you! Our advisor for <strong className="text-emerald-700 font-bold">{requestServiceModal}</strong> will contact you via WhatsApp / Phone within 24 hours.
                  </p>
                  <button
                    onClick={() => {
                      setRequestServiceModal(null);
                      setSubmittedInquiry(false);
                    }}
                    className="bg-emerald-600 text-white font-extrabold px-6 py-2.5 rounded-xl text-sm hover:bg-emerald-700 shadow-md shadow-emerald-600/20"
                  >
                    Close Window
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setSubmittedInquiry(true);
                  }}
                  className="space-y-4"
                >
                  <div>
                    <span className="text-xs text-emerald-700 font-extrabold uppercase tracking-wider">
                      Service Request Form
                    </span>
                    <h3 className="text-xl font-black text-slate-900 mt-0.5">
                      Request {requestServiceModal}
                    </h3>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Your Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Mary Joseph"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-sm outline-none focus:border-emerald-600 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Phone / WhatsApp</label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. +255 7XX XXX XXX"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-sm outline-none focus:border-emerald-600 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Message / Questions</label>
                    <textarea
                      rows={3}
                      placeholder="Tell us more about your target country, course, or specific questions..."
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-sm outline-none focus:border-emerald-600 focus:bg-white resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3.5 rounded-xl hover:shadow-lg transition-all text-sm mt-2 flex items-center justify-center gap-2 shadow-md shadow-emerald-600/25"
                  >
                    <Send className="w-4 h-4" />
                    <span>Submit Free Request</span>
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}
