import { cn } from "@/lib/utils/utils";

/** The H-person lettermark (`public/hrlite-mark*.svg`), inline so it takes `currentColor`. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" role="img" aria-label="HR Lite" className={cn("size-8 shrink-0", className)} fill="currentColor">
      <rect x="8" y="10" width="13" height="44" rx="6.5" />
      <rect x="43" y="10" width="13" height="44" rx="6.5" />
      <rect x="18" y="33" width="28" height="12" rx="6" />
      <circle cx="32" cy="21" r="7" />
    </svg>
  );
}

/**
 * Mark + wordmark. "HR" is semibold in the foreground color, "Lite" is light in the primary
 * color, as in the brand concept. `tone="inverted"` is for the blue brand panel.
 */
export function BrandLogo({
  className,
  markClassName,
  tone = "default",
}: {
  className?: string;
  markClassName?: string;
  tone?: "default" | "inverted";
}) {
  const inverted = tone === "inverted";

  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <BrandMark className={cn(inverted ? "text-white" : "text-primary", markClassName)} />
      <span className="flex items-baseline text-xl leading-none tracking-tight">
        <span className={cn("font-semibold", inverted ? "text-white" : "text-foreground")}>HR</span>
        <span className={cn("font-light", inverted ? "text-white/80" : "text-primary")}>Lite</span>
      </span>
    </span>
  );
}
