// @ts-nocheck
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const CRON_SECRET = Deno.env.get("CRON_SECRET");

// TODO: replace with a real public fuel price API.
const FUEL_PRICE_API_URL = "https://api.example.com/v1/fuel-price";

interface FuelApiResponse {
  price_per_liter: number;
}

serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  if (CRON_SECRET) {
    const headerSecret = req.headers.get("x-cron-secret");
    if (headerSecret !== CRON_SECRET) {
      return new Response("Unauthorized", { status: 401 });
    }
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Missing Supabase env vars");
    return new Response("Server misconfigured", { status: 500 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  try {
    const apiRes = await fetch(FUEL_PRICE_API_URL, {
      headers: { Accept: "application/json" },
    });

    if (!apiRes.ok) {
      const text = await apiRes.text();
      console.error("Fuel API error:", apiRes.status, text);
      return new Response("Failed to fetch fuel price", { status: 502 });
    }

    const json = (await apiRes.json()) as Partial<FuelApiResponse>;
    const price = Number(json.price_per_liter);

    if (!Number.isFinite(price) || price <= 0) {
      console.error("Invalid price payload:", json);
      return new Response("Invalid fuel price response", { status: 500 });
    }

    const { error } = await supabase
      .from("global_settings")
      .upsert(
        [
          {
            key: "oil_price_per_liter",
            value: price,
            updated_at: new Date().toISOString(),
          },
        ],
        { onConflict: "key" },
      );

    if (error) {
      console.error("Failed to update global_settings:", error);
      return new Response("Database update failed", { status: 500 });
    }

    return new Response(JSON.stringify({ ok: true, price }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response("Unexpected error", { status: 500 });
  }
});
