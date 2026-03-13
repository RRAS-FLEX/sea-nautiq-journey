import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";

type BoatRecord = {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  image_url: string | null;
  stripe_link: string | null;
};

type BoatCardProps = {
  boat: BoatRecord;
};

function BoatCard({ boat }: BoatCardProps) {
  const isTrustedStripeLink = (value: string) => {
    try {
      const url = new URL(value);
      return ["https:"].includes(url.protocol) && ["checkout.stripe.com", "buy.stripe.com"].includes(url.hostname);
    } catch {
      return false;
    }
  };

  const isAvailable = Boolean(boat.stripe_link && isTrustedStripeLink(boat.stripe_link));
  const priceLabel = typeof boat.price === "number" ? boat.price.toLocaleString() : "Contact for price";

  const handleBookNow = () => {
    if (!boat.stripe_link) {
      return;
    }

    if (!isTrustedStripeLink(boat.stripe_link)) {
      return;
    }

    window.location.href = boat.stripe_link;
  };

  return (
    <article className="overflow-hidden rounded-3xl border border-border/60 bg-card shadow-sm transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg">
      <div className="aspect-[4/3] overflow-hidden bg-muted">
        {boat.image_url ? (
          <img
            src={boat.image_url}
            alt={boat.name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-muted text-sm text-muted-foreground">
            No image available
          </div>
        )}
      </div>

      <div className="space-y-4 p-5">
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-foreground">{boat.name}</h3>
          {boat.description ? (
            <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">{boat.description}</p>
          ) : null}
        </div>

        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-2xl font-bold text-foreground">€{priceLabel}</p>
            <p className="text-sm text-muted-foreground">per day</p>
          </div>

          <button
            type="button"
            onClick={handleBookNow}
            disabled={!isAvailable}
            className="rounded-full bg-aegean px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-aegean/90 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
          >
            {isAvailable ? "Book Now" : "Unavailable"}
          </button>
        </div>
      </div>
    </article>
  );
}

export default function BoatGallery() {
  const [boats, setBoats] = useState<BoatRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchBoats = async () => {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("boats")
        .select("id, name, description, price, image_url, stripe_link")
        .order("name", { ascending: true });

      if (!isMounted) {
        return;
      }

      if (fetchError) {
        setError(fetchError.message);
        setBoats([]);
        setLoading(false);
        return;
      }

      setBoats((data as BoatRecord[]) ?? []);
      setLoading(false);
    };

    void fetchBoats();

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center">
        <div className="text-sm font-medium text-muted-foreground">Loading boats...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
        Failed to load boats: {error}
      </div>
    );
  }

  if (boats.length === 0) {
    return (
      <div className="rounded-2xl border border-border/60 bg-card p-6 text-sm text-muted-foreground">
        No boats available right now.
      </div>
    );
  }

  return (
    <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
      {boats.map((boat) => (
        <BoatCard key={boat.id} boat={boat} />
      ))}
    </section>
  );
}