import type { Metadata } from "next";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import {
  ShieldCheck,
  Lock,
  FileText,
  Globe,
  UserCheck,
  Mail,
  Scale,
  Trash2,
  HelpCircle,
  Phone,
  MapPin,
  Clock,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Learn how MtishbiScholars collects, uses, protects, stores, and manages personal information when you use our website and services.",
  alternates: {
    canonical: "https://www.mtishbischolar.com/privacy-policy",
  },
  openGraph: {
    title: "Privacy Policy | MtishbiScholars",
    description:
      "Learn how MtishbiScholars collects, uses, protects, stores, and manages personal information when you use our website and services.",
    url: "https://www.mtishbischolar.com/privacy-policy",
    type: "website",
    siteName: "MtishbiScholars",
  },
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#070D18] text-slate-100 flex flex-col selection:bg-[#D4AF37]/30 selection:text-white">
      <Navbar />

      <main className="flex-1 pt-24 sm:pt-28 md:pt-32 pb-20">
        {/* ── Hero Header ── */}
        <section className="relative overflow-hidden border-b border-slate-800/80 bg-gradient-to-b from-[#0B1528] via-[#080E1A] to-[#070D18] py-12 md:py-16">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-[#D4AF37]/5 rounded-full blur-3xl pointer-events-none" />
          <div className="container-wide section-padding relative z-10">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 bg-[#D4AF37]/10 border border-[#D4AF37]/25 rounded-full px-3.5 py-1.5 mb-5">
                <ShieldCheck className="w-4 h-4 text-[#D4AF37]" aria-hidden="true" />
                <span className="text-[#D4AF37] text-xs font-semibold tracking-wider uppercase">
                  Data Protection &amp; Privacy
                </span>
              </div>

              <h1
                className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight mb-4 leading-[1.15]"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Privacy Policy
              </h1>

              <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-4">
                At MtishbiScholars, we respect your privacy and are committed to protecting your personal data in accordance with the <strong>Tanzania Personal Data Protection Act, 2022</strong> and applicable international data protection standards.
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

        {/* ── Policy Body Content ── */}
        <section className="container-wide section-padding py-12 md:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            {/* Table of Contents - Desktop Sticky Sidebar */}
            <aside className="lg:col-span-4 hidden lg:block sticky top-28 space-y-4">
              <div className="p-5 rounded-2xl bg-[#0B1528]/80 border border-slate-800/80 backdrop-blur-md shadow-xl">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#D4AF37]" aria-hidden="true" />
                  <span>Table of Contents</span>
                </h2>
                <nav className="space-y-1 text-xs">
                  {[
                    { id: "scope", label: "1. Scope & Commitment" },
                    { id: "information-collected", label: "2. Information We Collect" },
                    { id: "how-we-use", label: "3. How We Use Information" },
                    { id: "application-processing", label: "4. University & Application Processing" },
                    { id: "how-we-share", label: "5. How We Share Information" },
                    { id: "storage-security", label: "6. Data Storage & Security" },
                    { id: "data-retention", label: "7. Data Retention & Deletion" },
                    { id: "international-transfers", label: "8. International Data Processing" },
                    { id: "privacy-rights", label: "9. Your Privacy Rights" },
                    { id: "account-security", label: "10. Account & Document Security" },
                    { id: "communications", label: "11. Communications & Alerts" },
                    { id: "children-privacy", label: "12. Children & Minors' Privacy" },
                    { id: "third-party-links", label: "13. Third-Party Links" },
                    { id: "changes-to-policy", label: "14. Changes to This Policy" },
                    { id: "contact-us", label: "15. Contact Information" },
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

              {/* Direct Assistance Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-[#0B1528] to-[#0D1B36] border border-[#D4AF37]/20">
                <h3 className="text-sm font-bold text-white mb-1.5 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-[#D4AF37]" aria-hidden="true" />
                  Have Privacy Questions?
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-3">
                  Our official student advisory and data support team is here to assist with any questions.
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

            {/* Main Policy Text */}
            <div className="lg:col-span-8 space-y-12 text-slate-300 leading-relaxed text-sm sm:text-base">
              {/* Section 1 */}
              <section id="scope" className="scroll-mt-28 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] shrink-0 font-bold text-sm">
                    1
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white" style={{ fontFamily: "var(--font-heading)" }}>
                    Scope &amp; Commitment
                  </h2>
                </div>
                <p>
                  MtishbiScholars (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;) is an international education advisory and student placement platform headquartered in Dar es Salaam, Tanzania. We provide comprehensive educational consultancy services, including international university discovery, program selection, scholarship exploration, university admissions guidance, visa-related assistance, and pre-departure preparation.
                </p>
                <p>
                  This Privacy Policy explains our practices regarding the collection, use, processing, storage, and protection of personal data when you:
                </p>
                <ul className="space-y-2 list-none pl-2">
                  {[
                    "Visit or interact with our website (https://www.mtishbischolar.com)",
                    "Register for a student account or log in via email or Google OAuth",
                    "Complete academic and personal profile details in the Student Dashboard",
                    "Upload educational certificates, passports, and verification documents",
                    "Submit university or scholarship applications through our platform",
                    "Communicate with our education advisors or submit inquiries via web forms, email, or telephone",
                  ].map((text, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" aria-hidden="true" />
                      <span>{text}</span>
                    </li>
                  ))}
                </ul>
              </section>

              {/* Section 2 */}
              <section id="information-collected" className="scroll-mt-28 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] shrink-0 font-bold text-sm">
                    2
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white" style={{ fontFamily: "var(--font-heading)" }}>
                    Information We Collect
                  </h2>
                </div>
                <p>
                  We collect only the categories of personal data necessary to provide you with educational consultancy, university placement, and application management services.
                </p>

                <div className="space-y-4 pt-2">
                  <div className="p-5 rounded-2xl bg-[#0B1528] border border-slate-800">
                    <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-[#D4AF37]" aria-hidden="true" />
                      A. Information You Provide Directly
                    </h3>
                    <ul className="space-y-1.5 text-xs sm:text-sm text-slate-300">
                      <li><strong>Identity &amp; Profile Data:</strong> Full name (first name, middle name, last name), date of birth, gender, and nationality.</li>
                      <li><strong>Contact Details:</strong> Email address, mobile telephone number, and physical residential location.</li>
                      <li><strong>Academic History &amp; Qualifications:</strong> Secondary school history (O-Level and A-Level school names, completion years, combinations/grades), and post-secondary educational history (certificates, diplomas, bachelor&apos;s, master&apos;s, or doctoral credentials).</li>
                      <li><strong>Study &amp; Destination Preferences:</strong> Target destination countries, preferred universities, degree levels, chosen intake periods, and course interests.</li>
                      <li><strong>Passport Information:</strong> Passport holder status, passport number, issue date, and expiry date required for international admissions and visa documentation.</li>
                      <li><strong>Sponsor &amp; Emergency Contacts:</strong> Full name, relationship type (parent, guardian, sponsor), email, and telephone number of designated family representatives.</li>
                      <li><strong>Uploaded Verification Documents:</strong> Scanned copies of academic transcripts, certificates, passport bio-data pages, and national identification uploaded for application processing.</li>
                      <li><strong>Inquiries &amp; Communications:</strong> Text submitted via our public contact form or support channels.</li>
                    </ul>
                  </div>

                  <div className="p-5 rounded-2xl bg-[#0B1528] border border-slate-800">
                    <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                      <Lock className="w-4 h-4 text-[#D4AF37]" aria-hidden="true" />
                      B. Account &amp; Authentication Information
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-300">
                      When you register or log in, we process your credentials via our secure Supabase authentication provider. If you choose to sign up or sign in using Google OAuth, we receive your verified Google account profile information (your email address, full name, and avatar picture URL) to create and sync your student profile. We never receive or store your Google account password.
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-[#0B1528] border border-slate-800">
                    <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#D4AF37]" aria-hidden="true" />
                      C. Application &amp; Payment Record Data
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-300">
                      When you submit applications, we record your target university, selected intake, application status, assigned admission officer review notes, offer letter documents, and application fee payment confirmation details (including transaction reference codes and uploaded payment receipts for verification).
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-[#0B1528] border border-slate-800">
                    <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                      <Globe className="w-4 h-4 text-[#D4AF37]" aria-hidden="true" />
                      D. Technical &amp; Operational Information
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-300">
                      When you access our platform, standard technical information is recorded automatically in system server logs for security, diagnostics, and session integrity. This includes your IP address, browser type and version, device operating system, access timestamps, and page request routes. We do not engage in invasive location tracking or third-party behavioral advertising trackers.
                    </p>
                  </div>
                </div>
              </section>

              {/* Section 3 */}
              <section id="how-we-use" className="scroll-mt-28 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] shrink-0 font-bold text-sm">
                    3
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white" style={{ fontFamily: "var(--font-heading)" }}>
                    How We Use Personal Information
                  </h2>
                </div>
                <p>
                  We use your personal data strictly for legitimate educational consultancy and operational purposes:
                </p>
                <ul className="space-y-2 list-none pl-2">
                  {[
                    "Account Creation & Identity Management: To create, authenticate, and maintain your secure student account.",
                    "Education Consultancy & Guidance: To evaluate your academic background and recommend matching university programs and scholarship opportunities.",
                    "Application Processing & Submission: To compile, verify, and submit your official admission files to selected partner universities.",
                    "Visa & Documentation Support: To review necessary paperwork, issue verification statuses, and assist you with Embassy visa application requirements.",
                    "Pre-departure Preparation: To arrange travel guidance, campus orientation, and arrival coordination at your study destination.",
                    "Service Notifications: To send you real-time notifications regarding application milestones, document approvals, payment receipts, and offer letters.",
                    "Platform Security & Fraud Prevention: To safeguard user accounts, detect unauthorized access, and maintain administrative audit trails.",
                    "Legal & Regulatory Compliance: To fulfill statutory record-keeping and data protection obligations under Tanzanian law.",
                  ].map((text, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" aria-hidden="true" />
                      <span>{text}</span>
                    </li>
                  ))}
                </ul>
              </section>

              {/* Section 4 */}
              <section id="application-processing" className="scroll-mt-28 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] shrink-0 font-bold text-sm">
                    4
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white" style={{ fontFamily: "var(--font-heading)" }}>
                    University, Scholarship &amp; Application Processing
                  </h2>
                </div>
                <p>
                  To fulfill your study abroad application, MtishbiScholars must transmit your academic credentials, identification, and profile data to the institutions you specifically select. These recipients may include:
                </p>
                <div className="p-4 rounded-xl bg-[#0B1528] border border-slate-800 space-y-2 text-sm">
                  <p><strong>Partner Universities &amp; Colleges:</strong> Institutions in destination countries (including India, the United Kingdom, Poland, Malaysia, China, Cyprus, United Arab Emirates, and other partner locations) for admission eligibility assessment and issuance of offer letters.</p>
                  <p><strong>Scholarship Awarding Bodies:</strong> Partner university scholarship committees evaluating academic merit or financial aid eligibility.</p>
                  <p><strong>Authorized Admission Representatives:</strong> Verified institutional officers and branch coordinators assisting with document evaluation and campus registration.</p>
                </div>
                <p className="text-xs text-slate-400">
                  Information is shared with universities and educational partners strictly on a need-to-know basis solely to evaluate and process your requested admission.
                </p>
              </section>

              {/* Section 5 */}
              <section id="how-we-share" className="scroll-mt-28 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] shrink-0 font-bold text-sm">
                    5
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white" style={{ fontFamily: "var(--font-heading)" }}>
                    How We Share Information
                  </h2>
                </div>
                <p>
                  <strong>We do not sell, rent, trade, or monetize your personal information to any third party for marketing or advertising purposes.</strong>
                </p>
                <p>We share personal information only under the following limited and lawful circumstances:</p>
                <ul className="space-y-2 list-none pl-2 text-sm">
                  <li className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] mt-2 shrink-0" />
                    <span><strong>Service Providers:</strong> We may use service providers necessary to operate authentication, hosting, communications, database management, and other requested platform functions.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] mt-2 shrink-0" />
                    <span><strong>Authorized Staff &amp; Advisors:</strong> Vetted educational consultants, admission officers, and finance personnel who require access to evaluate admissions, verify required documents, or process payments.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] mt-2 shrink-0" />
                    <span><strong>Legal &amp; Regulatory Compliance:</strong> Competent public authorities, regulatory bodies, or law enforcement agencies when required by applicable laws, court orders, or official regulatory requirements in the United Republic of Tanzania.</span>
                  </li>
                </ul>
              </section>

              {/* Section 6 */}
              <section id="storage-security" className="scroll-mt-28 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] shrink-0 font-bold text-sm">
                    6
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white" style={{ fontFamily: "var(--font-heading)" }}>
                    Data Storage &amp; Security Measures
                  </h2>
                </div>
                <p>
                  We use appropriate technical and organizational measures designed to protect personal information against unauthorized access, alteration, disclosure, loss, or destruction. These measures may include secure authentication, access controls, encrypted connections, and other appropriate safeguards.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div className="p-4 rounded-xl bg-[#0B1528] border border-slate-800 space-y-1.5">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-[#D4AF37]" aria-hidden="true" />
                      Encrypted Connections
                    </h3>
                    <p className="text-xs text-slate-300">
                      Data transmitted between your browser and our platform is protected using encrypted connections (HTTPS/TLS).
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-[#0B1528] border border-slate-800 space-y-1.5">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" aria-hidden="true" />
                      Access Controls
                    </h3>
                    <p className="text-xs text-slate-300">
                      Access to personal data is restricted to authorized personnel who need the information to perform their duties.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-[#0B1528] border border-slate-800 space-y-1.5">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-[#D4AF37]" aria-hidden="true" />
                      Secure Storage
                    </h3>
                    <p className="text-xs text-slate-300">
                      Uploaded application documents and academic records are maintained in secure cloud storage facilities with access protections.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-[#0B1528] border border-slate-800 space-y-1.5">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Scale className="w-3.5 h-3.5 text-[#D4AF37]" aria-hidden="true" />
                      Organizational Policies
                    </h3>
                    <p className="text-xs text-slate-300">
                      Our staff adhere to internal confidentiality standards and data protection practices.
                    </p>
                  </div>
                </div>
                <p className="text-xs text-slate-400 pt-1">
                  While we take reasonable steps to safeguard your information, no method of transmission over the Internet or electronic storage is completely secure. You are encouraged to maintain strong passwords and safeguard your login credentials.
                </p>
              </section>

              {/* Section 7 */}
              <section id="data-retention" className="scroll-mt-28 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] shrink-0 font-bold text-sm">
                    7
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white" style={{ fontFamily: "var(--font-heading)" }}>
                    Data Retention &amp; Deletion
                  </h2>
                </div>
                <p>
                  We retain personal information only for as long as reasonably necessary to fulfill the purposes described in this Privacy Policy, provide educational consultancy services, manage university applications, maintain user accounts, comply with statutory tax, accounting, or regulatory requirements, and resolve potential disputes.
                </p>
                <div className="p-4 rounded-xl bg-[#0B1528] border border-slate-800 space-y-2 text-sm">
                  <p className="font-bold text-white flex items-center gap-2">
                    <Trash2 className="w-4 h-4 text-[#D4AF37]" aria-hidden="true" />
                    Managing and Requesting Deletion
                  </p>
                  <p className="text-xs sm:text-sm text-slate-300">
                    You may manage certain profile information directly through your student dashboard, or contact us to request the deletion of your personal information, account, or uploaded documents, subject to applicable legal, regulatory, and operational record-keeping requirements.
                  </p>
                </div>
              </section>

              {/* Section 8 */}
              <section id="international-transfers" className="scroll-mt-28 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] shrink-0 font-bold text-sm">
                    8
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white" style={{ fontFamily: "var(--font-heading)" }}>
                    International Data Processing
                  </h2>
                </div>
                <p>
                  Because MtishbiScholars assists students with international study opportunities, processing your applications may require transferring personal information and academic documents to universities, colleges, and educational partners located outside Tanzania.
                </p>
                <p>
                  Where your requested services require personal information to be transferred outside Tanzania, such transfers will be carried out in accordance with applicable Tanzanian data protection requirements and any required safeguards, authorizations, or other lawful mechanisms.
                </p>
              </section>

              {/* Section 9 */}
              <section id="privacy-rights" className="scroll-mt-28 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] shrink-0 font-bold text-sm">
                    9
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white" style={{ fontFamily: "var(--font-heading)" }}>
                    Your Privacy Rights
                  </h2>
                </div>
                <p>
                  Under the <strong>Tanzania Personal Data Protection Act, 2022</strong> and applicable privacy legislation, you have rights regarding your personal information, subject to statutory limits and conditions:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1 text-xs sm:text-sm">
                  <div className="p-3.5 rounded-xl bg-[#0B1528] border border-slate-800">
                    <strong className="text-white block mb-1">Right to be Informed</strong>
                    <span className="text-slate-300">The right to receive clear, transparent information about how your personal data is collected and processed.</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#0B1528] border border-slate-800">
                    <strong className="text-white block mb-1">Right of Access</strong>
                    <span className="text-slate-300">The right to request access to and confirmation of the personal data held about you.</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#0B1528] border border-slate-800">
                    <strong className="text-white block mb-1">Right to Rectification</strong>
                    <span className="text-slate-300">The right to request correction or completion of inaccurate or incomplete personal records.</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#0B1528] border border-slate-800">
                    <strong className="text-white block mb-1">Right to Erasure / Destruction</strong>
                    <span className="text-slate-300">The right to request deletion of personal information where statutory grounds apply.</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#0B1528] border border-slate-800">
                    <strong className="text-white block mb-1">Right to Restrict Processing</strong>
                    <span className="text-slate-300">The right to request restriction of data processing in legally specified circumstances.</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#0B1528] border border-slate-800">
                    <strong className="text-white block mb-1">Right to Data Portability</strong>
                    <span className="text-slate-300">The right to receive your personal data in a structured, commonly used format where applicable.</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#0B1528] border border-slate-800">
                    <strong className="text-white block mb-1">Right to Object</strong>
                    <span className="text-slate-300">The right to object to processing of personal data on legitimate grounds recognized by law.</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#0B1528] border border-slate-800">
                    <strong className="text-white block mb-1">Right Regarding Automated Decisions</strong>
                    <span className="text-slate-300">The right not to be subject to decisions based solely on automated processing without human review where applicable.</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#0B1528] border border-slate-800">
                    <strong className="text-white block mb-1">Right to Withdraw Consent</strong>
                    <span className="text-slate-300">Where processing is based on consent, the right to withdraw that consent at any time.</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#0B1528] border border-slate-800">
                    <strong className="text-white block mb-1">Right to Complain</strong>
                    <span className="text-slate-300">The right to lodge a complaint with the Personal Data Protection Commission (PDPC) in Tanzania or relevant supervisory body.</span>
                  </div>
                </div>
                <p className="text-xs text-slate-400">
                  To exercise any statutory privacy rights, please contact us at <a href="mailto:info@mtishbischolar.com" className="text-[#D4AF37] underline">info@mtishbischolar.com</a>. We will respond in accordance with applicable legal timeframes.
                </p>
              </section>

              {/* Section 10 */}
              <section id="account-security" className="scroll-mt-28 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] shrink-0 font-bold text-sm">
                    10
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white" style={{ fontFamily: "var(--font-heading)" }}>
                    Account &amp; Document Security
                  </h2>
                </div>
                <p>
                  As an applicant or user, you are responsible for maintaining the confidentiality of your account credentials (email and password). You agree to:
                </p>
                <ul className="space-y-1.5 list-disc pl-5 text-xs sm:text-sm text-slate-300">
                  <li>Use accurate, complete, and authentic information and documents during application filing.</li>
                  <li>Avoid sharing your account password or session tokens with unauthorized third parties.</li>
                  <li>Promptly notify MtishbiScholars at <strong>support@mtishbischolar.com</strong> if you detect or suspect any unauthorized access to your account.</li>
                </ul>
              </section>

              {/* Section 11 */}
              <section id="communications" className="scroll-mt-28 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] shrink-0 font-bold text-sm">
                    11
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white" style={{ fontFamily: "var(--font-heading)" }}>
                    Communications &amp; Notifications
                  </h2>
                </div>
                <p>
                  We may send you service-related communications necessary for the fulfillment of our services, including:
                </p>
                <ul className="space-y-1.5 list-disc pl-5 text-xs sm:text-sm text-slate-300">
                  <li>Account verification and password reset instructions.</li>
                  <li>Status updates on university applications, offer letter notifications, and admission decisions.</li>
                  <li>Payment receipts, verification statuses, and fee schedule reminders.</li>
                  <li>Direct responses to inquiries submitted via our contact channels.</li>
                </ul>
                <p className="text-xs text-slate-400">
                  We do not send unsolicited commercial spam or distribute your email address to external advertising lists.
                </p>
              </section>

              {/* Section 12 */}
              <section id="children-privacy" className="scroll-mt-28 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] shrink-0 font-bold text-sm">
                    12
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white" style={{ fontFamily: "var(--font-heading)" }}>
                    Children &amp; Minors&apos; Privacy
                  </h2>
                </div>
                <p>
                  Our services are designed for students applying to higher education institutions, secondary programs, or preparatory courses. Where an applicant is a minor under applicable national law, personal data must be submitted with the involvement, knowledge, and authorization of a parent, legal guardian, or authorized educational sponsor.
                </p>
                <p className="text-xs text-slate-400">
                  We collect parent and guardian contact details (name, phone number, and relationship) within student profiles to ensure family involvement in the international admission process.
                </p>
              </section>

              {/* Section 13 */}
              <section id="third-party-links" className="scroll-mt-28 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] shrink-0 font-bold text-sm">
                    13
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white" style={{ fontFamily: "var(--font-heading)" }}>
                    Third-Party Links &amp; External Portals
                  </h2>
                </div>
                <p>
                  Our website may contain links to external third-party websites, including official university portals, embassy visa guidelines, scholarship foundations, and map services. We have no control over and are not responsible for the privacy practices, content, or security of external websites. We encourage you to review the privacy policies of any third-party websites you visit.
                </p>
              </section>

              {/* Section 14 */}
              <section id="changes-to-policy" className="scroll-mt-28 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] shrink-0 font-bold text-sm">
                    14
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white" style={{ fontFamily: "var(--font-heading)" }}>
                    Changes to This Privacy Policy
                  </h2>
                </div>
                <p>
                  We may periodically update this Privacy Policy to reflect changes in our operational procedures, university partnerships, technology infrastructure, or legal requirements. Any modifications will be posted on this page with an updated &ldquo;Last Updated&rdquo; date at the top of the policy.
                </p>
                <p className="text-xs text-slate-400">
                  We encourage you to review this Privacy Policy periodically to stay informed about how we protect your personal data.
                </p>
              </section>

              {/* Section 15 */}
              <section id="contact-us" className="scroll-mt-28 space-y-6 pt-4 border-t border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] shrink-0 font-bold text-sm">
                    15
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white" style={{ fontFamily: "var(--font-heading)" }}>
                    Contact Information
                  </h2>
                </div>
                <p>
                  If you have questions, inquiries, or requests regarding this Privacy Policy or the handling of your personal data, please contact us through our official communication channels:
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
                      Admissions, scholarship evaluations, and privacy requests.
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
                      24/7 technical assistance, login issues, and security notices.
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
