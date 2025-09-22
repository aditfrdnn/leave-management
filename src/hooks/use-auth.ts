"use client";

import instance from "@/lib/axios";
import { TUser } from "@/types/user";
import { useEffect, useState } from "react";

export function useAuth() {
  const [user, setUser] = useState<TUser | null>(null);
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      try {
        const res = await instance.get("/api/user");
        if (!res.data) throw new Error("Unauthorized");

        const data = await res.data;
        setUser(data);
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
