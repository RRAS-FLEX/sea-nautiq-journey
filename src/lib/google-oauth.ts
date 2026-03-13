const GOOGLE_CLIENT_ID_PATTERN = /^\d+-[a-zA-Z0-9_-]+\.apps\.googleusercontent\.com$/;

export const sanitizeGoogleClientId = (value: string | undefined) => {
  if (!value) {
    return "";
  }

  return value.trim().replace(/^['"]|['"]$/g, "");
};

export const isGoogleClientIdUsable = (clientId: string) => {
  if (!clientId) {
    return false;
  }

  if (clientId.includes("your-google-client-id")) {
    return false;
  }

  return GOOGLE_CLIENT_ID_PATTERN.test(clientId);
};