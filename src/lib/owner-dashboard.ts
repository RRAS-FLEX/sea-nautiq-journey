import { supabase } from "./supabase";
import { parseStorageReference, resolveStorageImage } from "./storage-public";

export interface BoatDocument {
  id?: string;
  name: string;
  dataUrl?: string;
  filePath: string;
  fileType: string;
  file?: File | null;
}

export interface OwnerBoat {
  id: string;
  name: string;
  type: string;
  location: string;
  description: string;
  lengthMeters: number;
  year: number;
  cruisingSpeedKnots: number;
  fuelBurnLitresPerHour: number;
  departureMarina: string;
  cancellationPolicy: string;
  responseTime: string;
  mapQuery: string;
  unavailableDates: string[];
  minNoticeHours: number;
  capacity: number;
  pricePerDay: number;
  rating: number;
  image: string;
  features: string[];
  skipperRequired: boolean;
  status: "active" | "inactive" | "maintenance";
  bookings: number;
  revenue: number;
  documentsFolder: string;
  documents: BoatDocument[];
}

type OwnerBoatMutation = Omit<OwnerBoat, "id" | "documentsFolder"> & {
  documentsFolder?: string;
  imageFile?: File | null;
};

type OwnerBoatUpdateMutation = Partial<OwnerBoat> & {
  imageFile?: File | null;
};

export interface OwnerPackage {
  id: string;
  name: string;
  duration: number;
  price: number;
  description: string;
  boatIds: string[];
}

export interface BoatExtra {
  id: string;
  name: string;
  price: number;
}

export interface OwnerCalendarEvent {
  id: string;
  boatId: string;
  date: string;
  type: "booked" | "blocked" | "maintenance";
  guestName?: string;
  bookingId?: string;
}

export interface OwnerStats {
  listedBoats: number;
  totalBookings: number;
  totalRevenue: number;
  averageRating: string;
}

const getSession = async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    throw new Error("You must be signed in to access owner data");
  }

  return session;
};

const toSafeFileName = (value: string) => value.replace(/[^a-zA-Z0-9._-]+/g, "-");

const getBoatDocumentsFolder = (ownerId: string, boatId: string) => `boat-documents/${ownerId}/${boatId}`;

const resolveDocumentUrl = async (filePath: string) => {
  if (!filePath) {
    return "";
  }

  if (/^https?:\/\//i.test(filePath) || /^data:/i.test(filePath)) {
    return filePath;
  }

  const storageRef = parseStorageReference(filePath, "boat-documents");
  if (!storageRef) {
    return filePath;
  }

  const { data, error } = await supabase.storage
    .from(storageRef.bucket)
    .createSignedUrl(storageRef.path, 60 * 60);

  if (error || !data?.signedUrl) {
    return filePath;
  }

  return data.signedUrl;
};

const mapBoatDocument = async (document: any): Promise<BoatDocument> => ({
  id: document.id,
  name: document.name,
  filePath: document.file_path,
  dataUrl: await resolveDocumentUrl(document.file_path),
  fileType: document.file_type ?? "application/octet-stream",
});

const normalizeBoatImagePath = (value: string | null | undefined) => {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return "";
  if (/\.\w{2,6}(\?|$)/.test(trimmed)) return trimmed;
  return `${trimmed.replace(/\/+$/, "")}/1.jpg`;
};

const resolveOwnerBoatImage = (boat: any) => {
  const candidate = normalizeBoatImagePath(boat.images ?? boat.image);
  return resolveStorageImage(candidate, "boat-images", "https://via.placeholder.com/400x300?text=Boat");
};

