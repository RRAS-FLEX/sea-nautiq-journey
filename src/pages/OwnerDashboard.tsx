import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BarChart3, Calendar, Package, Ship, Plus, Star, Wallet } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { getOwnerStats, getOwnerBoats, OwnerBoat, OwnerStats } from "../lib/owner-dashboard";
import AddBoatModal from "../components/owner/AddBoatModal";
import BoatsManagement from "../components/owner/BoatsManagement";
import CalendarManagement from "../components/owner/CalendarManagement";
import PackageManagement from "../components/owner/PackageManagement";
import { useLanguage } from "@/contexts/LanguageContext";

const OwnerDashboard = () => {
  const { tl } = useLanguage();
  const [activeTab, setActiveTab] = useState("overview");
  const [showAddBoat, setShowAddBoat] = useState(false);
  const [stats, setStats] = useState<OwnerStats>({ listedBoats: 0, totalBookings: 0, totalRevenue: 0, averageRating: "0.0" });
  const [boats, setBoats] = useState<OwnerBoat[]>([]);

  useEffect(() => {
    const loadDashboard = async () => {
      const [nextStats, nextBoats] = await Promise.all([getOwnerStats(), getOwnerBoats()]);
      setStats(nextStats);
      setBoats(nextBoats);
    };

    loadDashboard();
  }, [showAddBoat]);

  const dashboardStats = [
    { label: "Listed Boats", value: stats.listedBoats, icon: Ship, color: "text-aegean" },
    { label: "Total Bookings", value: stats.totalBookings, icon: Calendar, color: "text-turquoise" },
    { label: "Average Rating", value: stats.averageRating, icon: Star, color: "text-amber-400" },
    { label: "Revenue", value: `€${stats.totalRevenue.toLocaleString()}`, icon: Wallet, color: "text-emerald-500" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-16">
        <section className="py-8 md:py-12 border-b border-border bg-gradient-ocean">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div>
                <p className="text-primary-foreground/80 text-sm mb-2">Welcome back</p>
                <h1 className="text-3xl md:text-4xl font-heading font-bold text-primary-foreground">
                  {tl("Owner Dashboard", "Πίνακας Ιδιοκτήτη")}
                </h1>
              </div>
              <Link to="/owner-profile" className="text-sm font-medium text-primary-foreground/90 hover:text-primary-foreground">
                ← Back to profile
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {dashboardStats.map((stat) => (
                <Card key={stat.label} className="bg-primary-foreground/10 border-primary-foreground/20">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-3">
                      <stat.icon className={`h-5 w-5 ${stat.color}`} />
                    </div>
                    <p className="text-2xl font-heading font-bold text-primary-foreground">{stat.value}</p>
                    <p className="text-sm text-primary-foreground/80">{stat.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-10 md:py-12">
          <div className="container mx-auto px-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <TabsList className="grid w-full sm:w-auto grid-cols-5">
                  <TabsTrigger value="bookings" className="text-xs sm:text-sm">{tl("Bookings", "Κρατήσεις")}</TabsTrigger>
                  <TabsTrigger value="overview" className="text-xs sm:text-sm">{tl("Overview", "Επισκόπηση")}</TabsTrigger>
                  <TabsTrigger value="boats" className="text-xs sm:text-sm">{tl("Boats", "Σκάφη")}</TabsTrigger>
                  <TabsTrigger value="calendar" className="text-xs sm:text-sm">{tl("Calendar", "Ημερολόγιο")}</TabsTrigger>
                  <TabsTrigger value="packages" className="text-xs sm:text-sm">{tl("Packages", "Πακέτα")}</TabsTrigger>
                </TabsList>
                <Button
                  onClick={() => setShowAddBoat(true)}
                  className="bg-gradient-accent text-accent-foreground gap-2 w-full sm:w-auto"
                >
                  <Plus className="h-4 w-4" />
                  {tl("Add Boat", "Προσθήκη Σκάφους")}
                </Button>
              </div>

              <TabsContent value="bookings" className="space-y-6">
                <Card className="shadow-card-hover">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-aegean" />
                      {tl("Bookings", "Κρατήσεις")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="rounded-2xl border border-border p-4">
                        <p className="text-sm text-muted-foreground">{tl("Total bookings", "Συνολικές κρατήσεις")}</p>
                        <p className="text-2xl font-bold text-foreground mt-1">{stats.totalBookings}</p>
                      </div>
                      <div className="rounded-2xl border border-border p-4">
                        <p className="text-sm text-muted-foreground">{tl("Revenue", "Έσοδα")}</p>
                        <p className="text-2xl font-bold text-foreground mt-1">€{stats.totalRevenue.toLocaleString()}</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {tl(
                        "Detailed booking management remains available in your calendar and boat tools.",
                        "Η αναλυτική διαχείριση κρατήσεων παραμένει διαθέσιμη στο ημερολόγιο και στα εργαλεία σκαφών.",
                      )}
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="overview" className="space-y-6">
                <Card className="shadow-card-hover">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-aegean" />
                      Quick Stats
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="rounded-2xl border border-border p-4">
                        <p className="text-sm text-muted-foreground">Active Listings</p>
                        <p className="text-2xl font-bold text-foreground mt-1">{boats.filter(b => b.status === "active").length}</p>
                      </div>
                      <div className="rounded-2xl border border-border p-4">
                        <p className="text-sm text-muted-foreground">Pending Approvals</p>
                        <p className="text-2xl font-bold text-foreground mt-1">0</p>
                      </div>
                      <div className="rounded-2xl border border-border p-4">
                        <p className="text-sm text-muted-foreground">This Month Revenue</p>
                        <p className="text-2xl font-bold text-foreground mt-1">€2,450</p>
                      </div>
                      <div className="rounded-2xl border border-border p-4">
                        <p className="text-sm text-muted-foreground">Response Rate</p>
                        <p className="text-2xl font-bold text-foreground mt-1">98%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle>Your Boats</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {boats.length > 0 ? (
                      <div className="space-y-3">
                        {boats.map((boat) => (
                          <div
                            key={boat.id}
                            className="rounded-xl border border-border p-4 flex items-center justify-between"
                          >
                            <div>
                              <p className="font-semibold text-foreground">{boat.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {boat.location} • {boat.capacity} guests • €{boat.pricePerDay}/day
                              </p>
                            </div>
                            <Badge className={boat.status === "active" ? "bg-emerald-500" : "bg-slate-400"}>
                              {boat.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Ship className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                        <p className="text-muted-foreground">No boats added yet.</p>
                        <Button
                          onClick={() => setShowAddBoat(true)}
                          variant="outline"
                          className="mt-4 gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          Add Your First Boat
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="boats">
                <BoatsManagement onAddBoat={() => setShowAddBoat(true)} />
              </TabsContent>

              <TabsContent value="calendar">
                <CalendarManagement />
              </TabsContent>

              <TabsContent value="packages">
                <PackageManagement />
              </TabsContent>
            </Tabs>
          </div>
        </section>
      </main>

      {showAddBoat && <AddBoatModal onClose={() => setShowAddBoat(false)} />}

      <Footer />
    </div>
  );
};

export default OwnerDashboard;
