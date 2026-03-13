import { Bell, Lock, ShieldCheck, UserCog } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Settings = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-16">
        <section className="py-10 border-b border-border bg-muted/30">
          <div className="container mx-auto px-4">
            <p className="text-sm text-muted-foreground mb-2">Account</p>
            <h1 className="text-3xl md:text-4xl font-heading font-bold text-foreground">Settings</h1>
            <p className="text-muted-foreground mt-3 max-w-2xl">
              Manage profile preferences, security options, and notification settings.
            </p>
          </div>
        </section>

        <section className="py-10 md:py-12">
          <div className="container mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCog className="h-5 w-5 text-aegean" /> Profile Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-xl border border-border p-4 flex items-center justify-between">
                  <span className="text-sm text-foreground">Display name visibility</span>
                  <Badge variant="outline">Public</Badge>
                </div>
                <Button variant="outline" className="w-full">Edit profile information</Button>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-aegean" /> Security
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-xl border border-border p-4 flex items-center justify-between">
                  <span className="text-sm text-foreground">Session status</span>
                  <Badge className="bg-emerald-500">Active</Badge>
                </div>
                <Button variant="outline" className="w-full">Change password</Button>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-aegean" /> Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-xl border border-border p-4 flex items-center justify-between">
                  <span className="text-sm text-foreground">Booking updates</span>
                  <Badge variant="outline">Email + In-app</Badge>
                </div>
                <Button variant="outline" className="w-full">Notification preferences</Button>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-aegean" /> Privacy
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-xl border border-border p-4">
                  <p className="text-sm text-muted-foreground">Review your data usage and consent preferences.</p>
                </div>
                <Button variant="outline" className="w-full">Privacy controls</Button>
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
