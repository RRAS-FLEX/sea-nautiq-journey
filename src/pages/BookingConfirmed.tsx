import { Link, useSearchParams } from "react-router-dom";
import { CalendarCheck2, Mail, MessageCircle, ShieldCheck } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const BookingConfirmed = () => {
  const [searchParams] = useSearchParams();

  const bookingId = searchParams.get("bookingId") ?? "";
  const boat = searchParams.get("boat") ?? "Boat";
  const date = searchParams.get("date") ?? "";
  const departure = searchParams.get("departure") ?? "";
  const amount = searchParams.get("amount") ?? "";
  const emailQueued = searchParams.get("emailQueued") === "true";
  const ownerNotified = searchParams.get("ownerNotified") === "true";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-20 pb-12">
        <section className="container mx-auto px-4 max-w-3xl">
          <Card className="shadow-card-hover">
            <CardHeader>
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <CardTitle className="flex items-center gap-2">
                  <CalendarCheck2 className="h-5 w-5 text-aegean" />
                  Booking confirmed
                </CardTitle>
                <Badge className="bg-aegean/10 text-aegean border-aegean/30">Reference {bookingId || "pending"}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <p className="text-muted-foreground">
                Your trip is secured. We lock this slot immediately to avoid overlaps and keep your booking reliable.
              </p>

              <div className="rounded-2xl border border-border bg-muted/20 p-4 space-y-2 text-sm">
                <div className="flex items-center justify-between gap-4"><span className="text-muted-foreground">Boat</span><span className="font-medium text-foreground">{boat}</span></div>
                <div className="flex items-center justify-between gap-4"><span className="text-muted-foreground">Date</span><span className="font-medium text-foreground">{date || "-"}</span></div>
                <div className="flex items-center justify-between gap-4"><span className="text-muted-foreground">Departure</span><span className="font-medium text-foreground">{departure || "-"}</span></div>
                <div className="flex items-center justify-between gap-4"><span className="text-muted-foreground">Paid now</span><span className="font-medium text-foreground">€{amount || "0"}</span></div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-2xl border border-border p-4 bg-background">
                  <p className="text-sm font-medium text-foreground flex items-center gap-2"><MessageCircle className="h-4 w-4 text-aegean" />Owner notification</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {ownerNotified ? "Sent to owner queue." : "Pending owner notification."}
                  </p>
                </div>
                <div className="rounded-2xl border border-border p-4 bg-background">
                  <p className="text-sm font-medium text-foreground flex items-center gap-2"><Mail className="h-4 w-4 text-aegean" />Customer email</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {emailQueued ? "Confirmation email queued." : "In-app confirmation active."}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-aegean/30 bg-aegean/5 p-4 text-sm text-foreground flex items-start gap-2">
                <ShieldCheck className="h-4 w-4 text-aegean mt-0.5 shrink-0" />
                <span>Trust-first protection: overlapping bookings are blocked before confirmation, and live availability updates are applied in real time.</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button asChild>
                  <Link to="/history">View my bookings</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/boats">Book another trip</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default BookingConfirmed;
