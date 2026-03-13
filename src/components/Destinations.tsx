import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { getDestinations, type Destination } from "@/lib/destinations";

const Destinations = () => {
  const [destinations, setDestinations] = useState<Destination[]>([]);

  useEffect(() => {
    let cancelled = false;

    const loadDestinations = async () => {
      const nextDestinations = await getDestinations();
      if (!cancelled) {
        setDestinations(nextDestinations.filter((destination) => destination.boats > 0).slice(0, 4));
      }
    };

    loadDestinations();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section id="destinations" className="py-20 md:py-28 bg-muted">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-3">
            Popular Destinations
          </h2>
          <p className="text-muted-foreground text-lg max-w-md mx-auto">
            Explore the most stunning coastlines of Greece.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {destinations.map((dest, i) => (
            <Link key={dest.id} to={`/destinations#${dest.slug}`}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group relative aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer"
            >
              <img
                src={dest.image}
                alt={dest.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ocean/80 via-ocean/20 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <h3 className="text-xl font-heading font-bold text-primary-foreground">
                  {dest.name}
                </h3>
                <p className="text-sm text-primary-foreground/70">{dest.boats} boats available</p>
              </div>
            </motion.div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Destinations;
