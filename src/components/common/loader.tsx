import type { ComponentProps } from "react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils/utils";

type LoaderSize = "xs" | "sm" | "md" | "lg";

/** Three bars rising and falling in turn; takes the text color (muted by default). */
export function Loader({ size = "md", className }: { size?: LoaderSize; className?: string }) {
    return (
        <span
            role="presentation"
            data-size={size}
            className={cn("loader shrink-0 text-muted-foreground", className)}
        >
            <span className="loader-bar text-primary" />
            <span className="loader-bar text-yellow" />
            <span className="loader-bar text-primary" />
        </span>
    );
}

/**
 * Stands in for a block while its data loads. The spinner fades in after a short delay so
 * fast responses never flash it.
 */
export function SectionLoader({
    label,
    size = "sm",
    className,
    ...props
}: { label?: string; size?: LoaderSize } & ComponentProps<"div">) {
    return (
        <div
            role="status"
            aria-live="polite"
            className={cn("loader-fade flex min-h-24 w-full flex-col items-center justify-center gap-3", className)}
            {...props}
        >
            <Loader size={size} />
            {label ? (
                <p className="text-sm text-muted-foreground">{label}</p>
            ) : (
                <span className="sr-only">Loading</span>
            )}
        </div>
    );
}

/**
 * Full-page loading state, shown by the page gate while a route and its data load. The line under
 * the bars switches to a retry notice while React Query is retrying a failed request.
 */
export function PageLoader({ retrying = false }: { retrying?: boolean }) {
    const t = useTranslations("common");

    return (
        <div
            role="status"
            aria-live="polite"
            className="loader-fade flex min-h-[calc(100dvh-10rem)] w-full flex-col items-center justify-center gap-4"
        >
            <Loader size="md" />
            <p key={String(retrying)} className="animate-reveal text-sm text-muted-foreground">
                {retrying ? t("pageState.retrying") : t("states.loading")}
            </p>
        </div>
    );
}

/** Wraps content that replaces a loader, so it fades in instead of popping. */
export function Reveal({ className, ...props }: ComponentProps<"div">) {
    return <div className={cn("animate-reveal", className)} {...props} />;
}
