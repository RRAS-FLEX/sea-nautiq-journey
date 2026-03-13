import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Clock3, Sun, Waves } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getBoats } from "@/lib/boats";
import type { Boat } from "@/lib/boats";
import { useLanguage } from "@/contexts/LanguageContext";

const packageBlueprints = [
  {
    id: "three-hours",
    name: "3 Hour Escape",
    duration: "3 hours",
    durationHours: 3,
    popularityFactor: 0.9,
    priceFrom: 190,
    icon: Clock3,
    description: "Quick premium route with swim stop and skyline pass.",
  },
  {
    id: "half-day",
    name: "Half Day Signature",
    duration: "5 hours",
    durationHours: 5,
    popularityFactor: 1.1,
    priceFrom: 290,
    icon: Sun,
    description: "Balanced package for families and first-time island explorers.",
  },
  {
    id: "full-day",
    name: "Full Day Elite",
    duration: "8 hours",
    durationHours: 8,
    popularityFactor: 1.3,
    priceFrom: 430,
    icon: Waves,
    description: "Multi-bay itinerary with lunch stop and full sea-day freedom.",
  },
];

const PLATFORM_COMMISSION_RATE = 0.15;

const estimatePlatformRevenue = (boats: Boat[], durationHours: number, popularityFactor: number) => {
  const durationWeight = durationHours / 8;
  return boats.reduce((total, boat) => {
    const boatBookings = Math.max(0, boat.bookings || 0);
    const basePackagePrice = boat.pricePerDay * durationWeight;
    const estimatedBookingsForPackage = boatBookings * popularityFactor;
    const platformShare = basePackagePrice * PLATFORM_COMMISSION_RATE;
    return total + estimatedBookingsForPackage * platformShare;
  }, 0);
};

const TopPackages = () => {
  const { tl } = useLanguage();
  const [boats, setBoats] = useState<Boat[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getBoats()
      .then((data) => setBoats(data))
      .finally(() => setIsLoading(false));
  }, []);

  const topPackages = useMemo(() => {
    return packageBlueprints.map((pkg) => ({
      ...pkg,
      projectedPlatformRevenue: estimatePlatformRevenue(boats, pkg.durationHours, pkg.popularityFactor),
    }));
  }, [boats]);

  const mostProfitablePackageId = useMemo(() => {
    if (topPackages.length === 0) return null;
    return [...topPackages].sort((a, b) => b.projectedPlatformRevenue - a.projectedPlatformRevenue)[0]?.id ?? null;
  }, [topPackages]);

  return (
    <section className="py-16 md:py-20 border-y border-border bg-muted/20">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mb-8">
          <p className="inline-flex items-center rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground mb-4">
            {tl("Smart package recommendations", "Έξυπνες προτάσεις πακέτων")}
          </p>
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground">{tl("Top packages", "Κορυφαία πακέτα")}</h2>
          <p className="text-muted-foreground mt-2">
            {tl("Packages are ranked by booking demand and projected platform revenue to recommend what travelers choose most.", "Τα πακέτα ταξινομούνται με βάση τη ζήτηση κρατήσεων και τα εκτιμώμενα έσοδα της πλατφόρμας για να προτείνονται όσα επιλέγουν περισσότερο οι ταξιδιώτες.")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {topPackages.map((pkg) => (
            <Card
              key={pkg.id}
              className={`shadow-card hover:shadow-card-hover transition-shadow ${
                pkg.id === mostProfitablePackageId ? "border-aegean" : ""
              }`}
            >
              <CardContent className="pt-6 space-y-4">
                <div className="h-10 w-10 rounded-full bg-aegean/10 text-aegean flex items-center justify-center">
                  <pkg.icon className="h-5 w-5" />
                </div>
                {pkg.id === mostProfitablePackageId ? (
                  <p className="inline-flex w-fit rounded-full bg-aegean/10 px-2.5 py-1 text-xs font-semibold text-aegean">
                    {tl("Most People Choose", "Πιο δημοφιλές")}
                  </p>
                ) : null}
                <div>
                  <p className="font-semibold text-foreground">{pkg.name}</p>
                  <p className="text-sm text-muted-foreground">{pkg.duration}</p>
                </div>
                <p className="text-sm text-muted-foreground">{pkg.description}</p>
                <p className="text-xs text-muted-foreground">
                  {isLoading
                    ? tl("Calculating recommendation…", "Υπολογισμός πρότασης…")
                    : `${tl("Projected platform earnings", "Εκτιμώμενα έσοδα πλατφόρμας")}: €${Math.round(pkg.projectedPlatformRevenue).toLocaleString()}`}
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{tl("From", "Από")}</p>
                    <p className="text-2xl font-heading font-bold text-foreground">€{pkg.priceFrom}</p>
                  </div>
                  <Button asChild variant="outline" className="rounded-full">
                    <Link to="/boats">{tl("Choose", "Επιλογή")}</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TopPackages;
