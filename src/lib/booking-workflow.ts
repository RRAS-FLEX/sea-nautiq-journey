import { supabase } from "./supabase";

export type BookingPaymentMethod = "stripe" | "card" | "apple_pay" | "google_pay" | "manual";

export interface BookingRecord {
  id: string;
  createdAt: string;
  boatId: string;
  boatName: string;
  ownerName: string;
  customerName: string;
  customerEmail: string;
  packageLabel: string;
  guests: number;
  date: string;
  departureTime: string;
  departureMarina: string;
  totalPrice: number;
  paymentMethod: BookingPaymentMethod;
  paymentPlan: "deposit" | "full";
  amountDueNow: number;
  depositAmount: number;
  platformCommission: number;
  ownerPayout: number;
  extras: string[];
  notes: string;
  status: "confirmed";
}

export interface OwnerNotification {
  id: string;
  bookingId: string;
  ownerName: string;
  ownerEmail: string;
  subject: string;
  message: string;
  createdAt: string;
  status: "queued";
}

export interface CustomerEmailConfirmation {
  id: string;
  bookingId: string;
  toEmail: string;
  subject: string;
  previewText: string;
  body: string;
  createdAt: string;
  status: "queued";
}

export interface ConfirmBookingInput {
  boatId: string;
  boatName: string;
  ownerName: string;
  customerName: string;
  customerEmail: string;
  packageLabel: string;
  guests: number;
  date: string;
  departureTime: string;
  departureMarina: string;
  totalPrice: number;
  paymentMethod: BookingPaymentMethod;
  paymentPlan: "deposit" | "full";
  amountDueNow: number;
  depositAmount: number;
  platformCommission: number;
  ownerPayout: number;
  extras: string[];
  notes: string;
  queueCustomerEmail: boolean;
}

