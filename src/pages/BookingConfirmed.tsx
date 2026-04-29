import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CalendarCheck2, Mail, MessageCircle, ShieldCheck } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookingConfirmationSkeleton } from "@/components/loading/LoadingUI";

type ResolvedBooking = {
  bookingId: string;
  boat: string;
  date: string;
  departure: string;
  amount: number;
  ownerNotified: boolean;
  emailQueued: boolean;
  partyTicketCode?: string;
  partyTicketCount?: number;
  partyTicketStatus?: string;
  partyTicketPrice?: number;
  partyTicketQuantity?: number;
};

const BookingConfirmed = () => {
  const [searchParams] = useSearchParams();

  const bookingId = searchParams.get("bookingId") ?? "";
  const boat = searchParams.get("boat") ?? "Boat";
  const date = searchParams.get("date") ?? "";
  const departure = searchParams.get("departure") ?? "";
  const amount = searchParams.get("amount") ?? "";
  const emailQueued = searchParams.get("emailQueued") === "true";
  const ownerNotified = searchParams.get("ownerNotified") === "true";
  const partyTicketCode = searchParams.get("partyTicketCode") ?? "";
  const partyTicketCount = Number(searchParams.get("partyTicketCount") ?? 0);
  const partyTicketStatus = searchParams.get("partyTicketStatus") ?? "";
  const partyTicketPrice = Number(searchParams.get("partyTicketPrice") ?? 0);
  const partyTicketQuantity = Number(searchParams.get("partyTicketQuantity") ?? 0);
  const stripeSessionId = searchParams.get("session_id") ?? searchParams.get("sessionId") ?? "";

  const [resolvedBooking, setResolvedBooking] = useState<ResolvedBooking | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(stripeSessionId));
  const [error, setError] = useState<string | null>(null);

  const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? "").trim();
  const bookingLookupEndpoint = apiBaseUrl
    ? `${apiBaseUrl.replace(/\/$/, "")}/api/bookings/by-stripe-session`
    : "/api/bookings/by-stripe-session";

  useEffect(() => {
    if (!stripeSessionId) {
      return;
    }

    let cancelled = false;
    const loadBooking = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`${bookingLookupEndpoint}?session_id=${encodeURIComponent(stripeSessionId)}`);
        if (!response.ok) {
          throw new Error("Failed to load booking details for this payment session.");
        }

        const data: ResolvedBooking = await response.json();
        if (!cancelled) {
          setResolvedBooking(data);
        }
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : "Failed to load booking details.";
          setError(message);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadBooking();

    return () => {
      cancelled = true;
    };
  }, [stripeSessionId, bookingLookupEndpoint]);

  const effectiveBookingId = resolvedBooking?.bookingId || bookingId;
  const effectiveBoat = resolvedBooking?.boat || boat;
  const effectiveDate = resolvedBooking?.date || date;
  const effectiveDeparture = resolvedBooking?.departure || departure;
  const effectiveAmount =
    resolvedBooking && Number.isFinite(resolvedBooking.amount)
      ? String(resolvedBooking.amount)
      : amount;
  const effectiveOwnerNotified = resolvedBooking?.ownerNotified ?? ownerNotified;
  const effectiveEmailQueued = resolvedBooking?.emailQueued ?? emailQueued;
  const effectivePartyTicketCode = resolvedBooking?.partyTicketCode || partyTicketCode;
  const effectivePartyTicketCount = Number(resolvedBooking?.partyTicketCount ?? partyTicketCount);
  const effectivePartyTicketStatus = resolvedBooking?.partyTicketStatus || partyTicketStatus;
  const effectivePartyTicketPrice = Number(resolvedBooking?.partyTicketPrice ?? partyTicketPrice);
  const effectivePartyTicketQuantity = Number(resolvedBooking?.partyTicketQuantity ?? partyTicketQuantity);
  const hasPartyTicket = Boolean(effectivePartyTicketCode && effectivePartyTicketStatus === "issued");

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
                <Badge className="bg-aegean/10 text-aegean border-aegean/30">Reference {effectiveBookingId || "pending"}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <p className="text-muted-foreground">
                Your trip is secured. We lock this slot immediately to avoid overlaps and keep your booking reliable.
              </p>

              {isLoading ? <BookingConfirmationSkeleton /> : null}
              {error ? (
                <p className="text-xs text-destructive">{error}</p>
              ) : null}

              <div className="rounded-2xl border border-border bg-muted/20 p-4 space-y-2 text-sm">
                <div className="flex items-center justify-between gap-4"><span className="text-muted-foreground">Boat</span><span className="font-medium text-foreground">{effectiveBoat}</span></div>
                <div className="flex items-center justify-between gap-4"><span className="text-muted-foreground">Date</span><span className="font-medium text-foreground">{effectiveDate || "-"}</span></div>
                <div className="flex items-center justify-between gap-4"><span className="text-muted-foreground">Departure</span><span className="font-medium text-foreground">{effectiveDeparture || "-"}</span></div>
                <div className="flex items-center justify-between gap-4"><span className="text-muted-foreground">Paid now</span><span className="font-medium text-foreground">€{effectiveAmount || "0"}</span></div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-2xl border border-border p-4 bg-background">
                  <p className="text-sm font-medium text-foreground flex items-center gap-2"><MessageCircle className="h-4 w-4 text-aegean" />Owner notification</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {effectiveOwnerNotified ? "Sent to owner queue." : "Pending owner notification."}
                  </p>
                </div>
                <div className="rounded-2xl border border-border p-4 bg-background">
                  <p className="text-sm font-medium text-foreground flex items-center gap-2"><Mail className="h-4 w-4 text-aegean" />Customer email</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {effectiveEmailQueued ? "Confirmation email queued." : "In-app confirmation active."}
                  </p>
                </div>
              </div>

              {hasPartyTicket ? (
                <div className="rounded-2xl border border-amber-400/40 bg-amber-50 p-4 text-sm text-foreground space-y-2">
                  <p className="font-medium">Party tickets issued</p>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground">Unit price</span>
                    <span className="font-medium">{effectivePartyTicketPrice > 0 ? `€${effectivePartyTicketPrice.toFixed(effectivePartyTicketPrice % 1 === 0 ? 0 : 2)}` : "Included"}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground">Tickets</span>
                    <span className="font-medium">{Math.max(1, effectivePartyTicketQuantity || effectivePartyTicketCount)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground">Ticket code</span>
                    <span className="font-semibold tracking-wide">{effectivePartyTicketCode}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Show this code at check-in for your party boarding list.
                  </p>
                </div>
              ) : null}

              <div className="rounded-2xl border border-aegean/30 bg-aegean/5 p-4 text-sm text-foreground flex items-start gap-2">
                <ShieldCheck className="h-4 w-4 text-aegean mt-0.5 shrink-0" />
                <span>Trust-first protection: overlapping bookings are blocked before confirmation, and live availability updates are applied in real time.</span>
              </div>

              <div className="rounded-2xl border border-border bg-muted/20 p-4 text-sm text-foreground">
                <p className="font-medium">Cancellation & refund workflow</p>
                <p className="text-muted-foreground mt-1">
                  Need to cancel later? Open <span className="font-medium text-foreground">My bookings</span> and use <span className="font-medium text-foreground">Cancel booking</span>.
                  Refunds are processed automatically: 100% refund when cancelled 48+ hours before trip start, otherwise 50%.
                </p>
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
