import { useState } from "react";
import { useSEO } from "@/hooks/useSEO";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import FeaturedBoats from "@/components/FeaturedBoats";
import Destinations from "@/components/Destinations";
import HowItWorks from "@/components/HowItWorks";
import OwnerCTA from "@/components/OwnerCTA";
import Footer from "@/components/Footer";
import { BoatSearchCriteria } from "@/lib/boat-search";

const Index = () => {
  const [searchCriteria, setSearchCriteria] = useState<BoatSearchCriteria | null>(null);

  useSEO({
    title: "Nautiplex — Boat Rentals & Sea Experiences in Greece",
    description:
      "Book verified boats in Greece instantly — Mykonos, Santorini, Thassos, Halkidiki & more. Motor yachts, catamarans, speedboats with trusted local owners for EU and US travelers. Best prices, no hidden fees.",
    canonical: "https://nautiq.gr/",
    keywords:
      "boat rental Greece, rent a boat Greece, yacht charter Greece, Greek islands sailing, sea experiences Greece, boat rental Europe, boat rental for US travelers",
    locale: "en_US",
    hashtags: [
      "boatRental",
      "Greece",
      "GreekIslands",
      "YachtCharter",
      "SeaExperiences",
      "Nautiplex",
    ],
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
        <FeaturedBoats searchCriteria={searchCriteria} />
        <Destinations />
        <HowItWorks />
        <OwnerCTA />
      </>

      <Footer />
    </div>
  );
};

export default Index;
