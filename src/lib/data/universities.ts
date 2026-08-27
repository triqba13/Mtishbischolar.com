import { createClient } from "@/lib/supabase/client";

export interface University {
  id: string;
  name: string;
  country: string;
  city: string;
  flag: string;
  scholarship: string;
  courses: string[];
  intakes: string[];
  tuitionFeeUSD: number;
  featured: boolean;
  image: string;
  description: string;
}

export const INITIAL_UNIVERSITIES: University[] = [
  {
    id: "parul-india",
    name: "Parul University",
    country: "India",
    city: "Vadodara, Gujarat",
    flag: "🇮🇳",
    scholarship: "Scholarship Guaranteed",
    courses: [
      "B.Tech Computer Science & AI",
      "B.Tech Information Technology",
      "Bachelor of Business Administration (BBA)",
      "Bachelor of Pharmacy (B.Pharm)",
      "B.Sc Nursing",
      "MBA Global Business",
    ],
    intakes: ["September Intake", "January Intake"],
    tuitionFeeUSD: 2500,
    featured: true,
    image: "/videos/images/india.jpg",
    description: "NAAC A++ Accredited University in India providing world-class tech and engineering degrees with guaranteed tuition waiver for African students.",
  },
  {
    id: "srm-india",
    name: "SRM University AP",
    country: "India",
    city: "Andhra Pradesh",
    flag: "🇮🇳",
    scholarship: "Merit Scholarship",
    courses: [
      "B.Tech Computer Science Engineering",
      "B.Tech Mechanical Engineering",
      "BBA International Finance",
      "M.Tech Artificial Intelligence",
    ],
    intakes: ["September Intake", "January Intake"],
    tuitionFeeUSD: 3000,
    featured: true,
    image: "/videos/images/india.jpg",
    description: "Top-ranked private research university with state-of-the-art innovation labs and international exchange opportunities.",
  },
  {
    id: "vistula-poland",
    name: "Vistula University",
    country: "Poland",
    city: "Warsaw",
    flag: "🇵🇱",
    scholarship: "Schengen EU Subsidized Tuition",
    courses: [
      "BA Architecture & Design",
      "BA International Relations",
      "B.Sc Computer Engineering",
      "MA Global Management",
    ],
    intakes: ["September Intake", "January Intake", "March Intake"],
    tuitionFeeUSD: 3200,
    featured: true,
    image: "/videos/images/poland.jpg",
    description: "Located in Warsaw, Poland. Offers full Schengen Visa access across 27 European nations with English-taught degree programs.",
  },
  {
    id: "eul-cyprus",
    name: "European University of Lefke (EUL)",
    country: "Cyprus",
    city: "Lefke",
    flag: "🇨🇾",
    scholarship: "Scholarship Guaranteed",
    courses: [
      "B.Sc Software Engineering",
      "B.Sc Civil Engineering",
      "BA Tourism & Hospitality Management",
      "MBA Logistics & Supply Chain",
    ],
    intakes: ["September Intake", "January Intake"],
    tuitionFeeUSD: 2800,
    featured: true,
    image: "/videos/images/cyprus.jpg",
    description: "Beautiful Mediterranean island campus offering affordable British-standard degrees with high visa success rates for Tanzanian students.",
  },
  {
    id: "apu-malaysia",
    name: "Asia Pacific University (APU)",
    country: "Malaysia",
    city: "Kuala Lumpur",
    flag: "🇲🇾",
    scholarship: "Dual UK Degree Option",
    courses: [
      "B.Sc (Hons) Cybersecurity",
      "B.Sc (Hons) Data Analytics",
      "BBA Digital Transformation",
      "M.Sc Artificial Intelligence",
    ],
    intakes: ["September Intake", "January Intake", "March Intake", "July Intake"],
    tuitionFeeUSD: 4500,
    featured: true,
    image: "/videos/images/malaysia.jpg",
    description: "Premier technology university in Kuala Lumpur offering dual degree awards with De Montfort University (UK).",
  },
  {
    id: "hult-international-business-school-uk",
    name: "Hult International Business School",
    country: "UK",
    city: "Greater London",
    flag: "🇬🇧",
    scholarship: "International Student Loans & Scholarships",
    courses: [
      "Bachelor of Business Administration - Marketing",
      "Bachelor of Business Administration - Management",
      "Bachelor of Business Administration - Finance",
      "Bachelor of Business Administration - Entrepreneurship",
      "Bachelor of Business Administration - Business Analytics",
      "Masters in Management",
      "Masters in Marketing",
    ],
    intakes: ["September Intake", "January Intake"],
    tuitionFeeUSD: 42000,
    featured: true,
    image: "/videos/images/UK.jpg",
    description: "Top-ranked triple-accredited global business school in London offering career-focused undergraduate and postgraduate degrees with high job demand.",
  },
  {
    id: "algoma-university-canada",
    name: "Algoma University",
    country: "Canada",
    city: "Sault Ste. Marie, Ontario",
    flag: "🇨🇦",
    scholarship: "Scholarships Available & Fast Acceptance",
    courses: [
      "Bachelor of Science - Biology - Honours",
      "Bachelor of Business Administration - Honours",
      "Bachelor of Arts - Community, Economic and Social Development",
      "Bachelor of Computer Science - Honours",
      "Bachelor of Arts - Accounting - General",
      "Bachelor of Arts - Anishinaabemowin (Ojibwe...)",
      "Bachelor of Arts - Economics - General",
      "Bachelor of Arts - English - Honours",
      "Bachelor of Arts - Finance and Economics - Honours",
      "Bachelor of Arts - Fine Arts - General",
      "Master of Science - Business Analytics",
      "Master of Science - Business Analytics (MSBA)",
    ],
    intakes: ["January Intake", "May Intake", "September Intake"],
    tuitionFeeUSD: 16500,
    featured: true,
    image: "/videos/images/canada.jpg",
    description: "Public university in Ontario, Canada offering hands-on bachelor and master degree programs with PGWP work permits, fast acceptance, and no visa cap.",
  },
  {
    id: "city-university-malaysia",
    name: "City University Malaysia",
    country: "Malaysia",
    city: "Petaling Jaya, Selangor",
    flag: "🇲🇾",
    scholarship: "Special Promo Fee 2026",
    courses: [
      "Bachelor of Computer Science (Artificial Intelligence) (Hons)",
      "Bachelor of Information Technology (Hons)",
      "Bachelor of Business Administration (Hons)",
      "Bachelor of Graphic Design (Hons)",
      "Master of Business Administration (MBA)",
      "Doctor of Business Administration (DBA)",
    ],
    intakes: ["February Intake", "July Intake", "September Intake", "November Intake"],
    tuitionFeeUSD: 3500,
    featured: true,
    image: "/videos/images/malaysia.jpg",
    description: "Full-fledged premier university in Malaysia offering 80+ accredited Foundation, Diploma, Bachelor, Master, and PhD degrees across 8 faculties.",
  },
  {
    id: "c3s-business-school-spain",
    name: "C3S Business School",
    country: "Spain",
    city: "Barcelona",
    flag: "🇪🇸",
    scholarship: "European Subsidized Tuition & Dual UK Degree Pathway",
    courses: [
      "BA Hons in Business Management",
      "BA Hons in Business Analytics & Digital Transformation",
      "Global MBA",
      "Master in Project Management",
      "BSc (Hons) Business Computing and Information Systems",
      "Postgraduate Diploma in Logistics and Supply Chain Management",
    ],
    intakes: ["February Intake", "May Intake", "October Intake"],
    tuitionFeeUSD: 7500,
    featured: true,
    image: "/videos/images/spain.jpg",
    description: "Innovative business school in Barcelona, Spain offering accredited Spanish degrees and UK degree/diploma pathways with February, May, and October intakes.",
  },
  {
    id: "nest-academy-uae",
    name: "Nest Academy of Management Education",
    country: "UAE",
    city: "Dubai & Ras Al Khaimah",
    flag: "🇦🇪",
    scholarship: "Scholarship Guaranteed",
    courses: [
      "Diploma in Business Management",
      "Diploma in Hospitality Management",
      "Diploma in Events Management",
      "Diploma in Computing IT",
      "Foundation Diploma in Business Management",
      "Certificate in General English",
    ],
    intakes: ["September Intake", "January Intake", "March Intake", "July Intake"],
    tuitionFeeUSD: 6000,
    featured: true,
    image: "/videos/images/UAE.jpg",
    description: "Premier UK qualification academy in Dubai & RAK offering ATHE/CTH Level 3, 4 & 5 diplomas, foundation diplomas, and general English certification with fast-track UK progression.",
  },
  {
    id: "royal-roads-uae",
    name: "Royal Roads University - Ras Al Khaimah Campus",
    country: "UAE",
    city: "Ras Al Khaimah",
    flag: "🇦🇪",
    scholarship: "USD 7,000 Bachelor / USD 5,000 Master Scholarship",
    courses: [
      "Bachelor of Business Administration (BBA)",
      "Bachelor of Hospitality & Tourism Management (BHTM)",
      "Master of Business Administration (MBA)",
    ],
    intakes: ["September Intake", "January Intake"],
    tuitionFeeUSD: 6000,
    featured: true,
    image: "/videos/images/UAE.jpg",
    description: "Prestigious Canadian/international curriculum campus in Ras Al Khaimah offering accredited BBA, BHTM, and MBA degrees with guaranteed annual scholarship packages ($6,000/yr).",
  },
  {
    id: "wuhan-china",
    name: "Wuhan University of Technology (WUT)",
    country: "China",
    city: "Wuhan",
    flag: "🇨🇳",
    scholarship: "Self-sponsored / CSC Scholarship",
    courses: [
      "B.Eng Civil Engineering",
      "Computer Science & Technology",
      "International Economics & Trade",
    ],
    intakes: ["September Intake", "March Intake"],
    tuitionFeeUSD: 2800,
    featured: true,
    image: "/videos/images/china.jpg",
    description: "National Key & Double First Class University in Wuhan, China offering top engineering and technology degree programs.",
  },
];