const uploadPrimaryBoatImage = async (ownerId: string, boatId: string, file: File) => {
  const extension = (file.name.split(".").pop() ?? "jpg").toLowerCase();
  const normalizedExt = extension.replace(/[^a-z0-9]/g, "") || "jpg";
  const objectPath = `${ownerId}/${boatId}/1.${normalizedExt}`;

  const { error } = await supabase.storage
    .from("boat-images")
    .upload(objectPath, file, {
      upsert: true,
      contentType: file.type || "image/jpeg",
    });

  if (error) {
    throw new Error(error.message || "Failed to upload boat image");
  }

  return `boat-images/${ownerId}/${boatId}`;
};

const uploadBoatDocument = async (ownerId: string, boatId: string, document: BoatDocument) => {
  if (!(document.file instanceof File)) {
    return {
      name: document.name,
      file_path: document.filePath || document.dataUrl || "",
      file_type: document.fileType,
    };
  }

  const safeName = toSafeFileName(document.file.name || document.name || "document");
  const objectPath = `${ownerId}/${boatId}/${safeName}`;

  const { error } = await supabase.storage
    .from("boat-documents")
    .upload(objectPath, document.file, {
      upsert: true,
      contentType: document.file.type || document.fileType || "application/octet-stream",
    });

  if (error) {
    throw new Error(error.message || `Failed to upload document ${document.name}`);
  }

  return {
    name: document.name,
    file_path: `boat-documents/${objectPath}`,
    file_type: document.file.type || document.fileType || "application/octet-stream",
  };
};

const mapOwnerBoat = (boat: any, features: string[], documents: BoatDocument[]): OwnerBoat => ({
  id: boat.id,
  name: boat.name,
  type: boat.type,
  location: boat.location,
  description: boat.description ?? "",
  lengthMeters: Number(boat.length_meters ?? 0),
  year: Number(boat.year ?? 0),
  cruisingSpeedKnots: Number(boat.cruising_speed_knots ?? 0),
  fuelBurnLitresPerHour: Number(boat.fuel_burn_litres_per_hour ?? 0),
  departureMarina: boat.departure_marina ?? boat.location ?? "",
  cancellationPolicy: boat.cancellation_policy ?? "",
  responseTime: boat.response_time ?? "",
  mapQuery: boat.map_query ?? "",
  unavailableDates: Array.isArray(boat.unavailable_dates) ? boat.unavailable_dates : [],
  minNoticeHours: Number(boat.min_notice_hours ?? 24),
  capacity: Number(boat.capacity ?? 0),
  pricePerDay: Number(boat.price_per_day ?? 0),
  rating: Number(boat.rating ?? 0),
  image: resolveOwnerBoatImage(boat),
  features,
  skipperRequired: Boolean(boat.skipper_required),
  documents,
  status: boat.status ?? "active",
  bookings: Number(boat.bookings ?? 0),
  revenue: Number(boat.revenue ?? 0),
  documentsFolder: boat.documents_folder ?? "",
});

export const getOwnerBoats = async (): Promise<OwnerBoat[]> => {
  const session = await getSession();
  const boatsTable = (supabase as any).from("boats");
  const featuresTable = (supabase as any).from("boat_features");
  const documentsTable = (supabase as any).from("boat_documents");

  const { data: boats, error } = await boatsTable
    .select("*")
    .eq("owner_id", session.user.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message || "Failed to load owner boats");
  }

  const boatRows = Array.isArray(boats) ? boats : [];
  return Promise.all(
    boatRows.map(async (boat) => {
      const [{ data: featureRows }, { data: documentRows }] = await Promise.all([
        featuresTable.select("feature").eq("boat_id", boat.id),
        documentsTable.select("id, name, file_path, file_type").eq("boat_id", boat.id),
      ]);

      const resolvedDocuments = Array.isArray(documentRows)
        ? await Promise.all(documentRows.map(mapBoatDocument))
        : [];

      return mapOwnerBoat(
        boat,
        Array.isArray(featureRows) ? featureRows.map((feature: any) => feature.feature) : [],
        resolvedDocuments,
      );
    }),
  );
};

