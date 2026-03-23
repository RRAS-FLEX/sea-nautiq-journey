import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import BoatCard from "./BoatCard";
import { BoatSearchCriteria } from "@/lib/boat-search";
import { getBoats } from "@/lib/boats";
import type { Boat } from "@/lib/boats";
import { sortBoatsByBookingsFirst } from "@/lib/boat-ranking";
import { getBoatReviewStatsMap } from "@/lib/reviews";
import { useLanguage } from "@/contexts/LanguageContext";
import { withRetry } from "@/lib/retry";
import { BoatsGridSkeleton } from "@/components/loading/LoadingUI";

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
  const { t, tl } = useLanguage();
  const [reviewCounts, setReviewCounts] = useState<Record<string, number>>({});
  const [allBoats, setAllBoats] = useState<Boat[]>([]);
  const [isBoatsLoading, setIsBoatsLoading] = useState(true);
  const [boatsError, setBoatsError] = useState("");

  useEffect(() => {
    const loadBoats = async () => {
      try {
        setIsBoatsLoading(true);
        setBoatsError("");
        const data = await withRetry(() => getBoats(), { retries: 2, initialDelayMs: 220 });
        setAllBoats(data);
      } catch (error) {
        setBoatsError(error instanceof Error ? error.message : "Unable to load featured boats.");
      } finally {
        setIsBoatsLoading(false);
      }
    };

    void loadBoats();
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
        const statsMap = await getBoatReviewStatsMap(promotedBoats.map((boat) => boat.id));
        if (isActive) {
          const counts = Object.fromEntries(
            Object.entries(statsMap).map(([boatId, stats]) => [boatId, stats.total]),
          );
          setReviewCounts(counts);
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
            {promotedBoats.length} {promotedBoats.length === 1 ? tl("boat", "σκάφος") : tl("boats", "σκάφη")} {tl("ready to book", "έτοιμα για κράτηση")}
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
              {tl("Browse all boats →", "Περιήγηση σε όλα τα σκάφη →")}
            </Link>
          </div>
        </motion.div>

        {isBoatsLoading ? (
          <BoatsGridSkeleton count={6} />
        ) : boatsError ? (
          <div className="text-center space-y-3">
            <p className="text-muted-foreground text-lg">{boatsError}</p>
          </div>
        ) : filteredBoats.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
