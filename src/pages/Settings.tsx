import { useEffect, useMemo, useState } from "react";
import { Bell, Lock, ShieldCheck, UserCog } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

type SettingsState = {
  profilePublic: boolean;
  twoFactorEnabled: boolean;
  sessionAlerts: boolean;
  bookingEmail: boolean;
  bookingInApp: boolean;
  marketingEmail: boolean;
  analyticsConsent: boolean;
};

const SETTINGS_STORAGE_KEY = "nautiq:settings:v1";

const defaultSettings = (): SettingsState => ({
  profilePublic: true,
  twoFactorEnabled: false,
  sessionAlerts: true,
  bookingEmail: true,
  bookingInApp: true,
  marketingEmail: false,
  analyticsConsent: true,
});

const Settings = () => {
  const { tl } = useLanguage();
  const { toast } = useToast();
  const [settings, setSettings] = useState<SettingsState>(defaultSettings);
  const [savedSnapshot, setSavedSnapshot] = useState<string>(JSON.stringify(defaultSettings()));

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (!raw) {
        return;
      }

      const parsed = JSON.parse(raw) as Partial<SettingsState>;
      const merged = {
        ...defaultSettings(),
        ...parsed,
      };
      setSettings(merged);
      setSavedSnapshot(JSON.stringify(merged));
    } catch {
      setSettings(defaultSettings());
      setSavedSnapshot(JSON.stringify(defaultSettings()));
    }
  }, []);

  const isDirty = useMemo(() => JSON.stringify(settings) !== savedSnapshot, [savedSnapshot, settings]);

  const updateSetting = (key: keyof SettingsState, value: boolean) => {
    setSettings((current) => ({ ...current, [key]: value }));
  };

  const handleSave = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    }
    setSavedSnapshot(JSON.stringify(settings));
    toast({
      title: tl("Settings saved", "Οι ρυθμίσεις αποθηκεύτηκαν"),
      description: tl("Your preferences were updated successfully.", "Οι προτιμήσεις σου ενημερώθηκαν με επιτυχία."),
    });
  };

  const handleReset = () => {
    const reset = defaultSettings();
    setSettings(reset);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(reset));
    }
    setSavedSnapshot(JSON.stringify(reset));
    toast({
      title: tl("Defaults restored", "Επαναφορά προεπιλογών"),
      description: tl("All settings were reset to defaults.", "Όλες οι ρυθμίσεις επανήλθαν στις προεπιλογές."),
    });
  };

  const handleComingSoon = () => {
    toast({
      title: tl("Coming soon", "Έρχεται σύντομα"),
      description: tl("This action will be available in the next update.", "Αυτή η ενέργεια θα είναι διαθέσιμη στην επόμενη ενημέρωση."),
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-16">
        <section className="py-10 border-b border-border bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-2">{tl("Account", "Λογαριασμός")}</p>
                <h1 className="text-3xl md:text-4xl font-heading font-bold text-foreground">{tl("Settings", "Ρυθμίσεις")}</h1>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={isDirty ? "default" : "outline"} className={isDirty ? "bg-aegean text-primary-foreground" : ""}>
                  {isDirty ? tl("Unsaved changes", "Μη αποθηκευμένες αλλαγές") : tl("All changes saved", "Όλες οι αλλαγές αποθηκεύτηκαν")}
                </Badge>
              </div>
            </div>
            <p className="text-muted-foreground mt-3 max-w-2xl">
              {tl("Manage profile preferences, security options, and notification settings.", "Διαχειρίσου τις προτιμήσεις προφίλ, τις επιλογές ασφάλειας και τις ρυθμίσεις ειδοποιήσεων.")}
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <Button className="bg-gradient-accent text-accent-foreground" onClick={handleSave} disabled={!isDirty}>
                {tl("Save changes", "Αποθήκευση αλλαγών")}
              </Button>
              <Button variant="outline" onClick={handleReset}>
                {tl("Reset defaults", "Επαναφορά προεπιλογών")}
              </Button>
            </div>
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
                  <div>
                    <p className="text-sm text-foreground">{tl("Display name visibility", "Ορατότητα ονόματος")}</p>
                    <p className="text-xs text-muted-foreground">{tl("Let boat owners see your public profile name.", "Επίτρεψε στους ιδιοκτήτες να βλέπουν το δημόσιο όνομά σου.")}</p>
                  </div>
                  <Switch checked={settings.profilePublic} onCheckedChange={(checked) => updateSetting("profilePublic", checked)} />
                </div>
                <Button asChild variant="outline" className="w-full">
                  <Link to="/profile">{tl("Edit profile information", "Επεξεργασία στοιχείων προφίλ")}</Link>
                </Button>
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
                  <div>
                    <p className="text-sm text-foreground">{tl("Session status", "Κατάσταση συνεδρίας")}</p>
                    <p className="text-xs text-muted-foreground">{tl("Current session is active on this device.", "Η τρέχουσα συνεδρία είναι ενεργή σε αυτή τη συσκευή.")}</p>
                  </div>
                  <Badge className="bg-emerald-500">{tl("Active", "Ενεργή")}</Badge>
                </div>
                <div className="rounded-xl border border-border p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-foreground">{tl("Two-factor authentication", "Έλεγχος ταυτότητας δύο παραγόντων")}</p>
                    <p className="text-xs text-muted-foreground">{tl("Add an extra verification step for sign in.", "Πρόσθεσε επιπλέον βήμα επαλήθευσης για σύνδεση.")}</p>
                  </div>
                  <Switch checked={settings.twoFactorEnabled} onCheckedChange={(checked) => updateSetting("twoFactorEnabled", checked)} />
                </div>
                <div className="rounded-xl border border-border p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-foreground">{tl("Login alerts", "Ειδοποιήσεις σύνδεσης")}</p>
                    <p className="text-xs text-muted-foreground">{tl("Get notified for new sign-ins.", "Λάβε ειδοποίηση για νέες συνδέσεις.")}</p>
                  </div>
                  <Switch checked={settings.sessionAlerts} onCheckedChange={(checked) => updateSetting("sessionAlerts", checked)} />
                </div>
                <Button variant="outline" className="w-full" onClick={handleComingSoon}>{tl("Change password", "Αλλαγή κωδικού")}</Button>
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
                  <div>
                    <p className="text-sm text-foreground">{tl("Booking email updates", "Email ενημερώσεων κρατήσεων")}</p>
                    <p className="text-xs text-muted-foreground">{tl("Trip confirmations, changes, and reminders.", "Επιβεβαιώσεις εκδρομής, αλλαγές και υπενθυμίσεις.")}</p>
                  </div>
                  <Switch checked={settings.bookingEmail} onCheckedChange={(checked) => updateSetting("bookingEmail", checked)} />
                </div>
                <div className="rounded-xl border border-border p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-foreground">{tl("In-app booking notifications", "Ειδοποιήσεις κρατήσεων εντός εφαρμογής")}</p>
                    <p className="text-xs text-muted-foreground">{tl("Show updates while browsing Nautiq.", "Εμφάνιση ενημερώσεων καθώς περιηγείσαι στο Nautiq.")}</p>
                  </div>
                  <Switch checked={settings.bookingInApp} onCheckedChange={(checked) => updateSetting("bookingInApp", checked)} />
                </div>
                <div className="rounded-xl border border-border p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-foreground">{tl("Marketing offers", "Προσφορές marketing")}</p>
                    <p className="text-xs text-muted-foreground">{tl("Deals and seasonal package announcements.", "Προσφορές και εποχιακές ανακοινώσεις πακέτων.")}</p>
                  </div>
                  <Switch checked={settings.marketingEmail} onCheckedChange={(checked) => updateSetting("marketingEmail", checked)} />
                </div>
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
                <div className="rounded-xl border border-border p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-foreground">{tl("Analytics consent", "Συγκατάθεση analytics")}</p>
                    <p className="text-xs text-muted-foreground">{tl("Help improve Nautiq with anonymous usage analytics.", "Βοήθησε στη βελτίωση του Nautiq με ανώνυμα δεδομένα χρήσης.")}</p>
                  </div>
                  <Switch checked={settings.analyticsConsent} onCheckedChange={(checked) => updateSetting("analyticsConsent", checked)} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Button asChild variant="outline" className="w-full">
                    <Link to="/privacy-policy">{tl("Privacy policy", "Πολιτική απορρήτου")}</Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full">
                    <Link to="/cookie-policy">{tl("Cookie policy", "Πολιτική cookies")}</Link>
                  </Button>
                </div>
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
