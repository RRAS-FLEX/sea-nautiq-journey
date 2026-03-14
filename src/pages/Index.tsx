import { useState } from "react";
import { useSEO } from "@/hooks/useSEO";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import HomeValueStrip from "@/components/HomeValueStrip";
import FeaturedBoats from "@/components/FeaturedBoats";
import TopPackages from "@/components/TopPackages";
import Destinations from "@/components/Destinations";
import HowItWorks from "@/components/HowItWorks";
import OwnerCTA from "@/components/OwnerCTA";
import Footer from "@/components/Footer";
import { BoatSearchCriteria } from "@/lib/boat-search";

const Index = () => {
  const [searchCriteria, setSearchCriteria] = useState<BoatSearchCriteria | null>(null);

  useSEO({
    title: "Nautiq — Boat Rentals & Sea Experiences in Greece",
    description: "Book verified boats in Greece instantly — Mykonos, Santorini, Thassos, Halkidiki & more. Motor yachts, catamarans, speedboats with trusted local owners. Best prices, no hidden fees.",
    canonical: "https://nautiq.gr/",
    keywords: "boat rental Greece, rent a boat Greece, yacht charter Greece, Greek islands sailing, sea experiences Greece",
  });

  const handleFindBoats = (criteria: BoatSearchCriteria) => {
    setSearchCriteria(criteria);
    document.getElementById("boats")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <>
        <HeroSection onFindBoats={handleFindBoats} />
        <HomeValueStrip />
        <FeaturedBoats searchCriteria={searchCriteria} />
        <TopPackages />
        <Destinations />
        <HowItWorks />
        <OwnerCTA />
      </>

      <Footer />
    </div>
  );
};

export default Index;