export interface ConfirmBookingResult {
  booking: BookingRecord;
  ownerNotification: OwnerNotification;
  customerEmail: CustomerEmailConfirmation | null;
}
export const confirmBookingWorkflow = async (input: ConfirmBookingInput): Promise<ConfirmBookingResult> => {
  const timestamp = new Date().toISOString();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { data: bookingRow, error: bookingError } = await (supabase as any)
    .from("bookings")
    .insert({
      boat_id: input.boatId,
      boat_name: input.boatName,
      owner_name: input.ownerName,
      customer_id: session?.user?.id ?? null,
      customer_name: input.customerName,
      customer_email: input.customerEmail,
      package_label: input.packageLabel,
      guests: input.guests,
      start_date: input.date,
      end_date: input.date,
      departure_time: input.departureTime,
      departure_marina: input.departureMarina,
      total_price: input.totalPrice,
      payment_method: input.paymentMethod,
      payment_plan: input.paymentPlan,
      amount_due_now: input.amountDueNow,
      deposit_amount: input.depositAmount,
      platform_commission: input.platformCommission,
      owner_payout: input.ownerPayout,
      extras: input.extras,
      notes: input.notes,
      status: "confirmed",
    })
    .select()
    .single();

  if (bookingError || !bookingRow) {
    throw new Error(bookingError?.message || "Failed to confirm booking");
  }

  await (supabase as any)
    .from("calendar_events")
    .insert({
      boat_id: bookingRow.boat_id,
      date: bookingRow.start_date,
      type: "booked",
      guest_name: bookingRow.customer_name ?? input.customerName,
      booking_id: bookingRow.id,
    });

  const booking: BookingRecord = {
    id: bookingRow.id,
    createdAt: bookingRow.created_at,
    boatId: bookingRow.boat_id,
    boatName: bookingRow.boat_name ?? input.boatName,
    ownerName: bookingRow.owner_name ?? input.ownerName,
    customerName: bookingRow.customer_name ?? input.customerName,
    customerEmail: bookingRow.customer_email ?? input.customerEmail,
    packageLabel: bookingRow.package_label ?? input.packageLabel,
    guests: Number(bookingRow.guests ?? input.guests),
    date: bookingRow.start_date,
    departureTime: bookingRow.departure_time ?? input.departureTime,
    departureMarina: bookingRow.departure_marina ?? input.departureMarina,
    totalPrice: Number(bookingRow.total_price ?? input.totalPrice),
    paymentMethod: (bookingRow.payment_method ?? input.paymentMethod) as BookingPaymentMethod,
    paymentPlan: (bookingRow.payment_plan ?? input.paymentPlan) as "deposit" | "full",
    amountDueNow: Number(bookingRow.amount_due_now ?? input.amountDueNow),
    depositAmount: Number(bookingRow.deposit_amount ?? input.depositAmount),
    platformCommission: Number(bookingRow.platform_commission ?? input.platformCommission),
    ownerPayout: Number(bookingRow.owner_payout ?? input.ownerPayout),
    extras: Array.isArray(bookingRow.extras) ? bookingRow.extras : input.extras,
    notes: bookingRow.notes ?? input.notes,
    status: "confirmed",
  };

  const ownerNotification: OwnerNotification = {
    id: "",
    bookingId: booking.id,
    ownerName: input.ownerName,
    ownerEmail: "owner@nautiq.com",
    subject: `New booking confirmed for ${input.boatName}`,
    message: `${input.customerName} confirmed ${input.packageLabel} on ${input.date} at ${input.departureTime} for ${input.guests} guests. Total: €${input.totalPrice}. Due now: €${input.amountDueNow}. Owner payout: €${input.ownerPayout}.`,
    createdAt: timestamp,
    status: "queued",
  };

  const extrasLine = input.extras.length > 0 ? input.extras.join(", ") : "No add-ons selected";
  const notesLine = input.notes.trim() ? input.notes.trim() : "No special requests added.";
  const customerEmail: CustomerEmailConfirmation | null = input.queueCustomerEmail
    ? {
        id: "",
        bookingId: booking.id,
        toEmail: input.customerEmail,
        subject: `Booking confirmed: ${input.boatName} on ${input.date}`,
        previewText: `Your ${input.packageLabel} trip is confirmed with ${input.ownerName}.`,
        body: [
          `Hi ${input.customerName},`,
          "",
          `Your booking for ${input.boatName} is confirmed.`,
          `Package: ${input.packageLabel}`,
          `Date: ${input.date}`,
          `Departure time: ${input.departureTime}`,
          `Meeting point: ${input.departureMarina}`,
          `Guests: ${input.guests}`,
          `Add-ons: ${extrasLine}`,
          `Special requests: ${notesLine}`,
          `Total confirmed: €${input.totalPrice}`,
          `Paid now (${input.paymentPlan === "deposit" ? "30% deposit" : "full"}): €${input.amountDueNow}`,
          "",
          `Host: ${input.ownerName}`,
          "We have also notified the owner and queued your confirmation email.",
          "",
          "See you on the water,",
          "Nautiq",
        ].join("\n"),
        createdAt: timestamp,
        status: "queued",
      }
    : null;

  const { data: notificationRow } = await (supabase as any)
    .from("owner_notifications")
    .insert({
      booking_id: booking.id,
      owner_name: ownerNotification.ownerName,
      owner_email: ownerNotification.ownerEmail,
      subject: ownerNotification.subject,
      message: ownerNotification.message,
      status: ownerNotification.status,
    })
    .select()
    .single();

  if (notificationRow) {
    ownerNotification.id = notificationRow.id;
  }

  if (customerEmail) {
    const { data: customerEmailRow } = await (supabase as any)
      .from("customer_emails")
      .insert({
        booking_id: booking.id,
        to_email: customerEmail.toEmail,
        subject: customerEmail.subject,
        preview_text: customerEmail.previewText,
        body: customerEmail.body,
        status: customerEmail.status,
      })
      .select()
      .single();

    if (customerEmailRow) {
      customerEmail.id = customerEmailRow.id;
    }
  }

  return {
    booking,
    ownerNotification,
    customerEmail,
  };
};
