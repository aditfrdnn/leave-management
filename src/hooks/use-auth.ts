"use client";

import { TUser } from "@/types/user";
import { useEffect, useState } from "react";
import useCookies from "./use-cookies";

export function useAuth() {
  const [user, setUser] = useState<TUser | null>(null);
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      try {
        useCookies().then(({ authUser }) => setUser(authUser));
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    getUser();
  }, []);

  return { user, isLoading, isAuthenticated: !!user };
}
