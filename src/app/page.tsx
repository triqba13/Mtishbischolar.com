import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import TrustSection from "@/components/landing/TrustSection";
import ServicesSection from "@/components/landing/ServicesSection";
import UniversitiesSection from "@/components/landing/UniversitiesSection";
import DestinationsSection from "@/components/landing/DestinationsSection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import TeamSection from "@/components/landing/TeamSection";
import FaqSection from "@/components/landing/FaqSection";
import ContactSection from "@/components/landing/ContactSection";
import Footer from "@/components/landing/Footer";

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
      name: "MtishbiScholar",
      alternateName: "Mtishbi Scholar",
      url: baseUrl,
      logo: `${baseUrl}/logo.jpeg`,
      image: `${baseUrl}/logo.jpeg`,
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
      name: "MtishbiScholar",
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
