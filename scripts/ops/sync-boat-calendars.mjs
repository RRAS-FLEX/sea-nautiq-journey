import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();
dotenv.config({ path: ".env.local", override: true });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || "";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const unfoldIcsLines = (text) =>
  String(text || "")
    .replace(/\r/g, "")
    .split("\n")
    .reduce((lines, line) => {
      if ((line.startsWith(" ") || line.startsWith("\t")) && lines.length > 0) {
        lines[lines.length - 1] += line.slice(1);
        return lines;
      }

      lines.push(line);
      return lines;
    }, []);

const parseProperty = (line) => {
  const colonIndex = line.indexOf(":");
  if (colonIndex === -1) return null;

  const rawKey = line.slice(0, colonIndex);
  const value = line.slice(colonIndex + 1);
  const [name, ...rawParams] = rawKey.split(";");
  const params = Object.fromEntries(
    rawParams
      .map((entry) => entry.split("="))
      .filter(([key, paramValue]) => key && typeof paramValue !== "undefined")
      .map(([key, paramValue]) => [key.toUpperCase(), paramValue]),
  );

  return { name: name.toUpperCase(), params, value };
};

const parseIcsDate = (value, params = {}) => {
  const cleaned = String(value || "").trim();
  const isAllDay = params.VALUE === "DATE" || /^\d{8}$/.test(cleaned);

  if (isAllDay) {
    const year = Number(cleaned.slice(0, 4));
    const month = Number(cleaned.slice(4, 6)) - 1;
    const day = Number(cleaned.slice(6, 8));
    return {
      date: new Date(Date.UTC(year, month, day, 0, 0, 0)),
      allDay: true,
      timezone: params.TZID || "UTC",
    };
  }

  const hasZulu = cleaned.endsWith("Z");
  const compact = hasZulu ? cleaned.slice(0, -1) : cleaned;
  const year = Number(compact.slice(0, 4));
  const month = Number(compact.slice(4, 6)) - 1;
  const day = Number(compact.slice(6, 8));
  const hour = Number(compact.slice(9, 11));
  const minute = Number(compact.slice(11, 13));
  const second = Number(compact.slice(13, 15) || 0);

  return {
    date: hasZulu
      ? new Date(`${compact.slice(0, 4)}-${compact.slice(4, 6)}-${compact.slice(6, 8)}T${compact.slice(9, 11)}:${compact.slice(11, 13)}:${compact.slice(13, 15) || "00"}Z`)
      : new Date(Date.UTC(year, month, day, hour, minute, second)),
    allDay: false,
    timezone: params.TZID || "UTC",
  };
};

const parseFeed = (icsText) => {
  const lines = unfoldIcsLines(icsText);
  const events = [];
  let current = null;

  for (const line of lines) {
    if (line === "BEGIN:VEVENT") {
      current = {};
      continue;
    }

    if (line === "END:VEVENT") {
      if (current) {
        events.push(current);
      }
      current = null;
      continue;
    }

    if (!current) continue;

    const property = parseProperty(line);
    if (!property) continue;

    current[property.name] = { value: property.value, params: property.params };
  }

  return events
    .map((event, index) => {
      const startField = event.DTSTART;
      if (!startField?.value) return null;

      const start = parseIcsDate(startField.value, startField.params);
      const endField = event.DTEND;
      const end = endField?.value ? parseIcsDate(endField.value, endField.params) : null;
      const uid = String(event.UID?.value || `ical-${index}-${start.date.toISOString()}`);

      return {
        uid,
        title: String(event.SUMMARY?.value || "Blocked time"),
        description: String(event.DESCRIPTION?.value || "Imported from external iCal feed"),
        location: String(event.LOCATION?.value || ""),
        startTime: start.date.toISOString(),
        endTime: (end?.date ?? new Date(start.date.getTime() + 60 * 60 * 1000)).toISOString(),
        allDay: start.allDay,
        timezone: start.timezone,
      };
    })
    .filter(Boolean);
};

const syncBoatCalendar = async (boat) => {
  if (!boat.external_calendar_url) {
    return { inserted: 0, skipped: true };
  }

  const response = await fetch(boat.external_calendar_url, {
    headers: { Accept: "text/calendar,text/plain;q=0.9,*/*;q=0.8" },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch iCal feed for ${boat.name}: ${response.status} ${response.statusText}`);
  }

  const feedText = await response.text();
  const events = parseFeed(feedText);

  await supabase
    .from("calendar_events")
    .delete()
    .eq("boat_id", boat.id)
    .eq("external_source", "ical");

  if (events.length === 0) {
    return { inserted: 0, skipped: false };
  }

  const rows = events.map((event) => ({
    user_id: boat.owner_id,
    boat_id: boat.id,
    title: event.title,
    description: event.description,
    location: event.location || null,
    start_time: event.startTime,
    end_time: event.endTime,
    all_day: event.allDay,
    timezone: event.timezone,
    event_type: "blocked",
    external_source: "ical",
    external_source_uid: event.uid,
    external_source_url: boat.external_calendar_url,
  }));

  const { error } = await supabase.from("calendar_events").insert(rows);
  if (error) {
    throw new Error(error.message || `Failed to insert imported events for ${boat.name}`);
  }

  return { inserted: rows.length, skipped: false };
};

const main = async () => {
  const { data: boats, error } = await supabase
    .from("boats")
    .select("id, owner_id, name, external_calendar_url")
    .not("external_calendar_url", "is", null);

  if (error) {
    throw new Error(error.message || "Failed to load boats for iCal sync");
  }

  const syncableBoats = Array.isArray(boats) ? boats : [];
  let imported = 0;

  for (const boat of syncableBoats) {
    try {
      const result = await syncBoatCalendar(boat);
      imported += result.inserted;
      if (!result.skipped) {
        console.log(`Synced ${boat.name}: ${result.inserted} imported blocks`);
      }
    } catch (syncError) {
      console.error(syncError instanceof Error ? syncError.message : syncError);
    }
  }

  console.log(`Calendar sync complete. Imported ${imported} external blocks.`);
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
