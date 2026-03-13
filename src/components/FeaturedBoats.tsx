import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import BoatCard from "./BoatCard";
import { BoatSearchCriteria } from "@/lib/boat-search";
import { getBoats } from "@/lib/boats";
import type { Boat } from "@/lib/boats";
import { sortBoatsByPromotionScore } from "@/lib/boat-ranking";
import { getBoatReviewStats } from "@/lib/reviews";

const formatSearchDateTime = (dateTime: string) => {
  const parsed = new Date(dateTime);
  if (Number.isNaN(parsed.getTime())) {
    return dateTime;
  }

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
};

interface FeaturedBoatsProps {
  searchCriteria: BoatSearchCriteria | null;
}

const FeaturedBoats = ({ searchCriteria }: FeaturedBoatsProps) => {
  const [reviewCounts, setReviewCounts] = useState<Record<string, number>>({});
  const [allBoats, setAllBoats] = useState<Boat[]>([]);
  const [isBoatsLoading, setIsBoatsLoading] = useState(true);

  useEffect(() => {
    getBoats()
      .then((data) => { setAllBoats(data); setIsBoatsLoading(false); })
      .catch(() => setIsBoatsLoading(false));
  }, []);

  const normalizedLocationFilter = searchCriteria?.location.trim().toLowerCase() ?? "";
  const requiredPassengers = searchCriteria?.passengers ?? 0;

  const filteredBoats = searchCriteria
    ? allBoats.filter(
        (boat) =>
          boat.location.toLowerCase().includes(normalizedLocationFilter) &&
          boat.capacity >= requiredPassengers,
      )
    : allBoats;
  const promotedBoats = sortBoatsByPromotionScore(filteredBoats);
  const promotedBoatIdsKey = promotedBoats.map((boat) => boat.id).join("|");

  useEffect(() => {
    let isActive = true;

    const loadReviewCounts = async () => {
      try {
        const statsEntries = await Promise.all(
          promotedBoats.map(async (boat) => [boat.id, (await getBoatReviewStats(boat.id)).total] as const),
        );
        if (isActive) {
          setReviewCounts(Object.fromEntries(statsEntries));
        }
      } catch {
        if (isActive) {
          setReviewCounts({});
        }
      }
    };

    loadReviewCounts();

    return () => {
      isActive = false;
    };
  }, [promotedBoatIdsKey]);

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
            Hand-picked boats from verified owners across Greek islands, prioritized by real review quality.
          </p>
          {searchCriteria && (
            <p className="text-sm text-muted-foreground mt-3">
              Showing results for {searchCriteria.location} on {formatSearchDateTime(searchCriteria.dateTime)} for {searchCriteria.passengers} passengers.
            </p>
          )}
        </motion.div>

        {filteredBoats.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {promotedBoats.map((boat, i) => (
              <BoatCard
                key={boat.name}
                {...boat}
                index={i}
                reviewCount={reviewCounts[boat.id] ?? 0}
              />
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground text-lg">
            No boats found for {searchCriteria?.location} with capacity for {requiredPassengers} passengers.
          </p>
        )}
      </div>
    </section>
  );
};

export default FeaturedBoats;
