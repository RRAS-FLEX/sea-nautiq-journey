import type { Boat } from "@/lib/boats";

export interface PromotedBoatScore {
  boatId: string;
  score: number;
}

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

export const calculateBoatPromotionScore = (boat: Boat): number => {
  const tripsHosted = boat.owner.tripsHosted;
  const pseudoDaysSince = Math.max(0, 365 - tripsHosted);
  const latestReviewScore = clamp(10 - pseudoDaysSince * 0.02, 0, 10);

  const reviewVolumeBoost = clamp(tripsHosted * 0.08, 0, 18);
  const reviewQualityScore = boat.rating * 12;
  const responseScore = boat.owner.responseRate * 0.18;
  const reliabilityScore = clamp(tripsHosted * 0.05, 0, 15);
  const baseRatingScore = boat.rating * 10;

  return Number(
    (
      reviewQualityScore +
      reviewVolumeBoost +
      responseScore +
      reliabilityScore +
      baseRatingScore +
      latestReviewScore
    ).toFixed(2)
  );
};

export const sortBoatsByPromotionScore = (items: Boat[]): Boat[] =>
  [...items].sort((a, b) => calculateBoatPromotionScore(b) - calculateBoatPromotionScore(a));

export const calculateBoatDemandScore = (boat: Boat): number => {
  const bookingsScore = clamp(boat.bookings, 0, 10000) * 55;
  const revenueScore = clamp(boat.revenue, 0, 10_000_000) * 0.05;
  const ratingScore = clamp(boat.rating, 0, 5) * 35;
  const hostResponseScore = clamp(boat.owner.responseRate, 0, 100) * 0.2;
  return Number((bookingsScore + revenueScore + ratingScore + hostResponseScore).toFixed(2));
};

export const sortBoatsByBookingsFirst = (items: Boat[]): Boat[] =>
  [...items].sort((a, b) => {
    if (b.bookings !== a.bookings) {
      return b.bookings - a.bookings;
    }

    if (b.revenue !== a.revenue) {
      return b.revenue - a.revenue;
    }

    return calculateBoatDemandScore(b) - calculateBoatDemandScore(a);
  });