export const addOwnerBoat = async (boat: OwnerBoatMutation): Promise<OwnerBoat> => {
  const session = await getSession();
  const boatsTable = (supabase as any).from("boats");
  const featuresTable = (supabase as any).from("boat_features");
  const documentsTable = (supabase as any).from("boat_documents");

  const { data: insertedBoat, error } = await boatsTable
    .insert({
      owner_id: session.user.id,
      name: boat.name,
      description: boat.description,
      type: boat.type,
      location: boat.location,
      length_meters: boat.lengthMeters,
      year: boat.year,
      cruising_speed_knots: boat.cruisingSpeedKnots,
      fuel_burn_litres_per_hour: boat.fuelBurnLitresPerHour,
      departure_marina: boat.departureMarina,
      cancellation_policy: boat.cancellationPolicy,
      response_time: boat.responseTime,
      map_query: boat.mapQuery,
      unavailable_dates: boat.unavailableDates,
      min_notice_hours: boat.minNoticeHours,
      capacity: boat.capacity,
      price_per_day: boat.pricePerDay,
      rating: boat.rating,
      images: boat.image,
      skipper_required: boat.skipperRequired,
      documents_folder: getBoatDocumentsFolder(session.user.id, "pending"),
      status: boat.status,
      bookings: boat.bookings,
      revenue: boat.revenue,
    })
    .select()
    .single();

  if (error || !insertedBoat) {
    throw new Error(error?.message || "Failed to add boat");
  }

  let primaryImagePath = boat.image;
  if (boat.imageFile instanceof File) {
    primaryImagePath = await uploadPrimaryBoatImage(session.user.id, insertedBoat.id, boat.imageFile);
  }

  const documentsFolder = getBoatDocumentsFolder(session.user.id, insertedBoat.id);

  await boatsTable
    .update({
      images: primaryImagePath,
      documents_folder: documentsFolder,
      updated_at: new Date().toISOString(),
    })
    .eq("id", insertedBoat.id)
    .eq("owner_id", session.user.id);

  if (boat.features.length > 0) {
    await featuresTable.insert(
      boat.features.map((feature) => ({
        boat_id: insertedBoat.id,
        feature,
      })),
    );
  }

  if (boat.documents.length > 0) {
    const uploadedDocuments = await Promise.all(
      boat.documents.map((document) => uploadBoatDocument(session.user.id, insertedBoat.id, document)),
    );

    await documentsTable.insert(
      uploadedDocuments.map((document) => ({
        boat_id: insertedBoat.id,
        name: document.name,
        file_path: document.file_path,
        file_type: document.file_type,
      })),
    );
  }

  return {
    ...boat,
    id: insertedBoat.id,
    skipperRequired: boat.skipperRequired,
    documentsFolder,
    image: resolveStorageImage(normalizeBoatImagePath(primaryImagePath), "boat-images", "https://via.placeholder.com/400x300?text=Boat"),
    documents: boat.documents.map((document) => ({
      ...document,
      filePath: document.filePath || document.dataUrl || "",
      dataUrl: document.dataUrl || document.filePath,
    })),
  };
};

