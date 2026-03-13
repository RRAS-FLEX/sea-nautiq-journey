import destThassos from "@/assets/dest-thassos.jpg";
import destHalkidiki from "@/assets/dest-halkidiki.jpg";
import destMykonos from "@/assets/dest-mykonos.jpg";
import destSantorini from "@/assets/dest-santorini.jpg";
import { supabase } from "@/lib/supabase";
import { resolveStorageImage } from "@/lib/storage-public";

export interface Destination {
  id: string;
  slug: string;
  name: string;
  image: string;
  boats: number;
  description: string;
  bestFor: string;
}

const fallbackDestinations: Destination[] = [
  {
    id: "thassos",
    slug: "thassos",
    name: "Thassos",
    image: resolveStorageImage("thassos/cover.jpg", "destination-images", destThassos),
    boats: 24,
    description: "Crystal-clear bays, pine-lined coast, and relaxed island pacing.",
    bestFor: "Families & first-time boat trips",
  },
  {
    id: "halkidiki",
    slug: "halkidiki",
    name: "Halkidiki",
    image: resolveStorageImage("halkidiki/cover.jpg", "destination-images", destHalkidiki),
    boats: 18,
    description: "Long beaches and scenic peninsulas with calm summer waters.",
    bestFor: "Day cruises & snorkeling",
  },
  {
    id: "mykonos",
    slug: "mykonos",
    name: "Mykonos",
    image: resolveStorageImage("mykonos/cover.jpg", "destination-images", destMykonos),
    boats: 32,
    description: "Vibrant beach culture and iconic sunset routes to nearby islands.",
    bestFor: "Groups & premium experiences",
  },
  {
    id: "santorini",
    slug: "santorini",
    name: "Santorini",
    image: resolveStorageImage("santorini/cover.jpg", "destination-images", destSantorini),
    boats: 28,
    description: "Volcanic cliffs, dramatic caldera views, and signature sunset sailings.",
    bestFor: "Couples & luxury charters",
  },
];

export const getDestinations = async (): Promise<Destination[]> => {
  const { data, error } = await (supabase as any)
    .from("destinations")
    .select("id, slug, name, image, boats, description, best_for")
    .order("display_order", { ascending: true });

  if (error || !Array.isArray(data) || data.length === 0) {
    return fallbackDestinations;
  }

  return data.map((destination: any) => {
    const fallbackImage = fallbackDestinations.find((item) => item.slug === destination.slug)?.image ?? destThassos;

    return {
      id: destination.id,
      slug: destination.slug ?? String(destination.name ?? "destination").toLowerCase(),
      name: destination.name,
      image: resolveStorageImage(destination.image, "destination-images", fallbackImage),
      boats: Number(destination.boats ?? 0),
      description: destination.description ?? "",
      bestFor: destination.best_for ?? "Flexible day trips",
    };
  });
};

export { fallbackDestinations as destinations };