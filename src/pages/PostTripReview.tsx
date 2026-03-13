import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Star } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { addBoatReview } from "@/lib/reviews";
import { getBoatById } from "@/lib/boats";
import type { Boat } from "@/lib/boats";
import { useToast } from "@/hooks/use-toast";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useLanguage } from "@/contexts/LanguageContext";

const PostTripReview = () => {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { tl } = useLanguage();

  const bookingId = searchParams.get("bookingId") ?? "";
  const boatId = searchParams.get("boatId") ?? "";
  const [boat, setBoat] = useState<Boat | null>(null);

  useEffect(() => {
    if (boatId) getBoatById(boatId).then(setBoat);
  }, [boatId]);

  const { user: sessionUser } = useCurrentUser();
  const [customerName, setCustomerName] = useState(sessionUser?.name ?? "");
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  useEffect(() => {
    if (sessionUser?.name && !customerName) {
      setCustomerName(sessionUser.name);
    }
  }, [sessionUser, customerName]);

  const submitReview = async () => {
    if (!boat || !customerName.trim() || !title.trim() || !comment.trim()) {
      toast({
        title: tl("Missing review fields", "Λείπουν πεδία αξιολόγησης"),
        description: tl("Add name, title and comment before posting.", "Πρόσθεσε όνομα, τίτλο και σχόλιο πριν την υποβολή."),
        variant: "destructive",
      });
      return;
    }

    await addBoatReview({
      bookingId,
      boatId: boat.id,
      customerName: customerName.trim(),
      rating,
      title: title.trim(),
      comment: comment.trim(),
      tripDate: today,
    });

    setSubmitted(true);
    toast({
      title: tl("Review posted", "Η αξιολόγηση δημοσιεύτηκε"),
      description: tl(`Thanks! Your review for ${boat.name} is now visible.`, `Ευχαριστούμε! Η αξιολόγησή σου για το ${boat.name} είναι πλέον ορατή.`),
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-16">
        <section className="py-14 border-b border-border bg-muted/30">
          <div className="container mx-auto px-4">
            <p className="text-sm text-muted-foreground">{tl("Post-trip review", "Αξιολόγηση μετά την εκδρομή")}</p>
            <h1 className="text-4xl font-heading font-bold text-foreground mt-2">{tl("Share your trip feedback", "Μοιράσου την εμπειρία της εκδρομής σου")}</h1>
            <p className="text-muted-foreground mt-3 max-w-2xl">
              {tl("Your review helps us rank and promote the best boats with real customer quality signals.", "Η αξιολόγησή σου μας βοηθά να αναδεικνύουμε τα καλύτερα σκάφη με πραγματικά δεδομένα ποιότητας από πελάτες.")}
            </p>
          </div>
        </section>

        <section className="py-10">
          <div className="container mx-auto px-4 max-w-2xl">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>{boat ? tl(`Review for ${boat.name}`, `Αξιολόγηση για ${boat.name}`) : tl("Select a valid booking", "Επίλεξε έγκυρη κράτηση")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input value={customerName} onChange={(event) => setCustomerName(event.target.value)} placeholder={tl("Your name", "Το όνομά σου")} />

                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">{tl("Rating", "Βαθμολογία")}</p>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setRating(value)}
                        className={`h-9 w-9 rounded-full border flex items-center justify-center ${
                          rating >= value ? "border-amber-400 text-amber-400" : "border-border text-muted-foreground"
                        }`}
                      >
                        <Star className={`h-4 w-4 ${rating >= value ? "fill-amber-400" : ""}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder={tl("Short title", "Σύντομος τίτλος")} />
                <Textarea value={comment} onChange={(event) => setComment(event.target.value)} placeholder={tl("Tell other travelers what was great about the trip", "Πες στους άλλους ταξιδιώτες τι σου άρεσε περισσότερο στην εκδρομή")} />

                <Button className="w-full bg-gradient-accent text-accent-foreground" onClick={submitReview} disabled={submitted || !boat}>
                  {submitted ? tl("Review submitted", "Η αξιολόγηση υποβλήθηκε") : tl("Submit review", "Υποβολή αξιολόγησης")}
                </Button>

                {boat ? (
                  <Button asChild variant="outline" className="w-full">
                    <Link to={`/boats/${boat.id}`}>{tl("Back to boat profile", "Επιστροφή στο προφίλ σκάφους")}</Link>
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default PostTripReview;
