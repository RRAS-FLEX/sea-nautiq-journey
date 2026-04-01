import { useEffect, useMemo, useState } from "react";
import { useSEO } from "@/hooks/useSEO";
import { Link, useSearchParams } from "react-router-dom";
import { Anchor, Filter, LayoutGrid, MapPin, Rows3, Sparkles, Users } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BoatCard from "@/components/BoatCard";
import { BoatsGridSkeleton } from "@/components/loading/LoadingUI";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { getBoats } from "@/lib/boats";
import type { Boat } from "@/lib/boats";
import { sortBoatsByBookingsFirst } from "@/lib/boat-ranking";
import { getBoatReviewStatsMap } from "@/lib/reviews";
import { toOwnerSlug } from "@/lib/owners";
import { useLanguage } from "@/contexts/LanguageContext";
import { withRetry } from "@/lib/retry";

const featuredCollections = [
  { title: "Family Friendly", subtitle: "8+ guests", location: "", minCapacity: "8", boatType: "any", minRating: "any" },
  { title: "Luxury Escapes", subtitle: "Premium fleet", location: "", minCapacity: "any", boatType: "Luxury Yacht", minRating: "4.8" },
  { title: "Thassos Picks", subtitle: "Popular nearby", location: "Thassos", minCapacity: "any", boatType: "any", minRating: "any" },
];

const popularLocations = ["Thassos", "Halkidiki", "Mykonos", "Santorini"];

