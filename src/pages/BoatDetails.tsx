import { useEffect, useRef, useState } from "react";
import { useSEO } from "@/hooks/useSEO";
import { useStructuredData } from "@/hooks/useStructuredData";
import { Link, useParams } from "react-router-dom";
import { format, isSameDay, parseISO } from "date-fns";
import { CalendarDays, Check, Gauge, MapPin, MessageCircle, Navigation, ShieldCheck, Star, Users } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buildBoatPublicSlug, getBoatByPublicReference } from "@/lib/boats";
import type { Boat } from "@/lib/boats";
import { getBoatReviews, getBoatReviewStats } from "@/lib/reviews";
import { trackBoatViewed, trackBookingStarted } from "@/lib/analytics";
import { toOwnerSlug } from "@/lib/owners";
import { useLanguage } from "@/contexts/LanguageContext";

const BoatDetails = () => {
  const { tl } = useLanguage();
  const { boatRef } = useParams<{ boatRef: string }>();
  const [boat, setBoat] = useState<Boat | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const bookingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!boatRef) return;
    setBoat(null);
    setSelectedImage(0);
    getBoatByPublicReference(boatRef).then(setBoat);
  }, [boatRef]);

  const unavailableDates = boat?.availability.unavailableDates.map((date) => parseISO(date)) ?? [];
  const nextAvailableDate = Array.from({ length: 21 }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + index);
    return date;
  }).find((date) => !unavailableDates.some((blockedDate) => isSameDay(blockedDate, date)));
  const mapQuery = boat ? encodeURIComponent(boat.mapQuery) : "";
  const googleMapsUrl = boat ? `https://www.google.com/maps/search/?api=1&query=${mapQuery}` : "/boats";
  const googleDirectionsUrl = boat ? `https://www.google.com/maps/dir/?api=1&destination=${mapQuery}` : "/boats";
  const mapEmbedUrl = boat ? `https://www.google.com/maps?q=${mapQuery}&z=13&output=embed` : "";
  const [boatReviews, setBoatReviews] = useState<any[]>([]);
  const [reviewStats, setReviewStats] = useState({ total: 0, averageRating: 0 });
  const publicBoatRef = boat ? boat.publicSlug || buildBoatPublicSlug(boat) : "";
  const publicBoatUrl = boat ? `https://nautiq.gr/boats/${publicBoatRef}` : undefined;

  useEffect(() => {
    if (!boat?.id) {
      setBoatReviews([]);
      setReviewStats({ total: 0, averageRating: 0 });
      return;
    }

    const loadReviews = async () => {
      const [nextReviews, nextStats] = await Promise.all([
        getBoatReviews(boat.id),
        getBoatReviewStats(boat.id),
      ]);
      setBoatReviews(nextReviews.slice(0, 4));
      setReviewStats(nextStats);
    };

    loadReviews();
  }, [boat?.id]);
  const boatStructuredData = boat
    ? {
      "@context": "https://schema.org",
      "@type": "Product",
      name: boat.name,
      image: boat.images.length > 0 ? boat.images : [boat.image],
      description: boat.description,
      brand: {
        "@type": "Brand",
        name: "Nautiq",
      },
      category: `${boat.type} Boat Rental`,
      sku: boat.id,
      url: publicBoatUrl,
      areaServed: {
        "@type": "Place",
        name: `${boat.location}, Greece`,
      },
      offers: {
        "@type": "Offer",
        priceCurrency: "EUR",
        price: boat.pricePerDay,
        availability: nextAvailableDate ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        url: publicBoatUrl,
      },
      aggregateRating: reviewStats.total
        ? {
          "@type": "AggregateRating",
          ratingValue: reviewStats.averageRating,
          reviewCount: reviewStats.total,
        }
        : undefined,
      review: boatReviews.map((review) => ({
        "@type": "Review",
        author: {
          "@type": "Person",
          name: review.customerName,
        },
        reviewBody: review.comment,
        name: review.title,
        reviewRating: {
          "@type": "Rating",
          ratingValue: review.rating,
          bestRating: 5,
          worstRating: 1,
        },
      })),
    }
    : null;

  useStructuredData(`boat-schema-${boat?.id ?? "unknown"}`, boatStructuredData);

  useSEO({
    title: boat
      ? `${boat.name} — ${boat.type} in ${boat.location} | Nautiq`
      : "Boat Details | Nautiq",
    description: boat
      ? `Rent the ${boat.name}, a ${boat.type} in ${boat.location} for €${boat.pricePerDay}/day. Capacity: ${boat.capacity} guests. ${boat.description?.slice(0, 100) ?? "Verified by Nautiq."}`.trim()
      : "View boat details, availability and book instantly on Nautiq.",
    canonical: publicBoatUrl,
    ogImage: boat?.image,
    ogType: "article",
    keywords: boat ? `${boat.name}, ${boat.type} rental ${boat.location}, boat hire ${boat.location} Greece` : undefined,
  });

  useEffect(() => {
    if (!boat) {
      return;
    }

    trackBoatViewed({
      id: boat.id,
      name: boat.name,
      type: boat.type,
      location: boat.location,
      pricePerDay: boat.pricePerDay,
    });
  }, [boat]);

  const scrollToBooking = () => {
    bookingRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  if (!boat) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 pb-20">
          <div className="container mx-auto px-4 text-center space-y-4">
            <h1 className="text-3xl font-heading font-bold text-foreground">{tl("Boat not found", "Το σκάφος δεν βρέθηκε")}</h1>
            <p className="text-muted-foreground">{tl("This boat may have been removed or the link is incorrect.", "Αυτό το σκάφος μπορεί να έχει αφαιρεθεί ή ο σύνδεσμος να είναι λανθασμένος.")}</p>
            <Link to="/boats" className="text-aegean hover:text-turquoise font-medium">{tl("Back to boats →", "Επιστροφή στα σκάφη →")}</Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Mobile Book Now Button */}
      <button
        onClick={scrollToBooking}
        className="fixed bottom-4 left-4 right-4 md:hidden z-40 py-3 px-4 bg-gradient-accent text-accent-foreground font-semibold rounded-xl shadow-lg hover:opacity-90 transition-opacity"
      >
        {tl("Book Now", "Κράτηση τώρα")}
      </button>

      <main className="pt-16 pb-20 md:pb-0">
        <section className="py-8 md:py-10 border-b border-border">
          <div className="container mx-auto px-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">{tl("Boat details", "Λεπτομέρειες σκάφους")}</p>
              <h1 className="text-3xl md:text-4xl font-heading font-bold text-foreground">{boat.name}</h1>
            </div>
            <Link to="/boats" className="text-sm font-medium text-aegean hover:text-turquoise">← {tl("Back to all boats", "Επιστροφή σε όλα τα σκάφη")}</Link>
          </div>
        </section>

        <section className="py-10 md:py-12">
          <div className="container mx-auto px-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 overflow-hidden shadow-card-hover">
              <div className="aspect-[16/9] overflow-hidden">
                <img src={boat.images[selectedImage] ?? boat.image} alt={boat.name} className="w-full h-full object-cover" />
              </div>
              <CardContent className="pt-6 space-y-6">
                {boat.images.length > 1 ? (
                  <div className="grid grid-cols-4 gap-3 md:grid-cols-5">
                    {boat.images.map((imageUrl, index) => (
                      <button
                        key={`${boat.id}-image-${index}`}
                        type="button"
                        onClick={() => setSelectedImage(index)}
                        className={`overflow-hidden rounded-2xl border ${selectedImage === index ? "border-aegean" : "border-border"}`}
                      >
                        <img src={imageUrl} alt={`${boat.name} view ${index + 1}`} className="h-20 w-full object-cover" />
                      </button>
                    ))}
                  </div>
                ) : null}

                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="bg-gradient-accent text-accent-foreground">{boat.type}</Badge>
                  <Badge variant="outline" className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{boat.location}</Badge>
                  <Badge variant="outline" className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{boat.capacity} {tl("guests", "επισκέπτες")}</Badge>
                  <Badge variant="outline" className="flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />{boat.rating}</Badge>
                  {boat.skipperRequired ? <Badge variant="outline">{tl("Skipper required", "Απαιτείται skipper")}</Badge> : null}
                </div>

                <div className="rounded-3xl border border-border bg-muted/20 p-5 space-y-4">
                  <h2 className="font-heading font-semibold text-lg text-foreground">{tl("Overview", "Επισκόπηση")}</h2>
                  <p className="text-muted-foreground leading-relaxed">{boat.description}</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="rounded-2xl border border-border bg-background p-4">
                      <p className="text-xs text-muted-foreground">Length</p>
                      <p className="font-semibold text-foreground">{boat.lengthMeters} m</p>
                    </div>
                    <div className="rounded-2xl border border-border bg-background p-4">
                      <p className="text-xs text-muted-foreground">Built</p>
                      <p className="font-semibold text-foreground">{boat.year}</p>
                    </div>
                    <div className="rounded-2xl border border-border bg-background p-4">
                      <p className="text-xs text-muted-foreground">Cruising speed</p>
                      <p className="font-semibold text-foreground flex items-center gap-1"><Gauge className="h-4 w-4 text-aegean" />{boat.cruisingSpeedKnots} kn</p>
                    </div>
                    <div className="rounded-2xl border border-border bg-background p-4">
                      <p className="text-xs text-muted-foreground">Fuel burn</p>
                      <p className="font-semibold text-foreground">{boat.fuelBurnLitresPerHour} L/h</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h2 className="font-heading font-semibold text-lg">{tl("Included amenities", "Παροχές που περιλαμβάνονται")}</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {boat.amenities.map((amenity) => (
                      <div key={amenity} className="text-sm text-foreground flex items-center gap-2">
                        <Check className="h-4 w-4 text-aegean" />
                        {amenity}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-border p-4">
                    <p className="text-sm text-muted-foreground">{tl("Departure marina", "Μαρίνα αναχώρησης")}</p>
                    <p className="font-medium text-foreground">{boat.departureMarina}</p>
                    <p className="text-xs text-muted-foreground mt-1">{boat.responseTime}</p>
                  </div>
                  <div className="rounded-2xl border border-border p-4">
                    <p className="text-sm text-muted-foreground flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-aegean" />{tl("Booking policy", "Πολιτική κράτησης")}</p>
                    <p className="font-medium text-foreground">{boat.cancellationPolicy}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  <div className="rounded-3xl border border-border bg-muted/20 p-5 space-y-4">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-14 w-14 border border-border">
                        <AvatarFallback className="bg-aegean/10 text-aegean font-semibold">
                          {boat.owner.name
                            .split(" ")
                            .map((part) => part[0])
                            .join("")
                            .slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="font-heading text-lg font-semibold text-foreground">{tl("Hosted by", "Οικοδεσπότης")} {boat.owner.name}</h2>
                          {boat.owner.isSuperhost ? <Badge className="bg-aegean text-primary-foreground">{tl("Guest favorite", "Αγαπημένο των επισκεπτών")}</Badge> : null}
                        </div>
                        <p className="text-sm text-muted-foreground">{boat.owner.title} since {boat.owner.joinedYear}</p>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground">{boat.owner.bio}</p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                      <div className="rounded-2xl border border-border bg-background p-3">
                        <p className="text-muted-foreground text-xs">Trips</p>
                        <p className="font-semibold text-foreground">{boat.owner.tripsHosted}</p>
                      </div>
                      <div className="rounded-2xl border border-border bg-background p-3">
                        <p className="text-muted-foreground text-xs">Response rate</p>
                        <p className="font-semibold text-foreground">{boat.owner.responseRate}%</p>
                      </div>
                      <div className="rounded-2xl border border-border bg-background p-3">
                        <p className="text-muted-foreground text-xs">Languages</p>
                        <p className="font-semibold text-foreground">{boat.owner.languages.length}</p>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground">Speaks {boat.owner.languages.join(", ")}.</p>
                    <Button asChild variant="outline" className="w-full">
                      <Link to={`/owners/${toOwnerSlug(boat.owner.name)}`}>View all boats by this owner</Link>
                    </Button>
                  </div>

                  <div className="rounded-3xl border border-border bg-muted/20 p-5 space-y-4">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-5 w-5 text-aegean" />
                      <h2 className="font-heading text-lg font-semibold text-foreground">{tl("Availability check", "Έλεγχος διαθεσιμότητας")}</h2>
                    </div>
                    <Calendar
                      mode="single"
                      selected={nextAvailableDate}
                      disabled={unavailableDates}
                      className="rounded-2xl border border-border bg-background"
                    />
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      {unavailableDates.slice(0, 4).map((date) => (
                        <Badge key={date.toISOString()} variant="outline">
                          Booked {format(date, "d MMM")}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {tl("Next open day:", "Επόμενη διαθέσιμη ημέρα:")} <span className="font-medium text-foreground">{nextAvailableDate ? format(nextAvailableDate, "EEEE, d MMM") : tl("Check with owner", "Επικοινώνησε με τον ιδιοκτήτη")}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">Minimum notice: {boat.availability.minNoticeHours} hours before departure.</p>
                  </div>
                </div>

                <div className="rounded-3xl border border-border overflow-hidden bg-card">
                  <div className="grid grid-cols-1 xl:grid-cols-[1.15fr_0.85fr]">
                    <div className="min-h-[280px] border-b xl:border-b-0 xl:border-r border-border">
                      <iframe
                        title={`Map for ${boat.name}`}
                        src={mapEmbedUrl}
                        className="h-full min-h-[280px] w-full"
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                      />
                    </div>
                    <div className="p-5 space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground">{tl("Pickup point", "Σημείο παραλαβής")}</p>
                        <h2 className="font-heading text-lg font-semibold text-foreground">{boat.departureMarina}</h2>
                        <p className="text-sm text-muted-foreground mt-1">{boat.location}, Greece</p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Open the exact marina in Google Maps or start navigation before leaving for the harbor.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Button asChild className="bg-gradient-accent text-accent-foreground">
                          <a href={googleDirectionsUrl} target="_blank" rel="noreferrer">
                            <Navigation className="mr-2 h-4 w-4" />
                            {tl("Navigate in Google Maps", "Πλοήγηση στο Google Maps")}
                          </a>
                        </Button>
                        <Button asChild variant="outline">
                          <a href={googleMapsUrl} target="_blank" rel="noreferrer">
                            <MapPin className="mr-2 h-4 w-4" />
                            {tl("Open marina map", "Άνοιγμα χάρτη μαρίνας")}
                          </a>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>


              </CardContent>
            </Card>

            <div className="flex flex-col gap-6">
              <Card className="shadow-card" ref={bookingRef}>
                <CardHeader>
                  <CardTitle>{tl("Booking summary", "Σύνοψη κράτησης")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{tl("Starting from", "Από")}</p>
                      <p className="text-3xl font-heading font-bold text-foreground">€{boat.pricePerDay}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">{tl("per day", "ανά ημέρα")}</p>
                  </div>
                  <Button asChild className="w-full bg-gradient-accent text-accent-foreground">
                    <Link
                      to={`/booking?boatRef=${encodeURIComponent(publicBoatRef)}&boat=${encodeURIComponent(boat.name)}`}
                      onClick={() => trackBookingStarted({ boatId: boat.id, boatName: boat.name, source: "boat_details" })}
                    >
                      {tl("Request Booking", "Αίτημα Κράτησης")}
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full">
                    <Link to={`/chat?boatRef=${encodeURIComponent(publicBoatRef)}&boat=${encodeURIComponent(boat.name)}`}>
                      <MessageCircle className="mr-2 h-4 w-4" />{tl("Chat with owner", "Συνομιλία με ιδιοκτήτη")}
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="shadow-card">
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <CardTitle>{tl("Guest reviews", "Αξιολογήσεις επισκεπτών")}</CardTitle>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      {reviewStats.averageRating ? reviewStats.averageRating.toFixed(1) : boat.rating} ({reviewStats.total})
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {boatReviews.length > 0 ? (
                    <div className="space-y-3">
                      {boatReviews.map((review) => (
                        <div key={review.id} className="rounded-2xl border border-border p-4">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-medium text-foreground">{review.title}</p>
                            <p className="text-xs text-muted-foreground">{review.customerName}</p>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1 break-words">{review.comment}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">{tl("No reviews yet for this boat.", "Δεν υπάρχουν ακόμη αξιολογήσεις για αυτό το σκάφος.")}</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default BoatDetails;
