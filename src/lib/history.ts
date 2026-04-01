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

export interface OwnerSalesHistoryItem {
  id: string;
  boatId: string;
  boatName: string;
  customerName: string;
  packageLabel: string;
  startDate: string;
  status: string;
  totalPrice: number;
}

export interface CancelBookingResult {
  bookingId: string;
  status: string;
  alreadyCancelled: boolean;
  refundAmount: number;
  refundRatePercent: number;
  refundStatus: string;
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

export const getOwnerSalesHistory = async (): Promise<OwnerSalesHistoryItem[]> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    return [];
  }

  const ownerId = session.user.id;

  const { data: ownerBoats, error: boatsError } = await (supabase as any)
    .from("boats")
    .select("id")
    .eq("owner_id", ownerId);

  if (boatsError) {
    throw new Error(boatsError.message || "Failed to load owner boats");
  }

  const boatIds = Array.isArray(ownerBoats)
    ? ownerBoats.map((boat: any) => boat.id).filter(Boolean)
    : [];

  if (boatIds.length === 0) {
    return [];
  }

  const { data: bookingsData, error: bookingsError } = await (supabase as any)
    .from("bookings")
    .select("id, boat_id, boat_name, customer_name, package_label, start_date, status, total_price")
    .in("boat_id", boatIds)
    .order("start_date", { ascending: false });

  if (bookingsError) {
    throw new Error(bookingsError.message || "Failed to load owner sales history");
  }

  return Array.isArray(bookingsData)
    ? bookingsData.map((booking: any) => ({
        id: booking.id,
        boatId: booking.boat_id,
        boatName: booking.boat_name ?? "Boat",
        customerName: booking.customer_name ?? "Guest",
        packageLabel: booking.package_label ?? "Custom booking",
        startDate: booking.start_date,
        status: booking.status ?? "confirmed",
        totalPrice: Number(booking.total_price ?? 0),
      }))
    : [];
};

export const cancelCustomerBooking = async (input: {
  bookingId: string;
  reason?: string;
}): Promise<CancelBookingResult> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    throw new Error("You must be signed in to cancel a booking.");
  }

  const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? "").trim();
  const cancelEndpoint = apiBaseUrl
    ? `${apiBaseUrl.replace(/\/$/, "")}/api/bookings/cancel`
    : "/api/bookings/cancel";

  const response = await fetch(cancelEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      bookingId: input.bookingId,
      customerId: session.user.id,
      customerEmail: session.user.email ?? undefined,
      reason: input.reason,
    }),
  });

  const raw = await response.text();
  let payload: Partial<CancelBookingResult> & { error?: string } = {};
  if (raw) {
    try {
      payload = JSON.parse(raw);
    } catch {
      throw new Error("Cancellation API returned a non-JSON response.");
    }
  }

  if (!response.ok) {
    throw new Error(payload.error ?? "Failed to cancel booking");
  }

  return {
    bookingId: String(payload.bookingId ?? input.bookingId),
    status: String(payload.status ?? "cancelled"),
    alreadyCancelled: Boolean(payload.alreadyCancelled),
    refundAmount: Number(payload.refundAmount ?? 0),
    refundRatePercent: Number(payload.refundRatePercent ?? 0),
    refundStatus: String(payload.refundStatus ?? "none"),
  };
};