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

const PostTripReview = () => {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

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
        title: "Missing review fields",
        description: "Add name, title and comment before posting.",
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
      title: "Review posted",
      description: `Thanks! Your review for ${boat.name} is now visible.`,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-16">
        <section className="py-14 border-b border-border bg-muted/30">
          <div className="container mx-auto px-4">
            <p className="text-sm text-muted-foreground">Post-trip review</p>
            <h1 className="text-4xl font-heading font-bold text-foreground mt-2">Share your trip feedback</h1>
            <p className="text-muted-foreground mt-3 max-w-2xl">
              Your review helps us rank and promote the best boats with real customer quality signals.
            </p>
          </div>
        </section>

        <section className="py-10">
          <div className="container mx-auto px-4 max-w-2xl">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>{boat ? `Review for ${boat.name}` : "Select a valid booking"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input value={customerName} onChange={(event) => setCustomerName(event.target.value)} placeholder="Your name" />

                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">Rating</p>
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

                <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Short title" />
                <Textarea value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Tell other travelers what was great about the trip" />

                <Button className="w-full bg-gradient-accent text-accent-foreground" onClick={submitReview} disabled={submitted || !boat}>
                  {submitted ? "Review submitted" : "Submit review"}
                </Button>

                {boat ? (
                  <Button asChild variant="outline" className="w-full">
                    <Link to={`/boats/${boat.id}`}>Back to boat profile</Link>
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