export async function getUniversitiesFromDB(): Promise<University[]> {
  try {
    const supabase = createClient();
    const { data: unisData, error: unisError } = await supabase
      .from("universities")
      .select("*")
      .order("name", { ascending: true });

    if (unisError || !unisData || unisData.length === 0) {
      return INITIAL_UNIVERSITIES;
    }

    const { data: coursesData } = await supabase
      .from("courses")
      .select("*");

    const coursesByUni: Record<string, string[]> = {};
    if (coursesData) {
      coursesData.forEach((c: any) => {
        if (!coursesByUni[c.university_id]) {
          coursesByUni[c.university_id] = [];
        }
        coursesByUni[c.university_id].push(c.title);
      });
    }

    return unisData.map((u: any) => ({
      id: u.id,
      name: u.name,
      country: u.country,
      city: u.city || u.location || "",
      flag: u.flag || "",
      scholarship: u.scholarship || "Scholarship Available",
      courses: coursesByUni[u.id] && coursesByUni[u.id].length > 0 ? coursesByUni[u.id] : (u.courses || []),
      intakes: u.intakes || ["September Intake", "January Intake"],
      tuitionFeeUSD: u.tuition_fee_usd || 2500,
      featured: u.featured ?? true,
      image: u.image || "/videos/images/india.jpg",
      description: u.description || "",
    })) as University[];
  } catch (err) {
    return INITIAL_UNIVERSITIES;
  }
}
