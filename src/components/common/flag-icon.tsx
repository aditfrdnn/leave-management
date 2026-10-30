import { useId } from "react";

import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils/utils";

/** Inline SVG flags: emoji flags render as plain letters on Windows. */
export function FlagIcon({ locale, className }: { locale: Locale; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("inline-flex h-3.5 w-5 shrink-0 overflow-hidden rounded-[3px] ring-1 ring-foreground/10", className)}
    >
      {locale === "id" ? <IndonesiaFlag /> : <UnitedKingdomFlag />}
    </span>
  );
}

function IndonesiaFlag() {
  return (
    <svg viewBox="0 0 3 2" className="size-full" preserveAspectRatio="none">
      <rect width="3" height="1" fill="#CE1126" />
      <rect y="1" width="3" height="1" fill="#FFFFFF" />
    </svg>
  );
}

function UnitedKingdomFlag() {
  // The flag renders more than once per page (trigger and menu), so the clip path id must be unique.
  const clipId = useId();

  return (
    <svg viewBox="0 0 60 30" className="size-full" preserveAspectRatio="none">
      <clipPath id={clipId}>
        <path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" />
      </clipPath>
      <path d="M0,0 v30 h60 v-30 z" fill="#012169" />
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#FFFFFF" strokeWidth="6" />
      <path d="M0,0 L60,30 M60,0 L0,30" clipPath={`url(#${clipId})`} stroke="#C8102E" strokeWidth="4" />
      <path d="M30,0 v30 M0,15 h60" stroke="#FFFFFF" strokeWidth="10" />
      <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6" />
    </svg>
  );
}