export const updateOwnerBoat = async (boatId: string, updates: OwnerBoatUpdateMutation): Promise<OwnerBoat | null> => {
  const session = await getSession();
  const boatsTable = (supabase as any).from("boats");
  const featuresTable = (supabase as any).from("boat_features");
  const documentsTable = (supabase as any).from("boat_documents");

  const boatUpdates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.name !== undefined) boatUpdates.name = updates.name;
  if (updates.type !== undefined) boatUpdates.type = updates.type;
  if (updates.location !== undefined) boatUpdates.location = updates.location;
  if (updates.description !== undefined) boatUpdates.description = updates.description;
  if (updates.lengthMeters !== undefined) boatUpdates.length_meters = updates.lengthMeters;
  if (updates.year !== undefined) boatUpdates.year = updates.year;
  if (updates.cruisingSpeedKnots !== undefined) boatUpdates.cruising_speed_knots = updates.cruisingSpeedKnots;
  if (updates.fuelBurnLitresPerHour !== undefined) boatUpdates.fuel_burn_litres_per_hour = updates.fuelBurnLitresPerHour;
  if (updates.departureMarina !== undefined) boatUpdates.departure_marina = updates.departureMarina;
  if (updates.cancellationPolicy !== undefined) boatUpdates.cancellation_policy = updates.cancellationPolicy;
  if (updates.responseTime !== undefined) boatUpdates.response_time = updates.responseTime;
  if (updates.mapQuery !== undefined) boatUpdates.map_query = updates.mapQuery;
  if (updates.unavailableDates !== undefined) boatUpdates.unavailable_dates = updates.unavailableDates;
  if (updates.minNoticeHours !== undefined) boatUpdates.min_notice_hours = updates.minNoticeHours;
  if (updates.capacity !== undefined) boatUpdates.capacity = updates.capacity;
  if (updates.pricePerDay !== undefined) boatUpdates.price_per_day = updates.pricePerDay;
  if (updates.rating !== undefined) boatUpdates.rating = updates.rating;
  if (updates.image !== undefined) boatUpdates.images = updates.image;
  if (updates.skipperRequired !== undefined) boatUpdates.skipper_required = updates.skipperRequired;
  if (updates.status !== undefined) boatUpdates.status = updates.status;
  if (updates.bookings !== undefined) boatUpdates.bookings = updates.bookings;
  if (updates.revenue !== undefined) boatUpdates.revenue = updates.revenue;

  const { error } = await boatsTable.update(boatUpdates).eq("id", boatId).eq("owner_id", session.user.id);

  if (error) {
    throw new Error(error.message || "Failed to update boat");
  }

  if (updates.imageFile instanceof File) {
    const uploadedPath = await uploadPrimaryBoatImage(session.user.id, boatId, updates.imageFile);
    const { error: imageUpdateError } = await boatsTable
      .update({ images: uploadedPath, updated_at: new Date().toISOString() })
      .eq("id", boatId)
      .eq("owner_id", session.user.id);

    if (imageUpdateError) {
      throw new Error(imageUpdateError.message || "Failed to save uploaded boat image");
    }
  }

  if (updates.features) {
    await featuresTable.delete().eq("boat_id", boatId);
    if (updates.features.length > 0) {
      await featuresTable.insert(
        updates.features.map((feature) => ({
          boat_id: boatId,
          feature,
        })),
      );
    }
  }

  if (updates.documents) {
    await documentsTable.delete().eq("boat_id", boatId);
    if (updates.documents.length > 0) {
      const uploadedDocuments = await Promise.all(
        updates.documents.map((document) => uploadBoatDocument(session.user.id, boatId, document)),
      );

      await documentsTable.insert(
        uploadedDocuments.map((document) => ({
          boat_id: boatId,
          name: document.name,
          file_path: document.file_path,
          file_type: document.file_type,
        })),
      );

      await boatsTable
        .update({ documents_folder: getBoatDocumentsFolder(session.user.id, boatId), updated_at: new Date().toISOString() })
        .eq("id", boatId)
        .eq("owner_id", session.user.id);
    }
  }

  const refreshedBoats = await getOwnerBoats();
  return refreshedBoats.find((boat) => boat.id === boatId) ?? null;
};

export const deleteOwnerBoat = async (boatId: string): Promise<boolean> => {
  const session = await getSession();
  const { error } = await (supabase as any).from("boats").delete().eq("id", boatId).eq("owner_id", session.user.id);
  if (error) {
    throw new Error(error.message || "Failed to delete boat");
  }
  return true;
};

