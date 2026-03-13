import { Link } from "react-router-dom";
import { Clock3, Sun, Waves } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const topPackages = [
  {
    id: "three-hours",
    name: "3 Hour Escape",
    duration: "3 hours",
    priceFrom: 190,
    icon: Clock3,
    description: "Quick premium route with swim stop and skyline pass.",
  },
  {
    id: "half-day",
    name: "Half Day Signature",
    duration: "5 hours",
    priceFrom: 290,
    icon: Sun,
    description: "Balanced package for families and first-time island explorers.",
  },
  {
    id: "full-day",
    name: "Full Day Elite",
    duration: "8 hours",
    priceFrom: 430,
    icon: Waves,
    description: "Multi-bay itinerary with lunch stop and full sea-day freedom.",
  },
];

const TopPackages = () => {
  return (
    <section className="py-16 md:py-20 border-y border-border bg-muted/20">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mb-8">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground">Top packages</h2>
          <p className="text-muted-foreground mt-2">
            The most booked trip formats this month, tuned for speed, comfort, and island coverage.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {topPackages.map((pkg) => (
            <Card key={pkg.id} className="shadow-card hover:shadow-card-hover transition-shadow">
              <CardContent className="pt-6 space-y-4">
                <div className="h-10 w-10 rounded-full bg-aegean/10 text-aegean flex items-center justify-center">
                  <pkg.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">{pkg.name}</p>
                  <p className="text-sm text-muted-foreground">{pkg.duration}</p>
                </div>
                <p className="text-sm text-muted-foreground">{pkg.description}</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">From</p>
                    <p className="text-2xl font-heading font-bold text-foreground">€{pkg.priceFrom}</p>
                  </div>
                  <Button asChild variant="outline" className="rounded-full">
                    <Link to="/boats">Choose</Link>
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
