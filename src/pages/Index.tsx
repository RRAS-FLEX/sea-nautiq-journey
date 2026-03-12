import { useState } from "react";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import FeaturedBoats from "@/components/FeaturedBoats";
import Destinations from "@/components/Destinations";
import HowItWorks from "@/components/HowItWorks";
import OwnerCTA from "@/components/OwnerCTA";
import OwnerDashboardPreview from "@/components/OwnerDashboardPreview";
import Footer from "@/components/Footer";

const Index = () => {
  const [mode, setMode] = useState<"customer" | "owner">("customer");

  return (
    <div className="min-h-screen bg-background">
      <Navbar mode={mode} onModeChange={setMode} />

      {mode === "customer" ? (
        <>
          <HeroSection />
          <FeaturedBoats />
          <Destinations />
          <HowItWorks />
          <OwnerCTA />
        </>
      ) : (
        <>
          <div className="pt-16" />
          <OwnerDashboardPreview />
          <OwnerCTA />
        </>
      )}

      <Footer />
    </div>
  );
};

export default Index;
