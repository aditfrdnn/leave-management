"use client"

import { authService } from "@/services";
import { useAuthStore } from "@/stores"
import { useCallback, useEffect } from "react";

/** When this tab last went to IAM because the API refused it. */
const LOGIN_REDIRECT_KEY = "hrlite:login-redirect";
const LOOP_WINDOW_MS = 60 * 1000;


export function AuthProvider({
    children
}: {
    children: React.ReactNode
}) {
    const setAuth = useAuthStore((state) => state.setAuth);
    const clear = useAuthStore((state) => state.clear);
    const setInitialized = useAuthStore((state) => state.setInitialized);

    const initialize = useCallback(async () => {
        try {
            const response = await authService.me();
            const user = response?.data;

            if (user) {
                setAuth(user)
                sessionStorage.removeItem(LOGIN_REDIRECT_KEY)
            }
        } catch {
            // No session, or IAM ended it (signed out elsewhere, access removed): sign in again at
            // IAM and come back to this page. (This provider also wraps the signed-out page.)
            clear();
            if (window.location.pathname.startsWith("/signed-out")) return;

            // Just back from IAM and still refused: IAM let the person in, HR Lite does not
            // (account deactivated here, access removed). Say so instead of looping through IAM.
            const lastRedirect = Number(sessionStorage.getItem(LOGIN_REDIRECT_KEY) ?? 0);
            if (Date.now() - lastRedirect < LOOP_WINDOW_MS) {
                sessionStorage.removeItem(LOGIN_REDIRECT_KEY);
                window.location.replace("/signed-out?error=access_denied");
                return;
            }

            sessionStorage.setItem(LOGIN_REDIRECT_KEY, String(Date.now()));
            window.location.replace(`/auth/login?returnTo=${encodeURIComponent(`${window.location.pathname}${window.location.search}`)}`);
        } finally {
            setInitialized(true);
        }
    }, [setAuth, clear, setInitialized]);

    useEffect(() => {
        initialize();
    }, [initialize]);

    return children
}
