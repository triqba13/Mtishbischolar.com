export interface ServiceDetail {
  id: string;
  title: string;
  subtitle: string;
  iconName: string;
  color: string;
  overview: string;
  benefits: string[];
  processSteps: { title: string; desc: string }[];
  requirements: string[];
  faq: { q: string; a: string }[];
}

export const SERVICES_DATA: ServiceDetail[] = [
  {
    id: "university-admission",
    title: "University Admission Support",
    subtitle: "End-to-End International University Application & Placement",
    iconName: "GraduationCap",
    color: "from-blue-500 to-blue-700",
    overview:
      "MtishbiScholars provides full-scale university application assistance for African students seeking undergraduate, master's, diploma, or PhD programs in India, UK, China, Malaysia, Poland, Cyprus, UAE, and beyond. We match your academic profile, budget, and career goals to accredited universities.",
    benefits: [
      "Direct university partnerships with guaranteed processing priority",
      "No hidden fees or unexpected application costs",
      "Fast offer letter issuance (usually within 3–7 working days)",
      "Dedicated admission officer assigned to track your application",
    ],
    processSteps: [
      { title: "1. Profile Assessment & Counseling", desc: "Our counselors review your academic certificates (Form 4/6, Diploma, Bachelor) and guide you on top university options." },
      { title: "2. Course & College Selection", desc: "Select preferred courses and universities matching your career aspirations and financial budget." },
      { title: "3. Document Compilation & Verification", desc: "We review and format all required certificates, transcripts, recommendation letters, and personal statement." },
      { title: "4. Application Submission & Follow-up", desc: "We submit your application directly to university international admissions and track status daily." },
      { title: "5. Official Offer Letter Issuance", desc: "Receive your official Provisional & Final Admission Offer Letter directly from the university." },
    ],
    requirements: [
      "Academic Transcripts & Certificates (Form 4 / Form 6 / Diploma / Degree)",
      "Copy of Valid International Passport",
      "Recent Passport-size Photographs",
      "Statement of Purpose (SOP) or Motivation Letter (for Postgraduate)",
    ],
    faq: [
      { q: "How long does it take to get an offer letter?", a: "Offer letters from our partner universities typically arrive within 3 to 7 working days after document submission." },
      { q: "Do I need IELTS or TOEFL to apply?", a: "Most of our partner universities in India, Malaysia, Cyprus, and Poland do NOT require IELTS if your previous education was in English." },
    ],
  },
  {
    id: "scholarship-guidance",
    title: "Scholarship Guidance",
    subtitle: "Access Tuition Waivers & Financial Aid Schemes",
    iconName: "Award",
    color: "from-[#D4AF37] to-[#B8960C]",
    overview:
      "Education should be accessible to every deserving student. MtishbiScholars works with international universities and government funding bodies to secure partial and full tuition scholarships for eligible African applicants.",
    benefits: [
      "Guaranteed tuition scholarship packages for African students in India & Cyprus",
      "Chinese Government (CSC) & Provincial Full Scholarship support",
      "Special university merit discounts and early-bird bursaries",
      "Guidance on writing winning scholarship essays and motivation letters",
    ],
    processSteps: [
      { title: "1. Eligibility Audit", desc: "We evaluate your GPA/grades to determine highest scholarship category eligibility." },
      { title: "2. Scholarship Scheme Matching", desc: "Select matching scholarship schemes (African Waiver, Merit Bursary, CSC, etc.)." },
      { title: "3. Essay & Dossier Preparation", desc: "Assist in preparing scholarship essays, recommendation letters, and financial declaration." },
      { title: "4. Direct Portal Submission", desc: "Submit your application through official scholarship channels and monitor review boards." },
      { title: "5. Scholarship Award Letter", desc: "Receive your official university scholarship grant letter showing fee reduction." },
    ],
    requirements: [
      "High Academic Marks (Division 1/2 or GPA 3.0+ for high merit scholarships)",
      "Two Academic Recommendation Letters",
      "Scholarship Motivation Essay",
      "Proof of extracurricular activities / leadership (if applicable)",
    ],
    faq: [
      { q: "Are the scholarships guaranteed?", a: "Yes! Through our partner universities in India and Cyprus, tuition waivers are guaranteed for qualified African applicants." },
      { q: "Does the scholarship cover accommodation?", a: "Some full scholarships cover accommodation and monthly stipends, while tuition scholarships apply directly to academic tuition fees." },
    ],
  },
  {
    id: "document-assistance",
    title: "Document Assistance",
    subtitle: "Professional Translation, Legalization & Certificate Verification",
    iconName: "FileCheck",
    color: "from-green-500 to-emerald-700",
    overview:
      "Submitting incorrectly formatted documents is the #1 cause of university rejection and visa delays. MtishbiScholars reviews, formats, translates, and authenticates all academic documents required for international admission.",
    benefits: [
      "Zero rejection rate due to improper document formatting",
      "Assistance with NECTA / ZEC / University certificate equivalency verification",
      "Professional translation to English / French / Chinese if required",
      "Official legalization and embassy attestation support",
    ],
    processSteps: [
      { title: "1. Document Audit", desc: "Thorough inspection of original certificates, spellings, names, and date of birth." },
      { title: "2. Formatting & Conversion", desc: "Convert files into high-resolution PDF dossiers formatted for university portals." },
      { title: "3. Equivalency & Attestation", desc: "Guidance on Ministry of Education / Foreign Affairs certification when needed." },
      { title: "4. Final Verification", desc: "Final seal of approval before official submission to university & visa portals." },
    ],
    requirements: [
      "Original Academic Certificates & Transcripts",
      "National ID / Birth Certificate",
      "Passport Data Page Scan",
    ],
    faq: [
      { q: "What if my names are spelled differently on passport vs certificates?", a: "We assist you in obtaining a legal Affidavit or Deed Poll to ensure smooth university registration without rejection." },
    ],
  },
  {
    id: "visa-support",
    title: "Visa Support",
    subtitle: "100% Guided Student Visa Application & Interview Coaching",
    iconName: "Globe2",
    color: "from-purple-500 to-purple-700",
    overview:
      "Navigating visa applications can be daunting. MtishbiScholars provides step-by-step guidance on embassy documentation, bank statements, medical clearance, online visa forms, and mock visa interview preparation.",
    benefits: [
      "Over 98% visa success rate across India, UK, Malaysia, Poland, China, UAE",
      "Full checklist of required embassy documents tailored to your destination",
      "Mock interview sessions with former visa officers / senior advisors",
      "Fast e-Visa processing assistance where applicable",
    ],
    processSteps: [
      { title: "1. Visa Requirements Briefing", desc: "Receive custom embassy document checklist for your target destination country." },
      { title: "2. Financial & Bank Statement Guidance", desc: "Review bank statement proofs, sponsor affidavits, and source of funds." },
      { title: "3. Online Embassy Form Submission", desc: "We assist in filling and submitting official online visa application forms accurately." },
      { title: "4. Mock Interview Preparation", desc: "One-on-one mock interview sessions to build confidence for embassy appointments." },
      { title: "5. Visa Stamping & Flight Ticketing", desc: "Receive your visa sticker/e-Visa and coordinate arrival modalities." },
    ],
    requirements: [
      "Official University Admission Letter & Visa Eligibility Code",
      "Valid Passport (at least 6 months validity remaining)",
      "Bank Statement & Sponsor Affidavit of Support",
      "Medical Certificate (Yellow Fever, HIV/TB test as required by destination)",
      "Police Clearance Certificate",
    ],
    faq: [
      { q: "How long does student visa processing take?", a: "Visa processing varies by country: India e-Visa takes 3–5 days, UAE 2 weeks, Poland/UK 3–6 weeks." },
    ],
  },
  {
    id: "passport-assistance",
    title: "Passport Application Assistance",
    subtitle: "Hassle-Free Guidance for International Travel Passports",
    iconName: "IdCard",
    color: "from-red-500 to-rose-700",
    overview:
      "Don't have an international passport yet? MtishbiScholars assists prospective students through national immigration department procedures to acquire a valid travel passport smoothly.",
    benefits: [
      "Step-by-step checklist for national passport application requirements",
      "Assistance with online application forms and appointment booking",
      "Prevents delays so you can apply for university admissions on time",
    ],
    processSteps: [
      { title: "1. Document Preparation", desc: "Gather Birth Certificate, National ID (NIDA), Parent IDs, and supporting letters." },
      { title: "2. Online Immigration Registration", desc: "Complete official immigration application portal forms without errors." },
      { title: "3. Biometric Appointment Booking", desc: "Book convenient biometric capture date at regional immigration office." },
      { title: "4. Passport Issuance Follow-up", desc: "Monitor application progress until passport is collected." },
    ],
    requirements: [
      "National Identification Card (NIDA)",
      "Birth Certificate",
      "Recommendation Letter / Student Request Support Letter",
      "Passport Photos",
    ],
    faq: [
      { q: "Can I apply for university admission before getting my passport?", a: "Yes! We can initiate your provisional university application while you complete your passport processing." },
    ],
  },
  {
    id: "career-guidance",
    title: "Career Guidance & Post-Graduation Mentoring",
    subtitle: "Strategic Career Planning & International Internship Connections",
    iconName: "Briefcase",
    color: "from-cyan-500 to-cyan-700",
    overview:
      "Our relationship with students extends far beyond university admission. We mentor students on course selection aligned with global job markets, internship placements, and post-graduation career opportunities.",
    benefits: [
      "Selection of high-demand global career fields (AI, Cybersecurity, Nursing, Engineering)",
      "CV & Resume building for international internships",
      "Alumni networking & post-study work visa advice",
      "Guidance on returning to home country vs global job market integration",
    ],
    processSteps: [
      { title: "1. Psychometric & Career Profiling", desc: "Evaluate your strengths and align them with high-growth global industries." },
      { title: "2. Industry Mentorship Sessions", desc: "Connect with current students and alumni working in your target field." },
      { title: "3. Internship & Skill Development", desc: "Guidance on certifications and campus placement opportunities during study." },
      { title: "4. Post-Graduation Orientation", desc: "Navigate graduate work visas (PSW), license exams, and career launching." },
    ],
    requirements: [
      "Academic Transcript / Resume",
      "Career Interest Profile Form",
    ],
    faq: [
      { q: "Will MtishbiScholars help me find an internship during my studies?", a: "Yes! Our partner universities in India, UAE, Malaysia, and Poland have active career placement cells that connect students with internships." },
    ],
  },
  {
    id: "student-connect",
    title: "Student Connect (Campus Network)",
    subtitle: "Talk Directly via WhatsApp with Current Tanzanian & African Scholars Abroad",
    iconName: "Users",
    color: "from-emerald-500 to-teal-700",
    overview:
      "Exclusive peer-to-peer network inside the MtishbiScholars Student Portal. Logged-in students can view profiles and connect directly via WhatsApp with Tanzanian and African scholars currently studying at partner universities in India, China, UK, Germany, Italy, Malaysia, and UAE.",
    benefits: [
      "Direct WhatsApp contact with verified senior students on campus",
      "First-hand advice on accommodation, food, weather, and campus environment",
      "Tanzanian & African student community support in host countries",
      "Safe and private student directory accessible via Student Portal",
    ],
    processSteps: [
      { title: "1. Login to Student Portal", desc: "Access your verified MtishbiScholars student dashboard account." },
      { title: "2. Open Campus Connect Directory", desc: "Filter scholars by country (India, China, UK, Germany, Italy), course, or university." },
      { title: "3. View Student Profile", desc: "Read bio, campus activities, and specific topics the scholar can help you with." },
      { title: "4. Direct WhatsApp Connection", desc: "Click 'Connect on WhatsApp' to open instant chat with the scholar abroad." },
    ],
    requirements: [
      "Registered MtishbiScholars Student Portal Account",
      "Active WhatsApp Messenger Application",
    ],
    faq: [
      { q: "Is Student Connect free for registered students?", a: "Yes! All verified students on MtishbiScholars have 100% free access to connect with current scholars abroad." },
      { q: "Can I connect with students before traveling?", a: "Yes! You can speak with senior students at your target university before applying or before booking your flight." },
    ],
  },
];
