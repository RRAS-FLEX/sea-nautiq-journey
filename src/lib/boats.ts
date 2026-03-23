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
	publicSlug: string;
	image: string;
	images: string[];
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
	skipperRequired: boolean;
	bookings: number;
	revenue: number;
}

type BoatFeatureRow = {
	feature?: string | null;
};

type BoatUserRow = {
	name?: string | null;
	owner_title?: string | null;
	owner_bio?: string | null;
	owner_languages?: string[] | null;
	is_superhost?: boolean | null;
	response_rate?: number | null;
	created_at?: string | null;
};

type BoatRow = {
	id: string;
	name: string;
	location: string;
	type?: string | null;
	length_meters?: number | null;
	year?: number | null;
	cruising_speed_knots?: number | null;
	fuel_burn_litres_per_hour?: number | null;
	capacity?: number | null;
	departure_marina?: string | null;
	price_per_day?: number | null;
	rating?: number | null;
	description?: string | null;
	cancellation_policy?: string | null;
	response_time?: string | null;
	unavailable_dates?: string[] | null;
	min_notice_hours?: number | null;
	map_query?: string | null;
	skipper_required?: boolean | null;
	bookings?: number | null;
	revenue?: number | null;
	status?: string | null;
	images?: string[] | string | null;
	image?: string | null;
	boat_features?: BoatFeatureRow[] | null;
	users?: BoatUserRow | null;
};

const BOATS_CACHE_KEY = "nautiq:boats-cache:v3";
const BOATS_CACHE_TTL_MS = 5 * 60 * 1000;
const BOATS_CACHE_MAX_STALE_MS = 24 * 60 * 60 * 1000;

const isBrowser = typeof window !== "undefined";

type BoatsCachePayload = {
	updatedAt: number;
	boats: Boat[];
};

let boatsInMemory: BoatsCachePayload | null = null;
let boatsInFlight: Promise<Boat[]> | null = null;

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isFresh = (updatedAt: number, ttlMs: number) => Date.now() - updatedAt <= ttlMs;

const readCachedBoats = (): BoatsCachePayload | null => {
	if (!isBrowser) return null;
	try {
		const raw = window.localStorage.getItem(BOATS_CACHE_KEY);
		if (!raw) return null;
		const parsed = JSON.parse(raw);

		if (Array.isArray(parsed)) {
			return {
				updatedAt: 0,
				boats: parsed as Boat[],
			};
		}

		if (
			typeof parsed === "object" &&
			parsed !== null &&
			Array.isArray((parsed as BoatsCachePayload).boats)
		) {
			return parsed as BoatsCachePayload;
		}

		return null;
	} catch {
		return null;
	}
};

const writeCachedBoats = (boats: Boat[]) => {
	if (!isBrowser) return;
	try {
		const payload: BoatsCachePayload = {
			updatedAt: Date.now(),
			boats,
		};
		window.localStorage.setItem(BOATS_CACHE_KEY, JSON.stringify(payload));
		boatsInMemory = payload;
	} catch {
		// Ignore cache write failures.
	}
};

const slugifySegment = (value: string) =>
	value
		.toLowerCase()
		.normalize("NFKD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.replace(/-{2,}/g, "-");

const shortBoatToken = (id: string) => {
	let hash = 5381;
	for (const char of id) {
		hash = (hash * 33) ^ char.charCodeAt(0);
	}
	return Math.abs(hash >>> 0).toString(36).slice(0, 6);
};

export const buildBoatPublicSlug = (boatLike: { id: string; name: string; location: string }) => {
	const base = [slugifySegment(boatLike.name), slugifySegment(boatLike.location)]
		.filter(Boolean)
		.join("-");
	return `${base || "boat"}-${shortBoatToken(boatLike.id)}`;
};

export const buildBoatDetailsPath = (boatLike: { id: string; name: string; location: string; publicSlug?: string }) =>
	`/boats/${boatLike.publicSlug || buildBoatPublicSlug(boatLike)}`;

export const isBoatReferenceMatch = (boat: Pick<Boat, "id" | "publicSlug" | "name" | "location">, reference: string) => {
	const normalizedReference = String(reference ?? "").trim();
	if (!normalizedReference) return false;
	return (
		boat.id === normalizedReference ||
		boat.publicSlug === normalizedReference ||
		buildBoatPublicSlug(boat) === normalizedReference
	);
};

const hasFileExtension = (value: string) => /\.\w{2,6}(\?|$)/.test(value);

const normalizeImageCandidate = (value: string): string => {
	const trimmed = value.trim();
	if (!trimmed) return "";

	if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
		try {
			const parsed = JSON.parse(trimmed);
			if (Array.isArray(parsed) && parsed.length > 0) {
				return normalizeImageCandidate(String(parsed[0] ?? ""));
			}
		} catch {
			// Continue to additional parsers.
		}
	}

	if (trimmed.includes(",")) {
		const first = trimmed
			.split(",")
			.map((part) => part.trim())
			.find(Boolean);
		if (first) {
			return normalizeImageCandidate(first);
		}
	}

	return trimmed;
};

