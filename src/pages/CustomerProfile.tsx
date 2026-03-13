import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarClock, Compass, Heart, MapPin, Ship, Star } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { supabase } from "@/lib/supabase";

const CustomerProfile = () => {
  const { user } = useCurrentUser();
  const [bookings, setBookings] = useState<any[]>([]);

  useEffect(() => {
    const loadBookings = async () => {
      if (!user?.id) return;
      const { data } = await (supabase as any)
        .from("bookings")
        .select("id, boat_name, start_date, status")
        .eq("customer_id", user.id)
        .order("start_date", { ascending: false });

      setBookings(Array.isArray(data) ? data : []);
    };

    loadBookings();
  }, [user?.id]);

  const completedTrips = bookings.filter((b) => b.status === "completed").length;
  const upcomingTrips = bookings.filter((b) => new Date(b.start_date).getTime() >= new Date().setHours(0, 0, 0, 0));

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-16">
        <section className="py-12 md:py-16 border-b border-border bg-muted/40">
          <div className="container mx-auto px-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 shadow-card-hover">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row md:items-center gap-5">
                  <Avatar className="h-20 w-20 border border-border">
                    <AvatarFallback className="text-xl font-semibold">
                      {user?.name?.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase() ?? "CU"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="text-2xl md:text-3xl font-heading font-bold text-foreground">{user?.name ?? "Customer"}</h1>
                      <Badge className="bg-gradient-accent text-accent-foreground">Verified Customer</Badge>
                    </div>
                    <p className="text-muted-foreground max-w-2xl">
                      {user?.email ?? "Manage your trips and profile from this page."}
                    </p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 text-aegean" />
                      Based in Athens, Greece
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full bg-gradient-accent text-accent-foreground">Edit Profile</Button>
                <Button asChild variant="outline" className="w-full">
                  <Link to="/history">Manage Bookings</Link>
                </Button>
                <Button variant="outline" className="w-full">Saved Boats</Button>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="py-10 md:py-12">
          <div className="container mx-auto px-4 space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="shadow-card">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-3">
                    <Ship className="h-5 w-5 text-aegean" />
                    <Badge variant="outline" className="text-[10px]">Live</Badge>
                  </div>
                  <p className="text-2xl font-heading font-bold text-foreground">{completedTrips}</p>
                  <p className="text-sm text-muted-foreground">Trips Completed</p>
                </CardContent>
              </Card>
              <Card className="shadow-card">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-3">
                    <Heart className="h-5 w-5 text-aegean" />
                    <Badge variant="outline" className="text-[10px]">Live</Badge>
                  </div>
                  <p className="text-2xl font-heading font-bold text-foreground">0</p>
                  <p className="text-sm text-muted-foreground">Saved Boats</p>
                </CardContent>
              </Card>
              <Card className="shadow-card">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-3">
                    <CalendarClock className="h-5 w-5 text-aegean" />
                    <Badge variant="outline" className="text-[10px]">Live</Badge>
                  </div>
                  <p className="text-2xl font-heading font-bold text-foreground">{upcomingTrips.length}</p>
                  <p className="text-sm text-muted-foreground">Upcoming Trips</p>
                </CardContent>
              </Card>
              <Card className="shadow-card">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-3">
                    <Star className="h-5 w-5 text-aegean" />
                    <Badge variant="outline" className="text-[10px]">Live</Badge>
                  </div>
                  <p className="text-2xl font-heading font-bold text-foreground">{completedTrips}</p>
                  <p className="text-sm text-muted-foreground">Trips Eligible for Review</p>
                </CardContent>
              </Card>
            </div>

            <Card className="shadow-card-hover">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-xl">Upcoming Trips</CardTitle>
                <Button variant="outline" size="sm" className="gap-2">
                  <Compass className="h-4 w-4" />
                  Explore More Boats
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {upcomingTrips.map((trip) => (
                  <div key={trip.id} className="rounded-xl border border-border p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div>
                      <p className="font-semibold text-foreground">{trip.boat_name ?? "Boat"}</p>
                      <p className="text-sm text-muted-foreground">{new Date(trip.start_date).toLocaleString()}</p>
                    </div>
                    <Badge variant="outline" className="capitalize">{trip.status}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="text-center">
              <Link to="/owner-profile" className="text-aegean hover:text-turquoise transition-colors font-medium">
                Switch to owner profile view →
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default CustomerProfile;
