import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, CheckCircle2, Clock3, MessageSquareText } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { getCustomerBookingHistory, type CustomerHistoryItem } from "@/lib/history";

const isReviewEligible = (booking: CustomerHistoryItem) => {
  const tripDate = new Date(booking.startDate);
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  return booking.status !== "cancelled" && tripDate.getTime() <= today.getTime() && !booking.hasReview;
};

const History = () => {
  const { user, isLoading } = useCurrentUser();
  const [history, setHistory] = useState<CustomerHistoryItem[]>([]);

  useEffect(() => {
    if (!user?.id) {
      setHistory([]);
      return;
    }

    let cancelled = false;

    const loadHistory = async () => {
      const nextHistory = await getCustomerBookingHistory();
      if (!cancelled) {
        setHistory(nextHistory);
      }
    };

    loadHistory();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const reviewableTrips = useMemo(() => history.filter(isReviewEligible).length, [history]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-16">
        <section className="py-12 border-b border-border bg-muted/30">
          <div className="container mx-auto px-4">
            <p className="text-sm text-muted-foreground">Trip history</p>
            <h1 className="mt-2 text-4xl font-heading font-bold text-foreground">Bookings and reviews</h1>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              Review requests appear here once the trip date has passed, which is the cleanest point in the workflow to ask for a customer rating.
            </p>

            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Card className="shadow-card">
                <CardContent className="pt-6">
                  <div className="mb-3 flex items-center justify-between">
                    <CalendarDays className="h-5 w-5 text-aegean" />
                    <Badge variant="outline">Trips</Badge>
                  </div>
                  <p className="text-2xl font-heading font-bold text-foreground">{history.length}</p>
                  <p className="text-sm text-muted-foreground">Total bookings</p>
                </CardContent>
              </Card>
              <Card className="shadow-card">
                <CardContent className="pt-6">
                  <div className="mb-3 flex items-center justify-between">
                    <MessageSquareText className="h-5 w-5 text-aegean" />
                    <Badge variant="outline">Action</Badge>
                  </div>
                  <p className="text-2xl font-heading font-bold text-foreground">{reviewableTrips}</p>
                  <p className="text-sm text-muted-foreground">Trips waiting for review</p>
                </CardContent>
              </Card>
              <Card className="shadow-card">
                <CardContent className="pt-6">
                  <div className="mb-3 flex items-center justify-between">
                    <CheckCircle2 className="h-5 w-5 text-aegean" />
                    <Badge variant="outline">Complete</Badge>
                  </div>
                  <p className="text-2xl font-heading font-bold text-foreground">{history.filter((item) => item.hasReview).length}</p>
                  <p className="text-sm text-muted-foreground">Trips already reviewed</p>
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
                  <p className="text-muted-foreground">Sign in to see your booking history and leave reviews.</p>
                  <Button asChild className="bg-gradient-accent text-accent-foreground">
                    <Link to="/">Back to home</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {history.map((booking) => (
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
                        <p className="text-sm text-muted-foreground">Total paid: €{booking.totalPrice}</p>
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <Button asChild variant="outline">
                          <Link to={`/boats/${booking.boatId}`}>Boat details</Link>
                        </Button>
                        {isReviewEligible(booking) ? (
                          <Button asChild className="bg-gradient-accent text-accent-foreground">
                            <Link to={`/post-trip-review?bookingId=${booking.id}&boatId=${booking.boatId}`}>Leave review</Link>
                          </Button>
                        ) : booking.hasReview ? (
                          <Badge className="bg-emerald-500">Review submitted</Badge>
                        ) : (
                          <Badge variant="outline" className="gap-1">
                            <Clock3 className="h-3.5 w-3.5" /> Review after trip
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {history.length === 0 && !isLoading ? (
                  <Card className="shadow-card">
                    <CardContent className="pt-6">
                      <p className="text-muted-foreground">No bookings yet.</p>
                    </CardContent>
                  </Card>
                ) : null}
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default History;