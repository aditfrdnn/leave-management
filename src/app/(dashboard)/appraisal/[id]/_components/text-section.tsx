"use client";

import { useTranslations } from "next-intl";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { TTextField } from "@/types/appraisal";
import { looseSectionErrors, type TAnswerErrors, type TTextSection } from "./answers";
import FieldError from "./field-error";
import SectionCard from "./section-card";

/** Bagian V: one textarea per field, writable by whoever the field is `filled_by`. */
export default function TextSection({
  section,
  title,
  instructions,
  value,
  onChange,
  isEditable,
  isHidden,
  errors,
}: {
  section: TTextSection;
  title: string;
  instructions: string;
  value: Record<string, string>;
  onChange: (fieldKey: string, text: string) => void;
  isEditable: (field: TTextField) => boolean;
  /** Assessor-only fields stay hidden from the employee until the assessment is done. */
  isHidden: (field: TTextField) => boolean;
  errors: TAnswerErrors;
}) {
  const t = useTranslations("appraisal.form.text");
  const fieldKeys = new Set(section.fields.map((field) => field.key));
  const fieldError = (key: string) =>
    errors[`${section.key}.${key}`] ?? Object.entries(errors).find(([path]) => path.startsWith(`${section.key}.${key}.`))?.[1];

  return (
    <SectionCard id={section.key} title={title} instructions={instructions} errors={looseSectionErrors(errors, section.key, (head) => fieldKeys.has(head))}>
      {section.fields.map((field) => {
        const id = `${section.key}-${field.key}`;
        const error = fieldError(field.key);
        const text = value[field.key] ?? "";

        return (
          <div key={field.key} className="flex min-w-0 flex-col gap-1.5" data-appraisal-field>
            <div className="flex flex-wrap items-baseline justify-between gap-x-2">
              <Label htmlFor={id}>{field.label}</Label>
              <span className="text-xs text-muted-foreground">{t(`filledBy.${field.filled_by}`)}</span>
            </div>
            {isHidden(field) ? (
              <p className="rounded-lg border border-dashed px-3 py-2 text-xs text-muted-foreground">{t("pending")}</p>
            ) : isEditable(field) ? (
              <Textarea
                id={id}
                value={text}
                onChange={(event) => onChange(field.key, event.target.value)}
                placeholder={t("placeholder")}
                className="min-h-24 resize-y rounded-lg"
                aria-invalid={!!error || undefined}
              />
            ) : (
              <p id={id} className="text-sm whitespace-pre-wrap">
                {text || "-"}
              </p>
            )}
            <FieldError message={error} />
          </div>
        );
      })}
    </SectionCard>
  );
}
