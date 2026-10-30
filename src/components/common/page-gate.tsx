"use client";

import {
    createContext,
    useContext,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
    type ReactNode,
} from "react";
import { useQueryClient, type Query } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

import { PageLoader } from "@/components/common/loader";
import { Button } from "@/components/ui/button";
import { AlertCircleIcon, RotateLeft01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { cn } from "@/lib/utils/utils";

type GateState = "pending" | "ready" | "error";

/** How long the query cache must stay idle before the page counts as loaded (covers dependent queries). */
const SETTLE_MS = 120;

const PageGateContext = createContext<{
    state: GateState;
    setRoutePending: (pending: boolean) => void;
} | null>(null);

/**
 * Keeps one loader on screen until the page's first round of queries has settled, then reveals
 * the whole page at once. The page stays mounted (hidden, entrance animations paused) so its
 * queries run while the loader shows. If a first load fails, an error state with retry replaces
 * the loader. Once revealed, the gate stays open until the pathname changes: later refetches use
 * each component's own loader. The gate resets on pathname changes itself because the template
 * only remounts when its top-level segment changes (e.g. not from /setup/users to /setup/roles).
 */
export function PageGate({ children }: { children: ReactNode }) {
    const queryClient = useQueryClient();
    const [state, setState] = useState<GateState>("pending");
    const [routePending, setRoutePending] = useState(false);
    const [isRetrying, setIsRetrying] = useState(false);
    const [failed, setFailed] = useState<Query[]>([]);
    const tracked = useRef({ pathname: "", hashes: new Set<string>() });

    const pathname = usePathname();
    const [gatedPathname, setGatedPathname] = useState(pathname);
    if (pathname !== gatedPathname) {
        setGatedPathname(pathname);
        setState("pending");
        setFailed([]);
    }

    useEffect(() => {
        if (state !== "pending") return;
        if (tracked.current.pathname !== pathname) {
            tracked.current = { pathname, hashes: new Set() };
        }
        const { hashes } = tracked.current;

        const cache = queryClient.getQueryCache();
        let timer: ReturnType<typeof setTimeout> | undefined;
        let scheduled: ReturnType<typeof setTimeout> | undefined;

        const check = () => {
            clearTimeout(timer);

            const queries = cache.getAll();
            for (const query of queries) {
                if (query.state.fetchStatus === "fetching") hashes.add(query.queryHash);
            }
            const pageQueries = queries.filter((query) => hashes.has(query.queryHash));
            const fetching = pageQueries.filter((query) => query.state.fetchStatus === "fetching");

            setIsRetrying(fetching.some((query) => query.state.fetchFailureCount > 0));
            if (routePending || fetching.length) return;

            timer = setTimeout(() => {
                const errored = pageQueries.filter(
                    (query) => query.state.status === "error" && query.state.data === undefined,
                );
                setFailed(errored);
                setState(errored.length ? "error" : "ready");
            }, SETTLE_MS);
        };

        // Cache events can fire while a component renders (a query is created in useQuery), so
        // the gate reads the cache on the next tick rather than setting state mid-render.
        const schedule = () => {
            clearTimeout(scheduled);
            scheduled = setTimeout(check);
        };

        schedule();
        const unsubscribe = cache.subscribe(schedule);

        return () => {
            unsubscribe();
            clearTimeout(timer);
            clearTimeout(scheduled);
        };
    }, [queryClient, state, routePending, pathname]);

    const retry = () => {
        setState("pending");
        for (const query of failed) {
            void queryClient.refetchQueries({ queryKey: query.queryKey, exact: true });
        }
    };

    return (
        <PageGateContext.Provider value={{ state, setRoutePending }}>
            {state === "pending" && <PageLoader retrying={isRetrying} />}
            {state === "error" && (
                <PageError
                    message={failed[0]?.state.error?.message}
                    onRetry={retry}
                    onShowAnyway={() => setState("ready")}
                />
            )}
            <div
                data-state={state}
                aria-hidden={state !== "ready"}
                className={cn(
                    "page-reveal flex w-full flex-col gap-6",
                    state === "ready" ? "flex-1" : "invisible h-0 overflow-hidden",
                )}
            >
                {children}
            </div>
        </PageGateContext.Provider>
    );
}

/**
 * Rendered by every `loading.tsx`. While the route itself is still loading, it holds the gate
 * closed so the gate's loader covers both the route and its data in one go.
 */
export function RouteLoading() {
    const gate = useContext(PageGateContext);
    const setRoutePending = gate?.setRoutePending;

    useLayoutEffect(() => {
        if (!setRoutePending) return;
        setRoutePending(true);
        return () => setRoutePending(false);
    }, [setRoutePending]);

    // Outside a gate, or after it already opened, this is the loader itself.
    return !gate || gate.state === "ready" ? <PageLoader /> : null;
}

function PageError({
    message,
    onRetry,
    onShowAnyway,
}: {
    message?: string;
    onRetry: () => void;
    onShowAnyway: () => void;
}) {
    const t = useTranslations("common.pageState");

    return (
        <div
            role="alert"
            className="animate-reveal flex min-h-[calc(100dvh-10rem)] w-full flex-col items-center justify-center gap-4 text-center"
        >
            <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <HugeiconsIcon icon={AlertCircleIcon} className="size-6" />
            </div>
            <div className="flex max-w-md flex-col gap-1">
                <h2 className="text-base font-semibold">{t("errorTitle")}</h2>
                <p className="text-sm text-muted-foreground">{t("errorDescription")}</p>
                {message && <p className="mt-1 font-mono text-xs text-muted-foreground">{message}</p>}
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
                <Button size="sm" variant="outlinePrimary" onClick={onRetry}>
                    <HugeiconsIcon icon={RotateLeft01Icon} />
                    {t("retry")}
                </Button>
                <Button size="sm" variant="ghost" onClick={onShowAnyway}>
                    {t("showAnyway")}
                </Button>
            </div>
        </div>
    );
}