export const getOwnerPackages = async (): Promise<OwnerPackage[]> => {
  const session = await getSession();
  const packagesTable = (supabase as any).from("owner_packages");
  const packageBoatsTable = (supabase as any).from("owner_package_boats");

  const { data: packageRows, error } = await packagesTable
    .select("*")
    .eq("owner_id", session.user.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message || "Failed to load packages");
  }

  const packages = Array.isArray(packageRows) ? packageRows : [];
  if (packages.length === 0) {
    return [];
  }

  const { data: packageBoatRows } = await packageBoatsTable
    .select("package_id, boat_id")
    .in("package_id", packages.map((pkg: any) => pkg.id));

  return packages.map((pkg: any) => ({
    id: pkg.id,
    name: pkg.name,
    duration: Number(pkg.duration_hours ?? 0),
    price: Number(pkg.price ?? 0),
    description: pkg.description ?? "",
    boatIds: Array.isArray(packageBoatRows)
      ? packageBoatRows
          .filter((row: any) => row.package_id === pkg.id)
          .map((row: any) => row.boat_id)
      : [],
  }));
};

const BOAT_EXTRA_MARKER = "[boat-extra]";

export const listBoatExtras = async (boatId: string): Promise<BoatExtra[]> => {
  const session = await getSession();
  const packageBoatsTable = (supabase as any).from("owner_package_boats");

  const { data, error } = await packageBoatsTable
    .select("package_id, owner_packages!inner(id, owner_id, name, price, description)")
    .eq("boat_id", boatId)
    .eq("owner_packages.owner_id", session.user.id);

  if (error) {
    throw new Error(error.message || "Failed to load boat extras");
  }

  return Array.isArray(data)
    ? data
        .filter((row: any) =>
          typeof row.owner_packages?.description === "string" &&
          row.owner_packages.description.includes(BOAT_EXTRA_MARKER),
        )
        .map((row: any) => ({
          id: row.owner_packages.id,
          name: row.owner_packages.name,
          price: Number(row.owner_packages.price ?? 0),
        }))
    : [];
};

export const saveBoatExtras = async (
  boatId: string,
  extras: Array<{ name: string; price: number }>,
): Promise<void> => {
  const session = await getSession();
  const packagesTable = (supabase as any).from("owner_packages");
  const packageBoatsTable = (supabase as any).from("owner_package_boats");

  const sanitizedExtras = extras
    .map((extra) => ({
      name: extra.name.trim(),
      price: Number(extra.price) || 0,
    }))
    .filter((extra) => extra.name.length > 0);

  const { data: existingLinks } = await packageBoatsTable
    .select("package_id, owner_packages!inner(id, owner_id, description)")
    .eq("boat_id", boatId)
    .eq("owner_packages.owner_id", session.user.id);

  const existingExtraPackageIds = Array.isArray(existingLinks)
    ? existingLinks
        .filter((row: any) =>
          typeof row.owner_packages?.description === "string" &&
          row.owner_packages.description.includes(BOAT_EXTRA_MARKER),
        )
        .map((row: any) => row.package_id)
    : [];

  if (existingExtraPackageIds.length > 0) {
    await packageBoatsTable
      .delete()
      .eq("boat_id", boatId)
      .in("package_id", existingExtraPackageIds);

    await packagesTable
      .delete()
      .eq("owner_id", session.user.id)
      .in("id", existingExtraPackageIds);
  }

  if (sanitizedExtras.length === 0) {
    return;
  }

  const { data: insertedPackages, error: insertPackagesError } = await packagesTable
    .insert(
      sanitizedExtras.map((extra) => ({
        owner_id: session.user.id,
        name: extra.name,
        duration_hours: 0,
        price: extra.price,
        description: `${BOAT_EXTRA_MARKER} Added from boat form`,
      })),
    )
    .select("id");

  if (insertPackagesError || !Array.isArray(insertedPackages)) {
    throw new Error(insertPackagesError?.message || "Failed to save boat extras");
  }

  const { error: linkError } = await packageBoatsTable.insert(
    insertedPackages.map((pkg: any) => ({
      package_id: pkg.id,
      boat_id: boatId,
    })),
  );

  if (linkError) {
    throw new Error(linkError.message || "Failed to link boat extras");
  }
};

