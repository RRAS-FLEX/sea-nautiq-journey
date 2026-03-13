import { supabase } from "@/lib/supabase";

export interface CustomerHistoryItem {
  id: string;
  boatId: string;
  boatName: string;
  ownerName: string;
  packageLabel: string;
  startDate: string;
  status: string;
  totalPrice: number;
  hasReview: boolean;
}

export const getCustomerBookingHistory = async (): Promise<CustomerHistoryItem[]> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    return [];
  }

  const [bookingsResult, reviewsResult] = await Promise.all([
    (supabase as any)
      .from("bookings")
      .select("id, boat_id, boat_name, owner_name, package_label, start_date, status, total_price")
      .eq("customer_id", session.user.id)
      .order("start_date", { ascending: false }),
    (supabase as any)
      .from("reviews")
      .select("booking_id")
      .eq("customer_id", session.user.id),
  ]);

  if (bookingsResult.error) {
    throw new Error(bookingsResult.error.message || "Failed to load booking history");
  }

  if (reviewsResult.error) {
    throw new Error(reviewsResult.error.message || "Failed to load review history");
  }

  const reviewIds = new Set(
    Array.isArray(reviewsResult.data)
      ? reviewsResult.data.map((review: any) => review.booking_id).filter(Boolean)
      : [],
  );

  return Array.isArray(bookingsResult.data)
    ? bookingsResult.data.map((booking: any) => ({
        id: booking.id,
        boatId: booking.boat_id,
        boatName: booking.boat_name ?? "Boat",
        ownerName: booking.owner_name ?? "Owner",
        packageLabel: booking.package_label ?? "Custom booking",
        startDate: booking.start_date,
        status: booking.status ?? "confirmed",
        totalPrice: Number(booking.total_price ?? 0),
        hasReview: reviewIds.has(booking.id),
      }))
    : [];
};