import { supabase } from "./supabase";
import { resolveStorageImage } from "./storage-public";

export interface BoatDocument {
  id?: string;
  name: string;
  dataUrl?: string;
  filePath: string;
  fileType: string;
}

export interface OwnerBoat {
  id: string;
  name: string;
  type: string;
  location: string;
  capacity: number;
  pricePerDay: number;
  rating: number;
  image: string;
  features: string[];
  status: "active" | "inactive" | "maintenance";
  bookings: number;
  revenue: number;
  documents: BoatDocument[];
}

export interface OwnerPackage {
  id: string;
  name: string;
  duration: number;
  price: number;
  description: string;
  boatIds: string[];
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

const mapBoatDocument = (document: any): BoatDocument => ({
  id: document.id,
  name: document.name,
  filePath: document.file_path,
  dataUrl: document.file_path,
  fileType: document.file_type ?? "application/octet-stream",
});

const mapOwnerBoat = (boat: any, features: string[], documents: BoatDocument[]): OwnerBoat => ({
  id: boat.id,
  name: boat.name,
  type: boat.type,
  location: boat.location,
  capacity: Number(boat.capacity ?? 0),
  pricePerDay: Number(boat.price_per_day ?? 0),
  rating: Number(boat.rating ?? 0),
  image: resolveStorageImage(boat.image, "boat-images", "https://via.placeholder.com/400x300?text=Boat"),
  features,
  documents,
  status: boat.status ?? "active",
  bookings: Number(boat.bookings ?? 0),
  revenue: Number(boat.revenue ?? 0),
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

      return mapOwnerBoat(
        boat,
        Array.isArray(featureRows) ? featureRows.map((feature: any) => feature.feature) : [],
        Array.isArray(documentRows) ? documentRows.map(mapBoatDocument) : [],
      );
    }),
  );
};

export const addOwnerBoat = async (boat: Omit<OwnerBoat, "id">): Promise<OwnerBoat> => {
  const session = await getSession();
  const boatsTable = (supabase as any).from("boats");
  const featuresTable = (supabase as any).from("boat_features");
  const documentsTable = (supabase as any).from("boat_documents");

  const { data: insertedBoat, error } = await boatsTable
    .insert({
      owner_id: session.user.id,
      name: boat.name,
      type: boat.type,
      location: boat.location,
      capacity: boat.capacity,
      price_per_day: boat.pricePerDay,
      rating: boat.rating,
      image: boat.image,
      status: boat.status,
      bookings: boat.bookings,
      revenue: boat.revenue,
    })
    .select()
    .single();

  if (error || !insertedBoat) {
    throw new Error(error?.message || "Failed to add boat");
  }

  if (boat.features.length > 0) {
    await featuresTable.insert(
      boat.features.map((feature) => ({
        boat_id: insertedBoat.id,
        feature,
      })),
    );
  }

  if (boat.documents.length > 0) {
    await documentsTable.insert(
      boat.documents.map((document) => ({
        boat_id: insertedBoat.id,
        name: document.name,
        file_path: document.filePath || document.dataUrl || "",
        file_type: document.fileType,
      })),
    );
  }

  return {
    ...boat,
    id: insertedBoat.id,
    documents: boat.documents.map((document) => ({
      ...document,
      filePath: document.filePath || document.dataUrl || "",
      dataUrl: document.dataUrl || document.filePath,
    })),
  };
};

export const updateOwnerBoat = async (boatId: string, updates: Partial<OwnerBoat>): Promise<OwnerBoat | null> => {
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
  if (updates.capacity !== undefined) boatUpdates.capacity = updates.capacity;
  if (updates.pricePerDay !== undefined) boatUpdates.price_per_day = updates.pricePerDay;
  if (updates.rating !== undefined) boatUpdates.rating = updates.rating;
  if (updates.image !== undefined) boatUpdates.image = updates.image;
  if (updates.status !== undefined) boatUpdates.status = updates.status;
  if (updates.bookings !== undefined) boatUpdates.bookings = updates.bookings;
  if (updates.revenue !== undefined) boatUpdates.revenue = updates.revenue;

  const { error } = await boatsTable.update(boatUpdates).eq("id", boatId).eq("owner_id", session.user.id);

  if (error) {
    throw new Error(error.message || "Failed to update boat");
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
      await documentsTable.insert(
        updates.documents.map((document) => ({
          boat_id: boatId,
          name: document.name,
          file_path: document.filePath || document.dataUrl || "",
          file_type: document.fileType,
        })),
      );
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
  const session = await getSession();
  const boatsTable = (supabase as any).from("boats");
  const calendarTable = (supabase as any).from("calendar_events");
  const { data: ownedBoats, error: boatsError } = await boatsTable.select("id").eq("owner_id", session.user.id);

  if (boatsError) {
    throw new Error(boatsError.message || "Failed to load owner calendar");
  }

  const boatIds = Array.isArray(ownedBoats) ? ownedBoats.map((boat: any) => boat.id) : [];
  if (boatIds.length === 0) {
    return [];
  }

  let query = calendarTable.select("*").in("boat_id", boatIds).order("date", { ascending: true });
  if (boatId) {
    query = query.eq("boat_id", boatId);
  }

  const { data: events, error } = await query;
  if (error) {
    throw new Error(error.message || "Failed to load calendar events");
  }

  return Array.isArray(events)
    ? events.map((event: any) => ({
        id: event.id,
        boatId: event.boat_id,
        date: event.date,
        type: event.type,
        guestName: event.guest_name ?? undefined,
        bookingId: event.booking_id ?? undefined,
      }))
    : [];
};

export const addCalendarEvent = async (event: Omit<OwnerCalendarEvent, "id">): Promise<OwnerCalendarEvent> => {
  const session = await getSession();
  const boatsTable = (supabase as any).from("boats");
  const calendarTable = (supabase as any).from("calendar_events");
  const { data: boat } = await boatsTable.select("id").eq("id", event.boatId).eq("owner_id", session.user.id).single();

  if (!boat) {
    throw new Error("You can only manage calendar events for your own boats");
  }

  const { data, error } = await calendarTable
    .insert({
      boat_id: event.boatId,
      date: event.date,
      type: event.type,
      guest_name: event.guestName,
      booking_id: event.bookingId,
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Failed to add calendar event");
  }

  return {
    id: data.id,
    boatId: data.boat_id,
    date: data.date,
    type: data.type,
    guestName: data.guest_name ?? undefined,
    bookingId: data.booking_id ?? undefined,
  };
};

export const deleteCalendarEvent = async (id: string): Promise<boolean> => {
  const session = await getSession();
  const boatsTable = (supabase as any).from("boats");
  const calendarTable = (supabase as any).from("calendar_events");
  const { data: ownedBoats } = await boatsTable.select("id").eq("owner_id", session.user.id);
  const boatIds = Array.isArray(ownedBoats) ? ownedBoats.map((boat: any) => boat.id) : [];
  const { error } = await calendarTable.delete().eq("id", id).in("boat_id", boatIds);
  if (error) {
    throw new Error(error.message || "Failed to delete calendar event");
  }
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
