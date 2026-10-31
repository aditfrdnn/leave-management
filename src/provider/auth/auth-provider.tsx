"use client"

import { SignOut } from "@/app/(auth)/actions";
import { authService } from "@/services";
import { useAuthStore } from "@/stores"
import { useCallback, useEffect } from "react";


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
            }
        } catch {
            // No session, or an expired/revoked token: drop it and, unless already there, go to sign-in
            // with the current page as the callback. (This provider also wraps the sign-in page.)
            const onSignIn = window.location.pathname.startsWith("/sign-in");
            const { url } = await SignOut(onSignIn ? undefined : `${window.location.pathname}${window.location.search}`);
            clear();
            if (url && !onSignIn) window.location.replace(url);
        } finally {
            setInitialized(true);
        }
    }, [setAuth, clear, setInitialized]);

    useEffect(() => {
        initialize();
    }, [initialize]);

    return children
}
