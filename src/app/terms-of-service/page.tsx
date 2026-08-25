import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import {
  FileText,
  ShieldAlert,
  Scale,
  GraduationCap,
  Award,
  Globe,
  DollarSign,
  AlertTriangle,
  Lock,
  UserCheck,
  CheckCircle2,
  HelpCircle,
  Mail,
  Phone,
  MapPin,
  Clock,
  ArrowRight,
  ShieldCheck,
  Ban,
  Building,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Read the Terms of Service governing your use of the MtishbiScholars website, student accounts, education services, applications, and related platform features.",
  alternates: {
    canonical: "https://www.mtishbischolar.com/terms-of-service",
  },
  openGraph: {
    title: "Terms of Service | MtishbiScholars",
    description:
      "Read the Terms of Service governing your use of the MtishbiScholars website, student accounts, education services, applications, and related platform features.",
    url: "https://www.mtishbischolar.com/terms-of-service",
    type: "website",
    siteName: "MtishbiScholars",
  },
};

export default function TermsOfServicePage() {
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
                <Scale className="w-4 h-4 text-[#D4AF37]" aria-hidden="true" />
                <span className="text-[#D4AF37] text-xs font-semibold tracking-wider uppercase">
                  Legal Agreement &amp; User Terms
                </span>
              </div>

              <h1
                className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight mb-4 leading-[1.15]"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Terms of Service
              </h1>

              <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-4">
                Please read these Terms of Service carefully before accessing or using the MtishbiScholars website, student platform, or educational advisory services.
              </p>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <Clock className="w-3.5 h-3.5 text-[#D4AF37]" aria-hidden="true" />
                  Last Updated: 25 August 2026
                </span>
                <span className="text-slate-600 hidden sm:inline">&bull;</span>
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-[#D4AF37]" aria-hidden="true" />
                  Governing Law: United Republic of Tanzania
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
                    { id: "acceptance", label: "1. Acceptance & Scope" },
                    { id: "accounts", label: "2. Accounts & Registration" },
                    { id: "consultancy-scope", label: "3. Educational Advisory Scope" },
                    { id: "universities-courses", label: "4. Universities & Courses" },
                    { id: "scholarships", label: "5. Scholarship Opportunities" },
                    { id: "admission-processing", label: "6. Admission Applications" },
                    { id: "visa-support", label: "7. Visa & Immigration Guidance" },
                    { id: "payments-fees", label: "8. Payments & Service Fees" },
                    { id: "documents-authenticity", label: "9. Document Authenticity" },
                    { id: "user-responsibilities", label: "10. User Responsibilities" },
                    { id: "prohibited-use", label: "11. Prohibited Conduct" },
                    { id: "intellectual-property", label: "12. Intellectual Property" },
                    { id: "third-party-services", label: "13. Third-Party Services" },
                    { id: "no-guarantee", label: "14. No Guarantee Disclaimer" },
                    { id: "accuracy-disclaimer", label: "15. Information Accuracy" },
                    { id: "service-availability", label: "16. Service Availability" },
                    { id: "suspension-termination", label: "17. Suspension & Termination" },
                    { id: "limitation-liability", label: "18. Limitation of Liability" },
                    { id: "indemnification", label: "19. Indemnification" },
                    { id: "privacy", label: "20. Privacy & Data Protection" },
                    { id: "minors", label: "21. Children & Minors" },
                    { id: "changes-to-terms", label: "22. Changes to Terms" },
                    { id: "governing-law", label: "23. Governing Law & Disputes" },
                    { id: "contact-info", label: "24. Contact Information" },
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
                  Questions About Our Terms?
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-3">
                  Our advisory team is available to assist you with inquiries regarding our services and user policies.
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

            {/* Main Terms Body */}
            <div className="lg:col-span-8 space-y-12 text-slate-300 leading-relaxed text-sm sm:text-base">
              {/* Section 1 */}
              <section id="acceptance" className="scroll-mt-28 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] shrink-0 font-bold text-sm">
                    1
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white" style={{ fontFamily: "var(--font-heading)" }}>
                    Acceptance of Terms &amp; Scope
                  </h2>
                </div>
                <p>
                  These Terms of Service (&ldquo;Terms&rdquo;) constitute a legally binding agreement between you (&ldquo;User&rdquo;, &ldquo;Student&rdquo;, or &ldquo;you&rdquo;) and MtishbiScholars (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;), an education consultancy operating in the United Republic of Tanzania.
                </p>
                <p>
                  By visiting our website (https://www.mtishbischolar.com), creating a student account, submitting an inquiry, uploading academic files, or using any of our educational consultancy services, you acknowledge that you have read, understood, and agree to be bound by these Terms. If you do not agree to these Terms, you must not access or use the platform.
                </p>
              </section>

              {/* Section 2 */}
              <section id="accounts" className="scroll-mt-28 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] shrink-0 font-bold text-sm">
                    2
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white" style={{ fontFamily: "var(--font-heading)" }}>
                    Student Accounts &amp; Registration
                  </h2>
                </div>
                <p>
                  To access certain platform features, including submitting university applications and tracking admission progress, you must register for a student account using your email address and password or an authorized authentication provider (Google OAuth).
                </p>
                <div className="p-4 rounded-xl bg-[#0B1528] border border-slate-800 space-y-2 text-sm">
                  <p><strong>Account Accuracy:</strong> You agree to provide accurate, current, and complete information during registration and to promptly update your profile if your contact or personal details change.</p>
                  <p><strong>Credential Confidentiality:</strong> You are responsible for safeguarding your login credentials and are solely responsible for all activities that occur under your account.</p>
                  <p><strong>Unauthorized Access:</strong> If you discover or suspect unauthorized access to your account, you must immediately notify our technical support team at <strong className="text-white">support@mtishbischolar.com</strong>.</p>
                </div>
              </section>

              {/* Section 3 */}
              <section id="consultancy-scope" className="scroll-mt-28 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] shrink-0 font-bold text-sm">
                    3
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white" style={{ fontFamily: "var(--font-heading)" }}>
                    Educational Advisory Scope
                  </h2>
                </div>
                <p>
                  MtishbiScholars provides education advisory, guidance, course matching, scholarship discovery, application compilation support, document verification assistance, and pre-departure preparation for students seeking higher education opportunities.
                </p>
                <p>
                  <strong>Nature of Service:</strong> Our advisory services are designed to assist applicants in identifying suitable academic programs and submitting organized application files. MtishbiScholars does not function as a university, examination body, academic institution, or immigration authority.
                </p>
              </section>

              {/* Section 4 */}
              <section id="universities-courses" className="scroll-mt-28 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] shrink-0 font-bold text-sm">
                    4
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white" style={{ fontFamily: "var(--font-heading)" }}>
                    University &amp; Course Information
                  </h2>
                </div>
                <p>
                  Our platform displays profiles, course descriptions, entry requirements, estimated tuition fees, and intake schedules for international universities and partner colleges across various destination countries (such as India, the United Kingdom, Poland, Malaysia, China, Cyprus, and the UAE).
                </p>
                <p className="text-xs sm:text-sm text-slate-300">
                  While we strive to keep university and program listings accurate and up-to-date, institutional requirements, curriculum structures, program availability, tuition fees, and admission deadlines are established independently by each university and are subject to change without prior notice.
                </p>
              </section>

              {/* Section 5 */}
              <section id="scholarships" className="scroll-mt-28 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] shrink-0 font-bold text-sm">
                    5
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white" style={{ fontFamily: "var(--font-heading)" }}>
                    Scholarship Opportunities &amp; No Guarantee
                  </h2>
                </div>
                <p>
                  MtishbiScholars features information regarding institutional scholarships, tuition discount waivers, and financial aid schemes offered by universities and external awarding bodies.
                </p>
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-sm space-y-2">
                  <div className="flex items-center gap-2 font-bold text-amber-300">
                    <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>Important Scholarship Notice</span>
                  </div>
                  <p className="text-xs sm:text-sm leading-relaxed text-slate-200">
                    MtishbiScholars does not award scholarships independently and does not guarantee that any student will receive a scholarship, funding award, or tuition discount. Scholarship awards, percentages, criteria, and quotas are decided exclusively by the respective university or funding entity based on merit, availability, and eligibility.
                  </p>
                </div>
              </section>

              {/* Section 6 */}
              <section id="admission-processing" className="scroll-mt-28 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] shrink-0 font-bold text-sm">
                    6
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white" style={{ fontFamily: "var(--font-heading)" }}>
                    University Admission Applications
                  </h2>
                </div>
                <p>
                  When you submit an application through the platform, our admission officers review your academic files, check minimum eligibility guidelines, and forward verified files to the chosen partner institution.
                </p>
                <p>
                  <strong>Independent Decision-Making:</strong> The final decision to accept or reject an application, issue a conditional offer, or issue an unconditional admission letter rests solely and exclusively with the admissions board of the target university. MtishbiScholars has no authority to grant admission on behalf of any university.
                </p>
              </section>

              {/* Section 7 */}
              <section id="visa-support" className="scroll-mt-28 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] shrink-0 font-bold text-sm">
                    7
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white" style={{ fontFamily: "var(--font-heading)" }}>
                    Visa &amp; Immigration Guidance
                  </h2>
                </div>
                <p>
                  We provide students with general advisory support, document checklists, Embassy appointment guidance, and pre-departure preparation assistance for student visa applications.
                </p>
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs sm:text-sm text-slate-300">
                  <p className="font-bold text-white flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-amber-400" aria-hidden="true" />
                    Government Immigration Authority Disclaimer
                  </p>
                  <p>
                    MtishbiScholars is not a government agency, embassy, or immigration authority. Visa issuance, entry permits, and immigration clearances are determined entirely by the immigration department and consular authorities of the destination country. MtishbiScholars cannot guarantee visa approval, entry permission, or processing timelines.
                  </p>
                </div>
              </section>

              {/* Section 8 */}
              <section id="payments-fees" className="scroll-mt-28 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] shrink-0 font-bold text-sm">
                    8
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white" style={{ fontFamily: "var(--font-heading)" }}>
                    Payments, Application Fees &amp; Financial Terms
                  </h2>
                </div>
                <p>
                  Certain services, application processing, or institutional evaluation procedures may require payment of applicable fees. Applicable fees, required payment methods, and verification instructions will be communicated to you before payment is required.
                </p>
                <div className="p-4 rounded-xl bg-[#0B1528] border border-slate-800 space-y-3 text-xs sm:text-sm text-slate-300">
                  <p className="font-bold text-white text-sm">
                    Non-Refundable Fees Policy
                  </p>
                  <p>
                    All fees paid to MtishbiScholars for services, application processing, administrative processing, advisory services, or other applicable services are <strong>non-refundable</strong> once payment has been made.
                  </p>
                  <p>
                    Where payments are made to or on behalf of a university, institution, scholarship provider, or other third party, those payments are also subject to the applicable third-party terms and policies.
                  </p>
                  <p className="text-[#D4AF37] font-medium">
                    By making a payment, you acknowledge and agree that the applicable fee is non-refundable.
                  </p>
                </div>
                <ul className="space-y-2 list-none pl-2 text-xs sm:text-sm text-slate-300">
                  <li className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] mt-2 shrink-0" />
                    <span><strong>Payment Proof &amp; Verification:</strong> Where manual or bank transfer payments are submitted, students must upload valid transaction references and authentic payment receipts for review and verification by our finance team.</span>
                  </li>
                </ul>
              </section>

              {/* Section 9 */}
              <section id="documents-authenticity" className="scroll-mt-28 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] shrink-0 font-bold text-sm">
                    9
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white" style={{ fontFamily: "var(--font-heading)" }}>
                    User Document Submissions &amp; Authenticity Obligations
                  </h2>
                </div>
                <p>
                  Students upload academic certificates, transcripts, passport bio-data pages, and national identification to facilitate application processing. You represent and warrant that:
                </p>
                <ul className="space-y-2 list-none pl-2 text-xs sm:text-sm text-slate-300">
                  {[
                    "All documents, certificates, grades, and records you upload are genuine, authentic, and unaltered.",
                    "You have the lawful right to submit all personal data and documentation provided.",
                    "You will not submit falsified, forged, manipulated, or misleading academic or financial records.",
                  ].map((text, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" aria-hidden="true" />
                      <span>{text}</span>
                    </li>
                  ))}
                </ul>
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-200 text-xs sm:text-sm">
                  <strong>Consequences of Falsification:</strong> Submitting forged or fraudulent documents will result in immediate termination of services, cancellation of active applications, account suspension, and may be reported to partner universities and law enforcement authorities where legally required.
                </div>
              </section>

              {/* Section 10 */}
              <section id="user-responsibilities" className="scroll-mt-28 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] shrink-0 font-bold text-sm">
                    10
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white" style={{ fontFamily: "var(--font-heading)" }}>
                    User Responsibilities
                  </h2>
                </div>
                <p>As a user of our platform and services, you agree to:</p>
                <ul className="space-y-2 list-none pl-2 text-xs sm:text-sm text-slate-300">
                  <li className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] mt-2 shrink-0" />
                    <span>Review all application details, chosen courses, and personal records before submission.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] mt-2 shrink-0" />
                    <span>Meet all required deadlines for document submission, tuition payments, and visa appointments.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] mt-2 shrink-0" />
                    <span>Maintain an active email address and promptly respond to communications from admission officers.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] mt-2 shrink-0" />
                    <span>Comply with all applicable laws and regulations in the United Republic of Tanzania and your intended destination country.</span>
                  </li>
                </ul>
              </section>

              {/* Section 11 */}
              <section id="prohibited-use" className="scroll-mt-28 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] shrink-0 font-bold text-sm">
                    11
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white" style={{ fontFamily: "var(--font-heading)" }}>
                    Prohibited Conduct &amp; Platform Misuse
                  </h2>
                </div>
                <p>You agree not to engage in any of the following prohibited activities:</p>
                <ul className="space-y-2 list-none pl-2 text-xs sm:text-sm text-slate-300">
                  <li className="flex items-start gap-2.5">
                    <Ban className="w-4 h-4 text-red-400 shrink-0 mt-0.5" aria-hidden="true" />
                    <span>Impersonating another person, creating fraudulent accounts, or falsifying identity records.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Ban className="w-4 h-4 text-red-400 shrink-0 mt-0.5" aria-hidden="true" />
                    <span>Attempting to circumvent, breach, or compromise platform authentication, security, or access controls.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Ban className="w-4 h-4 text-red-400 shrink-0 mt-0.5" aria-hidden="true" />
                    <span>Introducing malicious code, viruses, trojans, or harmful software to the platform.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Ban className="w-4 h-4 text-red-400 shrink-0 mt-0.5" aria-hidden="true" />
                    <span>Using automated scripts, bots, or unauthorized scraping tools to extract platform data or content.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Ban className="w-4 h-4 text-red-400 shrink-0 mt-0.5" aria-hidden="true" />
                    <span>Engaging in harassment, abusive conduct, or unlawful behavior toward advisors or staff.</span>
                  </li>
                </ul>
              </section>

              {/* Section 12 */}
              <section id="intellectual-property" className="scroll-mt-28 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] shrink-0 font-bold text-sm">
                    12
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white" style={{ fontFamily: "var(--font-heading)" }}>
                    Intellectual Property
                  </h2>
                </div>
                <p>
                  All content, branding, logos, trademarks, website design, text, graphics, user interface elements, and software code on the MtishbiScholars platform are the property of MtishbiScholars and are protected by applicable intellectual property laws.
                </p>
                <p className="text-xs sm:text-sm text-slate-300">
                  You may not copy, reproduce, distribute, modify, republish, or commercially exploit any content from the website without our prior written consent. Third-party university logos, names, and emblems displayed on the platform remain the intellectual property of their respective educational institutions.
                </p>
              </section>

              {/* Section 13 */}
              <section id="third-party-services" className="scroll-mt-28 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] shrink-0 font-bold text-sm">
                    13
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white" style={{ fontFamily: "var(--font-heading)" }}>
                    Third-Party Institutions &amp; External Portals
                  </h2>
                </div>
                <p>
                  Our platform may contain links, references, or interfaces to third-party institutions, including universities, embassies, scholarship organizations, payment services, and external application portals.
                </p>
                <p className="text-xs sm:text-sm text-slate-300">
                  MtishbiScholars does not operate, control, or endorse external websites and is not responsible for their content, availability, privacy policies, or practices. We encourage you to review the specific terms and policies of any third-party website you access.
                </p>
              </section>

              {/* Section 14 */}
              <section id="no-guarantee" className="scroll-mt-28 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] shrink-0 font-bold text-sm">
                    14
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white" style={{ fontFamily: "var(--font-heading)" }}>
                    Comprehensive &ldquo;No Guarantee&rdquo; Disclaimer
                  </h2>
                </div>
                <div className="p-5 rounded-2xl bg-[#0B1528] border border-slate-800 space-y-3 text-xs sm:text-sm text-slate-300">
                  <p className="font-bold text-white text-base">
                    Unless expressly agreed in a separate formal written agreement, MtishbiScholars makes NO warranties or guarantees regarding:
                  </p>
                  <ul className="space-y-1.5 list-disc pl-5">
                    <li>University admission acceptance or placement at any specific institution.</li>
                    <li>Scholarship awards, financial aid approval, or specific discount percentages.</li>
                    <li>Student visa issuance, immigration approvals, entry clearance, or travel authorizations.</li>
                    <li>Post-graduation employment, work permits, permanent residency, or academic grades.</li>
                    <li>Accommodation availability, room assignments, or campus housing allocations.</li>
                  </ul>
                  <p className="text-xs text-slate-400 pt-1">
                    All admission, scholarship, and immigration determinations are sovereign decisions made exclusively by universities, scholarship bodies, and government authorities.
                  </p>
                </div>
              </section>

              {/* Section 15 */}
              <section id="accuracy-disclaimer" className="scroll-mt-28 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] shrink-0 font-bold text-sm">
                    15
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white" style={{ fontFamily: "var(--font-heading)" }}>
                    Information Accuracy Disclaimer
                  </h2>
                </div>
                <p>
                  While MtishbiScholars uses reasonable efforts to present accurate and current information on universities, programs, fees, and admission criteria, we make no representations or warranties of any kind regarding the completeness, accuracy, or reliability of all third-party listings.
                </p>
                <p className="text-xs sm:text-sm text-slate-300">
                  You are advised to verify critical requirements, program accreditation, fee structures, and application deadlines directly with the relevant institution before making binding educational or financial commitments.
                </p>
              </section>

              {/* Section 16 */}
              <section id="service-availability" className="scroll-mt-28 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] shrink-0 font-bold text-sm">
                    16
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white" style={{ fontFamily: "var(--font-heading)" }}>
                    Service Availability &amp; Maintenance
                  </h2>
                </div>
                <p>
                  We endeavor to maintain platform availability, but we do not guarantee that the website or student dashboard will operate uninterrupted, timely, or error-free.
                </p>
                <p className="text-xs sm:text-sm text-slate-300">
                  Access may occasionally be suspended or restricted for scheduled maintenance, updates, security enhancements, server migrations, or due to events beyond our reasonable control (such as telecommunications failures, internet routing outages, or infrastructure disruptions).
                </p>
              </section>

              {/* Section 17 */}
              <section id="suspension-termination" className="scroll-mt-28 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] shrink-0 font-bold text-sm">
                    17
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white" style={{ fontFamily: "var(--font-heading)" }}>
                    Account Suspension &amp; Termination
                  </h2>
                </div>
                <p>
                  We reserve the right to suspend, restrict, or terminate your account or access to our services, with or without prior notice, if:
                </p>
                <ul className="space-y-1.5 list-disc pl-5 text-xs sm:text-sm text-slate-300">
                  <li>You violate these Terms or our community standards.</li>
                  <li>You submit fraudulent, forged, or altered documentation.</li>
                  <li>You engage in abusive conduct toward advisors, officers, or staff.</li>
                  <li>We are required to do so to comply with legal, regulatory, or court orders.</li>
                </ul>
              </section>

              {/* Section 18 */}
              <section id="limitation-liability" className="scroll-mt-28 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] shrink-0 font-bold text-sm">
                    18
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white" style={{ fontFamily: "var(--font-heading)" }}>
                    Limitation of Liability
                  </h2>
                </div>
                <p>
                  To the maximum extent permitted by applicable law in the United Republic of Tanzania, MtishbiScholars, its directors, officers, advisors, and agents shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or related to:
                </p>
                <ul className="space-y-1.5 list-disc pl-5 text-xs sm:text-sm text-slate-300">
                  <li>University admission rejections, deferrals, or course cancellations.</li>
                  <li>Scholarship denial, reduction, or revocation by awarding institutions.</li>
                  <li>Visa refusals, delays, or immigration denials by government authorities.</li>
                  <li>User-provided errors, inaccurate information, or missed deadlines.</li>
                  <li>Temporary interruptions or unavailability of the website.</li>
                </ul>
                <p className="text-xs text-slate-400">
                  Nothing in these Terms excludes or limits liability that cannot be lawfully excluded under applicable Tanzanian statutory law.
                </p>
              </section>

              {/* Section 19 */}
              <section id="indemnification" className="scroll-mt-28 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] shrink-0 font-bold text-sm">
                    19
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white" style={{ fontFamily: "var(--font-heading)" }}>
                    Indemnification
                  </h2>
                </div>
                <p>
                  You agree to indemnify and hold harmless MtishbiScholars, its officers, employees, and authorized agents from and against any third-party claims, liabilities, damages, or costs (including reasonable legal fees) arising from your breach of these Terms, submission of falsified documents, or violation of applicable laws.
                </p>
              </section>

              {/* Section 20 */}
              <section id="privacy" className="scroll-mt-28 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] shrink-0 font-bold text-sm">
                    20
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white" style={{ fontFamily: "var(--font-heading)" }}>
                    Privacy &amp; Data Protection
                  </h2>
                </div>
                <p>
                  Your privacy is important to us. Our collection, use, processing, and protection of your personal information are governed by our separate{" "}
                  <Link
                    href="/privacy-policy"
                    className="text-[#D4AF37] font-semibold underline hover:text-[#E8C84A] transition-colors"
                  >
                    Privacy Policy
                  </Link>
                  , which forms an integral part of these Terms.
                </p>
                <p className="text-xs sm:text-sm text-slate-300">
                  By using our platform, you acknowledge that your personal information is processed in accordance with our Privacy Policy and the Tanzania Personal Data Protection Act, 2022.
                </p>
              </section>

              {/* Section 21 */}
              <section id="minors" className="scroll-mt-28 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] shrink-0 font-bold text-sm">
                    21
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white" style={{ fontFamily: "var(--font-heading)" }}>
                    Children &amp; Minors
                  </h2>
                </div>
                <p>
                  Where an applicant is a minor under applicable law, account creation and application submissions must be conducted with the consent and involvement of a parent, legal guardian, or authorized family sponsor.
                </p>
              </section>

              {/* Section 22 */}
              <section id="changes-to-terms" className="scroll-mt-28 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] shrink-0 font-bold text-sm">
                    22
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white" style={{ fontFamily: "var(--font-heading)" }}>
                    Changes to These Terms
                  </h2>
                </div>
                <p>
                  We may periodically revise these Terms of Service to reflect updates in our operational practices, service offerings, technology, or legal requirements.
                </p>
                <p className="text-xs sm:text-sm text-slate-300">
                  When revisions occur, we will update the &ldquo;Last Updated&rdquo; date at the top of this document. Continued use of our website or services following the posting of revised Terms indicates your acceptance of the updated Terms.
                </p>
              </section>

              {/* Section 23 */}
              <section id="governing-law" className="scroll-mt-28 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] shrink-0 font-bold text-sm">
                    23
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white" style={{ fontFamily: "var(--font-heading)" }}>
                    Governing Law &amp; Dispute Resolution
                  </h2>
                </div>
                <p>
                  These Terms shall be governed by and interpreted in accordance with the laws of the United Republic of Tanzania, subject to applicable mandatory statutory provisions.
                </p>
                <p className="text-xs sm:text-sm text-slate-300">
                  In the event of any question, disagreement, or dispute arising under these Terms, you agree to contact MtishbiScholars in writing first at <strong className="text-white">info@mtishbischolar.com</strong> so that we may attempt in good faith to resolve the matter informally and promptly.
                </p>
              </section>

              {/* Section 24 */}
              <section id="contact-info" className="scroll-mt-28 space-y-6 pt-4 border-t border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] shrink-0 font-bold text-sm">
                    24
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white" style={{ fontFamily: "var(--font-heading)" }}>
                    Contact Information
                  </h2>
                </div>
                <p>
                  If you have inquiries, feedback, or legal questions concerning these Terms of Service, please contact our team:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-5 rounded-2xl bg-[#0B1528] border border-slate-800 space-y-2">
                    <div className="flex items-center gap-2 text-white font-bold text-sm">
                      <Mail className="w-4 h-4 text-[#D4AF37]" aria-hidden="true" />
                      <span>General &amp; Advisory Inquiries</span>
                    </div>
                    <a
                      href="mailto:info@mtishbischolar.com"
                      className="text-xs sm:text-sm font-semibold text-[#D4AF37] hover:underline block"
                    >
                      info@mtishbischolar.com
                    </a>
                    <p className="text-xs text-slate-400">
                      Admissions guidance, course matching, and terms inquiries.
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
                      Account assistance, authentication, and technical inquiries.
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
                      In-person consultation sessions available by appointment.
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
