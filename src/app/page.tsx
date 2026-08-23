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

export default function Home() {
  return (
    <main className="flex flex-col min-h-screen">
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
