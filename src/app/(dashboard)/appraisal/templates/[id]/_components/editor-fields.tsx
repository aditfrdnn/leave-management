"use client";

import { useTranslations } from "next-intl";
import { get, useFormState, type Path, type UseFormReturn } from "react-hook-form";

import FormInput from "@/components/common/form-input";
import { Button } from "@/components/ui/button";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useTranslateMessage } from "@/hooks/use-translate-message";
import { SCALE_LENGTH, type AppraisalTemplateSchemaType } from "@/validations/appraisal-template-validations";
import { ArrowDown02Icon, ArrowUp02Icon, Delete02Icon } from "@hugeicons/core-free-icons";

export type TTemplateForm = UseFormReturn<AppraisalTemplateSchemaType>;
type TFormPath = Path<AppraisalTemplateSchemaType>;

/** An error message at `path`, including the `root` error RHF keeps for field arrays. */
export function readErrorMessage(errors: unknown, path: string): string | undefined {
  const error = get(errors, path) as { message?: string; root?: { message?: string } } | undefined;

  return error?.message || error?.root?.message || undefined;
}

/** Whether anything under `path` has an error. */
export function hasErrorAt(errors: unknown, path: string) {
  return get(errors, path) !== undefined;
}

/** Error text for a list or group (scale, items, fields) that has no input of its own. */
export function GroupError({ form, path }: { form: TTemplateForm; path: string }) {
  const translateMessage = useTranslateMessage();
  const { errors } = useFormState({ control: form.control });
  const message = readErrorMessage(errors, path);

  if (!message) return null;

  return (
    <p role="alert" className="text-xs text-destructive italic">
      {translateMessage(message)}
    </p>
  );
}

/** Integer input: RHF keeps a number, an empty box becomes NaN so Zod reports it. */
export function NumberField({ form, name, label }: { form: TTemplateForm; name: TFormPath; label: string }) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className="gap-1.5">
          <FormLabel>
            {label}
            <span className="-ml-1 text-destructive">*</span>
          </FormLabel>
          <FormControl>
            <Input
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              className="rounded-lg"
              name={field.name}
              ref={field.ref}
              onBlur={field.onBlur}
              value={typeof field.value === "number" && Number.isFinite(field.value) ? field.value : ""}
              onChange={(event) => field.onChange(event.target.value === "" ? Number.NaN : Number(event.target.value))}
            />
          </FormControl>
          <FormMessage className="-mt-1 text-xs italic" />
        </FormItem>
      )}
    />
  );
}

/** `string[]` edited as one line per entry; blank lines are dropped when saving. */
export function LinesField({ form, name, label, hint }: { form: TTemplateForm; name: TFormPath; label: string; hint?: string }) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className="gap-1.5">
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Textarea
              className="min-h-20 resize-y rounded-lg"
              name={field.name}
              ref={field.ref}
              onBlur={field.onBlur}
              value={Array.isArray(field.value) ? field.value.join("\n") : ""}
              onChange={(event) => field.onChange(event.target.value.split("\n"))}
            />
          </FormControl>
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
          <FormMessage className="-mt-1 text-xs italic" />
        </FormItem>
      )}
    />
  );
}

/** Explains the period placeholders a title or instruction may contain. */
export function PlaceholderHint() {
  const t = useTranslations("setup.appraisalTemplates.editor");

  return (
    <p className="text-xs text-muted-foreground">
      {t.rich("placeholderHint", {
        review: "{review_period}",
        target: "{target_period}",
        code: (chunks) => <code className="rounded bg-muted px-1 font-mono text-2xs">{chunks}</code>,
      })}
    </p>
  );
}

/** The five scale labels of a rating or KPI review section, lowest first. */
export function ScaleLabelsEditor({ form, sectionIndex }: { form: TTemplateForm; sectionIndex: number }) {
  const t = useTranslations("setup.appraisalTemplates.editor");

  return (
    <fieldset className="flex min-w-0 flex-col gap-2">
      <legend className="mb-2 text-sm font-medium">{t("scale.title")}</legend>
      <p className="-mt-1 text-xs text-muted-foreground">{t("scale.hint")}</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: SCALE_LENGTH }, (_, level) => (
          <FormInput
            key={level}
            form={form}
            name={`schema.sections.${sectionIndex}.scale.${level}.label`}
            label={t("scale.level", { value: level + 1 })}
            isRequired
          />
        ))}
      </div>
      <GroupError form={form} path={`schema.sections.${sectionIndex}.scale`} />
    </fieldset>
  );
}

/** Up / down / remove buttons for one entry of an ordered list. */
export function ReorderButtons({
  index,
  count,
  name,
  onMove,
  onRemove,
  canRemove = true,
}: {
  index: number;
  count: number;
  /** What the buttons act on, for the screen-reader labels. */
  name: string;
  onMove: (from: number, to: number) => void;
  onRemove: () => void;
  canRemove?: boolean;
}) {
  const t = useTranslations("setup.appraisalTemplates.editor.reorder");

  return (
    <div className="flex shrink-0 items-center gap-0.5">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        disabled={index === 0}
        aria-label={t("up", { name })}
        title={t("up", { name })}
        onClick={() => onMove(index, index - 1)}
      >
        <HugeiconsIcon icon={ArrowUp02Icon} className="size-4 text-muted-foreground" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        disabled={index === count - 1}
        aria-label={t("down", { name })}
        title={t("down", { name })}
        onClick={() => onMove(index, index + 1)}
      >
        <HugeiconsIcon icon={ArrowDown02Icon} className="size-4 text-muted-foreground" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        disabled={!canRemove}
        aria-label={t("remove", { name })}
        title={t("remove", { name })}
        onClick={onRemove}
      >
        <HugeiconsIcon icon={Delete02Icon} className="size-4 text-destructive" />
      </Button>
    </div>
  );
}

/** `base`, or `base_2`, `base_3`… when a sibling already uses it. */
export function uniqueKey(base: string, taken: string[]) {
  if (!base || !taken.includes(base)) return base;

  let suffix = 2;
  while (taken.includes(`${base}_${suffix}`)) suffix += 1;

  return `${base}_${suffix}`;
}
