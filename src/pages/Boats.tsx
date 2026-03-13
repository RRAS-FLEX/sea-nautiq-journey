import { useEffect, useMemo, useState } from "react";
import { useSEO } from "@/hooks/useSEO";
import { Link, useSearchParams } from "react-router-dom";
import { Anchor, Filter, MapPin, Sparkles, Users } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BoatCard from "@/components/BoatCard";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getBoats } from "@/lib/boats";
import type { Boat } from "@/lib/boats";
import { sortBoatsByPromotionScore } from "@/lib/boat-ranking";
import { getBoatReviewStats } from "@/lib/reviews";
import { toOwnerSlug } from "@/lib/owners";

const featuredCollections = [
  { title: "Family Friendly", subtitle: "8+ guests", location: "", minCapacity: "8", boatType: "any", minRating: "any" },
  { title: "Luxury Escapes", subtitle: "Premium fleet", location: "", minCapacity: "any", boatType: "Luxury Yacht", minRating: "4.8" },
  { title: "Thassos Picks", subtitle: "Popular nearby", location: "Thassos", minCapacity: "any", boatType: "any", minRating: "any" },
];

const popularLocations = ["Thassos", "Halkidiki", "Mykonos", "Santorini"];

const Boats = () => {
  const [searchParams] = useSearchParams();
  const [locationQuery, setLocationQuery] = useState(searchParams.get("location") ?? "");

  useSEO({
    title: "Browse Boats for Rent in Greece | Nautiq",
    description: "Browse hundreds of verified boats for rent across Greek islands. Filter by location, type, price and capacity. Instant booking — no licenses needed for most boats.",
    canonical: "https://nautiq.gr/boats",
    keywords: "boats for rent Greece, rent boat Mykonos, boat hire Santorini, motor yacht charter Greece, catamaran rental Greek islands",
  });
  const [minCapacity, setMinCapacity] = useState("any");
  const [maxPrice, setMaxPrice] = useState("any");
  const [minLength, setMinLength] = useState("any");
  const [priceSort, setPriceSort] = useState<"recommended" | "price-low" | "price-high">("recommended");
  const [boatType, setBoatType] = useState("any");
  const [minRating, setMinRating] = useState("any");
  const [reviewCounts, setReviewCounts] = useState<Record<string, number>>({});
  const [allBoats, setAllBoats] = useState<Boat[]>([]);
  const [isBoatsLoading, setIsBoatsLoading] = useState(true);

  useEffect(() => {
    const locationFromQuery = searchParams.get("location") ?? "";
    setLocationQuery(locationFromQuery);
  }, [searchParams]);

  useEffect(() => {
    getBoats()
      .then((data) => { setAllBoats(data); setIsBoatsLoading(false); })
      .catch(() => setIsBoatsLoading(false));
  }, []);

  const filteredBoats = useMemo(() => {
    const normalizedLocation = locationQuery.trim().toLowerCase();

    const visibleBoats = allBoats.filter((boat) => {
      const matchesLocation = normalizedLocation
        ? boat.location.toLowerCase().includes(normalizedLocation)
        : true;

      const matchesCapacity =
        minCapacity === "any" ? true : boat.capacity >= Number(minCapacity);

      const matchesPrice =
        maxPrice === "any" ? true : boat.pricePerDay <= Number(maxPrice);

      const matchesLength =
        minLength === "any" ? true : boat.lengthMeters >= Number(minLength);

      const matchesBoatType =
        boatType === "any" ? true : boat.type === boatType;

      const matchesRating =
        minRating === "any" ? true : boat.rating >= Number(minRating);

      return matchesLocation && matchesCapacity && matchesPrice && matchesLength && matchesBoatType && matchesRating;
    });

    if (priceSort === "price-low") {
      return [...visibleBoats].sort((a, b) => a.pricePerDay - b.pricePerDay);
    }

    if (priceSort === "price-high") {
      return [...visibleBoats].sort((a, b) => b.pricePerDay - a.pricePerDay);
    }

    return sortBoatsByPromotionScore(visibleBoats);
  }, [allBoats, locationQuery, minCapacity, maxPrice, minLength, priceSort, boatType, minRating]);
  const filteredBoatIdsKey = filteredBoats.map((boat) => boat.id).join("|");

  const activeFiltersCount = [
    locationQuery.trim() ? 1 : 0,
    minCapacity !== "any" ? 1 : 0,
    maxPrice !== "any" ? 1 : 0,
    minLength !== "any" ? 1 : 0,
    boatType !== "any" ? 1 : 0,
    minRating !== "any" ? 1 : 0,
  ].reduce((total, value) => total + value, 0);

  const resetFilters = () => {
    setLocationQuery("");
    setMinCapacity("any");
    setMaxPrice("any");
    setMinLength("any");
    setBoatType("any");
    setMinRating("any");
    setPriceSort("recommended");
  };

  const applyCollection = (collection: typeof featuredCollections[number]) => {
    setLocationQuery(collection.location);
    setMinCapacity(collection.minCapacity);
    setBoatType(collection.boatType);
    setMinRating(collection.minRating);
  };

  useEffect(() => {
    let isActive = true;

    const loadReviewCounts = async () => {
      try {
        const stats = await Promise.all(
          filteredBoats.map(async (boat) => [boat.id, (await getBoatReviewStats(boat.id)).total] as const),
        );
        if (isActive) {
          setReviewCounts(Object.fromEntries(stats));
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
  }, [filteredBoatIdsKey]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-16">
        <section className="border-b border-border bg-gradient-ocean py-16 md:py-20">
          <div className="container mx-auto px-4">
            <p className="text-primary-foreground/80 text-sm mb-3">Explore our fleet</p>
            <h1 className="text-4xl md:text-5xl font-heading font-bold text-primary-foreground mb-4">
              Find the right boat for your next sea trip
            </h1>
            <p className="text-primary-foreground/70 max-w-2xl">
              Compare verified boats by island, capacity, and price to book faster.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-8">
              {featuredCollections.map((collection) => (
                <button
                  key={collection.title}
                  onClick={() => applyCollection(collection)}
                  className="text-left rounded-xl border border-primary-foreground/20 bg-primary-foreground/10 hover:bg-primary-foreground/20 transition-colors p-4"
                >
                  <p className="text-primary-foreground font-semibold">{collection.title}</p>
                  <p className="text-primary-foreground/70 text-sm">{collection.subtitle}</p>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="py-10 md:py-12">
          <div className="container mx-auto px-4 space-y-8">
            <Card className="shadow-card">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Filter className="h-5 w-5 text-aegean" />
                  Filter Boats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {popularLocations.map((location) => (
                    <button
                      key={location}
                      onClick={() => setLocationQuery(location)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                        locationQuery.toLowerCase() === location.toLowerCase()
                          ? "bg-aegean text-primary-foreground border-aegean"
                          : "bg-background text-muted-foreground border-border hover:text-foreground"
                      }`}
                    >
                      {location}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Location</p>
                  <Input
                    value={locationQuery}
                    onChange={(event) => setLocationQuery(event.target.value)}
                    placeholder="Thassos, Mykonos, Santorini..."
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Minimum Capacity</p>
                  <Select value={minCapacity} onValueChange={setMinCapacity}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any size</SelectItem>
                      <SelectItem value="4">4+ guests</SelectItem>
                      <SelectItem value="8">8+ guests</SelectItem>
                      <SelectItem value="12">12+ guests</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Maximum Price</p>
                  <Select value={maxPrice} onValueChange={setMaxPrice}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any price" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any price</SelectItem>
                      <SelectItem value="500">Up to €500/day</SelectItem>
                      <SelectItem value="1000">Up to €1,000/day</SelectItem>
                      <SelectItem value="1500">Up to €1,500/day</SelectItem>
                      <SelectItem value="2000">Up to €2,000+/day</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Minimum Length</p>
                  <Select value={minLength} onValueChange={setMinLength}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any length" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any length</SelectItem>
                      <SelectItem value="30">30+ meters</SelectItem>
                      <SelectItem value="40">40+ meters</SelectItem>
                      <SelectItem value="50">50+ meters</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Boat Type</p>
                  <Select value={boatType} onValueChange={setBoatType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any type</SelectItem>
                      <SelectItem value="Motor Yacht">Motor Yacht</SelectItem>
                      <SelectItem value="Speed Boat">Speed Boat</SelectItem>
                      <SelectItem value="Catamaran">Catamaran</SelectItem>
                      <SelectItem value="Luxury Yacht">Luxury Yacht</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Minimum Rating</p>
                  <Select value={minRating} onValueChange={setMinRating}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any rating" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any rating</SelectItem>
                      <SelectItem value="4.5">4.5+</SelectItem>
                      <SelectItem value="4.8">4.8+</SelectItem>
                      <SelectItem value="4.9">4.9+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Sort</p>
                  <Select
                    value={priceSort}
                    onValueChange={(value) => setPriceSort(value as "recommended" | "price-low" | "price-high")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Recommended" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recommended">Recommended</SelectItem>
                      <SelectItem value="price-low">Price: Low to high</SelectItem>
                      <SelectItem value="price-high">Price: High to low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <p className="text-sm text-muted-foreground">
                    {activeFiltersCount > 0 ? `${activeFiltersCount} filters active` : "No active filters"}
                  </p>
                  <button onClick={resetFilters} className="text-sm text-aegean hover:text-turquoise transition-colors">
                    Reset all filters
                  </button>
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-wrap items-center gap-5 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><Anchor className="h-4 w-4 text-aegean" />{filteredBoats.length} boats available</span>
              <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-aegean" />Greek islands</span>
              <span className="flex items-center gap-1.5"><Users className="h-4 w-4 text-aegean" />Group sizes from 4 to 20</span>
              <span className="flex items-center gap-1.5"><Sparkles className="h-4 w-4 text-aegean" />Verified and highly rated hosts</span>
            </div>

            {filteredBoats.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBoats.map((boat, index) => (
                  <div key={boat.name} className="space-y-2">
                    <BoatCard {...boat} index={index} reviewCount={reviewCounts[boat.id] ?? 0} />
                    <Link
                      to={`/owners/${toOwnerSlug(boat.owner.name)}`}
                      className="text-xs text-aegean hover:text-turquoise font-medium"
                    >
                      View {boat.owner.name}'s fleet →
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-10 text-center space-y-2">
                  <p className="text-lg font-semibold text-foreground">No boats found</p>
                  <p className="text-sm text-muted-foreground">Try a different location or lower minimum capacity.</p>
                </CardContent>
              </Card>
            )}

            <div className="text-center pt-2">
              <Link to="/owner-profile" className="text-aegean hover:text-turquoise transition-colors font-medium">
                Are you a boat owner? View owner profile →
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Boats;
