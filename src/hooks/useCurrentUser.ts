// Auth state is managed centrally in AuthContext to avoid per-page re-fetching.
// This hook is a thin wrapper so all existing consumers remain unchanged.
import { useAuth } from "@/contexts/AuthContext";

export const useCurrentUser = () => useAuth();
