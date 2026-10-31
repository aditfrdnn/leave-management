"use client";

import { useTranslations } from "next-intl";
import { useFormState, useWatch } from "react-hook-form";

import FormInput from "@/components/common/form-input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils/utils";
import { toTemplateKey } from "@/validations/appraisal-template-validations";
import { hasErrorAt, NumberField, PlaceholderHint, ReorderButtons, ScaleLabelsEditor, uniqueKey, type TTemplateForm } from "./editor-fields";
import RatingItemsEditor from "./rating-items-editor";
import TextFieldsEditor from "./text-fields-editor";

/** One section of the form: shared fields (key, title, instructions) and the editor of its kind. */
export default function SectionCard({
  form,
  index,
  count,
  locked,
  onMove,
  onRemove,
}: {
  form: TTemplateForm;
  index: number;
  count: number;
  locked: boolean;
  onMove: (from: number, to: number) => void;
  onRemove: () => void;
}) {
  const t = useTranslations("setup.appraisalTemplates.editor");
  const path = `schema.sections.${index}` as const;
  const kind = useWatch({ control: form.control, name: `${path}.kind` });
  const title = useWatch({ control: form.control, name: `${path}.title` });
  const { errors } = useFormState({ control: form.control });
  const name = title || t("sections.untitled", { number: index + 1 });
  const headingId = `template-section-${index}`;

  const fillKey = () => {
    if (form.getValues(`${path}.key`)) return;

    const siblings = form.getValues("schema.sections").map((section) => section.key);
    const key = uniqueKey(toTemplateKey(form.getValues(`${path}.title`) ?? ""), siblings);
    if (key) form.setValue(`${path}.key`, key, { shouldDirty: true, shouldValidate: true });
  };

  return (
    <Card role="group" aria-labelledby={headingId} className={cn("min-w-0 gap-4", hasErrorAt(errors, path) && "ring-1 ring-destructive/50")}>
      <CardHeader className="flex min-w-0 flex-row items-start justify-between gap-2 px-4 sm:px-6">
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="type-overline text-muted-foreground">{t("sections.number", { number: index + 1 })}</span>
            <Badge variant="secondary">{t(`kinds.${kind}.label`)}</Badge>
          </div>
          <h3 id={headingId} className="type-section-title break-words">
            {name}
          </h3>
        </div>
        <ReorderButtons index={index} count={count} name={name} onMove={onMove} onRemove={onRemove} canRemove={count > 1} />
      </CardHeader>

      <CardContent className="flex min-w-0 flex-col gap-5 px-4 sm:px-6">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <div className="flex flex-col gap-1 lg:col-span-2" onBlur={fillKey}>
            <FormInput form={form} name={`${path}.title`} label={t("sections.fields.title")} isRequired />
            <PlaceholderHint />
          </div>
          <div className="flex flex-col gap-1">
            <FormInput form={form} name={`${path}.key`} label={t("sections.fields.key")} isRequired />
            <p className="text-xs text-muted-foreground">{t("keyHint")}</p>
          </div>
        </div>

        <FormInput form={form} type="textarea" name={`${path}.instructions`} label={t("sections.fields.instructions")} />

        {kind === "rating" && (
          <div className="flex flex-col gap-1 sm:max-w-md">
            <FormInput form={form} name={`${path}.item_heading`} label={t("sections.fields.itemHeading")} placeholder="Key Behavior Definition" />
            <p className="text-xs text-muted-foreground">{t("sections.fields.itemHeadingHint")}</p>
          </div>
        )}

        {(kind === "rating" || kind === "kpi_review") && <ScaleLabelsEditor form={form} sectionIndex={index} />}

        {(kind === "kpi_review" || kind === "kpi_target") && (
          <div className="flex flex-col gap-1">
            <div className="grid grid-cols-1 gap-3 sm:max-w-md sm:grid-cols-2">
              <NumberField form={form} name={`${path}.min_rows`} label={t("sections.fields.minRows")} />
              <NumberField form={form} name={`${path}.max_rows`} label={t("sections.fields.maxRows")} />
            </div>
            <p className="text-xs text-muted-foreground">{kind === "kpi_review" ? t("kinds.kpi_review.rowsHint") : t("kinds.kpi_target.rowsHint")}</p>
          </div>
        )}

        {kind === "rating" && <RatingItemsEditor form={form} sectionIndex={index} locked={locked} />}
        {kind === "text" && <TextFieldsEditor form={form} sectionIndex={index} />}
      </CardContent>
    </Card>
  );
}