const getBoatImageCandidates = (row: BoatRow): string[] => {
	const rawImages = row.images;
	const legacyImage = row.image;

	if (Array.isArray(rawImages)) {
		const candidates = rawImages
			.map((value) => normalizeImageCandidate(String(value ?? "")))
			.filter(Boolean);
		if (candidates.length > 0) return candidates;
	}

	if (typeof rawImages === "string" && rawImages.trim()) {
		const candidate = normalizeImageCandidate(rawImages);
		if (candidate) return [candidate];
	}

	if (typeof legacyImage === "string" && legacyImage.trim()) {
		const candidate = normalizeImageCandidate(legacyImage);
		if (candidate) return [candidate];
	}

	return [];
};

const resolveBoatImages = (row: BoatRow): string[] => {
	const imageCandidates = getBoatImageCandidates(row);
	if (imageCandidates.length === 0) {
		return [];
	}

	const firstCandidate = imageCandidates[0];
	if (!hasFileExtension(firstCandidate) && !/^https?:\/\//i.test(firstCandidate)) {
		return [resolveStorageImage(`${firstCandidate.replace(/\/+$/, "")}/1.jpg`, "boat-images")].filter(Boolean);
	}

	return imageCandidates.map((candidate) => resolveStorageImage(candidate, "boat-images", candidate));
};

const mapRow = (row: BoatRow): Boat => {
	const resolvedImages = resolveBoatImages(row);

	return {
	id: row.id,
	publicSlug: buildBoatPublicSlug({ id: row.id, name: row.name, location: row.location }),
	images: resolvedImages,
	image: resolvedImages[0] ?? "https://via.placeholder.com/400x300?text=Boat",
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
	amenities: (row.boat_features ?? [])
		.map((featureRow) => featureRow.feature)
		.filter((feature): feature is string => Boolean(feature)),
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
	skipperRequired: Boolean(row.skipper_required),
	bookings: Number(row.bookings ?? 0),
	revenue: Number(row.revenue ?? 0),
	};
};

const BOAT_SELECT =
	"*, boat_features(feature), users(name, owner_title, owner_bio, owner_languages, is_superhost, response_rate, created_at)";
const BOAT_SELECT_FALLBACK =
	"*, users(name, created_at), boat_features(feature)";
const BOAT_SELECT_MINIMAL =
	"id, name, type, location, capacity, price_per_day, rating, images, image, skipper_required, bookings, revenue, status, created_at";

const isPublicBoatStatus = (status: unknown): boolean => {
	const normalized = String(status ?? "").trim().toLowerCase();
	if (!normalized) return true;
	return !["inactive", "maintenance", "archived", "draft"].includes(normalized);
};

const queryBoats = (selectClause: string) =>
	supabase.from("boats").select(selectClause);

const filterBoatRowsByVisibility = (rows: BoatRow[], includeInactive = false) =>
	includeInactive ? rows : rows.filter((row) => isPublicBoatStatus(row?.status));

