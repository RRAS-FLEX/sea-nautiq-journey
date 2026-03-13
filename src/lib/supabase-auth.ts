import type { User } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import type { DatabaseUsersRow } from "./supabase";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  isOwner: boolean;
}

const toReadableAuthError = (message?: string) => {
  const normalizedMessage = message?.trim().toLowerCase() ?? "";

  if (
    normalizedMessage.includes("email rate limit exceeded") ||
    normalizedMessage.includes("over_email_send_rate_limit")
  ) {
    return "Supabase email sending is rate-limited right now. Wait a few minutes, or disable email confirmation in Supabase: Authentication > Providers > Email > Confirm email.";
  }

  if (normalizedMessage.includes("user already registered")) {
    return "This email is already registered. Try signing in instead.";
  }

  if (normalizedMessage.includes("invalid login credentials")) {
    return "Invalid email or password.";
  }

  return message || "Authentication failed";
};

const mapProfileToAuthUser = (profile: DatabaseUsersRow): AuthUser => ({
  id: profile.id,
  email: profile.email,
  name: profile.name,
  isOwner: profile.is_owner ?? false,
});

const mapSessionToAuthUser = (user: User): AuthUser => ({
  id: user.id,
  email: user.email?.trim().toLowerCase() ?? "",
  name: buildProfileName(user),
  isOwner: false,
});

const buildProfileName = (user: User, fallbackName?: string) => {
  const metadataName = typeof user.user_metadata?.name === "string" ? user.user_metadata.name.trim() : "";
  if (metadataName) {
    return metadataName;
  }

  if (fallbackName?.trim()) {
    return fallbackName.trim();
  }

  const email = user.email?.trim();
  if (email) {
    return email.split("@")[0];
  }

  return "Nautiq User";
};

const ensureUserProfile = async (user: User, fallbackName?: string): Promise<DatabaseUsersRow> => {
  const email = user.email?.trim().toLowerCase();
  if (!email) {
    throw new Error("Supabase user is missing an email address");
  }

  const usersTable = supabase.from("users") as any;

  const { data, error } = await usersTable.upsert(
      {
        id: user.id,
        email,
        name: buildProfileName(user, fallbackName),
        is_owner: false,
      },
      { onConflict: "id" }
    )
    .select()
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Failed to create or load user profile");
  }

  return data;
};

/**
 * Sign up with email and password using Supabase Auth
 * Also creates a user record in the users table
 */
export const signUpWithEmail = async (
  name: string,
  email: string,
  password: string
): Promise<AuthUser> => {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedName = name.trim();

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: normalizedEmail,
    password,
    options: {
      data: {
        name: normalizedName,
      },
    },
  });

  if (authError || !authData.user) {
    throw new Error(toReadableAuthError(authError?.message || "Failed to sign up"));
  }

  if (!authData.session) {
    throw new Error("Account created. Confirm your email, then sign in.");
  }

  const profile = await ensureUserProfile(authData.user, normalizedName);
  return mapProfileToAuthUser(profile);
};

export const signInWithGoogle = async (redirectTo?: string): Promise<void> => {
  const target = redirectTo || `${window.location.origin}/`;
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: target,
    },
  });

  if (error) {
    throw new Error(toReadableAuthError(error.message || "Google sign in failed"));
  }
};

/**
 * Sign in with email and password
 */
export const signInWithEmail = async (
  email: string,
  password: string
): Promise<AuthUser> => {
  const usersTable = supabase.from("users") as any;

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });

  if (error || !data.user) {
    throw new Error(toReadableAuthError(error?.message || "Invalid email or password"));
  }

  // Fetch user profile
  const { data: userData, error: userError } = await usersTable
    .select("*")
    .eq("id", data.user.id)
    .single();

  if (userError || !userData) {
    try {
      const profile = await ensureUserProfile(data.user);
      return mapProfileToAuthUser(profile);
    } catch {
      return mapSessionToAuthUser(data.user);
    }
  }

  return mapProfileToAuthUser(userData);
};

/**
 * Get the currently signed-in user (from Supabase session)
 */
export const getSessionUser = async (): Promise<AuthUser | null> => {
  const usersTable = supabase.from("users") as any;

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.user) {
    return null;
  }

  const sessionFallback = mapSessionToAuthUser(session.user);

  // Fetch user profile
  const { data: userData, error: userError } = await usersTable
    .select("*")
    .eq("id", session.user.id)
    .single();

  if (userError || !userData) {
    try {
      const profile = await ensureUserProfile(session.user);
      return mapProfileToAuthUser(profile);
    } catch {
      return sessionFallback;
    }
  }

  return mapProfileToAuthUser(userData);
};

/**
 * Sign out the current user
 */
export const signOut = async (): Promise<void> => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new Error(error.message || "Failed to sign out");
  }
};

/**
 * Listen to auth state changes (for reactive UI updates)
 */
export const onAuthStateChange = (
  callback: (user: AuthUser | null) => void
): (() => void) => {
  const { data: listener } = supabase.auth.onAuthStateChange(
    async (_event, session) => {
      if (!session?.user) {
        callback(null);
        return;
      }

      const user = await getSessionUser();
      callback(user ?? mapSessionToAuthUser(session.user));
    }
  );

  return () => {
    listener?.subscription.unsubscribe();
  };
};
