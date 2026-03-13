import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import BoatCard from "./BoatCard";
import { BoatSearchCriteria } from "@/lib/boat-search";
import { getBoats } from "@/lib/boats";
import type { Boat } from "@/lib/boats";
import { sortBoatsByBookingsFirst } from "@/lib/boat-ranking";
import { getBoatReviewStats } from "@/lib/reviews";
import { useLanguage } from "@/contexts/LanguageContext";

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
  const { t } = useLanguage();
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
  const promotedBoats = sortBoatsByBookingsFirst(filteredBoats);
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
          <p className="inline-flex items-center rounded-full border border-border bg-muted/40 px-3 py-1 text-xs text-muted-foreground mb-4">
            {promotedBoats.length} {promotedBoats.length === 1 ? "boat" : "boats"} ready to book
          </p>
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-3">
            {t("featured.title")}
          </h2>
          <p className="text-muted-foreground text-lg max-w-md mx-auto">
            {t("featured.subtitle")}
          </p>
          {searchCriteria && (
            <p className="text-sm text-muted-foreground mt-3">
              {t("featured.showing", {
                location: searchCriteria.location,
                dateTime: formatSearchDateTime(searchCriteria.dateTime),
                passengers: searchCriteria.passengers,
              })}
            </p>
          )}

          <div className="mt-4">
            <Link to="/boats" className="text-sm font-medium text-aegean hover:text-turquoise transition-colors">
              Browse all boats →
            </Link>
          </div>
        </motion.div>

        {isBoatsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }, (_, index) => (
              <div key={`boat-skeleton-${index}`} className="rounded-2xl border border-border bg-card overflow-hidden">
                <div className="aspect-[4/3] bg-muted animate-pulse" />
                <div className="p-4 space-y-3">
                  <div className="h-4 w-2/3 rounded bg-muted animate-pulse" />
                  <div className="h-3 w-1/2 rounded bg-muted animate-pulse" />
                  <div className="h-3 w-1/3 rounded bg-muted animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredBoats.length > 0 ? (
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
            {t("featured.none", { location: searchCriteria?.location ?? "-", passengers: requiredPassengers })}
          </p>
        )}
      </div>
    </section>
  );
};

export default FeaturedBoats;
