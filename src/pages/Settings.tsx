import { Bell, Lock, ShieldCheck, UserCog } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";

const Settings = () => {
  const { tl } = useLanguage();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-16">
        <section className="py-10 border-b border-border bg-muted/30">
          <div className="container mx-auto px-4">
            <p className="text-sm text-muted-foreground mb-2">{tl("Account", "Λογαριασμός")}</p>
            <h1 className="text-3xl md:text-4xl font-heading font-bold text-foreground">{tl("Settings", "Ρυθμίσεις")}</h1>
            <p className="text-muted-foreground mt-3 max-w-2xl">
              {tl("Manage profile preferences, security options, and notification settings.", "Διαχειρίσου τις προτιμήσεις προφίλ, τις επιλογές ασφάλειας και τις ρυθμίσεις ειδοποιήσεων.")}
            </p>
          </div>
        </section>

        <section className="py-10 md:py-12">
          <div className="container mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCog className="h-5 w-5 text-aegean" /> {tl("Profile Settings", "Ρυθμίσεις Προφίλ")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-xl border border-border p-4 flex items-center justify-between">
                  <span className="text-sm text-foreground">{tl("Display name visibility", "Ορατότητα ονόματος")}</span>
                  <Badge variant="outline">{tl("Public", "Δημόσιο")}</Badge>
                </div>
                <Button variant="outline" className="w-full">{tl("Edit profile information", "Επεξεργασία στοιχείων προφίλ")}</Button>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-aegean" /> {tl("Security", "Ασφάλεια")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-xl border border-border p-4 flex items-center justify-between">
                  <span className="text-sm text-foreground">{tl("Session status", "Κατάσταση συνεδρίας")}</span>
                  <Badge className="bg-emerald-500">{tl("Active", "Ενεργή")}</Badge>
                </div>
                <Button variant="outline" className="w-full">{tl("Change password", "Αλλαγή κωδικού")}</Button>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-aegean" /> {tl("Notifications", "Ειδοποιήσεις")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-xl border border-border p-4 flex items-center justify-between">
                  <span className="text-sm text-foreground">{tl("Booking updates", "Ενημερώσεις κρατήσεων")}</span>
                  <Badge variant="outline">{tl("Email + In-app", "Email + Εντός εφαρμογής")}</Badge>
                </div>
                <Button variant="outline" className="w-full">{tl("Notification preferences", "Προτιμήσεις ειδοποιήσεων")}</Button>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-aegean" /> {tl("Privacy", "Απόρρητο")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-xl border border-border p-4">
                  <p className="text-sm text-muted-foreground">{tl("Review your data usage and consent preferences.", "Έλεγξε τη χρήση δεδομένων και τις προτιμήσεις συγκατάθεσης.")}</p>
                </div>
                <Button variant="outline" className="w-full">{tl("Privacy controls", "Έλεγχοι απορρήτου")}</Button>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Settings;
