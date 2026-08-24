import dynamic from "next/dynamic";
import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import TrustSection from "@/components/landing/TrustSection";

// Lazy load below-the-fold sections for optimized critical rendering path and reduced initial JS payload
const ServicesSection = dynamic(() => import("@/components/landing/ServicesSection"));
const UniversitiesSection = dynamic(() => import("@/components/landing/UniversitiesSection"));
const DestinationsSection = dynamic(() => import("@/components/landing/DestinationsSection"));
const TestimonialsSection = dynamic(() => import("@/components/landing/TestimonialsSection"));
const TeamSection = dynamic(() => import("@/components/landing/TeamSection"));
const FaqSection = dynamic(() => import("@/components/landing/FaqSection"));
const ContactSection = dynamic(() => import("@/components/landing/ContactSection"));
const Footer = dynamic(() => import("@/components/landing/Footer"));

const baseUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "https://mtishbischolar.com"
).replace(/\/$/, "");

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "EducationalOrganization",
      "@id": `${baseUrl}/#organization`,
      name: "MtishbiScholars",
      alternateName: "Mtishbi Scholars",
      url: baseUrl,
      logo: `${baseUrl}/logo.png`,
      image: `${baseUrl}/logo.png`,
      description:
        "Platform helping Tanzanian students discover international universities, scholarships, and university admission opportunities.",
      address: {
        "@type": "PostalAddress",
        addressCountry: "TZ",
        addressLocality: "Dar es Salaam, Tanzania",
      },
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "Student Admissions & Support",
        availableLanguage: ["English", "Swahili"],
      },
    },
    {
      "@type": "WebSite",
      "@id": `${baseUrl}/#website`,
      url: baseUrl,
      name: "MtishbiScholars",
      description:
        "Study Abroad & University Admissions for Tanzanian Students",
      publisher: {
        "@id": `${baseUrl}/#organization`,
      },
      inLanguage: "en-TZ",
    },
  ],
};

export default function Home() {
  return (
    <main className="flex flex-col min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />
      <HeroSection />
      <TrustSection />
      <ServicesSection />
      <UniversitiesSection />
      <DestinationsSection />
      <TestimonialsSection />
      <TeamSection />
      <FaqSection />
      <ContactSection />
      <Footer />
    </main>
  );
}