const Boats = () => {
  const { tl } = useLanguage();
  const [searchParams] = useSearchParams();
  const [locationQuery, setLocationQuery] = useState(searchParams.get("location") ?? "");
  const [ownerQuery, setOwnerQuery] = useState(searchParams.get("owner") ?? "");

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
  const [boatsError, setBoatsError] = useState("");
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");

  useEffect(() => {
    const locationFromQuery = searchParams.get("location") ?? "";
    const ownerFromQuery = searchParams.get("owner") ?? "";
    setLocationQuery(locationFromQuery);
    setOwnerQuery(ownerFromQuery);
  }, [searchParams]);

  const loadBoats = async () => {
    try {
      setIsBoatsLoading(true);
      setBoatsError("");
      const data = await withRetry(() => getBoats(), { retries: 2, initialDelayMs: 200 });
      setAllBoats(data);
    } catch (error) {
      setBoatsError(error instanceof Error ? error.message : "Unable to load boats right now.");
    } finally {
      setIsBoatsLoading(false);
    }
  };

  useEffect(() => {
    loadBoats();
  }, []);

  const filteredBoats = useMemo(() => {
    const normalizedLocation = locationQuery.trim().toLowerCase();
    const normalizedOwner = ownerQuery.trim().toLowerCase();

    const visibleBoats = allBoats.filter((boat) => {
      const matchesLocation = normalizedLocation
        ? boat.location.toLowerCase().includes(normalizedLocation)
        : true;

      const ownerSlug = toOwnerSlug(boat.owner.name).toLowerCase();
      const normalizedOwnerSlug = toOwnerSlug(normalizedOwner).toLowerCase();
      const matchesOwner = normalizedOwner
        ? boat.owner.name.toLowerCase().includes(normalizedOwner) || ownerSlug === normalizedOwnerSlug
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

      return matchesLocation && matchesOwner && matchesCapacity && matchesPrice && matchesLength && matchesBoatType && matchesRating;
    });

    if (priceSort === "price-low") {
      return [...visibleBoats].sort((a, b) => a.pricePerDay - b.pricePerDay);
    }

    if (priceSort === "price-high") {
      return [...visibleBoats].sort((a, b) => b.pricePerDay - a.pricePerDay);
    }

    return sortBoatsByBookingsFirst(visibleBoats);
  }, [allBoats, locationQuery, ownerQuery, minCapacity, maxPrice, minLength, priceSort, boatType, minRating]);
  const filteredBoatIdsKey = filteredBoats.map((boat) => boat.id).join("|");

  const activeFiltersCount = [
    locationQuery.trim() ? 1 : 0,
    ownerQuery.trim() ? 1 : 0,
    minCapacity !== "any" ? 1 : 0,
    maxPrice !== "any" ? 1 : 0,
    minLength !== "any" ? 1 : 0,
    boatType !== "any" ? 1 : 0,
    minRating !== "any" ? 1 : 0,
  ].reduce((total, value) => total + value, 0);

  const resetFilters = () => {
    setLocationQuery("");
    setOwnerQuery("");
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
        const statsMap = await getBoatReviewStatsMap(filteredBoats.map((boat) => boat.id));
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
  }, [filteredBoatIdsKey]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-16">
        <section className="border-b border-border bg-gradient-ocean py-12 md:py-20">
          <div className="container mx-auto px-4">
            <p className="text-primary-foreground/80 text-sm mb-3">Explore our fleet</p>
            <h1 className="text-3xl md:text-5xl font-heading font-bold text-primary-foreground mb-4">
              {tl("Find the right boat for your next sea trip", "Βρες το κατάλληλο σκάφος για την επόμενη θαλάσσια εκδρομή σου")}
            </h1>
            <p className="text-primary-foreground/70 max-w-2xl">
              {tl("Compare verified boats by island, capacity, and price to book faster.", "Σύγκρινε επαληθευμένα σκάφη ανά νησί, χωρητικότητα και τιμή για πιο γρήγορη κράτηση.")}
            </p>

            <div className="mt-6 md:mt-8 -mx-1 px-1 overflow-x-auto pb-2">
              <div className="flex gap-3 min-w-max md:min-w-0 md:grid md:grid-cols-2 xl:grid-cols-3 md:gap-3">
              {featuredCollections.map((collection) => (
                <button
                  key={collection.title}
                  onClick={() => applyCollection(collection)}
                  className="w-[220px] md:w-auto text-left rounded-xl border border-primary-foreground/20 bg-primary-foreground/10 hover:bg-primary-foreground/20 transition-colors p-4"
                >
                  <p className="text-primary-foreground font-semibold">{collection.title}</p>
                  <p className="text-primary-foreground/70 text-sm">{collection.subtitle}</p>
                </button>
              ))}
              </div>
            </div>
          </div>
        </section>

        <section className="py-8 md:py-12">
          <div className="container mx-auto px-4 space-y-6 md:space-y-8">
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <p className="text-sm text-muted-foreground order-2 sm:order-1">
                  {filteredBoats.length} {tl("boats near you", "σκάφη κοντά σου")}
                </p>
                {activeFiltersCount > 0 ? (
                  <p className="text-xs text-aegean order-1 sm:order-2">
                    {activeFiltersCount} {tl("active filters", "ενεργά φίλτρα")}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <Dialog open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="gap-2 w-full sm:w-auto">
                      <Filter className="h-4 w-4 text-aegean" />
                      {tl("Filters", "Φίλτρα")}
                      {activeFiltersCount > 0 ? `(${activeFiltersCount})` : ""}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
                      <span className="flex items-center gap-2"><Filter className="h-5 w-5 text-aegean" />{tl("Filter Boats", "Φίλτρα Σκαφών")}</span>
                      <span className="text-sm font-normal text-muted-foreground">{filteredBoats.length} {tl("results", "αποτελέσματα")}</span>
                    </DialogTitle>
                  </DialogHeader>

                  <div className="space-y-4">
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">{tl("Location", "Τοποθεσία")}</p>
                        <Input
                          value={locationQuery}
                          onChange={(event) => setLocationQuery(event.target.value)}
                          placeholder="Thassos, Mykonos, Santorini..."
                        />
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">{tl("Minimum Capacity", "Ελάχιστη Χωρητικότητα")}</p>
                        <Select value={minCapacity} onValueChange={setMinCapacity}>
                          <SelectTrigger><SelectValue placeholder="Any size" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="any">Any size</SelectItem>
                            <SelectItem value="4">4+ guests</SelectItem>
                            <SelectItem value="8">8+ guests</SelectItem>
                            <SelectItem value="12">12+ guests</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">{tl("Maximum Price", "Μέγιστη Τιμή")}</p>
                        <Select value={maxPrice} onValueChange={setMaxPrice}>
                          <SelectTrigger><SelectValue placeholder="Any price" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="any">Any price</SelectItem>
                            <SelectItem value="500">Up to €500/day</SelectItem>
                            <SelectItem value="1000">Up to €1,000/day</SelectItem>
                            <SelectItem value="1500">Up to €1,500/day</SelectItem>
                            <SelectItem value="2000">Up to €2,000+/day</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">{tl("Minimum Length", "Ελάχιστο Μήκος")}</p>
                        <Select value={minLength} onValueChange={setMinLength}>
                          <SelectTrigger><SelectValue placeholder="Any length" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="any">Any length</SelectItem>
                            <SelectItem value="30">30+ meters</SelectItem>
                            <SelectItem value="40">40+ meters</SelectItem>
                            <SelectItem value="50">50+ meters</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">{tl("Boat Type", "Τύπος Σκάφους")}</p>
                        <Select value={boatType} onValueChange={setBoatType}>
                          <SelectTrigger><SelectValue placeholder="Any type" /></SelectTrigger>
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
                        <p className="text-sm text-muted-foreground">{tl("Minimum Rating", "Ελάχιστη Βαθμολογία")}</p>
                        <Select value={minRating} onValueChange={setMinRating}>
                          <SelectTrigger><SelectValue placeholder="Any rating" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="any">Any rating</SelectItem>
                            <SelectItem value="4.5">4.5+</SelectItem>
                            <SelectItem value="4.8">4.8+</SelectItem>
                            <SelectItem value="4.9">4.9+</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <p className="text-sm text-muted-foreground">{tl("Sort", "Ταξινόμηση")}</p>
                        <Select
                          value={priceSort}
                          onValueChange={(value) => setPriceSort(value as "recommended" | "price-low" | "price-high")}
                        >
                          <SelectTrigger><SelectValue placeholder="Recommended" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="recommended">Recommended</SelectItem>
                            <SelectItem value="price-low">Price: Low to high</SelectItem>
                            <SelectItem value="price-high">Price: High to low</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 pt-1">
                      <p className="text-sm text-muted-foreground">
                        {activeFiltersCount > 0 ? `${activeFiltersCount} filters active` : "No active filters"}
                      </p>
                      <Button variant="ghost" onClick={resetFilters} className="text-aegean hover:text-turquoise">
                        {tl("Reset all filters", "Επαναφορά όλων")}
                      </Button>
                    </div>
                  </div>
                  </DialogContent>
                </Dialog>

                <div className="grid grid-cols-2 sm:flex items-center gap-1 rounded-lg border border-border p-1 w-full sm:w-auto">
                  <Button
                    size="sm"
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    className="gap-1.5 justify-center"
                    onClick={() => setViewMode("grid")}
                    aria-label={tl("Two-column view", "Προβολή δύο στηλών")}
                  >
                    <LayoutGrid className="h-4 w-4" />
                    <span className="text-xs sm:text-sm">{tl("Grid", "Πλέγμα")}</span>
                  </Button>
                  <Button
                    size="sm"
                    variant={viewMode === "list" ? "default" : "ghost"}
                    className="gap-1.5 justify-center"
                    onClick={() => setViewMode("list")}
                    aria-label={tl("Single-column view", "Προβολή μίας στήλης")}
                  >
                    <Rows3 className="h-4 w-4" />
                    <span className="text-xs sm:text-sm">{tl("List", "Λίστα")}</span>
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5 rounded-2xl border border-border bg-card px-4 py-3"><Anchor className="h-4 w-4 text-aegean" />{filteredBoats.length} {tl("boats available", "διαθέσιμα σκάφη")}</span>
              <span className="flex items-center gap-1.5 rounded-2xl border border-border bg-card px-4 py-3"><MapPin className="h-4 w-4 text-aegean" />{tl("Greek islands", "Ελληνικά νησιά")}</span>
              <span className="flex items-center gap-1.5 rounded-2xl border border-border bg-card px-4 py-3"><Users className="h-4 w-4 text-aegean" />{tl("Group sizes from 4 to 20", "Ομάδες από 4 έως 20 άτομα")}</span>
              <span className="flex items-center gap-1.5 rounded-2xl border border-border bg-card px-4 py-3"><Sparkles className="h-4 w-4 text-aegean" />{tl("Verified and highly rated hosts", "Επαληθευμένοι και υψηλά αξιολογημένοι οικοδεσπότες")}</span>
            </div>

            <div className="flex justify-stretch sm:justify-end">
              <Link
                to={`/boats-map${locationQuery.trim() ? `?location=${encodeURIComponent(locationQuery.trim())}` : ""}`}
                className="w-full sm:w-auto text-center rounded-full border border-aegean/20 bg-aegean/5 px-4 py-2 text-sm font-medium text-aegean hover:text-turquoise"
              >
                {tl("Open map view →", "Άνοιγμα προβολής χάρτη →")}
              </Link>
            </div>

            {isBoatsLoading ? (
              <BoatsGridSkeleton count={6} />
            ) : boatsError ? (
              <Card>
                <CardContent className="py-10 text-center space-y-3">
                  <p className="text-lg font-semibold text-foreground">{tl("Could not load boats", "Δεν ήταν δυνατή η φόρτωση σκαφών")}</p>
                  <p className="text-sm text-muted-foreground">{boatsError}</p>
                  <Button variant="outline" onClick={loadBoats}>{tl("Try again", "Δοκίμασε ξανά")}</Button>
                </CardContent>
              </Card>
            ) : filteredBoats.length > 0 ? (
              <div className={`grid gap-5 md:gap-6 ${
                viewMode === "grid"
                  ? "grid-cols-2 md:grid-cols-2 xl:grid-cols-3"
                  : "grid-cols-1 md:grid-cols-2"
              }`}>
                {filteredBoats.map((boat, index) => (
                  <div key={boat.name} className="space-y-2">
                    <BoatCard {...boat} index={index} reviewCount={reviewCounts[boat.id] ?? 0} />
                    {boat.owner.name && (
                      <Link
                        to={`/owners/${toOwnerSlug(boat.owner.name)}`}
                        className="text-xs text-aegean hover:text-turquoise font-medium"
                      >
                        View {boat.owner.name}'s fleet →
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-10 text-center space-y-2">
                  <p className="text-lg font-semibold text-foreground">{tl("No boats found", "Δεν βρέθηκαν σκάφη")}</p>
                  <p className="text-sm text-muted-foreground">{tl("Try a different location or lower minimum capacity.", "Δοκίμασε άλλη τοποθεσία ή χαμηλότερη ελάχιστη χωρητικότητα.")}</p>
                </CardContent>
              </Card>
            )}

            <div className="text-center pt-2">
              <Link to="/owner-profile" className="text-aegean hover:text-turquoise transition-colors font-medium">
                {tl("Are you a boat owner? View owner profile →", "Είσαι ιδιοκτήτης σκάφους; Δες το προφίλ ιδιοκτήτη →")}
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
