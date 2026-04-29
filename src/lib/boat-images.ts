import { supabase } from "@/lib/supabase";

// Helper to ensure path segments are URL-safe
const sanitizeSegment = (value: unknown) => {
  const asString = String(value ?? "");
  return asString.replace(/[^a-zA-Z0-9_-]/g, "").trim();
};

const slugifyFileName = (value: string) =>
  (value || "image.jpg")
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "") || "image.jpg";

export const uploadBoatImageToStorage = async (
  file: File,
  ownerId: string | null | undefined,
  boatId: string | number,
): Promise<string> => {
  if (!file) throw new Error("File is required");
  const ownerIdStr = String(ownerId ?? "").trim();
  if (!ownerIdStr) throw new Error("ownerId is required");

  // Sanitize EVERYTHING that goes into the path
  const safeOwner = sanitizeSegment(ownerIdStr);
  const safeBoat = sanitizeSegment(boatId);
  const baseFolder = `${safeOwner}/${safeBoat}`;
  // We always store the primary image as "1.jpg" inside the folder
  const objectPath = `${baseFolder}/1.jpg`;

  const { error } = await supabase.storage.from("boat-images").upload(objectPath, file, {
    upsert: true, // Ensure your RLS has UPDATE permissions!
    contentType: file.type || "image/jpeg",
  });

  if (error) {
    // Log the actual code for debugging (like that 22007 you saw)
    console.error(`Storage Error: ${error.message}`, error);
    throw error;
  }
  // In the boats.images column we store just the folder reference,
  // not the specific file URL, so multiple files can live under it.
  return `boat-images/${baseFolder}`;
};