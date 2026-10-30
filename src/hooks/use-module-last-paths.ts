"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";

const STORAGE_KEY = "app-module-last-paths";
const CHANGE_EVENT = "app-module-last-paths-change";

function readRaw() {
    try {
        return localStorage.getItem(STORAGE_KEY) ?? "{}";
    } catch {
        return "{}";
    }
}

function parse(raw: string): Record<string, string> {
    try {
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
        return {};
    }
}

function subscribe(onChange: () => void) {
    window.addEventListener("storage", onChange);
    window.addEventListener(CHANGE_EVENT, onChange);
    return () => {
        window.removeEventListener("storage", onChange);
        window.removeEventListener(CHANGE_EVENT, onChange);
    };
}

/**
 * Remembers the last page opened in each module, so switching back to a module
 * returns to where the user left it instead of the module's landing page.
 */
export function useModuleLastPaths(activeModuleId: string, currentPath: string) {
    // The server snapshot is empty, so the first client render matches the server.
    const raw = useSyncExternalStore(subscribe, readRaw, () => "{}");
    const lastPaths = useMemo(() => parse(raw), [raw]);

    useEffect(() => {
        const stored = parse(readRaw());
        if (stored[activeModuleId] === currentPath) return;

        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...stored, [activeModuleId]: currentPath }));
            window.dispatchEvent(new Event(CHANGE_EVENT));
        } catch {
            // Storage can be blocked (private mode); remembering is best-effort.
        }
    }, [activeModuleId, currentPath]);

    return lastPaths;
}
