import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import Stripe from "stripe";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local", override: true });

const requiredEnv = [
  "STRIPE_SECRET_KEY",
  "STRIPE_PUBLISHABLE_KEY",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
];

const hasPlaceholderValue = (value) => {
  const normalized = String(value ?? "").trim().toLowerCase();
  return (
    normalized.length === 0 ||
    normalized.includes("your-project") ||
    normalized.includes("your_supabase") ||
    normalized.includes("your-stripe") ||
    normalized.includes("your_stripe") ||
    normalized.includes("placeholder") ||
    normalized.includes("changeme")
  );
};

for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

const hasValidSupabaseAdminConfig =
  !hasPlaceholderValue(process.env.SUPABASE_URL) &&
  !hasPlaceholderValue(process.env.SUPABASE_SERVICE_ROLE_KEY);

const hasValidStripeConfig =
  !hasPlaceholderValue(process.env.STRIPE_SECRET_KEY) &&
  !hasPlaceholderValue(process.env.STRIPE_PUBLISHABLE_KEY);

const getSupabaseConfigErrorMessage = () =>
  "Supabase admin is not configured. Set real SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY values in .env/.env.local (do not use placeholder values).";

const getStripeConfigErrorMessage = () =>
  "Stripe is not configured. Set real STRIPE_SECRET_KEY and STRIPE_PUBLISHABLE_KEY values in .env/.env.local (do not use placeholder values).";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-02-24.acacia",
});

const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const app = express();
const port = Number(process.env.API_PORT ?? 4242);

app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(",").map((entry) => entry.trim()).filter(Boolean) ?? true,
  credentials: false,
}));

app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return res.status(500).json({ error: "STRIPE_WEBHOOK_SECRET is not configured." });
  }

  const signature = req.headers["stripe-signature"];
  if (!signature || Array.isArray(signature)) {
    return res.status(400).json({ error: "Missing Stripe signature." });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid webhook payload";
    return res.status(400).json({ error: message });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const bookingId = session.metadata?.bookingId;

    if (bookingId) {
      const updatePayload = {
        status: "confirmed",
        stripe_session_id: session.id,
        stripe_payment_intent_id: typeof session.payment_intent === "string" ? session.payment_intent : null,
      };

      const { error } = await supabaseAdmin
        .from("bookings")
        .update(updatePayload)
        .eq("id", bookingId);

      if (error) {
        await supabaseAdmin
          .from("bookings")
          .update({ status: "confirmed" })
          .eq("id", bookingId);
      }
    }
  }

  return res.json({ received: true });
});

app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/stripe/config", (_req, res) => {
  res.json({ publishableKey: process.env.STRIPE_PUBLISHABLE_KEY });
});

const createConnectAccountSchema = z.object({
  ownerId: z.string().min(1),
  email: z.string().email().optional(),
  country: z.string().length(2).optional(),
});

app.post("/api/stripe/connect/accounts", async (req, res) => {
  if (!hasValidStripeConfig) {
    return res.status(500).json({ error: getStripeConfigErrorMessage() });
  }

  const parsed = createConnectAccountSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request body", details: parsed.error.flatten() });
  }

  const { ownerId, email, country } = parsed.data;

  const { data: owner, error: ownerError } = await supabaseAdmin
    .from("users")
    .select("id, email, stripe_account_id")
    .eq("id", ownerId)
    .single();

  if (ownerError || !owner) {
    return res.status(404).json({ error: "Owner not found" });
  }

  if (owner.stripe_account_id) {
    return res.json({ stripeAccountId: owner.stripe_account_id, alreadyExists: true });
  }

  try {
    const account = await stripe.accounts.create({
      type: "express",
      country: (country ?? "GR").toUpperCase(),
      email: email ?? owner.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });

    const { error: updateError } = await supabaseAdmin
      .from("users")
      .update({ stripe_account_id: account.id })
      .eq("id", ownerId);

    if (updateError) {
      return res.status(500).json({ error: `Failed to persist stripe account id: ${updateError.message}` });
    }

    return res.status(201).json({ stripeAccountId: account.id, alreadyExists: false });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create Stripe Connect account";
    return res.status(500).json({ error: message });
  }
});

const onboardingLinkSchema = z.object({
  ownerId: z.string().min(1),
  refreshUrl: z.string().url(),
  returnUrl: z.string().url(),
});

app.post("/api/stripe/connect/onboarding-link", async (req, res) => {
  if (!hasValidStripeConfig) {
    return res.status(500).json({ error: getStripeConfigErrorMessage() });
  }

  const parsed = onboardingLinkSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request body", details: parsed.error.flatten() });
  }

  const { ownerId, refreshUrl, returnUrl } = parsed.data;

  const { data: owner, error: ownerError } = await supabaseAdmin
    .from("users")
    .select("stripe_account_id")
    .eq("id", ownerId)
    .single();

  if (ownerError || !owner) {
    return res.status(404).json({ error: "Owner not found" });
  }

  if (!owner.stripe_account_id) {
    return res.status(400).json({ error: "Owner does not have a Stripe Connect account yet." });
  }

  try {
    const link = await stripe.accountLinks.create({
      account: owner.stripe_account_id,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: "account_onboarding",
    });

    return res.json({ url: link.url, expiresAt: link.expires_at });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create onboarding link";
    return res.status(500).json({ error: message });
  }
});

