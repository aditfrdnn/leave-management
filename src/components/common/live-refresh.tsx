"use client";

import { useQueryClient } from "@tanstack/react-query";
import Echo from "laravel-echo";
import { useRouter } from "next/navigation";
import Pusher from "pusher-js";
import { useEffect } from "react";

import { authService } from "@/services";
import { useAuthStore } from "@/stores";

const key = process.env.NEXT_PUBLIC_REVERB_KEY;
const host = process.env.NEXT_PUBLIC_REVERB_HOST;
const port = Number(process.env.NEXT_PUBLIC_REVERB_PORT ?? 443);
const secure = process.env.NEXT_PUBLIC_REVERB_SCHEME === "https";

/**
 * Keeps open pages current without a manual refresh. The leave API announces changes on Reverb
 * (a leave request submitted or decided, on the web or WhatsApp; setup data; appraisals) and every
 * page refetches what it shows. When the signed-in user's roles change in IAM, who they are and
 * what they may open is fetched again. Messages carry no data.
 */
export function LiveRefresh() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id);
  const setAuth = useAuthStore((state) => state.setAuth);

  useEffect(() => {
    if (!key || !host || !userId) return;

    const echo = new Echo({
      broadcaster: "reverb",
      key,
      wsHost: host,
      wsPort: port,
      wssPort: port,
      forceTLS: secure,
      enabledTransports: ["ws", "wss"],
      authEndpoint: "/broadcasting/auth",
      Pusher,
    });

    let timer: ReturnType<typeof setTimeout> | undefined;
    // A burst of changes (a bulk save) becomes one refetch.
    const refetch = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        queryClient.invalidateQueries();
        router.refresh();
      }, 400);
    };

    echo.private("hrlite").listen(".changed", refetch);
    echo.private(`users.${userId}`).listen(".changed", async ({ topic }: { topic?: string }) => {
      // Signed out at IAM (elsewhere, or the session was ended in the console): sign in again.
      if (topic === "session") {
        window.location.replace(`/auth/login?returnTo=${encodeURIComponent(`${window.location.pathname}${window.location.search}`)}`);
        return;
      }

      try {
        const response = await authService.me();
        if (response?.data) setAuth(response.data);
        refetch();
      } catch {
        // No longer allowed in (deactivated, access removed): AuthProvider takes it from here.
        window.location.reload();
      }
    });

    return () => {
      clearTimeout(timer);
      echo.leave("hrlite");
      echo.leave(`users.${userId}`);
      echo.disconnect();
    };
  }, [router, queryClient, userId, setAuth]);

  return null;
}
