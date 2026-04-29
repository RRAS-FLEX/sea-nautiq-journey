import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseUrl || !serviceRoleKey) {
  console.warn("Booking notification worker is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to enable it.");
}

const supabase = createClient(supabaseUrl || "https://example.supabase.co", serviceRoleKey || "placeholder-key", {
  auth: { persistSession: false, autoRefreshToken: false },
});

const minutesBetween = (start, end) => Math.round((end.getTime() - start.getTime()) / 60000);

const buildTripStart = (booking) => {
  const datePart = booking.start_date || booking.trip_start?.slice?.(0, 10);
  const timePart = booking.start_time || booking.departure_time || "09:00:00";
  return new Date(`${datePart}T${timePart.length === 5 ? `${timePart}:00` : timePart}`);
};

const buildTripEnd = (booking) => {
  const datePart = booking.end_date || booking.trip_end?.slice?.(0, 10) || booking.start_date;
  const timePart = booking.end_time || "17:00:00";
  return new Date(`${datePart}T${timePart.length === 5 ? `${timePart}:00` : timePart}`);
};

const sendDockLocationMessage = async (booking) => {
  console.log(`[TODO] Send dock location message to ${booking.customer_email} for booking ${booking.id}`);
  console.log(`Dock / marina: ${booking.departure_marina || booking.dock_location || "TBD"}`);
};

const sendReviewRequestMessage = async (booking) => {
  console.log(`[TODO] Send review request to ${booking.customer_email} for booking ${booking.id}`);
};

const fetchBookingsForReminderWindow = async (startWindow, endWindow) => {
  const { data, error } = await supabase
    .from("bookings")
    .select("id, customer_email, customer_name, start_date, start_time, end_date, end_time, departure_marina, boat_id, departure_time, trip_start, trip_end, status")
    .eq("status", "confirmed")
    .gte("start_date", startWindow.toISOString().slice(0, 10))
    .lte("start_date", endWindow.toISOString().slice(0, 10));

  if (error) {
    throw new Error(error.message || "Failed to load bookings for the notification worker");
  }

  return Array.isArray(data) ? data : [];
};

const run = async () => {
  const now = new Date();
  const dockWindowStart = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const dockWindowEnd = new Date(dockWindowStart.getTime() + 15 * 60 * 1000);
  const reviewWindowStart = new Date(now.getTime() - 60 * 60 * 1000);
  const reviewWindowEnd = new Date(reviewWindowStart.getTime() + 15 * 60 * 1000);

  const bookings = await fetchBookingsForReminderWindow(dockWindowStart, reviewWindowEnd);

  for (const booking of bookings) {
    const tripStart = buildTripStart(booking);
    const tripEnd = buildTripEnd(booking);

    if (tripStart >= dockWindowStart && tripStart < dockWindowEnd) {
      console.log(`Dock reminder candidate (${minutesBetween(now, tripStart)} minutes out): ${booking.id}`);
      await sendDockLocationMessage(booking);
    }

    if (tripEnd >= reviewWindowStart && tripEnd < reviewWindowEnd) {
      console.log(`Review request candidate (${minutesBetween(tripEnd, now)} minutes ago): ${booking.id}`);
      await sendReviewRequestMessage(booking);
    }
  }
};

run().catch((error) => {
  console.error("Booking notification worker failed", error);
  process.exitCode = 1;
});