const createCheckoutSchema = z.object({
  boatId: z.string().min(1),
  boatName: z.string().min(1).optional(),
  customerEmail: z.string().email().optional(),
  bookingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  departureTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
  packageHours: z.number().min(1).max(8).optional(),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

app.post("/api/stripe/create-checkout", async (req, res) => {
  if (!hasValidStripeConfig) {
    return res.status(500).json({ error: getStripeConfigErrorMessage() });
  }

  if (!hasValidSupabaseAdminConfig) {
    return res.status(500).json({ error: getSupabaseConfigErrorMessage() });
  }

  const parsed = createCheckoutSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request body", details: parsed.error.flatten() });
  }

  const {
    boatId,
    boatName,
    customerEmail,
    bookingDate,
    departureTime,
    packageHours,
    successUrl,
    cancelUrl,
  } = parsed.data;

  const { data: boatById, error: boatByIdError } = await supabaseAdmin
    .from("boats")
    .select("id, name, owner_id, price_per_day")
    .eq("id", boatId)
    .maybeSingle();

  let boat = boatById;

  if (!boat && boatName) {
    const { data: boatByName, error: boatByNameError } = await supabaseAdmin
      .from("boats")
      .select("id, name, owner_id, price_per_day")
      .eq("name", boatName)
      .limit(1)
      .maybeSingle();

    if (boatByName) {
      boat = boatByName;
    }

    if (!boat && boatByNameError) {
      const message = String(boatByNameError.message ?? "Boat lookup failed");
      const normalized = message.toLowerCase();
      if (normalized.includes("fetch failed") || normalized.includes("network") || normalized.includes("failed to fetch")) {
        return res.status(500).json({
          error: `${message}. ${getSupabaseConfigErrorMessage()}`,
        });
      }

      return res.status(500).json({ error: `Boat lookup failed: ${message}` });
    }
  }

  if (!boat && boatByIdError) {
    const message = String(boatByIdError.message ?? "Boat lookup failed");
    const normalized = message.toLowerCase();
    if (normalized.includes("fetch failed") || normalized.includes("network") || normalized.includes("failed to fetch")) {
      return res.status(500).json({
        error: `${message}. ${getSupabaseConfigErrorMessage()}`,
      });
    }

    if (normalized.includes("invalid input syntax") || normalized.includes("not found") || normalized.includes("no rows")) {
      return res.status(404).json({ error: "Boat not found" });
    }

    return res.status(500).json({ error: `Boat lookup failed: ${message}` });
  }

  if (!boat) {
    return res.status(404).json({ error: "Boat not found" });
  }

  const dynamicPrice = Number(boat.price_per_day ?? 0);
  if (!Number.isFinite(dynamicPrice) || dynamicPrice <= 0) {
    return res.status(400).json({ error: "Boat has no valid dynamic price (expected price_per_day)" });
  }

  const { data: owner, error: ownerError } = await supabaseAdmin
    .from("users")
    .select("id, stripe_account_id")
    .eq("id", boat.owner_id)
    .single();

  if (ownerError || !owner) {
    return res.status(404).json({ error: "Boat owner not found" });
  }

  const allowPlatformFallback = String(process.env.STRIPE_ALLOW_PLATFORM_FALLBACK ?? "true").toLowerCase() !== "false";
  const canTransferToOwner = Boolean(owner.stripe_account_id);

  if (!canTransferToOwner && !allowPlatformFallback) {
    return res.status(400).json({ error: "Boat owner has not completed Stripe Connect onboarding" });
  }

  const amountCents = Math.round(dynamicPrice * 100);
  // Platform commission is fixed at 20% of the boat dynamic price.
  const applicationFeeAmount = Math.round(amountCents * 0.2);

  const todayIso = new Date().toISOString().slice(0, 10);
  const selectedDate = bookingDate ?? todayIso;
  const selectedDepartureTime = departureTime ?? "10:00";
  const selectedPackageHours = Math.max(1, Math.min(8, Number(packageHours ?? 1)));

  const [hourPart, minutePart] = selectedDepartureTime.split(":").map((part) => Number(part));
  const endMinutesRaw = ((hourPart * 60) + minutePart + (selectedPackageHours * 60)) % (24 * 60);
  const endHour = String(Math.floor(endMinutesRaw / 60)).padStart(2, "0");
  const endMinute = String(endMinutesRaw % 60).padStart(2, "0");
  const selectedEndTime = `${endHour}:${endMinute}`;

  const normalizedCustomerEmail = customerEmail?.trim().toLowerCase();

  const holdMinutesRaw = Number(process.env.STRIPE_PENDING_HOLD_MINUTES ?? 5);
  const holdMinutes = Number.isFinite(holdMinutesRaw) && holdMinutesRaw > 0 ? holdMinutesRaw : 5;
  const staleCutoffIso = new Date(Date.now() - (holdMinutes * 60 * 1000)).toISOString();
  await supabaseAdmin
    .from("bookings")
    .update({ status: "cancelled" })
    .eq("boat_id", boat.id)
    .eq("start_date", selectedDate)
    .eq("status", "pending")
    .lt("created_at", staleCutoffIso)
    .is("stripe_payment_intent_id", null);

  await supabaseAdmin
    .from("bookings")
    .update({ status: "cancelled" })
    .eq("boat_id", boat.id)
    .eq("start_date", selectedDate)
    .eq("status", "pending")
    .is("departure_time", null)
    .lt("created_at", staleCutoffIso)
    .is("stripe_payment_intent_id", null);

  const findReusablePendingBooking = async () => {
    if (normalizedCustomerEmail) {
      const { data: byEmail } = await supabaseAdmin
        .from("bookings")
        .select("id")
        .eq("boat_id", boat.id)
        .eq("start_date", selectedDate)
        .eq("departure_time", selectedDepartureTime)
        .eq("status", "pending")
        .eq("customer_email", normalizedCustomerEmail)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (byEmail) {
        return byEmail;
      }
    }

    const { data: byNullEmail } = await supabaseAdmin
      .from("bookings")
      .select("id")
      .eq("boat_id", boat.id)
      .eq("start_date", selectedDate)
      .eq("departure_time", selectedDepartureTime)
      .eq("status", "pending")
      .is("customer_email", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    return byNullEmail ?? null;
  };

  let bookingRow = null;
  bookingRow = await findReusablePendingBooking();

  if (!bookingRow) {
    const { data: createdBooking, error: bookingError } = await supabaseAdmin
      .from("bookings")
      .insert({
        boat_id: boat.id,
        customer_id: null,
        customer_email: normalizedCustomerEmail ?? null,
        start_date: selectedDate,
        end_date: selectedDate,
        departure_time: selectedDepartureTime,
        start_time: selectedDepartureTime,
        end_time: selectedEndTime,
        package_hours: selectedPackageHours,
        total_price: dynamicPrice,
        status: "pending",
      })
      .select("id")
      .single();

    if (bookingError || !createdBooking) {
      const message = bookingError?.message ?? "Failed to create pending booking";
      if (message.includes("OVERLAP_BLOCKED")) {
        const fallbackPending = await findReusablePendingBooking();

        if (fallbackPending) {
          bookingRow = fallbackPending;
        } else {
          return res.status(409).json({ error: message });
        }
      } else {
        return res.status(500).json({ error: message });
      }
    }

    if (createdBooking) {
      bookingRow = createdBooking;
    }
  }

  try {
    const appBaseUrl = process.env.APP_BASE_URL ?? "http://localhost:8080";
    const paymentIntentData = canTransferToOwner
      ? {
          // Stripe Connect split payment:
          // - `application_fee_amount` keeps the platform commission.
          // - `transfer_data.destination` sends the remaining funds to the owner.
          application_fee_amount: applicationFeeAmount,
          transfer_data: {
            destination: owner.stripe_account_id,
          },
          metadata: {
            bookingId: bookingRow.id,
            boatId: boat.id,
          },
        }
      : {
          metadata: {
            bookingId: bookingRow.id,
            boatId: boat.id,
            payoutMode: "platform_only",
          },
        };

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      // Stripe Checkout uses `card` to support card entry plus Apple Pay / Google Pay
      // automatically when wallet/domain prerequisites are satisfied in Stripe.
      payment_method_types: ["card"],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "eur",
            unit_amount: amountCents,
            product_data: {
              name: `${boat.name} booking`,
              description: `Boat booking payment for ${boat.name}`,
            },
          },
        },
      ],
      customer_email: customerEmail,
      success_url: `${successUrl ?? `${appBaseUrl}/booking-confirmed`}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl ?? `${appBaseUrl}/booking`,
      metadata: {
        boatId: boat.id,
        ownerId: owner.id,
        bookingId: bookingRow.id,
        payoutMode: canTransferToOwner ? "connect_split" : "platform_only",
      },
      payment_intent_data: paymentIntentData,
    });

    await supabaseAdmin
      .from("bookings")
      .update({ stripe_session_id: checkoutSession.id })
      .eq("id", bookingRow.id);

    return res.json({
      sessionId: checkoutSession.id,
      checkoutUrl: checkoutSession.url,
      bookingId: bookingRow.id,
      amount: dynamicPrice,
      commissionAmount: applicationFeeAmount / 100,
      ownerStripeAccountId: owner.stripe_account_id,
      payoutMode: canTransferToOwner ? "connect_split" : "platform_only",
      warning: canTransferToOwner ? null : "Owner has not completed Stripe Connect onboarding. Funds are collected on platform account.",
    });
  } catch (error) {
    await supabaseAdmin
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("id", bookingRow.id);

    const message = error instanceof Error ? error.message : "Failed to create Stripe Checkout session";
    return res.status(500).json({ error: message });
  }
});

app.listen(port, () => {
  console.log(`Stripe API running on http://localhost:${port}`);
});
