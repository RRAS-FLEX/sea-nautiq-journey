import { Link, useSearchParams } from "react-router-dom";
import { addDays, format } from "date-fns";
import { CalendarX2, MessageCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const reasonLabel = (reason: string) => {
  if (reason === "date-unavailable") return "This date is blocked by the owner.";
  if (reason === "day-fully-booked") return "All valid time windows are already booked for this day.";
  if (reason === "slot-unavailable") return "The selected departure slot is no longer available.";
  return "Booking is currently closed for this request.";
};

const BookingClosed = () => {
  const [searchParams] = useSearchParams();
  const boat = searchParams.get("boat") ?? "this boat";
  const date = searchParams.get("date") ?? "";
  const reason = searchParams.get("reason") ?? "generic";

  const parsedDate = date ? new Date(`${date}T12:00:00`) : null;
  const nextDate = parsedDate ? format(addDays(parsedDate, 1), "yyyy-MM-dd") : format(addDays(new Date(), 1), "yyyy-MM-dd");

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-20 pb-12">
        <section className="container mx-auto px-4 max-w-3xl">
          <Card className="shadow-card-hover">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarX2 className="h-5 w-5 text-destructive" />
                Booking closed
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">{reasonLabel(reason)}</p>
              <p className="text-sm text-foreground">
                Boat: <strong>{boat}</strong>
                {date ? <> • Date: <strong>{date}</strong></> : null}
              </p>

              <div className="rounded-2xl border border-border bg-muted/20 p-4 space-y-2">
                <p className="text-sm font-medium text-foreground">What you can do next</p>
                <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                  <li>Try another date to find open slots quickly.</li>
                  <li>Switch package length for more available start times.</li>
                  <li>Chat with the owner for custom availability.</li>
                </ul>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <Button asChild>
                  <Link to={`/booking?boat=${encodeURIComponent(boat)}&date=${encodeURIComponent(nextDate)}`}>
                    Try another day
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/boats">Browse other boats</Link>
                </Button>
                <Button asChild variant="outline" className="sm:col-span-2">
                  <Link to={`/chat?boat=${encodeURIComponent(boat)}`}>
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Chat with owner
                  </Link>
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

export default BookingClosed;
