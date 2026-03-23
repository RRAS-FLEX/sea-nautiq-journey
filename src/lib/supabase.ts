import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          is_owner: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name: string;
          is_owner?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          is_owner?: boolean;
          updated_at?: string;
        };
      };
      boats: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          description: string | null;
          type: string;
          location: string;
          capacity: number;
          price: number | null;
          price_per_day: number;
          rating: number;
          image: string;
          images: string | null;
          skipper_required: boolean | null;
          documents_folder: string | null;
          image_url: string | null;
          stripe_link: string | null;
          status: "active" | "inactive" | "maintenance";
          bookings: number;
          revenue: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          description?: string | null;
          type: string;
          location: string;
          capacity: number;
          price?: number | null;
          price_per_day: number;
          rating?: number;
          image?: string;
          images?: string | null;
          skipper_required?: boolean | null;
          documents_folder?: string | null;
          image_url?: string | null;
          stripe_link?: string | null;
          status?: "active" | "inactive" | "maintenance";
          bookings?: number;
          revenue?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          name?: string;
          description?: string | null;
          type?: string;
          location?: string;
          capacity?: number;
          price?: number | null;
          price_per_day?: number;
          rating?: number;
          image?: string;
          images?: string | null;
          skipper_required?: boolean | null;
          documents_folder?: string | null;
          image_url?: string | null;
          stripe_link?: string | null;
          status?: "active" | "inactive" | "maintenance";
          bookings?: number;
          revenue?: number;
          updated_at?: string;
        };
      };
      boat_features: {
        Row: {
          id: string;
          boat_id: string;
          feature: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          boat_id: string;
          feature: string;
          created_at?: string;
        };
        Update: {
          feature?: string;
        };
      };
      boat_documents: {
        Row: {
          id: string;
          boat_id: string;
          name: string;
          file_path: string;
          file_type: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          boat_id: string;
          name: string;
          file_path: string;
          file_type: string;
          created_at?: string;
        };
        Update: {
          name?: string;
        };
      };
      bookings: {
        Row: {
          id: string;
          boat_id: string;
          customer_id: string | null;
          start_date: string;
          end_date: string;
          start_time: string | null;
          end_time: string | null;
          package_hours: number | null;
          departure_time: string | null;
          departure_marina: string | null;
          status: "pending" | "confirmed" | "completed" | "cancelled";
          total_price: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          boat_id: string;
          customer_id?: string | null;
          start_date: string;
          end_date: string;
          start_time?: string | null;
          end_time?: string | null;
          package_hours?: number | null;
          departure_time?: string | null;
          departure_marina?: string | null;
          status?: "pending" | "confirmed" | "completed" | "cancelled";
          total_price: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          customer_id?: string | null;
          start_date?: string;
          end_date?: string;
          start_time?: string | null;
          end_time?: string | null;
          package_hours?: number | null;
          departure_time?: string | null;
          departure_marina?: string | null;
          status?: "pending" | "confirmed" | "completed" | "cancelled";
          total_price?: number;
          updated_at?: string;
        };
      };
      calendar_events: {
        Row: {
          id: string;
          boat_id: string;
          start_time: string | null;
          end_time: string | null;
          date: string;
          type: "booked" | "blocked" | "maintenance";
          guest_name: string | null;
          booking_id: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          boat_id: string;
          start_time?: string | null;
          end_time?: string | null;
          date: string;
          type: "booked" | "blocked" | "maintenance";
          guest_name?: string | null;
          booking_id?: string | null;
          created_at?: string | null;
        };
        Update: {
          boat_id?: string;
          start_time?: string | null;
          end_time?: string | null;
          date?: string;
          type?: "booked" | "blocked" | "maintenance";
          guest_name?: string | null;
          booking_id?: string | null;
          created_at?: string | null;
        };
      };
      admin_users: {
        Row: {
          id: string;
          user_id: string;
          email: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          email: string;
          created_at?: string;
        };
        Update: {};
      };
      reviews: {
        Row: {
          id: string;
          boat_id: string;
          customer_id: string;
          rating: number;
          comment: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          boat_id: string;
          customer_id: string;
          rating: number;
          comment?: string;
          created_at?: string;
        };
        Update: {
          rating?: number;
          comment?: string;
        };
      };
      favorites: {
        Row: {
          id: string;
          user_id: string;
          boat_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          boat_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          boat_id?: string;
          created_at?: string;
        };
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
};

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

const isLocalUrl = (value: string) => /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(value);

const isAllowedSupabaseUrl = (value: string) => /^https:\/\//i.test(value) || isLocalUrl(value);

const decodeJwtPayload = (token: string) => {
	try {
		const [, payload] = token.split(".");
		if (!payload) return null;
		const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
		const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
		return JSON.parse(atob(padded));
	} catch {
		return null;
	}
};

const isServiceRoleKey = (token: string) => {
	const payload = decodeJwtPayload(token);
	return payload?.role === "service_role";
};

let supabase: SupabaseClient<Database> | null = null;

if (supabaseUrl && supabaseAnonKey && isAllowedSupabaseUrl(supabaseUrl) && !isServiceRoleKey(supabaseAnonKey)) {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: "pkce",
      storageKey: "nautiq.auth.token",
    },
  });
} else {
  console.warn(
    "Supabase environment variables are missing or insecure. Database features will be disabled. " +
    "Use an HTTPS Supabase URL (or localhost for dev) and only the anon public key, never the service_role key."
  );
  
  // Create a dummy client that won't throw errors
  supabase = {
    auth: {
      signUp: () => Promise.reject(new Error("Supabase not configured")),
      signInWithPassword: () => Promise.reject(new Error("Supabase not configured")),
      signOut: () => Promise.reject(new Error("Supabase not configured")),
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
    from: () => ({
      select: () => Promise.reject(new Error("Supabase not configured")),
      insert: () => Promise.reject(new Error("Supabase not configured")),
      update: () => Promise.reject(new Error("Supabase not configured")),
      delete: () => Promise.reject(new Error("Supabase not configured")),
    }),
    storage: {
      from: () => ({
        upload: () => Promise.reject(new Error("Supabase not configured")),
        list: () => Promise.reject(new Error("Supabase not configured")),
        createSignedUrl: () => Promise.reject(new Error("Supabase not configured")),
      }),
    },
  } as any;
}

export { supabase };

type DatabaseShape = Database;

export type AppDatabase = DatabaseShape;

export type DatabasePublic = DatabaseShape["public"];

export type DatabaseTables = DatabasePublic["Tables"];

export type DatabaseUsersRow = DatabaseTables["users"]["Row"];

export type DatabaseUsersInsert = DatabaseTables["users"]["Insert"];

export type DatabaseUsersUpdate = DatabaseTables["users"]["Update"];

