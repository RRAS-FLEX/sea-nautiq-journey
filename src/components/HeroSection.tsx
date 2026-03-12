import { Search, MapPin, Calendar, Users } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "./ui/button";
import heroImage from "@/assets/hero-boat.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-[90vh] md:min-h-screen flex items-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Luxury boat in turquoise Mediterranean waters"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ocean/70 via-ocean/50 to-ocean/80" />
      </div>

      <div className="container relative z-10 mx-auto px-4 pt-24 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-3xl"
        >
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-heading font-bold text-primary-foreground leading-[1.1] mb-4">
            Discover Boats.
            <br />
            <span className="text-turquoise">Explore the Sea.</span>
          </h1>
          <p className="text-lg md:text-xl text-primary-foreground/80 font-body max-w-xl mb-8">
            Find and book boats instantly for your perfect island adventure in
            the Greek Mediterranean.
          </p>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="bg-card rounded-2xl shadow-card-hover p-3 md:p-4 max-w-3xl"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-muted">
              <MapPin className="h-5 w-5 text-aegean shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground font-medium">Location</p>
                <input
                  type="text"
                  placeholder="Thassos, Greece"
                  className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-full"
                />
              </div>
            </div>
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-muted">
              <Calendar className="h-5 w-5 text-aegean shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground font-medium">Date</p>
                <input
                  type="text"
                  placeholder="Pick a date"
                  className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-full"
                />
              </div>
            </div>
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-muted">
              <Users className="h-5 w-5 text-aegean shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground font-medium">Passengers</p>
                <input
                  type="text"
                  placeholder="2 guests"
                  className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-full"
                />
              </div>
            </div>
            <Button className="bg-gradient-accent text-accent-foreground rounded-xl h-auto py-3 text-base font-semibold gap-2">
              <Search className="h-5 w-5" />
              Find Boats
            </Button>
          </div>
        </motion.div>

        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex flex-wrap items-center gap-6 mt-8 text-primary-foreground/60 text-sm"
        >
          <span>🛡️ Verified boats</span>
          <span>⭐ 4.9 average rating</span>
          <span>🌊 500+ trips completed</span>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
