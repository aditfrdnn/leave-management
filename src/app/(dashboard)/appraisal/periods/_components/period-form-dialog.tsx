"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { useForm, useWatch, type FieldPath } from "react-hook-form";
import { toast } from "sonner";

import FormCalendar from "@/components/common/form-calendar";
import FormInput from "@/components/common/form-input";
import FormSelect from "@/components/common/form-select";
import LoadingButton from "@/components/common/loading-button";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { useTranslateMessage } from "@/hooks/use-translate-message";
import { isActionState } from "@/lib/action-state";
import { toApiDate } from "@/lib/utils/utils";
import type { TAppraisalPeriod } from "@/types/appraisal";
import { appraisalPeriodSchema, type AppraisalPeriodSchemaType } from "@/validations/appraisal-validations";
import { formatMonthYear } from "../../_components/appraisal-format";
import { GetActiveTemplates, SaveAppraisalPeriod } from "../action";

type TDateField = "review_start" | "review_end" | "target_start" | "target_end" | "due_date";

/**
 * The period that is due now: review = 1 Aug (Y-1) … 31 Jul (Y), target = 1 Aug (Y) … 31 Jul (Y+1),
 * where Y is the year of the last July that has ended.
 */
function defaultRanges(today = new Date()) {
  const year = today.getMonth() >= 7 ? today.getFullYear() : today.getFullYear() - 1;

  return {
    review_start: `${year - 1}-08-01`,
    review_end: `${year}-07-31`,
    target_start: `${year}-08-01`,
    target_end: `${year + 1}-07-31`,
  };
}

/** One dialog for create and update; `item` switches it to update. */
export default function PeriodFormDialog({
  open,
  onOpenChange,
  item,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: TAppraisalPeriod | null;
  onSuccess?: () => void;
}) {
  const t = useTranslations("appraisal");
  const tCommon = useTranslations("common.actions");
  const locale = useLocale();
  const translateMessage = useTranslateMessage();
  const [openDate, setOpenDate] = useState<TDateField | null>(null);
  const isUpdate = !!item;
  const isTemplateLocked = isUpdate && (item.counts?.total ?? 0) > 0;

  const { data: templates = [], isError: isTemplatesError } = useQuery({
    queryKey: ["appraisal", "templates", "active"],
    queryFn: () => GetActiveTemplates(),
    enabled: open,
  });

  const templateItems = templates.map((template) => ({ value: String(template.id), label: `${template.code} ${template.revision} — ${template.name}` }));
  // A period keeps its template even after that template is deactivated.
  if (item && !templateItems.some((option) => option.value === String(item.template.id))) {
    templateItems.unshift({ value: String(item.template.id), label: `${item.template.code} ${item.template.revision} — ${item.template.name}` });
  }

  const defaults = defaultRanges();
  const defaultName = t("format.range", { start: formatMonthYear(defaults.review_start, locale), end: formatMonthYear(defaults.review_end, locale) });

  const form = useForm<AppraisalPeriodSchemaType>({
    resolver: zodResolver(appraisalPeriodSchema),
    defaultValues: { id: "", name: defaultName, ...defaults, due_date: "", template_id: "" },
    values: item
      ? {
          id: String(item.id),
          name: item.name,
          review_start: item.review_start.slice(0, 10),
          review_end: item.review_end.slice(0, 10),
          target_start: item.target_start.slice(0, 10),
          target_end: item.target_end.slice(0, 10),
          due_date: item.due_date?.slice(0, 10) ?? "",
          template_id: String(item.template.id),
        }
      : { id: "", name: defaultName, ...defaults, due_date: "", template_id: templates.length === 1 ? String(templates[0].id) : "" },
  });

  const dueDate = useWatch({ control: form.control, name: "due_date" });

  const { mutate, isPending } = useMutation({
    mutationFn: async (values: AppraisalPeriodSchemaType) => {
      const state = await SaveAppraisalPeriod({ status: "idle" }, values);

      if (state.status === "error") throw state;

      return state;
    },
    onSuccess: (state) => {
      toast.success(translateMessage(state.message) || t(isUpdate ? "periods.toast.updated" : "periods.toast.created"));
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error: unknown) => {
      if (!isActionState(error)) {
        toast.error(t("periods.toast.saveFailed"), { description: error instanceof Error ? error.message : undefined });
        return;
      }

      toast.error(translateMessage(error.message) || t("periods.toast.saveFailed"), {
        description: translateMessage(error.errors?._form?.[0]) || undefined,
      });

      Object.entries(error.errors ?? {}).forEach(([field, messages]) => {
        if (field === "_form" || messages.length === 0) return;
        form.setError(field as FieldPath<AppraisalPeriodSchemaType>, { type: "server", message: messages[0] });
      });
    },
  });

  const onSubmit = form.handleSubmit((values) => mutate(values));

  const dateField = (name: TDateField, label: string, isRequired = true) => (
    <FormCalendar
      form={form}
      name={name}
      label={label}
      isRequired={isRequired}
      open={openDate === name}
      onOpenChange={(next) => setOpenDate(next ? name : null)}
      onSelect={(date) => {
        form.setValue(name, toApiDate(date), { shouldDirty: true, shouldValidate: form.formState.isSubmitted });
        setOpenDate(null);
      }}
    />
  );

  return (
    <Dialog open={open} onOpenChange={isPending ? () => {} : onOpenChange}>
      <DialogContent className="max-h-[90dvh] max-w-full overflow-y-auto sm:max-w-140">
        <DialogHeader>
          <DialogTitle>{isUpdate ? t("periods.form.updateTitle") : t("periods.form.createTitle")}</DialogTitle>
          <DialogDescription>{t("periods.form.description")}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <fieldset disabled={isPending} className="flex min-w-0 flex-col gap-4">
              <FormInput form={form} name="name" label={t("periods.fields.name")} placeholder={t("periods.form.namePlaceholder")} isRequired />

              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium">{t("periods.fields.reviewPeriod")}</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {dateField("review_start", t("periods.fields.start"))}
                  {dateField("review_end", t("periods.fields.end"))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium">{t("periods.fields.targetPeriod")}</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {dateField("target_start", t("periods.fields.start"))}
                  {dateField("target_end", t("periods.fields.end"))}
                </div>
              </div>

              <div className="flex flex-col gap-1">
                {dateField("due_date", t("periods.fields.dueDate"), false)}
                {dueDate && (
                  <button
                    type="button"
                    className="self-start text-xs text-muted-foreground hover:text-foreground hover:underline"
                    onClick={() => form.setValue("due_date", "", { shouldDirty: true })}
                  >
                    {t("periods.form.clearDueDate")}
                  </button>
                )}
              </div>

              <FormSelect
                form={form}
                name="template_id"
                label={t("periods.fields.template")}
                placeholder={t("periods.form.templatePlaceholder")}
                items={templateItems}
                disabled={isTemplateLocked}
                isRequired
              />
              {isTemplateLocked && <p className="-mt-2 text-xs text-muted-foreground">{t("periods.form.templateLocked")}</p>}
              {isTemplatesError && <p className="-mt-2 text-xs text-destructive">{t("periods.form.templatesFailed")}</p>}
            </fieldset>

            <DialogFooter className="flex-row items-center gap-2">
              <Button type="submit" size="sm" disabled={isPending}>
                {isPending ? <LoadingButton /> : tCommon("save")}
              </Button>
              <Button type="button" size="sm" variant="outline" disabled={isPending} onClick={() => onOpenChange(false)}>
                {tCommon("cancel")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
