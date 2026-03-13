const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";

const ABSOLUTE_URL = /^https?:\/\//i;
const DATA_URL = /^data:/i;

export const getPublicStorageUrl = (bucket: string, path: string): string => {
  if (!supabaseUrl || !path.trim()) {
    return "";
  }

  const normalizedPath = path.replace(/^\/+/, "");
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${normalizedPath}`;
};

export const resolveStorageImage = (
  value: string | null | undefined,
  defaultBucket: string,
  fallback = "",
): string => {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) {
    return fallback;
  }

  if (ABSOLUTE_URL.test(trimmed) || DATA_URL.test(trimmed)) {
    return trimmed;
  }

  const bucketPrefix = `${defaultBucket}/`;
  if (trimmed.startsWith(bucketPrefix)) {
    return getPublicStorageUrl(defaultBucket, trimmed.slice(bucketPrefix.length)) || fallback;
  }

  const firstSlash = trimmed.indexOf("/");
  if (firstSlash > 0) {
    const maybeBucket = trimmed.slice(0, firstSlash);
    const maybePath = trimmed.slice(firstSlash + 1);
    const knownBuckets = new Set([
      "boat-images",
      "destination-images",
      "profile-images",
      "review-media",
      "boat-documents",
      "owner-verification-docs",
      "chat-attachments",
      "payment-receipts",
      "support-attachments",
      "temp-uploads",
    ]);

    if (knownBuckets.has(maybeBucket)) {
      return getPublicStorageUrl(maybeBucket, maybePath) || fallback;
    }
  }

  return getPublicStorageUrl(defaultBucket, trimmed) || fallback;
};
