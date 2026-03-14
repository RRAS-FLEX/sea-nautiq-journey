import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, CheckCircle2, Clock3, MessageSquareText } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { buildBoatDetailsPath, buildBoatPublicSlug, getBoats } from "@/lib/boats";
import type { Boat } from "@/lib/boats";
import {
  getCustomerBookingHistory,
  getOwnerSalesHistory,
  type CustomerHistoryItem,
  type OwnerSalesHistoryItem,
} from "@/lib/history";
import { useLanguage } from "@/contexts/LanguageContext";

const isReviewEligible = (booking: CustomerHistoryItem) => {
  const tripDate = new Date(booking.startDate);
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  return booking.status !== "cancelled" && tripDate.getTime() <= today.getTime() && !booking.hasReview;
};

const History = () => {
  const { tl } = useLanguage();
  const { user, isLoading } = useCurrentUser();
  const [customerHistory, setCustomerHistory] = useState<CustomerHistoryItem[]>([]);
  const [salesHistory, setSalesHistory] = useState<OwnerSalesHistoryItem[]>([]);
  const [boats, setBoats] = useState<Boat[]>([]);
  const [historyError, setHistoryError] = useState("");

  useEffect(() => {
    getBoats().then(setBoats).catch(() => setBoats([]));
  }, []);

  useEffect(() => {
    if (!user?.id) {
      setCustomerHistory([]);
      setSalesHistory([]);
      setHistoryError("");
      return;
    }

    let cancelled = false;

    const loadHistory = async () => {
      try {
        setHistoryError("");
        const [nextCustomerHistory, nextSalesHistory] = await Promise.all([
          getCustomerBookingHistory(),
          user.isOwner ? getOwnerSalesHistory() : Promise.resolve([]),
        ]);

        if (!cancelled) {
          setCustomerHistory(nextCustomerHistory);
          setSalesHistory(nextSalesHistory);
        }
      } catch (error) {
        if (!cancelled) {
          setHistoryError(error instanceof Error ? error.message : tl("Unable to load history", "Αδυναμία φόρτωσης ιστορικού"));
        }
      }
    };

    loadHistory();

    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.isOwner, tl]);

  const reviewableTrips = useMemo(() => customerHistory.filter(isReviewEligible).length, [customerHistory]);
  const completedSales = useMemo(() => salesHistory.filter((entry) => entry.status === "completed"), [salesHistory]);
  const totalSalesRevenue = useMemo(
    () => completedSales.reduce((sum, entry) => sum + Number(entry.totalPrice || 0), 0),
    [completedSales],
  );
  const pendingSales = useMemo(
    () => salesHistory.filter((entry) => entry.status === "pending" || entry.status === "confirmed").length,
    [salesHistory],
  );
  const getBoatById = (boatId: string) => boats.find((entry) => entry.id === boatId);
  const getBoatPath = (boatId: string) => {
    const matchingBoat = getBoatById(boatId);
    return matchingBoat ? buildBoatDetailsPath(matchingBoat) : "/boats";
  };
  const getBoatReference = (boatId: string) => {
    const matchingBoat = getBoatById(boatId);
    return matchingBoat ? matchingBoat.publicSlug || buildBoatPublicSlug(matchingBoat) : boatId;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-16">
        <section className="py-12 border-b border-border bg-muted/30">
          <div className="container mx-auto px-4">
            <p className="text-sm text-muted-foreground">Trip history</p>
            <h1 className="mt-2 text-4xl font-heading font-bold text-foreground">{tl("Bookings and reviews", "Κρατήσεις και αξιολογήσεις")}</h1>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              {tl("Review requests appear here once the trip date has passed, which is the cleanest point in the workflow to ask for a customer rating.", "Τα αιτήματα αξιολόγησης εμφανίζονται εδώ αφού περάσει η ημερομηνία εκδρομής, που είναι το κατάλληλο σημείο στη ροή για να ζητηθεί βαθμολογία πελάτη.")}
            </p>

            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Card className="shadow-card">
                <CardContent className="pt-6">
                  <div className="mb-3 flex items-center justify-between">
                    <CalendarDays className="h-5 w-5 text-aegean" />
                    <Badge variant="outline">Trips</Badge>
                  </div>
                  <p className="text-2xl font-heading font-bold text-foreground">{customerHistory.length}</p>
                  <p className="text-sm text-muted-foreground">{tl("Total bookings", "Συνολικές κρατήσεις")}</p>
                </CardContent>
              </Card>
              <Card className="shadow-card">
                <CardContent className="pt-6">
                  <div className="mb-3 flex items-center justify-between">
                    <MessageSquareText className="h-5 w-5 text-aegean" />
                    <Badge variant="outline">Action</Badge>
                  </div>
                  <p className="text-2xl font-heading font-bold text-foreground">{reviewableTrips}</p>
                  <p className="text-sm text-muted-foreground">{tl("Trips waiting for review", "Εκδρομές που περιμένουν αξιολόγηση")}</p>
                </CardContent>
              </Card>
              <Card className="shadow-card">
                <CardContent className="pt-6">
                  <div className="mb-3 flex items-center justify-between">
                    <CheckCircle2 className="h-5 w-5 text-aegean" />
                    <Badge variant="outline">Complete</Badge>
                  </div>
                  <p className="text-2xl font-heading font-bold text-foreground">{customerHistory.filter((item) => item.hasReview).length}</p>
                  <p className="text-sm text-muted-foreground">{tl("Trips already reviewed", "Εκδρομές που αξιολογήθηκαν")}</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-10">
          <div className="container mx-auto px-4">
            {!user && !isLoading ? (
              <Card className="shadow-card">
                <CardContent className="pt-6 space-y-4">
                  <p className="text-muted-foreground">{tl("Sign in to see your booking history and leave reviews.", "Συνδέσου για να δεις το ιστορικό κρατήσεων και να αφήσεις αξιολογήσεις.")}</p>
                  <Button asChild className="bg-gradient-accent text-accent-foreground">
                    <Link to="/">{tl("Back to home", "Επιστροφή στην αρχική")}</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : historyError ? (
              <Card className="shadow-card">
                <CardContent className="pt-6 space-y-4">
                  <p className="text-muted-foreground">{historyError}</p>
                  <Button asChild variant="outline">
                    <Link to="/boats">{tl("Browse boats", "Περιήγηση στα σκάφη")}</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Tabs defaultValue="bookings" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="bookings">{tl("Booking history", "Ιστορικό κρατήσεων")}</TabsTrigger>
                  {user?.isOwner ? <TabsTrigger value="sales">{tl("Selling history", "Ιστορικό πωλήσεων")}</TabsTrigger> : null}
                </TabsList>

                <TabsContent value="bookings" className="space-y-4">
                  {customerHistory.map((booking) => (
                    <Card key={booking.id} className="shadow-card-hover">
                      <CardHeader className="flex flex-row items-start justify-between gap-4">
                        <div>
                          <CardTitle>{booking.boatName}</CardTitle>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {booking.ownerName} • {booking.packageLabel}
                          </p>
                        </div>
                        <Badge variant="outline" className="capitalize">{booking.status}</Badge>
                      </CardHeader>
                      <CardContent className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="font-medium text-foreground">{new Date(booking.startDate).toLocaleDateString()}</p>
                          <p className="text-sm text-muted-foreground">{tl("Total paid", "Συνολικό ποσό")}: €{booking.totalPrice}</p>
                        </div>
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                          <Button asChild variant="outline">
                            <Link to={getBoatPath(booking.boatId)}>{tl("Boat details", "Λεπτομέρειες σκάφους")}</Link>
                          </Button>
                          {isReviewEligible(booking) ? (
                            <Button asChild className="bg-gradient-accent text-accent-foreground">
                              <Link to={`/post-trip-review?bookingId=${encodeURIComponent(booking.id)}&boatRef=${encodeURIComponent(getBoatReference(booking.boatId))}&boat=${encodeURIComponent(booking.boatName)}`}>{tl("Leave review", "Αφήστε αξιολόγηση")}</Link>
                            </Button>
                          ) : booking.hasReview ? (
                            <Badge className="bg-emerald-500">{tl("Review submitted", "Η αξιολόγηση υποβλήθηκε")}</Badge>
                          ) : (
                            <Badge variant="outline" className="gap-1">
                              <Clock3 className="h-3.5 w-3.5" /> {tl("Review after trip", "Αξιολόγηση μετά την εκδρομή")}
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {customerHistory.length === 0 && !isLoading ? (
                    <Card className="shadow-card">
                      <CardContent className="pt-6">
                        <p className="text-muted-foreground">{tl("No bookings yet.", "Δεν υπάρχουν κρατήσεις ακόμη.")}</p>
                      </CardContent>
                    </Card>
                  ) : null}
                </TabsContent>

                {user?.isOwner ? (
                  <TabsContent value="sales" className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <Card className="shadow-card">
                        <CardContent className="pt-6">
                          <p className="text-2xl font-heading font-bold text-foreground">{salesHistory.length}</p>
                          <p className="text-sm text-muted-foreground">{tl("Total sales bookings", "Συνολικές κρατήσεις πώλησης")}</p>
                        </CardContent>
                      </Card>
                      <Card className="shadow-card">
                        <CardContent className="pt-6">
                          <p className="text-2xl font-heading font-bold text-foreground">{pendingSales}</p>
                          <p className="text-sm text-muted-foreground">{tl("Pending or confirmed", "Σε εκκρεμότητα ή επιβεβαιωμένες")}</p>
                        </CardContent>
                      </Card>
                      <Card className="shadow-card">
                        <CardContent className="pt-6">
                          <p className="text-2xl font-heading font-bold text-foreground">€{totalSalesRevenue.toLocaleString()}</p>
                          <p className="text-sm text-muted-foreground">{tl("Completed sales revenue", "Έσοδα από ολοκληρωμένες πωλήσεις")}</p>
                        </CardContent>
                      </Card>
                    </div>

                    {salesHistory.map((sale) => (
                      <Card key={sale.id} className="shadow-card-hover">
                        <CardHeader className="flex flex-row items-start justify-between gap-4">
                          <div>
                            <CardTitle>{sale.boatName}</CardTitle>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {tl("Guest", "Πελάτης")}: {sale.customerName} • {sale.packageLabel}
                            </p>
                          </div>
                          <Badge variant="outline" className="capitalize">{sale.status}</Badge>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                          <div>
                            <p className="font-medium text-foreground">{new Date(sale.startDate).toLocaleDateString()}</p>
                            <p className="text-sm text-muted-foreground">{tl("Sale value", "Αξία πώλησης")}: €{sale.totalPrice}</p>
                          </div>
                          <Button asChild variant="outline">
                            <Link to={getBoatPath(sale.boatId)}>{tl("Boat details", "Λεπτομέρειες σκάφους")}</Link>
                          </Button>
                        </CardContent>
                      </Card>
                    ))}

                    {salesHistory.length === 0 && !isLoading ? (
                      <Card className="shadow-card">
                        <CardContent className="pt-6">
                          <p className="text-muted-foreground">{tl("No selling history yet.", "Δεν υπάρχει ακόμη ιστορικό πωλήσεων.")}</p>
                        </CardContent>
                      </Card>
                    ) : null}
                  </TabsContent>
                ) : null}
              </Tabs>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default History;