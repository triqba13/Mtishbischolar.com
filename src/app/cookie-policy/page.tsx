import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import {
  Cookie,
  ShieldCheck,
  Lock,
  FileText,
  Globe,
  Settings,
  BarChart3,
  Bug,
  Search,
  Ban,
  Clock,
  MapPin,
  HelpCircle,
  Mail,
  Phone,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Layers,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description:
    "Learn how MtishbiScholars uses essential cookies, functional browser storage, analytics, and error-monitoring technologies to operate and improve its website and services.",
  alternates: {
    canonical: "https://www.mtishbischolar.com/cookie-policy",
  },
  openGraph: {
    title: "Cookie Policy | MtishbiScholars",
    description:
      "Learn how MtishbiScholars uses essential cookies, functional browser storage, analytics, and error-monitoring technologies to operate and improve its website and services.",
    url: "https://www.mtishbischolar.com/cookie-policy",
    type: "website",
    siteName: "MtishbiScholars",
  },
};

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-[#070D18] text-slate-100 flex flex-col selection:bg-[#D4AF37]/30 selection:text-white">
      <Navbar />

      <main className="flex-1 pt-24 sm:pt-28 md:pt-32 pb-20">
        {/* Hero Header */}
        <section className="relative overflow-hidden border-b border-slate-800/80 bg-gradient-to-b from-[#0B1528] via-[#080E1A] to-[#070D18] py-12 md:py-16">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-[#D4AF37]/5 rounded-full blur-3xl pointer-events-none" />
          <div className="container-wide section-padding relative z-10">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 bg-[#D4AF37]/10 border border-[#D4AF37]/25 rounded-full px-3.5 py-1.5 mb-5">
                <Cookie className="w-4 h-4 text-[#D4AF37]" aria-hidden="true" />
                <span className="text-[#D4AF37] text-xs font-semibold tracking-wider uppercase">
                  Storage &amp; Tracking Transparency
                </span>
              </div>

              <h1
                className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight mb-4 leading-[1.15]"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Cookie Policy
              </h1>

              <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-4">
                This Cookie Policy explains how MtishbiScholars uses essential cookies, functional local storage, analytics, and error-monitoring technologies when you visit our website or use our student platform.
              </p>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <Clock className="w-3.5 h-3.5 text-[#D4AF37]" aria-hidden="true" />
                  Last Updated: 25 August 2026
                </span>
                <span className="text-slate-600 hidden sm:inline">&bull;</span>
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-[#D4AF37]" aria-hidden="true" />
                  Applicable Law: United Republic of Tanzania
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Content Section */}
        <section className="container-wide section-padding py-12 md:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            {/* Desktop Sticky Table of Contents */}
            <aside className="lg:col-span-4 hidden lg:block sticky top-28 space-y-4">
              <div className="p-5 rounded-2xl bg-[#0B1528]/80 border border-slate-800/80 backdrop-blur-md shadow-xl">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#D4AF37]" aria-hidden="true" />
                  <span>Table of Contents</span>
                </h2>
                <nav className="space-y-1 text-xs">
                  {[
                    { id: "introduction", label: "1. Introduction" },
                    { id: "what-are-cookies", label: "2. What Cookies Are" },
                    { id: "how-we-use-cookies", label: "3. How We Use Cookies" },
                    { id: "auth-cookies", label: "4. Strictly Necessary Cookies" },
                    { id: "oauth-pkce", label: "5. Google OAuth & PKCE" },
                    { id: "local-storage", label: "6. Functional Browser Storage" },
                    { id: "google-analytics", label: "7. Google Analytics" },
                    { id: "sentry-monitoring", label: "8. Sentry Error Monitoring" },
                    { id: "search-console", label: "9. Google Search Console" },
                    { id: "trackers-not-used", label: "10. Technologies Not Used" },
                    { id: "advertising", label: "11. Advertising & Marketing" },
                    { id: "third-party-services", label: "12. Third-Party Services" },
                    { id: "lifespan", label: "13. Cookie & Storage Lifespan" },
                    { id: "managing-cookies", label: "14. Managing Preferences" },
                    { id: "disabling-storage", label: "15. Impact of Disabling Storage" },
                    { id: "privacy-protection", label: "16. Privacy & Data Protection" },
                    { id: "changes", label: "17. Policy Updates" },
                    { id: "contact-info", label: "18. Contact Information" },
                  ].map((item) => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      className="block py-1.5 px-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all truncate"
                    >
                      {item.label}
                    </a>
                  ))}
                </nav>
              </div>

              {/* Direct Support Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-[#0B1528] to-[#0D1B36] border border-[#D4AF37]/20">
                <h3 className="text-sm font-bold text-white mb-1.5 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-[#D4AF37]" aria-hidden="true" />
                  Storage Questions?
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-3">
                  Our technical advisory team is available to address questions regarding cookies, storage, and platform security.
                </p>
                <a
                  href="mailto:info@mtishbischolar.com"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#D4AF37] hover:text-[#E8C84A] transition-colors"
                >
                  <span>info@mtishbischolar.com</span>
                  <ArrowRight className="w-3 h-3" aria-hidden="true" />
                </a>
              </div>
            </aside>

            {/* Main Policy Body */}
            <div className="lg:col-span-8 space-y-12 text-slate-300 leading-relaxed text-sm sm:text-base">
              {/* Section 1 */}
              <section id="introduction" className="scroll-mt-28 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] shrink-0 font-bold text-sm">
                    1
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white" style={{ fontFamily: "var(--font-heading)" }}>
                    Introduction
                  </h2>
                </div>
                <p>
                  MtishbiScholars (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;) is an international education advisory and student placement platform based in Dar es Salaam, Tanzania. We are dedicated to maintaining complete transparency regarding how we store data in your browser, maintain secure user sessions, monitor software stability, and assess public website traffic.
                </p>
                <p>
                  This Cookie Policy outlines the specific cookies and local storage items used on our platform, their operational purposes, retention durations, and the mechanisms available to manage your preferences.
                </p>
              </section>

              {/* Section 2 */}
              <section id="what-are-cookies" className="scroll-mt-28 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] shrink-0 font-bold text-sm">
                    2
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white" style={{ fontFamily: "var(--font-heading)" }}>
                    What Cookies and Browser Storage Are
                  </h2>
                </div>
                <p>
                  <strong>Cookies</strong> are small text files placed on your computer or mobile device by websites you visit. Cookies are transmitted between your web browser and web servers to enable authentication, preserve user sessions, and maintain platform security.
                </p>
                <p>
                  <strong>Browser Local Storage (localStorage)</strong> is a browser-based storage technology that allows web applications to store functional key-value pairs locally on your device. Unlike HTTP cookies, local storage items are not automatically sent to web servers with every network request.
                </p>
              </section>

              {/* Section 3 */}
              <section id="how-we-use-cookies" className="scroll-mt-28 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] shrink-0 font-bold text-sm">
                    3
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white" style={{ fontFamily: "var(--font-heading)" }}>
                    How MtishbiScholars Uses Storage Technologies
                  </h2>
                </div>
                <p>
                  We utilize cookies and browser storage strictly for legitimate operational purposes, categorized as follows:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                  <div className="p-4 rounded-xl bg-[#0B1528] border border-slate-800 space-y-1.5">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-[#D4AF37]" aria-hidden="true" />
                      1. Strictly Necessary
                    </h3>
                    <p className="text-xs text-slate-300">
                      Essential for user sign-in, session persistence, role access verification, and platform security.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#0B1528] border border-slate-800 space-y-1.5">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Settings className="w-3.5 h-3.5 text-[#D4AF37]" aria-hidden="true" />
                      2. Functional Storage
                    </h3>
                    <p className="text-xs text-slate-300">
                      Stores user-chosen interface settings, such as dark/light theme preferences and notification UI filters.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#0B1528] border border-slate-800 space-y-1.5">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <BarChart3 className="w-3.5 h-3.5 text-[#D4AF37]" aria-hidden="true" />
                      3. Analytics
                    </h3>
                    <p className="text-xs text-slate-300">
                      Measures public website traffic and aggregate navigation trends without collecting sensitive personal data.
                    </p>
                  </div>
                </div>
              </section>

              {/* Section 4 */}
              <section id="auth-cookies" className="scroll-mt-28 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] shrink-0 font-bold text-sm">
                    4
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white" style={{ fontFamily: "var(--font-heading)" }}>
                    Strictly Necessary Authentication Cookies
                  </h2>
                </div>
                <p>
                  Strictly necessary cookies are essential for our platform to operate securely. They enable student login, secure session validation across page loads, and role-based route protection in our middleware.
                </p>
                <div className="p-4 rounded-xl bg-[#0B1528] border border-slate-800 space-y-3 text-xs sm:text-sm">
                  <div className="space-y-1">
                    <strong className="text-white block font-mono text-xs text-[#D4AF37]">
                      sb-&lt;project-ref&gt;-auth-token (including .0, .1 chunked variants)
                    </strong>
                    <p className="text-slate-300">
                      <strong>Provider:</strong> Supabase Authentication (`@supabase/ssr`).
                    </p>
                    <p className="text-slate-300">
                      <strong>Purpose:</strong> Stores encrypted JSON Web Tokens (JWT) and refresh tokens required to authenticate students, admission officers, and finance staff securely across server requests.
                    </p>
                    <p className="text-slate-400 text-xs">
                      <strong>Lifespan:</strong> Session-based or duration-limited by token expiration.
                    </p>
                  </div>
                </div>
              </section>

              {/* Section 5 */}
              <section id="oauth-pkce" className="scroll-mt-28 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] shrink-0 font-bold text-sm">
                    5
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white" style={{ fontFamily: "var(--font-heading)" }}>
                    Google OAuth &amp; PKCE Verification
                  </h2>
                </div>
                <p>
                  When you authenticate using Google OAuth, our authentication provider utilizes the standard Proof Key for Code Exchange (PKCE) security protocol to prevent authorization code interception.
                </p>
                <div className="p-4 rounded-xl bg-[#0B1528] border border-slate-800 space-y-2 text-xs sm:text-sm">
                  <strong className="text-white block font-mono text-xs text-[#D4AF37]">
                    sb-&lt;project-ref&gt;-auth-token-code-verifier
                  </strong>
                  <p className="text-slate-300">
                    <strong>Purpose:</strong> Transient cryptographic verifier cookie used temporarily during OAuth callback processing to ensure that the entity completing authentication is the same entity that initiated it.
                  </p>
                  <p className="text-slate-400 text-xs">
                    <strong>Lifespan:</strong> Short-lived; automatically removed upon completion of authentication.
                  </p>
                </div>
              </section>

              {/* Section 6 */}
              <section id="local-storage" className="scroll-mt-28 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] shrink-0 font-bold text-sm">
                    6
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white" style={{ fontFamily: "var(--font-heading)" }}>
                    Functional Browser Storage (localStorage)
                  </h2>
                </div>
                <p>
                  We use browser local storage to save your UI preferences directly in your browser. These items are strictly functional and do not track you across external websites:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1 text-xs sm:text-sm">
                  <div className="p-3.5 rounded-xl bg-[#0B1528] border border-slate-800">
                    <strong className="text-[#D4AF37] font-mono text-xs block mb-1">mtb_theme</strong>
                    <span className="text-slate-300">Stores student portal and public UI display mode preference (&ldquo;light&rdquo;, &ldquo;dark&rdquo;, or &ldquo;system&rdquo;).</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#0B1528] border border-slate-800">
                    <strong className="text-[#D4AF37] font-mono text-xs block mb-1">mtishbi_admin_theme</strong>
                    <span className="text-slate-300">Stores administrative theme preference for staff dashboards.</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#0B1528] border border-slate-800">
                    <strong className="text-[#D4AF37] font-mono text-xs block mb-1">mtb_ui_notif_prefs</strong>
                    <span className="text-slate-300">Stores student notification UI filter and alert preferences.</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#0B1528] border border-slate-800">
                    <strong className="text-[#D4AF37] font-mono text-xs block mb-1">mtishbi_admin_notif_prefs</strong>
                    <span className="text-slate-300">Stores administrative notification filter preferences.</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#0B1528] border border-slate-800">
                    <strong className="text-[#D4AF37] font-mono text-xs block mb-1">mtishbi_remember_email</strong>
                    <span className="text-slate-300">Optional: Stores student email address on login form only when user selects &ldquo;Remember email&rdquo;.</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#0B1528] border border-slate-800">
                    <strong className="text-[#D4AF37] font-mono text-xs block mb-1">mtishbi_admin_remember_email</strong>
                    <span className="text-slate-300">Optional: Stores staff email on admin login form when selected.</span>
                  </div>
                </div>
                <p className="text-xs text-slate-400">
                  Note: sessionStorage is not used anywhere on the platform.
                </p>
              </section>

              {/* Section 7 */}
              <section id="google-analytics" className="scroll-mt-28 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] shrink-0 font-bold text-sm">
                    7
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white" style={{ fontFamily: "var(--font-heading)" }}>
                    Google Analytics (GA4)
                  </h2>
                </div>
                <p>
                  We use Google Analytics 4 to evaluate public website traffic, page navigation patterns, popular destination searches, and public call-to-action interactions.
                </p>
                <div className="p-4 rounded-xl bg-[#0B1528] border border-slate-800 space-y-2 text-xs sm:text-sm text-slate-300">
                  <p><strong>Configuration &amp; Data Protection:</strong></p>
                  <ul className="space-y-1.5 list-disc pl-5">
                    <li>Google Analytics operates in consent mode and respects user consent choices.</li>
                    <li>IP anonymization is enforced on analytics requests.</li>
                    <li><strong>No Sensitive Personal Information Collected:</strong> We strictly prohibit sending student passwords, passport numbers, national identification numbers, payment documents, academic transcripts, or private application details to Google Analytics.</li>
                    <li>Analytics scripts are loaded asynchronously (after interactive) to ensure that website performance, speed, and Largest Contentful Paint (LCP) are preserved.</li>
                  </ul>
                </div>
              </section>

              {/* Section 8 */}
              <section id="sentry-monitoring" className="scroll-mt-28 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] shrink-0 font-bold text-sm">
                    8
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white" style={{ fontFamily: "var(--font-heading)" }}>
                    Sentry Error Monitoring
                  </h2>
                </div>
                <p>
                  We use Sentry for production error monitoring, crash detection, unhandled exception diagnosis, and application reliability tracking.
                </p>
                <div className="p-4 rounded-xl bg-[#0B1528] border border-slate-800 space-y-2 text-xs sm:text-sm text-slate-300">
                  <p>
                    <strong>Purpose:</strong> Sentry is purely a technical stability and diagnostic tool, not an advertising or marketing service. It captures software stack traces, browser environment context, and error messages to help developers fix bugs promptly.
                  </p>
                  <p>
                    <strong>Data Scrubbing:</strong> Sentry is configured with automated data-scrubbing filters that remove sensitive headers, authentication tokens, passwords, passport numbers, and identification records before error payloads are transmitted.
                  </p>
                </div>
              </section>

              {/* Section 9 */}
              <section id="search-console" className="scroll-mt-28 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] shrink-0 font-bold text-sm">
                    9
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white" style={{ fontFamily: "var(--font-heading)" }}>
                    Google Search Console
                  </h2>
                </div>
                <p>
                  MtishbiScholars uses Google Search Console as an administrative webmaster service to monitor website search indexing, submit XML sitemaps, verify search crawl health, and identify technical search visibility issues.
                </p>
                <p className="text-xs sm:text-sm text-slate-300">
                  Google Search Console operates via server-level metadata verification and does not inject advertising tracking scripts or behavioral cookies into your browser.
                </p>
              </section>

              {/* Section 10 */}
              <section id="trackers-not-used" className="scroll-mt-28 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] shrink-0 font-bold text-sm">
                    10
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white" style={{ fontFamily: "var(--font-heading)" }}>
                    Analytics &amp; Tracking Technologies Not Used
                  </h2>
                </div>
                <p>
                  To protect applicant privacy, MtishbiScholars explicitly does <strong>not</strong> install, use, or integrate any of the following third-party tracking services:
                </p>
                <div className="p-4 rounded-xl bg-[#0B1528] border border-slate-800 text-xs sm:text-sm">
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300">
                    <li className="flex items-center gap-2">
                      <Ban className="w-3.5 h-3.5 text-red-400 shrink-0" aria-hidden="true" />
                      <span>Meta / Facebook Pixel</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Ban className="w-3.5 h-3.5 text-red-400 shrink-0" aria-hidden="true" />
                      <span>Microsoft Clarity</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Ban className="w-3.5 h-3.5 text-red-400 shrink-0" aria-hidden="true" />
                      <span>Hotjar</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Ban className="w-3.5 h-3.5 text-red-400 shrink-0" aria-hidden="true" />
                      <span>Vercel Analytics</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Ban className="w-3.5 h-3.5 text-red-400 shrink-0" aria-hidden="true" />
                      <span>PostHog / Mixpanel / Segment</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Ban className="w-3.5 h-3.5 text-red-400 shrink-0" aria-hidden="true" />
                      <span>TikTok Pixel / LinkedIn Insight Tag</span>
                    </li>
                  </ul>
                </div>
              </section>

              {/* Section 11 */}
              <section id="advertising" className="scroll-mt-28 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] shrink-0 font-bold text-sm">
                    11
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white" style={{ fontFamily: "var(--font-heading)" }}>
                    Advertising &amp; Marketing Technologies
                  </h2>
                </div>
                <p className="font-semibold text-white">
                  MtishbiScholars does NOT use advertising cookies, marketing pixels, cross-site trackers, or behavioral profiling tools.
                </p>
                <p className="text-xs sm:text-sm text-slate-300">
                  We do not monetize your browsing activity, display third-party advertisements on our platform, or share student browsing profiles with commercial ad networks.
                </p>
              </section>

              {/* Section 12 */}
              <section id="third-party-services" className="scroll-mt-28 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] shrink-0 font-bold text-sm">
                    12
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white" style={{ fontFamily: "var(--font-heading)" }}>
                    Third-Party Services Summary
                  </h2>
                </div>
                <div className="space-y-3 text-xs sm:text-sm">
                  <div className="p-3.5 rounded-xl bg-[#0B1528] border border-slate-800">
                    <strong className="text-white block font-bold mb-1">Supabase</strong>
                    <span className="text-slate-300">Provides database hosting, encrypted session authentication cookies, and secure document storage.</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#0B1528] border border-slate-800">
                    <strong className="text-white block font-bold mb-1">Google OAuth</strong>
                    <span className="text-slate-300">Provides optional federated login using standard PKCE token exchange.</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#0B1528] border border-slate-800">
                    <strong className="text-white block font-bold mb-1">Google Maps Embed</strong>
                    <span className="text-slate-300">Displays our physical office location map in Dar es Salaam on the contact section with standard no-referrer policies.</span>
                  </div>
                </div>
              </section>

              {/* Section 13 */}
              <section id="lifespan" className="scroll-mt-28 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] shrink-0 font-bold text-sm">
                    13
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white" style={{ fontFamily: "var(--font-heading)" }}>
                    Cookie &amp; Storage Lifespan
                  </h2>
                </div>
                <ul className="space-y-2 list-none pl-2 text-xs sm:text-sm text-slate-300">
                  <li className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] mt-2 shrink-0" />
                    <span><strong>Session Cookies:</strong> Temporary cookies that remain active only while your browser is open and are deleted upon closing the browser.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] mt-2 shrink-0" />
                    <span><strong>Persistent Cookies &amp; Local Storage:</strong> Stored locally until their expiration date or until manually cleared via your browser settings or dashboard preferences.</span>
                  </li>
                </ul>
              </section>

              {/* Section 14 */}
              <section id="managing-cookies" className="scroll-mt-28 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] shrink-0 font-bold text-sm">
                    14
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white" style={{ fontFamily: "var(--font-heading)" }}>
                    Managing Cookies &amp; Browser Storage
                  </h2>
                </div>
                <p>
                  You have full control over cookie storage through multiple methods:
                </p>
                <div className="p-4 rounded-xl bg-[#0B1528] border border-slate-800 space-y-2 text-xs sm:text-sm text-slate-300">
                  <p><strong>1. Cookie Consent Banner:</strong> You may accept or decline optional analytics storage via our on-page cookie preferences banner on public pages.</p>
                  <p><strong>2. Web Browser Controls:</strong> Most web browsers allow you to view, manage, delete, or block cookies and local storage through their settings menu (Chrome, Safari, Firefox, Edge). Consult your browser&apos;s help documentation for instructions.</p>
                </div>
              </section>

              {/* Section 15 */}
              <section id="disabling-storage" className="scroll-mt-28 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] shrink-0 font-bold text-sm">
                    15
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white" style={{ fontFamily: "var(--font-heading)" }}>
                    Impact of Disabling Essential Storage
                  </h2>
                </div>
                <p className="text-xs sm:text-sm text-slate-300">
                  If you configure your browser to block all cookies, strictly necessary authentication cookies will be blocked, preventing you from logging into your student dashboard, uploading application documents, or submitting university files. Public pages (universities, scholarships, services) will remain readable.
                </p>
              </section>

              {/* Section 16 */}
              <section id="privacy-protection" className="scroll-mt-28 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] shrink-0 font-bold text-sm">
                    16
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white" style={{ fontFamily: "var(--font-heading)" }}>
                    Privacy &amp; Personal Data Protection
                  </h2>
                </div>
                <p>
                  For detailed information regarding how personal information is collected, processed, retained, and protected in accordance with the <strong>Tanzania Personal Data Protection Act, 2022</strong>, please review our{" "}
                  <Link
                    href="/privacy-policy"
                    className="text-[#D4AF37] font-semibold underline hover:text-[#E8C84A] transition-colors"
                  >
                    Privacy Policy
                  </Link>
                  .
                </p>
              </section>

              {/* Section 17 */}
              <section id="changes" className="scroll-mt-28 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] shrink-0 font-bold text-sm">
                    17
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white" style={{ fontFamily: "var(--font-heading)" }}>
                    Changes to This Cookie Policy
                  </h2>
                </div>
                <p className="text-xs sm:text-sm text-slate-300">
                  We may periodically update this Cookie Policy to reflect changes in our operational technologies or applicable statutory standards. Any modifications will be posted on this page with an updated &ldquo;Last Updated&rdquo; date.
                </p>
              </section>

              {/* Section 18 */}
              <section id="contact-info" className="scroll-mt-28 space-y-6 pt-4 border-t border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] shrink-0 font-bold text-sm">
                    18
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white" style={{ fontFamily: "var(--font-heading)" }}>
                    Contact Information
                  </h2>
                </div>
                <p>
                  If you have inquiries or questions regarding our Cookie Policy or storage technologies, please contact us:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-5 rounded-2xl bg-[#0B1528] border border-slate-800 space-y-2">
                    <div className="flex items-center gap-2 text-white font-bold text-sm">
                      <Mail className="w-4 h-4 text-[#D4AF37]" aria-hidden="true" />
                      <span>General &amp; Data Inquiries</span>
                    </div>
                    <a
                      href="mailto:info@mtishbischolar.com"
                      className="text-xs sm:text-sm font-semibold text-[#D4AF37] hover:underline block"
                    >
                      info@mtishbischolar.com
                    </a>
                    <p className="text-xs text-slate-400">
                      Admissions guidance and privacy inquiries.
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-[#0B1528] border border-slate-800 space-y-2">
                    <div className="flex items-center gap-2 text-white font-bold text-sm">
                      <Mail className="w-4 h-4 text-purple-400" aria-hidden="true" />
                      <span>Technical &amp; Account Support</span>
                    </div>
                    <a
                      href="mailto:support@mtishbischolar.com"
                      className="text-xs sm:text-sm font-semibold text-purple-300 hover:underline block"
                    >
                      support@mtishbischolar.com
                    </a>
                    <p className="text-xs text-slate-400">
                      Technical assistance and storage questions.
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-[#0B1528] border border-slate-800 space-y-2">
                    <div className="flex items-center gap-2 text-white font-bold text-sm">
                      <Phone className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                      <span>Telephone Consultation</span>
                    </div>
                    <a
                      href="tel:+255764488687"
                      className="text-xs sm:text-sm font-semibold text-emerald-300 hover:underline block"
                    >
                      +255 764 488 687
                    </a>
                    <p className="text-xs text-slate-400">
                      Mon–Fri 8:00 AM – 5:00 PM, Sat 8:00 AM – 1:00 PM (EAT).
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-[#0B1528] border border-slate-800 space-y-2">
                    <div className="flex items-center gap-2 text-white font-bold text-sm">
                      <MapPin className="w-4 h-4 text-[#D4AF37]" aria-hidden="true" />
                      <span>Headquarters</span>
                    </div>
                    <p className="text-xs sm:text-sm font-semibold text-white">
                      Dar es Salaam, Tanzania
                    </p>
                    <p className="text-xs text-slate-400">
                      In-person advisory sessions available by appointment.
                    </p>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
