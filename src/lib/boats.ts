import { supabase } from "./supabase";
import { resolveStorageImage } from "./storage-public";

export interface BoatOwner {
	name: string;
	title: string;
	joinedYear: number;
	tripsHosted: number;
	responseRate: number;
	bio: string;
	languages: string[];
	isSuperhost: boolean;
}

export interface Boat {
	id: string;
	image: string;
	name: string;
	type: string;
	lengthMeters: number;
	year: number;
	cruisingSpeedKnots: number;
	fuelBurnLitresPerHour: number;
	capacity: number;
	location: string;
	departureMarina: string;
	pricePerDay: number;
	rating: number;
	description: string;
	amenities: string[];
	cancellationPolicy: string;
	responseTime: string;
	owner: BoatOwner;
	availability: {
		unavailableDates: string[];
		minNoticeHours: number;
	};
	mapQuery: string;
}

const mapRow = (row: any): Boat => ({
	id: row.id,
 image: resolveStorageImage(row.image, "boat-images"),
	name: row.name,
	type: row.type,
	lengthMeters: Number(row.length_meters ?? 0),
	year: Number(row.year ?? 0),
	cruisingSpeedKnots: Number(row.cruising_speed_knots ?? 0),
	fuelBurnLitresPerHour: Number(row.fuel_burn_litres_per_hour ?? 0),
	capacity: Number(row.capacity),
	location: row.location,
	departureMarina: row.departure_marina ?? row.location,
	pricePerDay: Number(row.price_per_day),
	rating: Number(row.rating ?? 0),
	description: row.description ?? "",
	amenities: (row.boat_features ?? []).map((f: any) => f.feature),
	cancellationPolicy: row.cancellation_policy ?? "Contact owner for details",
	responseTime: row.response_time ?? "",
	owner: {
		name: row.users?.name ?? "Owner",
		title: row.users?.owner_title ?? "Boat Owner",
		joinedYear: row.users?.created_at
			? new Date(row.users.created_at).getFullYear()
			: new Date().getFullYear(),
		tripsHosted: Number(row.bookings ?? 0),
		responseRate: Number(row.users?.response_rate ?? 95),
		bio: row.users?.owner_bio ?? "",
		languages: row.users?.owner_languages ?? ["English"],
		isSuperhost: row.users?.is_superhost ?? false,
	},
	availability: {
		unavailableDates: row.unavailable_dates ?? [],
		minNoticeHours: Number(row.min_notice_hours ?? 24),
	},
	mapQuery: row.map_query ?? `${row.location}, Greece`,
});

const BOAT_SELECT =
	"*, boat_features(feature), users(name, owner_title, owner_bio, owner_languages, is_superhost, response_rate, created_at)";
const BOAT_SELECT_FALLBACK =
	"id, name, type, location, capacity, price_per_day, rating, image, bookings, users(name, created_at), boat_features(feature)";

export const getBoats = async (): Promise<Boat[]> => {
	const { data, error } = await (supabase as any)
		.from("boats")
		.select(BOAT_SELECT)
		.eq("status", "active")
		.order("rating", { ascending: false });

	if (!error) {
		return (data ?? []).map(mapRow);
	}

	const { data: fallbackData, error: fallbackError } = await (supabase as any)
		.from("boats")
		.select(BOAT_SELECT_FALLBACK)
		.eq("status", "active")
		.order("rating", { ascending: false });

	if (fallbackError) {
		throw new Error(fallbackError.message);
	}

	return (fallbackData ?? []).map(mapRow);
};

export const getBoatById = async (id: string): Promise<Boat | null> => {
	const { data, error } = await (supabase as any)
		.from("boats")
		.select(BOAT_SELECT)
		.eq("id", id)
		.maybeSingle();

	if (!error && data) {
		return mapRow(data);
	}

	const { data: fallbackData, error: fallbackError } = await (supabase as any)
		.from("boats")
		.select(BOAT_SELECT_FALLBACK)
		.eq("id", id)
		.maybeSingle();

	if (fallbackError || !fallbackData) return null;
	return mapRow(fallbackData);
};