export const addOwnerPackage = async (pkg: Omit<OwnerPackage, "id">): Promise<OwnerPackage> => {
  const session = await getSession();
  const packagesTable = (supabase as any).from("owner_packages");
  const packageBoatsTable = (supabase as any).from("owner_package_boats");

  const { data, error } = await packagesTable
    .insert({
      owner_id: session.user.id,
      name: pkg.name,
      duration_hours: pkg.duration,
      price: pkg.price,
      description: pkg.description,
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Failed to add package");
  }

  if (pkg.boatIds.length > 0) {
    await packageBoatsTable.insert(
      pkg.boatIds.map((boatId) => ({
        package_id: data.id,
        boat_id: boatId,
      })),
    );
  }

  return { ...pkg, id: data.id };
};

export const updateOwnerPackage = async (id: string, updates: Partial<OwnerPackage>): Promise<OwnerPackage | null> => {
  const session = await getSession();
  const packagesTable = (supabase as any).from("owner_packages");
  const packageBoatsTable = (supabase as any).from("owner_package_boats");

  const packageUpdates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (updates.name !== undefined) packageUpdates.name = updates.name;
  if (updates.duration !== undefined) packageUpdates.duration_hours = updates.duration;
  if (updates.price !== undefined) packageUpdates.price = updates.price;
  if (updates.description !== undefined) packageUpdates.description = updates.description;

  const { error } = await packagesTable.update(packageUpdates).eq("id", id).eq("owner_id", session.user.id);
  if (error) {
    throw new Error(error.message || "Failed to update package");
  }

  if (updates.boatIds) {
    await packageBoatsTable.delete().eq("package_id", id);
    if (updates.boatIds.length > 0) {
      await packageBoatsTable.insert(
        updates.boatIds.map((boatId) => ({
          package_id: id,
          boat_id: boatId,
        })),
      );
    }
  }

  const refreshedPackages = await getOwnerPackages();
  return refreshedPackages.find((pkg) => pkg.id === id) ?? null;
};

export const deleteOwnerPackage = async (id: string): Promise<boolean> => {
  const session = await getSession();
  await (supabase as any).from("owner_package_boats").delete().eq("package_id", id);
  const { error } = await (supabase as any).from("owner_packages").delete().eq("id", id).eq("owner_id", session.user.id);
  if (error) {
    throw new Error(error.message || "Failed to delete package");
  }
  return true;
};

export const getOwnerCalendarEvents = async (boatId?: string): Promise<OwnerCalendarEvent[]> => {
  // Calendar events feature is disabled; return an empty list.
  return [];
};

export const addCalendarEvent = async (event: Omit<OwnerCalendarEvent, "id">): Promise<OwnerCalendarEvent> => {
  // Calendar events feature is disabled; simulate a no-op add and echo parameters.
  return {
    id: "disabled-calendar-event",
    boatId: event.boatId,
    date: event.date,
    type: event.type,
    guestName: event.guestName,
    bookingId: event.bookingId,
  };
};

export const deleteCalendarEvent = async (id: string): Promise<boolean> => {
  // Calendar events feature is disabled; treat delete as success.
  void id;
  return true;
};

export const getOwnerStats = async (): Promise<OwnerStats> => {
  const boats = await getOwnerBoats();
  const totalBookings = boats.reduce((sum, boat) => sum + boat.bookings, 0);
  const totalRevenue = boats.reduce((sum, boat) => sum + boat.revenue, 0);
  const averageRating = boats.length > 0
    ? (boats.reduce((sum, boat) => sum + boat.rating, 0) / boats.length).toFixed(1)
    : "0.0";

  return {
    listedBoats: boats.length,
    totalBookings,
    totalRevenue,
    averageRating,
  };
};
