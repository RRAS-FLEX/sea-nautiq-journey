import { useEffect, useState } from "react";
import { getSessionUser, onAuthStateChange } from "@/lib/auth-hybrid";
import type { AuthUser } from "@/lib/auth-hybrid";

export const useCurrentUser = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadUser = async () => {
      try {
        const currentUser = await getSessionUser();
        if (isMounted) {
          setUser(currentUser ?? null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadUser();

    const unsubscribe = onAuthStateChange((nextUser) => {
      if (!isMounted) {
        return;
      }
      setUser(nextUser ?? null);
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      unsubscribe?.();
    };
  }, []);

  return { user, isLoading };
};
