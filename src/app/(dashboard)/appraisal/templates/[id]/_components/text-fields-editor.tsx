"use client";

import { useTranslations } from "next-intl";
import { useFieldArray } from "react-hook-form";

import FormInput from "@/components/common/form-input";
import FormSelect from "@/components/common/form-select";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { TEXT_FILLED_BY, toTemplateKey } from "@/validations/appraisal-template-validations";
import { Add01Icon } from "@hugeicons/core-free-icons";
import { GroupError, ReorderButtons, uniqueKey, type TTemplateForm } from "./editor-fields";

/** The free-text fields of a `text` section (Bagian V): key, label and who fills it. */
export default function TextFieldsEditor({ form, sectionIndex }: { form: TTemplateForm; sectionIndex: number }) {
  const t = useTranslations("setup.appraisalTemplates.editor");
  const fieldsPath = `schema.sections.${sectionIndex}.fields` as const;
  const { fields, append, move, remove } = useFieldArray({ control: form.control, name: fieldsPath });

  const filledByItems = TEXT_FILLED_BY.map((value) => ({ value, label: t(`fields.filledBy.${value}`) }));

  const fillKey = (index: number) => {
    const path = `${fieldsPath}.${index}` as const;
    if (form.getValues(`${path}.key`)) return;

    const siblings = (form.getValues(fieldsPath) ?? []).map((entry) => entry.key);
    const key = uniqueKey(toTemplateKey(form.getValues(`${path}.label`) ?? ""), siblings);
    if (key) form.setValue(`${path}.key`, key, { shouldDirty: true, shouldValidate: true });
  };

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <h4 className="text-sm font-medium">{t("fields.title", { count: fields.length })}</h4>

      <ol className="flex flex-col gap-2">
        {fields.map((field, index) => (
          <li key={field.id} className="flex min-w-0 flex-col gap-3 rounded-lg border p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground tabular-nums">{t("fields.number", { number: index + 1 })}</span>
              <ReorderButtons
                index={index}
                count={fields.length}
                name={form.getValues(`${fieldsPath}.${index}.label`) || t("fields.number", { number: index + 1 })}
                onMove={move}
                onRemove={() => remove(index)}
                canRemove={fields.length > 1}
              />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div onBlur={() => fillKey(index)}>
                <FormInput form={form} name={`${fieldsPath}.${index}.label`} label={t("fields.label")} isRequired />
              </div>
              <FormInput form={form} name={`${fieldsPath}.${index}.key`} label={t("fields.key")} isRequired />
              <FormSelect form={form} name={`${fieldsPath}.${index}.filled_by`} label={t("fields.filledByLabel")} items={filledByItems} isRequired />
            </div>
          </li>
        ))}
      </ol>

      <GroupError form={form} path={fieldsPath} />

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="self-start"
        onClick={() => append({ key: "", label: "", filled_by: "assessor" })}
      >
        <HugeiconsIcon icon={Add01Icon} className="size-4" />
        {t("fields.add")}
      </Button>
    </div>
  );
}
