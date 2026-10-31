"use client";

import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils/utils";
import type { TKpiReviewRow, TScaleLevel } from "@/types/appraisal";
import { Add01Icon, AlertCircleIcon, CheckmarkCircle02Icon, Delete02Icon } from "@hugeicons/core-free-icons";
import { emptyKpiRow, looseSectionErrors, weightTotal, type TAnswerErrors, type TKpiRow } from "./answers";
import FieldError from "./field-error";
import RatingControl from "./rating-control";
import SectionCard from "./section-card";

type TTextKey = "objective" | "kpi" | "target";

const hasRatings = (row: TKpiRow): row is TKpiReviewRow => "self" in row;

/**
 * Bagian IV: KPI rows (objective, KPI, target, weight %). The review kind (IV.A) adds self and
 * final ratings per row and shows weight × final; the target kind (IV.B) is rows only.
 */
export default function KpiSection({
  sectionKey,
  title,
  instructions,
  scale,
  minRows,
  maxRows,
  rows,
  onChange,
  rowsEditable,
  selfEditable,
  finalEditable,
  showFinal,
  errors,
}: {
  sectionKey: string;
  title: string;
  instructions: string;
  /** Only for kpi_review. */
  scale?: TScaleLevel[];
  minRows: number;
  maxRows: number;
  rows: TKpiRow[];
  onChange: (rows: TKpiRow[]) => void;
  rowsEditable: boolean;
  selfEditable: boolean;
  finalEditable: boolean;
  showFinal: boolean;
  errors: TAnswerErrors;
}) {
  const t = useTranslations("appraisal.form.kpi");
  const tRating = useTranslations("appraisal.form.rating");
  const locale = useLocale();
  const number = new Intl.NumberFormat(locale === "id" ? "id-ID" : "en-GB", { maximumFractionDigits: 2 });
  const withRatings = !!scale;

  const total = weightTotal(rows);
  const isBalanced = Math.abs(total - 100) < 0.001;

  const updateRow = (index: number, patch: Partial<TKpiReviewRow>) => onChange(rows.map((row, rowIndex) => (rowIndex === index ? ({ ...row, ...patch } as TKpiRow) : row)));
  const removeRow = (index: number) => onChange(rows.filter((_, rowIndex) => rowIndex !== index));
  const addRow = () => onChange([...rows, withRatings ? emptyKpiRow(true) : emptyKpiRow(false)]);

  const rowError = (index: number, field: string) => errors[`${sectionKey}.${index}.${field}`];
  const looseErrors = looseSectionErrors(errors, sectionKey, (head) => /^\d+$/.test(head) && Number(head) < rows.length);

  const textField = (index: number, field: TTextKey, row: TKpiRow) => {
    const id = `${sectionKey}-${index}-${field}`;
    const error = rowError(index, field);

    return (
      <div className="flex min-w-0 flex-col gap-1.5" data-appraisal-field>
        <Label htmlFor={id} className="text-xs text-muted-foreground">
          {t(field)}
        </Label>
        {rowsEditable ? (
          // Objective and KPI are often long sentences; both get a textarea. Target stays one line.
          field === "objective" || field === "kpi" ? (
            <Textarea
              id={id}
              value={row[field]}
              onChange={(event) => updateRow(index, { [field]: event.target.value })}
              className="min-h-16 resize-y rounded-lg"
              aria-invalid={!!error || undefined}
            />
          ) : (
            <Input id={id} value={row[field]} onChange={(event) => updateRow(index, { [field]: event.target.value })} className="rounded-lg" aria-invalid={!!error || undefined} />
          )
        ) : (
          <p id={id} className="text-sm whitespace-pre-wrap">
            {row[field] || "-"}
          </p>
        )}
        <FieldError message={error} />
      </div>
    );
  };

  return (
    <SectionCard id={sectionKey} title={title} instructions={instructions} errors={looseErrors}>
      {rows.length === 0 && <p className="text-sm text-muted-foreground">{t("empty")}</p>}

      <ol className="flex flex-col gap-3">
        {rows.map((row, index) => {
          const weightId = `${sectionKey}-${index}-weight`;
          const weightError = rowError(index, "weight");

          return (
            <li key={index} className="flex flex-col gap-3 rounded-xl border p-3 sm:p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold">{t("row", { index: index + 1 })}</p>
                {rowsEditable && rows.length > minRows && (
                  <Button type="button" variant="ghost" size="icon-sm" aria-label={t("removeRow", { index: index + 1 })} onClick={() => removeRow(index)}>
                    <HugeiconsIcon icon={Delete02Icon} className="size-4 text-destructive" />
                  </Button>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {textField(index, "objective", row)}
                {textField(index, "kpi", row)}
                {textField(index, "target", row)}
                <div className="flex min-w-0 flex-col gap-1.5" data-appraisal-field>
                  <Label htmlFor={weightId} className="text-xs text-muted-foreground">
                    {t("weight")}
                  </Label>
                  {rowsEditable ? (
                    <div className="relative w-full sm:w-32">
                      <Input
                        id={weightId}
                        type="number"
                        inputMode="decimal"
                        min={0}
                        max={100}
                        step="any"
                        value={String(row.weight)}
                        onChange={(event) => updateRow(index, { weight: Number(event.target.value) || 0 })}
                        className="rounded-lg pr-8 tabular-nums"
                        aria-invalid={!!weightError || undefined}
                      />
                      <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-muted-foreground">%</span>
                    </div>
                  ) : (
                    <p id={weightId} className="text-sm tabular-nums">
                      {number.format(row.weight)}%
                    </p>
                  )}
                  <FieldError message={weightError} />
                </div>
              </div>

              {withRatings && hasRatings(row) && scale && (
                <div className="grid gap-4 border-t pt-3 sm:grid-cols-2">
                  <RatingControl
                    label={tRating("self")}
                    scale={scale}
                    value={row.self}
                    readOnly={!selfEditable}
                    onChange={(rating) => updateRow(index, { self: rating })}
                    error={rowError(index, "self")}
                  />
                  {showFinal ? (
                    <div className="flex flex-col gap-2">
                      <RatingControl
                        label={tRating("final")}
                        tone="final"
                        scale={scale}
                        value={row.final}
                        readOnly={!finalEditable}
                        onChange={(rating) => updateRow(index, { final: rating })}
                        error={rowError(index, "final")}
                      />
                      {row.final !== null && (
                        <p className="text-xs text-muted-foreground tabular-nums">
                          {t("score", { weight: number.format(row.weight), final: row.final, score: number.format((row.weight * row.final) / 100) })}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1.5">
                      <span className="text-xs font-medium text-muted-foreground">{tRating("final")}</span>
                      <p className="rounded-lg border border-dashed px-3 py-2 text-xs text-muted-foreground">{tRating("finalHidden")}</p>
                    </div>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ol>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {rowsEditable && (
            <Button type="button" variant="outline" size="sm" disabled={rows.length >= maxRows} onClick={addRow}>
              <HugeiconsIcon icon={Add01Icon} className="size-4" />
              {t("addRow")}
            </Button>
          )}
          <span className="text-xs text-muted-foreground">{t("rowsHint", { min: minRows, max: maxRows })}</span>
        </div>
        {rows.length > 0 && (
          <p
            className={cn("flex items-center gap-1.5 text-sm", isBalanced ? "text-green-strong" : "text-yellow-strong")}
            aria-live="polite"
          >
            <HugeiconsIcon icon={isBalanced ? CheckmarkCircle02Icon : AlertCircleIcon} className="size-4" />
            <span>
              {t("totalWeight")}: <span className="font-semibold tabular-nums">{number.format(total)}%</span>
            </span>
          </p>
        )}
      </div>
      {rows.length > 0 && !isBalanced && <p className="-mt-2 text-xs text-yellow-strong sm:text-right">{t("weightWarning")}</p>}
    </SectionCard>
  );
}
