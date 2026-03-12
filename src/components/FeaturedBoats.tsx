import { motion } from "framer-motion";
import BoatCard from "./BoatCard";
import boat1 from "@/assets/boat-1.jpg";
import boat2 from "@/assets/boat-2.jpg";
import boat3 from "@/assets/boat-3.jpg";
import boat4 from "@/assets/boat-4.jpg";
import boat5 from "@/assets/boat-5.jpg";
import boat6 from "@/assets/boat-6.jpg";

const boats = [
  { image: boat1, name: "Aegean Breeze", capacity: 8, location: "Thassos", pricePerDay: 250, rating: 4.9 },
  { image: boat2, name: "Poseidon Express", capacity: 6, location: "Thassos", pricePerDay: 350, rating: 4.8 },
  { image: boat3, name: "Blue Horizon", capacity: 12, location: "Halkidiki", pricePerDay: 500, rating: 5.0 },
  { image: boat4, name: "Traditional Explorer", capacity: 4, location: "Mykonos", pricePerDay: 120, rating: 4.7 },
  { image: boat5, name: "Wave Runner", capacity: 5, location: "Thassos", pricePerDay: 180, rating: 4.6 },
  { image: boat6, name: "Mediterranean Star", capacity: 20, location: "Santorini", pricePerDay: 900, rating: 4.9 },
];

const FeaturedBoats = () => {
  return (
    <section id="boats" className="py-20 md:py-28 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-3">
            Featured Boats
          </h2>
          <p className="text-muted-foreground text-lg max-w-md mx-auto">
            Hand-picked boats from verified owners across Greek islands.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {boats.map((boat, i) => (
            <BoatCard key={boat.name} {...boat} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedBoats;
