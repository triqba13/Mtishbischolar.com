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
    id: "abertay-uk",
    name: "Abertay University",
    country: "UK",
    city: "Dundee, Scotland",
    flag: "🇬🇧",
    scholarship: "£3,000 International Bursary",
    courses: [
      "B.Sc (Hons) Computer Games Technology",
      "BA (Hons) Business Management",
      "M.Sc Ethical Hacking & Cybersecurity",
    ],
    intakes: ["September Intake", "January Intake"],
    tuitionFeeUSD: 14000,
    featured: true,
    image: "/videos/images/UK.jpg",
    description: "Renowned UK University in Dundee, Scotland, famous for world-leading technology, business, and cybersecurity programs.",
  },
  {
    id: "zhejiang-china",
    name: "Zhejiang University",
    country: "China",
    city: "Hangzhou",
    flag: "🇨🇳",
    scholarship: "Chinese Government Scholarship (CSC)",
    courses: [
      "MBBS Clinical Medicine (English Medium)",
      "B.Eng Mechanical Engineering",
      "M.Sc Environmental Science",
    ],
    intakes: ["September Intake", "March Intake"],
    tuitionFeeUSD: 3500,
    featured: true,
    image: "/videos/images/china.jpg",
    description: "Top 3 university in China providing world-class English-taught MBBS medicine and engineering programs with generous CSC scholarships.",
  },
  {
    id: "eserp-spain",
    name: "ESERP Business School",
    country: "Spain",
    city: "Barcelona & Madrid",
    flag: "🇪🇸",
    scholarship: "30% Merit Subsidized Fee",
    courses: [
      "Bachelor in Business Management & Law",
      "Bachelor in International Trade",
      "Master in Digital Marketing & FinTech",
    ],
    intakes: ["September Intake", "January Intake", "March Intake", "July Intake"],
    tuitionFeeUSD: 6000,
    featured: true,
    image: "/videos/images/spain.jpg",
    description: "Leading Spanish business academy offering top-ranking European business degrees in vibrant Barcelona & Madrid with July & March additional intakes.",
  },
  {
    id: "manipal-dubai",
    name: "Manipal Academy of Higher Education",
    country: "UAE",
    city: "Dubai Campus",
    flag: "🇦🇪",
    scholarship: "25% African Merit Grant",
    courses: [
      "B.Tech Computer Science Engineering",
      "Bachelor of Design (B.Des)",
      "MBA Global Business",
    ],
    intakes: ["September Intake", "January Intake", "March Intake", "July Intake"],
    tuitionFeeUSD: 8500,
    featured: true,
    image: "/videos/images/UAE.jpg",
    description: "World-class Dubai campus offering flexible intakes (September, January, March, July) and direct career opportunities in the UAE.",
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