const fetchBoatsFromSupabase = async (includeInactive = false) => {
	const primary = await queryBoats(BOAT_SELECT);
	if (!primary.error) {
		const rows = filterBoatRowsByVisibility((primary.data ?? []) as unknown as BoatRow[], includeInactive);
		return rows.map(mapRow);
	}

	const relationFallback = await queryBoats(BOAT_SELECT_FALLBACK);
	if (!relationFallback.error) {
		const rows = filterBoatRowsByVisibility((relationFallback.data ?? []) as unknown as BoatRow[], includeInactive);
		return rows.map(mapRow);
	}

	const minimal = await queryBoats(BOAT_SELECT_MINIMAL);
	if (!minimal.error) {
		const rows = filterBoatRowsByVisibility((minimal.data ?? []) as unknown as BoatRow[], includeInactive);
		return rows.map(mapRow);
	}

	const minimalWithoutStatus = await supabase
		.from("boats")
		.select(BOAT_SELECT_MINIMAL);

	if (!minimalWithoutStatus.error) {
		const rows = filterBoatRowsByVisibility((minimalWithoutStatus.data ?? []) as unknown as BoatRow[], includeInactive);
		return rows.map(mapRow);
	}

	throw new Error(
		minimalWithoutStatus.error?.message ||
			minimal.error?.message ||
			relationFallback.error?.message ||
			primary.error?.message ||
			"Failed to load boats",
	);
};

export const getBoats = async (): Promise<Boat[]> => {
	if (boatsInMemory && isFresh(boatsInMemory.updatedAt, BOATS_CACHE_TTL_MS)) {
		return boatsInMemory.boats;
	}

	const cached = readCachedBoats();
	if (cached && isFresh(cached.updatedAt, BOATS_CACHE_TTL_MS) && cached.boats.length > 0) {
		boatsInMemory = cached;
		return cached.boats;
	}

	if (boatsInFlight) {
		return boatsInFlight;
	}

	boatsInFlight = (async () => {
		try {
			const boats = await fetchBoatsFromSupabase();
			writeCachedBoats(boats);
			return boats;
		} catch {
			if (cached && cached.boats.length > 0 && isFresh(cached.updatedAt, BOATS_CACHE_MAX_STALE_MS)) {
				boatsInMemory = cached;
				return cached.boats;
			}

			if (boatsInMemory?.boats?.length) {
				return boatsInMemory.boats;
			}

			return [];
		} finally {
			boatsInFlight = null;
		}
	})();

	return boatsInFlight;
};

export const getBoatById = async (id: string): Promise<Boat | null> => {
	const normalizedId = String(id ?? "").trim();
	if (!UUID_REGEX.test(normalizedId)) {
		return null;
	}

	const { data, error } = await supabase
		.from("boats")
		.select(BOAT_SELECT)
		.eq("id", normalizedId)
		.maybeSingle();

	if (!error && data) {
		return mapRow(data as unknown as BoatRow);
	}

	const { data: fallbackData, error: fallbackError } = await supabase
		.from("boats")
		.select(BOAT_SELECT_FALLBACK)
		.eq("id", normalizedId)
		.maybeSingle();

	if (!fallbackError && fallbackData) {
		return mapRow(fallbackData as unknown as BoatRow);
	}

	const { data: minimalData, error: minimalError } = await supabase
		.from("boats")
		.select(BOAT_SELECT_MINIMAL)
		.eq("id", normalizedId)
		.maybeSingle();

	if (minimalError || !minimalData) return null;
	return mapRow(minimalData as unknown as BoatRow);
};

export const getBoatByPublicReference = async (reference: string): Promise<Boat | null> => {
	const normalizedReference = String(reference ?? "").trim();
	if (!normalizedReference) {
		return null;
	}

	const directMatch = await getBoatById(normalizedReference);
	if (directMatch) {
		return directMatch;
	}

	try {
		const allBoats = await fetchBoatsFromSupabase(true);
		const matchedBoat = allBoats.find((boat) => isBoatReferenceMatch(boat, normalizedReference));
		if (matchedBoat) return matchedBoat;
	} catch {
		// Fallback to cached/public fetch path below.
	}

	const boats = await getBoats();
	return boats.find((boat) => isBoatReferenceMatch(boat, normalizedReference)) ?? null;
};

