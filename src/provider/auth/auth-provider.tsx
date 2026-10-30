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
            await SignOut();
            clear();
        } finally {
            setInitialized(true);
        }
    }, [setAuth, clear, setInitialized]);

    useEffect(() => {
        initialize();
    }, [initialize]);

    return children
}
