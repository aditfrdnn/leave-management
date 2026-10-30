"use client";

import { useId, useRef, type KeyboardEvent } from "react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils/utils";
import type { TScaleLevel } from "@/types/appraisal";
import FieldError from "./field-error";

/**
 * A 1–5 rating as a radiogroup of buttons (arrow keys move and select, like native radios).
 * The selected level's label and, when given, its description show beneath.
 */
export default function RatingControl({
  label,
  scale,
  levels,
  value,
  onChange,
  readOnly,
  tone = "self",
  error,
}: {
  label: string;
  scale: TScaleLevel[];
  /** Descriptions in scale order (rating items); KPI rows have none. */
  levels?: string[];
  value: number | null;
  onChange?: (value: number) => void;
  readOnly?: boolean;
  tone?: "self" | "final";
  error?: string;
}) {
  const t = useTranslations("appraisal.form.rating");
  const labelId = useId();
  const errorId = useId();
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  const selectedIndex = scale.findIndex((level) => level.value === value);
  const selected = selectedIndex >= 0 ? scale[selectedIndex] : null;
  const focusIndex = selectedIndex >= 0 ? selectedIndex : 0;
  const description = selected && levels ? levels[selectedIndex] : undefined;

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (readOnly) return;

    const step = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 0;
    const target = event.key === "Home" ? 0 : event.key === "End" ? scale.length - 1 : step ? (index + step + scale.length) % scale.length : -1;
    if (target < 0) return;

    event.preventDefault();
    onChange?.(scale[target].value);
    buttons.current[target]?.focus();
  };

  return (
    <div className="flex min-w-0 flex-col gap-1.5" data-appraisal-field>
      <span id={labelId} className="text-xs font-medium text-muted-foreground">
        {label}
      </span>
      <div
        role="radiogroup"
        aria-labelledby={labelId}
        aria-readonly={readOnly || undefined}
        aria-invalid={!!error || undefined}
        aria-describedby={error ? errorId : undefined}
        className="flex flex-wrap gap-1.5"
      >
        {scale.map((level, index) => {
          const isSelected = level.value === value;

          return (
            <button
              key={level.value}
              ref={(element) => {
                buttons.current[index] = element;
              }}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={`${level.value} — ${level.label}`}
              title={level.label}
              disabled={readOnly}
              tabIndex={index === focusIndex ? 0 : -1}
              onClick={() => onChange?.(level.value)}
              onKeyDown={(event) => onKeyDown(event, index)}
              className={cn(
                "flex size-9 items-center justify-center rounded-lg border text-sm font-medium tabular-nums transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                isSelected
                  ? tone === "final"
                    ? "border-green-strong bg-green/10 text-green-strong"
                    : "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-foreground hover:bg-muted",
                readOnly && "cursor-default hover:bg-transparent disabled:opacity-100",
                readOnly && !isSelected && "text-muted-foreground",
                !!error && !isSelected && "border-destructive",
              )}
            >
              {level.value}
            </button>
          );
        })}
      </div>
      <div className="flex flex-col gap-0.5" aria-live="polite">
        {selected ? (
          <>
            <p className="text-xs font-medium">{selected.label}</p>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
          </>
        ) : (
          <p className="text-xs text-muted-foreground">{t("notRated")}</p>
        )}
      </div>
      <FieldError id={errorId} message={error} />
    </div>
  );
}
