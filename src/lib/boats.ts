import { supabase } from "./supabase";
import { getPublicStorageUrl, parseStorageReference, resolveStorageImage } from "./storage-public";

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

const BOATS_CACHE_KEY = "nautiq:boats-cache:v3";
const IMAGE_FILE_REGEX = /\.(avif|gif|jpe?g|png|webp|svg)$/i;

const isBrowser = typeof window !== "undefined";

const readCachedBoats = (): Boat[] => {
	if (!isBrowser) return [];
	try {
		const raw = window.localStorage.getItem(BOATS_CACHE_KEY);
		if (!raw) return [];
		const parsed = JSON.parse(raw);
		return Array.isArray(parsed) ? (parsed as Boat[]) : [];
	} catch {
		return [];
	}
};

const writeCachedBoats = (boats: Boat[]) => {
	if (!isBrowser) return;
	try {
		window.localStorage.setItem(BOATS_CACHE_KEY, JSON.stringify(boats));
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

const getBoatImageCandidates = (row: any): string[] => {
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

const listFolderImages = async (folderReference: string): Promise<string[]> => {
	const storageRef = parseStorageReference(folderReference, "boat-images");
	if (!storageRef) return [];

	const { data, error } = await supabase.storage
		.from(storageRef.bucket)
		.list(storageRef.path, {
			limit: 24,
			sortBy: { column: "name", order: "asc" },
		});

	if (error || !Array.isArray(data)) {
		return [resolveStorageImage(`${folderReference.replace(/\/+$/, "")}/1.jpg`, "boat-images")].filter(Boolean);
	}

	const imageUrls = data
		.filter((item) => item.name && IMAGE_FILE_REGEX.test(item.name))
		.map((item) => getPublicStorageUrl(storageRef.bucket, `${storageRef.path}/${item.name}`))
		.filter(Boolean);

	if (imageUrls.length > 0) {
		return imageUrls;
	}

	return [resolveStorageImage(`${folderReference.replace(/\/+$/, "")}/1.jpg`, "boat-images")].filter(Boolean);
};

const resolveBoatImages = async (row: any): Promise<string[]> => {
	const imageCandidates = getBoatImageCandidates(row);
	if (imageCandidates.length === 0) {
		return [];
	}

	const firstCandidate = imageCandidates[0];
	if (!hasFileExtension(firstCandidate) && !/^https?:\/\//i.test(firstCandidate)) {
		return listFolderImages(firstCandidate);
	}

	return imageCandidates.map((candidate) => resolveStorageImage(candidate, "boat-images", candidate));
};

const mapRow = async (row: any): Promise<Boat> => {
	const resolvedImages = await resolveBoatImages(row);

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
	(supabase as any)
		.from("boats")
		.select(selectClause);

const fetchBoatsFromSupabase = async () => {
	const primary = await queryBoats(BOAT_SELECT);
	if (!primary.error) {
		const visibleRows = (primary.data ?? []).filter((row: any) => isPublicBoatStatus(row?.status));
		return Promise.all(visibleRows.map(mapRow));
	}

	const relationFallback = await queryBoats(BOAT_SELECT_FALLBACK);
	if (!relationFallback.error) {
		const visibleRows = (relationFallback.data ?? []).filter((row: any) => isPublicBoatStatus(row?.status));
		return Promise.all(visibleRows.map(mapRow));
	}

	const minimal = await queryBoats(BOAT_SELECT_MINIMAL);
	if (!minimal.error) {
		const visibleRows = (minimal.data ?? []).filter((row: any) => isPublicBoatStatus(row?.status));
		return Promise.all(visibleRows.map(mapRow));
	}

	const minimalWithoutStatus = await (supabase as any)
		.from("boats")
		.select(BOAT_SELECT_MINIMAL);

	if (!minimalWithoutStatus.error) {
		const activeOrUnknown = (minimalWithoutStatus.data ?? []).filter((row: any) => isPublicBoatStatus(row?.status));
		return Promise.all(activeOrUnknown.map(mapRow));
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
	for (let attempt = 0; attempt < 2; attempt += 1) {
		try {
			const boats = await fetchBoatsFromSupabase();
			writeCachedBoats(boats);
			return boats;
		} catch {
			if (attempt === 1) {
				const cached = readCachedBoats();
				if (cached.length > 0) return cached;
			}
		}
	}

	return [];
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

	if (!fallbackError && fallbackData) {
		return mapRow(fallbackData);
	}

	const { data: minimalData, error: minimalError } = await (supabase as any)
		.from("boats")
		.select(BOAT_SELECT_MINIMAL)
		.eq("id", id)
		.maybeSingle();

	if (minimalError || !minimalData) return null;
	return mapRow(minimalData);
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

	const boats = await getBoats();
	return boats.find((boat) => isBoatReferenceMatch(boat, normalizedReference)) ?? null;
};

