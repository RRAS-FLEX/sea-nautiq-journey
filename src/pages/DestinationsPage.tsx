import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useSEO } from "@/hooks/useSEO";
import { Compass, MapPinned, Ship, Sparkles } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDestinations, type Destination } from "@/lib/destinations";

const DestinationsPage = () => {
  useSEO({
    title: "Greek Island Boating Destinations | Nautiq",
    description: "Explore the best Greek island destinations for boat rentals — Mykonos, Santorini, Thassos, Halkidiki and more. Find your perfect sea escape.",
    canonical: "https://nautiq.gr/destinations",
    keywords: "Greek island boat destinations, Mykonos boating, Santorini sailing, Thassos boat trip, Halkidiki boat rental",
  });

  const [destinations, setDestinations] = useState<Destination[]>([]);

  useEffect(() => {
    let cancelled = false;

    const loadDestinations = async () => {
      const nextDestinations = await getDestinations();
      if (!cancelled) {
        setDestinations(nextDestinations);
      }
    };

    loadDestinations();

    return () => {
      cancelled = true;
    };
  }, []);

  const totalBoats = useMemo(
    () => destinations.reduce((sum, destination) => sum + destination.boats, 0),
    [destinations],
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-16">
        <section className="border-b border-border bg-gradient-ocean py-16 md:py-20">
          <div className="container mx-auto px-4">
            <p className="text-primary-foreground/80 text-sm mb-3">Destination guide</p>
            <h1 className="text-3xl md:text-5xl font-heading font-bold text-primary-foreground mb-4">
              Discover Greek islands made for boating
            </h1>
            <p className="text-primary-foreground/70 max-w-2xl">
              Compare top islands, trip styles, and available fleets before you book.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-8">
              <Card className="bg-primary-foreground/10 border-primary-foreground/15 text-primary-foreground">
                <CardContent className="pt-6 flex items-center gap-3">
                  <Ship className="h-5 w-5" />
                  <div>
                    <p className="text-2xl font-heading font-bold">{totalBoats}</p>
                    <p className="text-sm text-primary-foreground/80">Boats listed</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-primary-foreground/10 border-primary-foreground/15 text-primary-foreground">
                <CardContent className="pt-6 flex items-center gap-3">
                  <MapPinned className="h-5 w-5" />
                  <div>
                    <p className="text-2xl font-heading font-bold">{destinations.length}</p>
                    <p className="text-sm text-primary-foreground/80">Popular islands</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-primary-foreground/10 border-primary-foreground/15 text-primary-foreground">
                <CardContent className="pt-6 flex items-center gap-3">
                  <Sparkles className="h-5 w-5" />
                  <div>
                    <p className="text-2xl font-heading font-bold">4.8</p>
                    <p className="text-sm text-primary-foreground/80">Average ratings</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-10 md:py-12">
          <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-6">
            {destinations.map((destination) => (
              <Card key={destination.id} id={destination.slug} className="overflow-hidden shadow-card-hover scroll-mt-24">
                <div className="aspect-[16/9] overflow-hidden">
                  <img src={destination.image} alt={destination.name} className="w-full h-full object-cover" />
                </div>
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle>{destination.name}</CardTitle>
                    <Badge className="bg-gradient-accent text-accent-foreground">{destination.boats} boats</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">{destination.description}</p>
                  <p className="text-sm text-foreground">
                    <span className="text-muted-foreground">Best for: </span>
                    {destination.bestFor}
                  </p>
                  <Button asChild className="w-full bg-gradient-accent text-accent-foreground">
                    <Link to={`/boats?location=${encodeURIComponent(destination.name)}`}>
                      Explore boats in {destination.name}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="pb-12 md:pb-16">
          <div className="container mx-auto px-4">
            <Card>
              <CardContent className="pt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <p className="font-semibold text-foreground">Need help choosing an island?</p>
                  <p className="text-sm text-muted-foreground">Start with your group size and preferred vibe, then filter boats in one click.</p>
                </div>
                <Button asChild variant="outline" className="gap-2">
                  <Link to="/boats">
                    <Compass className="h-4 w-4" />
                    Browse all boats
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default DestinationsPage;
