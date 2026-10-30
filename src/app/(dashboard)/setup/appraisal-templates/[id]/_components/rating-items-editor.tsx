"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useFieldArray, useFormState, useWatch } from "react-hook-form";

import FormInput from "@/components/common/form-input";
import FormSelect from "@/components/common/form-select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { cn } from "@/lib/utils/utils";
import { SCALE_LENGTH, toTemplateKey } from "@/validations/appraisal-template-validations";
import { Add01Icon, Alert02Icon, ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { GroupError, hasErrorAt, LinesField, ReorderButtons, uniqueKey, type TTemplateForm } from "./editor-fields";

/** The items of one rating section: add, reorder, remove, each one collapsible. */
export default function RatingItemsEditor({ form, sectionIndex, locked }: { form: TTemplateForm; sectionIndex: number; locked: boolean }) {
  const t = useTranslations("setup.appraisalTemplates.editor");
  const itemsPath = `schema.sections.${sectionIndex}.items` as const;
  const { fields, append, move, remove } = useFieldArray({ control: form.control, name: itemsPath });
  // Items loaded with the template start closed so a long section stays scannable; added ones start open.
  const [closedIds, setClosedIds] = useState<Set<string>>(() => new Set(fields.map((field) => field.id)));

  const setOpen = (id: string, open: boolean) =>
    setClosedIds((current) => {
      const next = new Set(current);
      if (open) next.delete(id);
      else next.add(id);

      return next;
    });

  const addItem = () => {
    append({ key: "", code: "", title: "", points: [], levels: Array.from({ length: SCALE_LENGTH }, () => ""), audience: "all" });
  };

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-sm font-medium">{t("items.title", { count: fields.length })}</h4>
      </div>

      <ol className="flex flex-col gap-2">
        {fields.map((field, index) => (
          <li key={field.id}>
            <RatingItemCard
              form={form}
              sectionIndex={sectionIndex}
              index={index}
              count={fields.length}
              open={locked || !closedIds.has(field.id)}
              onOpenChange={(open) => setOpen(field.id, open)}
              onMove={move}
              onRemove={() => remove(index)}
            />
          </li>
        ))}
      </ol>

      <GroupError form={form} path={itemsPath} />

      <Button type="button" variant="outline" size="sm" className="self-start" onClick={addItem}>
        <HugeiconsIcon icon={Add01Icon} className="size-4" />
        {t("items.add")}
      </Button>
    </div>
  );
}

function RatingItemCard({
  form,
  sectionIndex,
  index,
  count,
  open,
  onOpenChange,
  onMove,
  onRemove,
}: {
  form: TTemplateForm;
  sectionIndex: number;
  index: number;
  count: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMove: (from: number, to: number) => void;
  onRemove: () => void;
}) {
  const t = useTranslations("setup.appraisalTemplates.editor");
  const path = `schema.sections.${sectionIndex}.items.${index}` as const;
  const item = useWatch({ control: form.control, name: path });
  const scale = useWatch({ control: form.control, name: `schema.sections.${sectionIndex}.scale` as const }) as { label: string }[] | undefined;
  const { errors } = useFormState({ control: form.control });
  const invalid = hasErrorAt(errors, path);
  const name = item?.title || t("items.untitled", { number: index + 1 });

  // Reveal an item that failed validation so its messages are visible.
  useEffect(() => {
    if (invalid && !open) onOpenChange(true);
  }, [invalid]);

  const fillKey = () => {
    if (form.getValues(`${path}.key`)) return;

    const siblings = (form.getValues(`schema.sections.${sectionIndex}.items`) ?? []).map((entry) => entry.key);
    const key = uniqueKey(toTemplateKey(form.getValues(`${path}.title`) ?? ""), siblings);
    if (key) form.setValue(`${path}.key`, key, { shouldDirty: true, shouldValidate: true });
  };

  return (
    <Collapsible open={open} onOpenChange={onOpenChange} className={cn("rounded-lg border", invalid && "border-destructive/60")}>
      <div className="flex min-w-0 items-center gap-2 py-1 pr-1 pl-3">
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex min-w-0 flex-1 items-center gap-2 rounded-md py-1.5 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
          >
            <HugeiconsIcon icon={ArrowDown01Icon} className={cn("size-4 shrink-0 text-muted-foreground transition-transform", !open && "-rotate-90")} />
            <span className="w-6 shrink-0 text-xs text-muted-foreground tabular-nums">{index + 1}.</span>
            <span className="min-w-0 flex-1 truncate text-sm font-medium">{name}</span>
            {item?.code && <span className="hidden font-mono text-xs text-muted-foreground sm:inline">{item.code}</span>}
            {item?.audience === "leaders" && (
              <Badge variant="warning" className="shrink-0">
                {t("items.audience.leaders")}
              </Badge>
            )}
            {invalid && (
              <HugeiconsIcon icon={Alert02Icon} className="size-4 shrink-0 text-destructive" aria-label={t("items.hasErrors")} />
            )}
          </button>
        </CollapsibleTrigger>
        <ReorderButtons index={index} count={count} name={name} onMove={onMove} onRemove={onRemove} canRemove={count > 1} />
      </div>

      <CollapsibleContent className="flex flex-col gap-4 border-t px-3 py-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2" onBlur={fillKey}>
            <FormInput form={form} name={`${path}.title`} label={t("items.fields.title")} isRequired />
          </div>
          <FormInput form={form} name={`${path}.code`} label={t("items.fields.code")} isRequired />
          <FormSelect
            form={form}
            name={`${path}.audience`}
            label={t("items.fields.audience")}
            isRequired
            items={[
              { value: "all", label: t("items.audience.all") },
              { value: "leaders", label: t("items.audience.leaders") },
            ]}
          />
          <div className="flex flex-col gap-1 sm:col-span-2">
            <FormInput form={form} name={`${path}.key`} label={t("items.fields.key")} isRequired />
            <p className="text-xs text-muted-foreground">{t("keyHint")}</p>
          </div>
        </div>

        <LinesField form={form} name={`${path}.points`} label={t("items.fields.points")} hint={t("items.pointsHint")} />

        <fieldset className="flex min-w-0 flex-col gap-2">
          <legend className="mb-2 text-sm font-medium">{t("items.fields.levels")}</legend>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
            {Array.from({ length: SCALE_LENGTH }, (_, level) => (
              <FormInput
                key={level}
                form={form}
                type="textarea"
                name={`${path}.levels.${level}`}
                label={t("items.levelLabel", { value: level + 1, label: scale?.[level]?.label || "-" })}
              />
            ))}
          </div>
          <GroupError form={form} path={`${path}.levels`} />
        </fieldset>
      </CollapsibleContent>
    </Collapsible>
  );
}
