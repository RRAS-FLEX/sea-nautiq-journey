import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BarChart3,
  CalendarCheck2,
  Pencil,
  Plus,
  MapPin,
  Ship,
  Star,
  Wallet,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import AddBoatModal from "../components/owner/AddBoatModal";
import PackageManagement from "../components/owner/PackageManagement";
import { getOwnerBoats, getOwnerStats, OwnerBoat } from "../lib/dashboard-hybrid";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { useLanguage } from "@/contexts/LanguageContext";

const OwnerProfile = () => {
  const { tl } = useLanguage();
  const { user } = useCurrentUser();
  const [showAddBoat, setShowAddBoat] = useState(false);
  const [editingBoat, setEditingBoat] = useState<OwnerBoat | null>(null);
  const [ownerBoats, setOwnerBoats] = useState<OwnerBoat[]>([]);
  const [ownerStatsData, setOwnerStatsData] = useState({ listedBoats: 0, totalBookings: 0, totalRevenue: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [boatsData, statsData] = await Promise.all([
          getOwnerBoats(),
          getOwnerStats(),
        ]);
        setOwnerBoats(boatsData);
        setOwnerStatsData(statsData);
      } catch (error) {
        console.error("Failed to load owner data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const refreshBoats = async () => {
    try {
      const boatsData = await getOwnerBoats();
      const statsData = await getOwnerStats();
      setOwnerBoats(boatsData);
      setOwnerStatsData(statsData);
    } catch (error) {
      console.error("Failed to refresh boats:", error);
    }
  };

  const handleCloseAdd = () => { setShowAddBoat(false); refreshBoats(); };
  const handleCloseEdit = () => { setEditingBoat(null); refreshBoats(); };

  const averageRevenuePerBooking = ownerStatsData.totalBookings > 0
    ? Math.round(ownerStatsData.totalRevenue / ownerStatsData.totalBookings)
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-16">
        <section className="py-12 md:py-16 border-b border-border bg-muted/40">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              <Card className="lg:col-span-2 shadow-card-hover">
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row md:items-center gap-5">
                    <Avatar className="h-20 w-20 border border-border">
                      <AvatarFallback className="text-xl font-semibold">
                        {user?.name?.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase() ?? "OW"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h1 className="text-2xl md:text-3xl font-heading font-bold text-foreground">{user?.name ?? "Owner"}</h1>
                        <Badge className="bg-gradient-accent text-accent-foreground">{tl("Verified Owner", "Επαληθευμένος Ιδιοκτήτης")}</Badge>
                      </div>
                      <p className="text-muted-foreground max-w-2xl">
                        {user?.email ?? "Manage your boats and bookings from the owner dashboard."}
                      </p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                        <MapPin className="h-4 w-4 text-aegean" />
                        Based in Thassos, Greece
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="text-lg">{tl("Profile Actions", "Ενέργειες Προφίλ")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full bg-gradient-accent text-accent-foreground">{tl("Edit Profile", "Επεξεργασία Προφίλ")}</Button>
                  <Button asChild variant="outline" className="w-full">
                    <Link to="/owner-dashboard">{tl("Open Owner Dashboard", "Άνοιγμα Πίνακα Ιδιοκτήτη")}</Link>
                  </Button>
                  <Button variant="outline" className="w-full gap-2" onClick={() => setShowAddBoat(true)}>
                    <Plus className="h-4 w-4" />
                    {tl("Add Another Boat", "Προσθήκη Νέου Σκάφους")}
                  </Button>
                  <Button asChild variant="outline" className="w-full">
                    <Link to="/business-promotions">{tl("Business promotion tickets", "Αιτήματα προώθησης επιχειρήσεων")}</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-10 md:py-12">
          <div className="container mx-auto px-4 space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="shadow-card">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-3">
                    <CalendarCheck2 className="h-5 w-5 text-aegean" />
                    <Badge variant="outline" className="text-[10px]">Live</Badge>
                  </div>
                  <p className="text-2xl font-heading font-bold text-foreground">{ownerStatsData.totalBookings}</p>
                  <p className="text-sm text-muted-foreground">Total Bookings</p>
                </CardContent>
              </Card>
              <Card className="shadow-card">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-3">
                    <Star className="h-5 w-5 text-aegean" />
                    <Badge variant="outline" className="text-[10px]">Live</Badge>
                  </div>
                  <p className="text-2xl font-heading font-bold text-foreground">
                    {ownerBoats.length > 0
                      ? (ownerBoats.reduce((sum, boat) => sum + Number(boat.rating || 0), 0) / ownerBoats.length).toFixed(1)
                      : "0.0"}
                  </p>
                  <p className="text-sm text-muted-foreground">Average Rating</p>
                </CardContent>
              </Card>
              <Card className="shadow-card">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-3">
                    <Wallet className="h-5 w-5 text-aegean" />
                    <Badge variant="outline" className="text-[10px]">Live</Badge>
                  </div>
                  <p className="text-2xl font-heading font-bold text-foreground">€{ownerStatsData.totalRevenue.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                </CardContent>
              </Card>
              <Card className="shadow-card">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-3">
                    <Ship className="h-5 w-5 text-aegean" />
                    <Badge variant="outline" className="text-[10px]">Live</Badge>
                  </div>
                  <p className="text-2xl font-heading font-bold text-foreground">{ownerStatsData.listedBoats}</p>
                  <p className="text-sm text-muted-foreground">Listed Boats</p>
                </CardContent>
              </Card>
            </div>

            <Card className="shadow-card-hover">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-xl">Fleet Overview</CardTitle>
                <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowAddBoat(true)}>
                  <Plus className="h-4 w-4" />
                  Add Boat
                </Button>
              </CardHeader>
              <CardContent>
                {ownerBoats.length > 0 ? (
                  <div className="space-y-3">
                    {ownerBoats.map((boat) => (
                      <div key={boat.id} className="rounded-xl border border-border p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div>
                          <p className="font-semibold text-foreground">{boat.name}</p>
                          <p className="text-sm text-muted-foreground">{boat.location} • Capacity {boat.capacity} guests</p>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline">€{Number(boat.pricePerDay || 0)}/day</Badge>
                          <Badge className="bg-turquoise/20 text-foreground border-transparent">{Number(boat.rating || 0).toFixed(1)}★ rating</Badge>
                          <Badge variant="outline" className="capitalize">{boat.status}</Badge>
                          {boat.documents?.length > 0 && (
                            <Badge variant="outline" className="text-aegean">{boat.documents.length} doc{boat.documents.length !== 1 ? "s" : ""}</Badge>
                          )}
                          <Button size="sm" variant="outline" className="gap-1 h-7 px-2" onClick={() => setEditingBoat(boat)}>
                            <Pencil className="h-3 w-3" />
                            Edit
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <Ship className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
                    <p className="text-muted-foreground mb-4">No owner boats yet. Add your first boat to start receiving bookings.</p>
                    <Button className="bg-gradient-accent text-accent-foreground gap-2" onClick={() => setShowAddBoat(true)}>
                      <Plus className="h-4 w-4" />
                      Add First Boat
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-xl">Performance Report</CardTitle>
                <BarChart3 className="h-5 w-5 text-aegean" />
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="rounded-2xl border border-border p-4">
                    <p className="text-sm text-muted-foreground">Listed Boats</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{ownerStatsData.listedBoats}</p>
                  </div>
                  <div className="rounded-2xl border border-border p-4">
                    <p className="text-sm text-muted-foreground">Total Bookings</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{ownerStatsData.totalBookings}</p>
                  </div>
                  <div className="rounded-2xl border border-border p-4">
                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                    <p className="text-2xl font-bold text-foreground mt-1">€{ownerStatsData.totalRevenue.toLocaleString()}</p>
                  </div>
                  <div className="rounded-2xl border border-border p-4">
                    <p className="text-sm text-muted-foreground">Avg Revenue / Booking</p>
                    <p className="text-2xl font-bold text-foreground mt-1">€{averageRevenuePerBooking.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <PackageManagement />

            <Card className="shadow-card bg-muted/30">
              <CardHeader>
                <CardTitle className="text-xl">Owner Growth Ideas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>• Add at least 5 feature toggles per boat to increase booking confidence.</p>
                <p>• Create 3 packages (3h, 6h, full-day) and assign them to every active boat.</p>
                <p>• Upload real photos from your boat to improve conversion over placeholder images.</p>
              </CardContent>
            </Card>

            <div className="text-center">
              <Link to="/boats" className="text-aegean hover:text-turquoise transition-colors font-medium">
                Browse customer-facing boats page →
              </Link>
            </div>
          </div>
        </section>
      </main>

      {showAddBoat && <AddBoatModal onClose={handleCloseAdd} />}
      {editingBoat && <AddBoatModal boat={editingBoat} onClose={handleCloseEdit} />}

      <Footer />
    </div>
  );
};

export default OwnerProfile;
