import { getBoats } from "@/lib/boats";
import type { Boat, BoatOwner } from "@/lib/boats";

export const toOwnerSlug = (ownerName: string) =>
  (ownerName
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/(^-|-$)/g, "")) || "owner";

export const getOwnerFleetBySlug = async (
  ownerSlug: string,
): Promise<{ ownerName: string; owner: BoatOwner | undefined; fleet: Boat[] }> => {
  const allBoats = await getBoats();
  const normalizedOwnerSlug = decodeURIComponent(ownerSlug || "").trim();
  const fleet = allBoats.filter((b) => toOwnerSlug(b.owner.name) === normalizedOwnerSlug);
  return {
    ownerName: fleet[0]?.owner.name ?? "",
    fleet,
    owner: fleet[0]?.owner,
  };
};

export const getUniqueOwners = async () => {
  const allBoats = await getBoats();
  const names = Array.from(new Set(allBoats.map((boat) => boat.owner.name)));
  return names.map((name) => {
    const ownerBoats = allBoats.filter((boat) => boat.owner.name === name);
    return {
      name,
      slug: toOwnerSlug(name),
      owner: ownerBoats[0]?.owner,
      fleetCount: ownerBoats.length,
      locations: Array.from(new Set(ownerBoats.map((boat) => boat.location))),
    };
  });
};
