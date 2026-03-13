import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { getMyOwnerApplication, submitOwnerApplication } from "@/lib/owner-applications";

const BecomeOwner = () => {
  const { user, isLoading } = useCurrentUser();
  const { toast } = useToast();
  const [operatingArea, setOperatingArea] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");
  const [boatCount, setBoatCount] = useState("");
  const [notes, setNotes] = useState("");
  const [applicationStatus, setApplicationStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!user?.id || user.isOwner) {
      return;
    }

    let cancelled = false;

    const loadApplication = async () => {
      try {
        const application = await getMyOwnerApplication();
        if (!cancelled) {
          setApplicationStatus(application?.status ?? null);
        }
      } catch (error) {
        console.error("Failed to load owner application:", error);
      }
    };

    loadApplication();

    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.isOwner]);

  const handleSubmit = async () => {
    if (!operatingArea.trim() || !yearsExperience.trim() || !boatCount.trim()) {
      toast({
        title: "Missing application details",
        description: "Add your operating area, experience and intended fleet size.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const application = await submitOwnerApplication({
        operatingArea,
        yearsExperience,
        boatCount,
        notes,
      });
      setApplicationStatus(application.status);
      toast({
        title: "Application submitted",
        description: "Your owner onboarding request is now waiting for admin review.",
      });
    } catch (error) {
      toast({
        title: "Application failed",
        description: error instanceof Error ? error.message : "Failed to submit owner application.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-16">
        <section className="border-b border-border bg-muted/30 py-12">
          <div className="container mx-auto px-4 max-w-3xl">
            <p className="text-sm text-muted-foreground">Owner onboarding</p>
            <h1 className="mt-2 text-4xl font-heading font-bold text-foreground">Apply to list boats on Nautiq</h1>
            <p className="mt-3 text-muted-foreground">
              This replaces the old one-click owner switch. Submit your operating details first, then an admin approves the account before owner tools unlock.
            </p>
          </div>
        </section>

        <section className="py-10">
          <div className="container mx-auto px-4 max-w-3xl">
            {!user && !isLoading ? (
              <Card className="shadow-card">
                <CardContent className="pt-6 space-y-4">
                  <p className="text-muted-foreground">Sign in before starting an owner application.</p>
                  <Button asChild className="bg-gradient-accent text-accent-foreground">
                    <Link to="/">Back to home</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : user?.isOwner ? (
              <Card className="shadow-card">
                <CardContent className="pt-6 space-y-4">
                  <p className="font-semibold text-foreground">Your account is already approved as an owner.</p>
                  <Button asChild className="bg-gradient-accent text-accent-foreground">
                    <Link to="/owner-dashboard">Open owner dashboard</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                <Card className="shadow-card-hover">
                  <CardHeader>
                    <CardTitle>Application form</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="operating-area">Operating area</Label>
                        <Input id="operating-area" value={operatingArea} onChange={(event) => setOperatingArea(event.target.value)} placeholder="Thassos, Halkidiki, Athens Riviera" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="years-experience">Years of experience</Label>
                        <Input id="years-experience" value={yearsExperience} onChange={(event) => setYearsExperience(event.target.value)} placeholder="5 years" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="boat-count">How many boats will you list?</Label>
                      <Input id="boat-count" value={boatCount} onChange={(event) => setBoatCount(event.target.value)} placeholder="1 to 3 boats" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="notes">Notes for the review team</Label>
                      <Textarea id="notes" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Tell us about licenses, crew, or anything the admin should know." />
                    </div>
                    <Button className="w-full bg-gradient-accent text-accent-foreground" onClick={handleSubmit} disabled={isSubmitting || applicationStatus === "pending"}>
                      {applicationStatus === "pending" ? "Application pending review" : isSubmitting ? "Submitting" : "Submit application"}
                    </Button>
                  </CardContent>
                </Card>

                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle>Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      {applicationStatus === "approved"
                        ? "Approved. Refresh your session if owner tools are not visible yet."
                        : applicationStatus === "rejected"
                          ? "Rejected. Update your details and submit a new request."
                          : applicationStatus === "pending"
                            ? "Pending admin review."
                            : "No application submitted yet."}
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default BecomeOwner;