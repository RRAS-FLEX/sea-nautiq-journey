import { supabase } from "./supabase";

export interface BoatReview {
  id: string;
  boatId: string;
  customerName: string;
  rating: number;
  title: string;
  comment: string;
  tripDate: string;
  createdAt: string;
}

export interface ReviewDraftInput {
  bookingId: string;
  boatId: string;
  customerName: string;
  rating: number;
  title: string;
  comment: string;
  tripDate: string;
}

const mapReview = (review: any): BoatReview => ({
  id: review.id,
  boatId: review.boat_id,
  customerName: review.customer_name ?? "Guest",
  rating: Number(review.rating ?? 0),
  title: review.title ?? "Review",
  comment: review.comment ?? "",
  tripDate: review.trip_date ?? review.created_at?.slice(0, 10) ?? "",
  createdAt: review.created_at,
});

export const getAllReviews = async (): Promise<BoatReview[]> => {
  const { data, error } = await (supabase as any).from("reviews").select("*").order("created_at", { ascending: false });
  if (error) {
    throw new Error(error.message || "Failed to load reviews");
  }
  return Array.isArray(data) ? data.map(mapReview) : [];
};

export const getBoatReviews = async (boatId: string): Promise<BoatReview[]> => {
  const { data, error } = await (supabase as any)
    .from("reviews")
    .select("*")
    .eq("boat_id", boatId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message || "Failed to load boat reviews");
  }

  return Array.isArray(data) ? data.map(mapReview) : [];
};

export const getBoatReviewStats = async (boatId: string) => {
  const reviews = await getBoatReviews(boatId);
  const total = reviews.length;
  const averageRating = total > 0
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / total
    : 0;

  return {
    total,
    averageRating,
  };
};

export const addBoatReview = async (input: ReviewDraftInput): Promise<BoatReview> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { data, error } = await (supabase as any)
    .from("reviews")
    .insert({
      booking_id: input.bookingId,
      boat_id: input.boatId,
      customer_id: session?.user?.id ?? null,
      customer_name: input.customerName,
      rating: input.rating,
      title: input.title.trim(),
      comment: input.comment.trim(),
      trip_date: input.tripDate,
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Failed to submit review");
  }

  return mapReview(data);
};
