export interface UniversityDetail {
  name: string;
  location: string;
  accreditation?: string;
  scholarship: string;
  popularCourses: {
    name: string;
    level: string;
    duration: string;
    fee: string;
  }[];
}

export interface Destination {
  id: string;
  country: string;
  code: string;
  flag: string;
  image: string;
  popular: boolean;
  tagline: string;
  description: string;
  universitiesCount: string;
  scholarshipMax: string;
  avgTuition: string;
  highlights: string[];
  universities: UniversityDetail[];
}

export const DESTINATIONS: Destination[] = [
  {
    id: "india",
    country: "India",
    code: "IN",
    flag: "🇮🇳",
    image: "/videos/images/india.jpg",
    popular: true,
    tagline: "World-Class Technical & Medical Education at Unbeatable Value",
    description:
      "India is a premier global education hub offering NAAC A++ accredited universities, state-of-the-art research facilities, and generous 50% to 100% scholarships for African students.",
    universitiesCount: "25+ Partner Universities",
    scholarshipMax: "Up to 50-100% Scholarship",
    avgTuition: "$1,800 - $3,500 / year",
    highlights: [
      "50% Flat Scholarship schemes for African students",
      "Degrees fully recognized by WHO, WDOMS, UNESCO, AIU",
      "100% English medium instruction",
      "Low cost of living ($100 - $150/month)",
    ],
    universities: [
      {
        name: "Parul University",
        location: "Vadodara, Gujarat, India",
        accreditation: "NAAC A++ Grade",
        scholarship: "Flat 50% Scholarship for International Students",
        popularCourses: [
          { name: "B.Tech Computer Science & AI", level: "Bachelor", duration: "4 Years", fee: "$2,200 / year" },
          { name: "Bachelor of Business Administration (BBA)", level: "Bachelor", duration: "3 Years", fee: "$1,800 / year" },
          { name: "Bachelor of Pharmacy (B.Pharm)", level: "Bachelor", duration: "4 Years", fee: "$2,400 / year" },
          { name: "Master of Business Administration (MBA)", level: "Master", duration: "2 Years", fee: "$2,500 / year" },
        ],
      },
      {
        name: "Jain University",
        location: "Bengaluru, Karnataka, India",
        accreditation: "NAAC A++ Grade | AACSB Accredited",
        scholarship: "Up to 50% Merit & African Diversity Scholarship",
        popularCourses: [
          { name: "B.Tech AI & Data Science", level: "Bachelor", duration: "4 Years", fee: "$2,800 / year" },
          { name: "BCA Computer Applications", level: "Bachelor", duration: "3 Years", fee: "$2,100 / year" },
          { name: "B.Sc Biotechnology", level: "Bachelor", duration: "3 Years", fee: "$2,000 / year" },
        ],
      },
      {
        name: "Lovely Professional University (LPU)",
        location: "Phagwara, Punjab, India",
        accreditation: "NAAC A++ Grade | NIRF Top Ranked",
        scholarship: "50% International Scholarship",
        popularCourses: [
          { name: "B.Tech Mechanical / Civil", level: "Bachelor", duration: "4 Years", fee: "$2,500 / year" },
          { name: "B.Des Fashion & Interior Design", level: "Bachelor", duration: "4 Years", fee: "$2,600 / year" },
          { name: "M.Sc Information Technology", level: "Master", duration: "2 Years", fee: "$2,200 / year" },
        ],
      },
      {
        name: "Marwadi University",
        location: "Rajkot, Gujarat, India",
        accreditation: "NAAC A+ Grade",
        scholarship: "Special African Partner Scholarship",
        popularCourses: [
          { name: "B.Tech Information Technology", level: "Bachelor", duration: "4 Years", fee: "$2,100 / year" },
          { name: "Bachelor of Commerce (B.Com)", level: "Bachelor", duration: "3 Years", fee: "$1,600 / year" },
        ],
      },
      {
        name: "RK University",
        location: "Rajkot, Gujarat, India",
        accreditation: "UGC & AICTE Approved",
        scholarship: "50% Tuition Waiver Package",
        popularCourses: [
          { name: "B.Sc Agricultural Science", level: "Bachelor", duration: "4 Years", fee: "$1,900 / year" },
          { name: "Diploma in Engineering", level: "Diploma", duration: "3 Years", fee: "$1,400 / year" },
        ],
      },
    ],
  },
  {
    id: "china",
    country: "China",
    code: "CN",
    flag: "🇨🇳",
    image: "/videos/images/china.jpg",
    popular: true,
    tagline: "High-Tech Infrastructure & Chinese Government Scholarships",
    description:
      "China stands at the forefront of global technology, engineering, and medical science. African students enjoy full tuition waivers, accommodation stipends, and internship access at Fortune 500 tech hubs.",
    universitiesCount: "15+ Partner Universities",
    scholarshipMax: "CSC & Provincial Full Scholarships",
    avgTuition: "$2,500 - $4,500 / year",
    highlights: [
      "Chinese Government Scholarship (CSC) opportunities",
      "MBBS medical degree in 100% English medium",
      "Access to AI, Robotics, and Green Energy labs",
      "High safety ranking & modern campus infrastructure",
    ],
    universities: [
      {
        name: "Zhejiang University of Technology",
        location: "Hangzhou, China",
        accreditation: "Double First Class University",
        scholarship: "Provincial & University Full Tuition Waiver",
        popularCourses: [
          { name: "Software Engineering", level: "Bachelor", duration: "4 Years", fee: "$2,800 / year" },
          { name: "International Economics & Trade", level: "Bachelor", duration: "4 Years", fee: "$2,500 / year" },
          { name: "M.Sc Chemical Engineering", level: "Master", duration: "3 Years", fee: "$3,200 / year" },
        ],
      },
      {
        name: "Jiangsu University",
        location: "Zhenjiang, China",
        accreditation: "Top 40 National University",
        scholarship: "JSU President Scholarship (100% Tuition Off)",
        popularCourses: [
          { name: "MBBS Clinical Medicine", level: "Bachelor", duration: "6 Years", fee: "$3,800 / year" },
          { name: "B.Eng Civil Engineering", level: "Bachelor", duration: "4 Years", fee: "$2,900 / year" },
        ],
      },
    ],
  },
  {
    id: "uk",
    country: "United Kingdom",
    code: "GB",
    flag: "🇬🇧",
    image: "/videos/images/UK.jpg",
    popular: true,
    tagline: "Prestigious British Qualifications Recognized Worldwide",
    description:
      "Earn a world-renowned degree from prestigious UK institutions. Fast-track 3-year Bachelor's and 1-year Master's programs with 2-year post-study work visa rights.",
    universitiesCount: "10+ Partner Universities",
    scholarshipMax: "Partial Merit & Chevening Assistance",
    avgTuition: "£11,000 - £16,000 / year",
    highlights: [
      "2-Year Graduate Post-Study Work Permit (PSW)",
      "1-Year Master's Degree options for quick graduation",
      "Direct pathway to global corporate careers in London",
      "Part-time work permitted during studies (20 hrs/week)",
    ],
    universities: [
      {
        name: "University of Greenwich",
        location: "London, United Kingdom",
        accreditation: "TEF Gold Rated",
        scholarship: "International Bursary £1,500 - £3,000",
        popularCourses: [
          { name: "MSc Data Science & AI", level: "Master", duration: "1 Year", fee: "£14,500 / year" },
          { name: "BSc Business Computing", level: "Bachelor", duration: "3 Years", fee: "£13,800 / year" },
          { name: "MBA International Business", level: "Master", duration: "1 Year", fee: "£15,200 / year" },
        ],
      },
    ],
  },
  {
    id: "malaysia",
    country: "Malaysia",
    code: "MY",
    flag: "🇲🇾",
    image: "/videos/images/malaysia.jpg",
    popular: true,
    tagline: "Affordable British & Australian Dual-Degree Pathways",
    description:
      "Malaysia offers high quality, English-medium education at a fraction of Western tuition fees. Study in modern Kuala Lumpur with dual-degree options from UK/Australia.",
    universitiesCount: "12+ Partner Universities",
    scholarshipMax: "Up to 40% Merit Scholarships",
    avgTuition: "$3,000 - $5,500 / year",
    highlights: [
      "Dual UK / Australian partner degree options",
      "100% English taught curricula",
      "Easy student visa process with high approval rate",
      "Multi-cultural, safe, and modern living environment",
    ],
    universities: [
      {
        name: "Asia Pacific University (APU)",
        location: "Kuala Lumpur, Malaysia",
        accreditation: "SETARA 5-Star University",
        scholarship: "African Leadership Bursary 30%",
        popularCourses: [
          { name: "BSc Cybersecurity", level: "Bachelor", duration: "3 Years", fee: "$4,200 / year" },
          { name: "B.Com International Business", level: "Bachelor", duration: "3 Years", fee: "$3,800 / year" },
        ],
      },
    ],
  },
  {
    id: "poland",
    country: "Poland",
    code: "PL",
    flag: "🇵🇱",
    image: "/videos/images/poland.jpg",
    popular: true,
    tagline: "Schengen European Union Degrees at Low Costs",
    description:
      "Study in the heart of Europe! Polish universities offer EU-standard degrees, full English medium instruction, free movement across 27 Schengen nations, and low tuition fees.",
    universitiesCount: "8+ Partner Universities",
    scholarshipMax: "EU Student Subsidy Packages",
    avgTuition: "€3,000 - €4,500 / year",
    highlights: [
      "Schengen Visa allows travel across 27 EU nations",
      "Degrees valid across all European Union countries",
      "Part-time work allowed for international students",
      "High quality living standards at affordable European cost",
    ],
    universities: [
      {
        name: "Vistula University",
        location: "Warsaw, Poland",
        accreditation: "CEEMAN IQA & Perspektywy #1 Private University",
        scholarship: "Early Bird Discount & Merit Waiver",
        popularCourses: [
          { name: "BA Architecture", level: "Bachelor", duration: "4 Years", fee: "€3,800 / year" },
          { name: "BA Economics", level: "Bachelor", duration: "3 Years", fee: "€3,800 / year" },
          { name: "BA International Relations", level: "Bachelor", duration: "3 Years", fee: "€3,800 / year" },
          { name: "BA Business Analytics", level: "Bachelor", duration: "3 Years", fee: "€4,000 / year" },
          { name: "MA Tourism & Hospitality", level: "Master", duration: "2 Years", fee: "€4,000 / year" },
        ],
      },
    ],
  },
  {
    id: "cyprus",
    country: "Cyprus",
    code: "CY",
    flag: "🇨🇾",
    image: "/videos/images/cyprus.jpg",
    popular: false,
    tagline: "Mediterranean Climate with Guaranteed Scholarship",
    description:
      "Cyprus is a tropical Mediterranean paradise offering British-system university programs, high safety, and guaranteed scholarships for African applicants.",
    universitiesCount: "6+ Partner Universities",
    scholarshipMax: "Guaranteed Scholarship",
    avgTuition: "€2,800 - €4,200 / year",
    highlights: [
      "Guaranteed international student scholarship",
      "No IELTS required for admission",
      "British curriculum framework and credit transfer",
      "Safe, sunny Mediterranean island lifestyle",
    ],
    universities: [
      {
        name: "European University of Lefke",
        location: "Lefke, Northern Cyprus",
        accreditation: "YOK & FIBAA Accredited",
        scholarship: "Guaranteed Scholarship Package",
        popularCourses: [
          { name: "B.Sc Nursing", level: "Bachelor", duration: "4 Years", fee: "€3,100 / year" },
          { name: "B.Eng Electrical Engineering", level: "Bachelor", duration: "4 Years", fee: "€3,300 / year" },
          { name: "BA Pharmacy", level: "Bachelor", duration: "5 Years", fee: "€4,100 / year" },
        ],
      },
    ],
  },
  {
    id: "uae",
    country: "United Arab Emirates",
    code: "AE",
    flag: "🇦🇪",
    image: "/videos/images/UAE.jpg",
    popular: false,
    tagline: "Study in Dubai - Global Commerce & Tech Capital",
    description:
      "Study in Dubai, Ras Al-Khaimah, and Sharjah. Gain direct exposure to multinational companies, tax-free career opportunities, and ultramodern campuses.",
    universitiesCount: "5+ Partner Campuses",
    scholarshipMax: "Up to 35% Academic Bursary",
    avgTuition: "$4,500 - $7,500 / year",
    highlights: [
      "Tax-free internship and employment opportunities",
      "100% English environment in global business capital",
      "Fast student visa processing within 2-3 weeks",
      "Transfer options to UK/US main campuses",
    ],
    universities: [
      {
        name: "BIG Education Campuses",
        location: "Dubai & Ras Al-Khaimah, UAE",
        accreditation: "KHDA & UAE Ministry Approved",
        scholarship: "Mtishbi Scholars Partner Bursary",
        popularCourses: [
          { name: "BBA International Business", level: "Bachelor", duration: "3 Years", fee: "$4,800 / year" },
          { name: "BSc Information Technology", level: "Bachelor", duration: "3 Years", fee: "$5,200 / year" },
          { name: "MBA Executive Management", level: "Master", duration: "1 Year", fee: "$6,500 / year" },
        ],
      },
    ],
  },
  {
    id: "canada",
    country: "Canada",
    code: "CA",
    flag: "🇨🇦",
    image: "/videos/images/canada.jpg",
    popular: false,
    tagline: "World-Class Quality & Permanent Residency Pathways",
    description:
      "Canada is globally renowned for top education standards, multi-cultural diversity, and 3-year Post-Graduation Work Permits (PGWP) leading to PR pathways.",
    universitiesCount: "8+ Partner Institutions",
    scholarshipMax: "Entrance Bursaries $2,000 - $5,000",
    avgTuition: "CAD $13,000 - $18,000 / year",
    highlights: [
      "3-Year PGWP (Post Graduation Work Permit)",
      "Direct pathway to Permanent Residency (PR)",
      "Part-time work permitted during semester",
    ],
    universities: [
      {
        name: "Seneca College / Partner Institutions",
        location: "Toronto, Ontario, Canada",
        accreditation: "Ontario College Quality Assurance",
        scholarship: "International Entrance Award",
        popularCourses: [
          { name: "Diploma Computer Programming", level: "Diploma", duration: "2 Years", fee: "CAD $15,000 / yr" },
          { name: "Post-Graduate Certificate Global Business", level: "PG Diploma", duration: "1 Year", fee: "CAD $16,500 / yr" },
        ],
      },
    ],
  },
  {
    id: "spain",
    country: "Spain",
    code: "ES",
    flag: "🇪🇸",
    image: "/videos/images/spain.jpg",
    popular: false,
    tagline: "Vibrant European Culture & Quality Degrees",
    description:
      "Experience Spain's rich heritage, warm climate, and innovative business programs taught fully in English in Barcelona and Madrid.",
    universitiesCount: "4+ Partner Universities",
    scholarshipMax: "Merit Discounts 25-40%",
    avgTuition: "€4,000 - €6,500 / year",
    highlights: [
      "Full English taught bachelor and master programs",
      "Schengen visa travel across Europe",
      "Internship placement support in top EU firms",
    ],
    universities: [
      {
        name: "EU Business School",
        location: "Barcelona, Spain",
        accreditation: "ACBSP & IACBE Accredited",
        scholarship: "Diversity Excellence Scholarship",
        popularCourses: [
          { name: "BBA Digital Business", level: "Bachelor", duration: "3 Years", fee: "€6,200 / year" },
          { name: "Master in Tourism & Hospitality", level: "Master", duration: "1 Year", fee: "€5,800 / year" },
        ],
      },
    ],
  },
  {
    id: "mauritius",
    country: "Mauritius",
    code: "MU",
    flag: "🇲🇺",
    image: "/videos/images/mauritius.jpg",
    popular: false,
    tagline: "Africa's Education Paradise with No Visa Hassles",
    description:
      "Mauritius offers world-class pan-African higher education, visa-free entry for many African nationalities, and international UK partner degrees.",
    universitiesCount: "5+ Partner Campuses",
    scholarshipMax: "Pan-African Leadership Grants",
    avgTuition: "$2,800 - $4,200 / year",
    highlights: [
      "Easy visa approval for African passport holders",
      "Safe, English-speaking island environment",
      "UK & Australian affiliated qualification degrees",
    ],
    universities: [
      {
        name: "African Leadership University / Middlesex Mauritius",
        location: "Pamplemousses, Mauritius",
        accreditation: "TEC Mauritius Approved",
        scholarship: "Mtishbi Scholars Africa Grant",
        popularCourses: [
          { name: "BSc Software Engineering", level: "Bachelor", duration: "3 Years", fee: "$3,400 / year" },
          { name: "BA Entrepreneurial Leadership", level: "Bachelor", duration: "3 Years", fee: "$3,000 / year" },
        ],
      },
    ],
  },
];
