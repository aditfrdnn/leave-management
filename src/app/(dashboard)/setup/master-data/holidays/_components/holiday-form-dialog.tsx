"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useForm, type FieldPath } from "react-hook-form";
import { toast } from "sonner";

import FormCalendar from "@/components/common/form-calendar";
import FormInput from "@/components/common/form-input";
import FormSwitch from "@/components/common/form-switch";
import LoadingButton from "@/components/common/loading-button";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { useTranslateMessage } from "@/hooks/use-translate-message";
import { isActionState } from "@/lib/action-state";
import { toApiDate } from "@/lib/utils/utils";
import type { THolidayItem } from "@/types/setup";
import { holidaySchema, type HolidaySchemaType } from "@/validations/setup-validations";
import { SaveHoliday } from "../action";

/** One dialog for create and update; `item` switches it to update. */
export default function HolidayFormDialog({
  open,
  onOpenChange,
  item,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: THolidayItem | null;
  onSuccess?: () => void;
}) {
  const t = useTranslations("setup.holidays");
  const tCommon = useTranslations("common.actions");
  const translateMessage = useTranslateMessage();
  const [isDateOpen, setIsDateOpen] = useState(false);
  const isUpdate = !!item;

  const form = useForm<HolidaySchemaType>({
    resolver: zodResolver(holidaySchema),
    defaultValues: { id: "", date: "", name: "", description: "", is_mass_leave: false },
    values: {
      id: item ? String(item.id) : "",
      date: item?.date ?? "",
      name: item?.name ?? "",
      description: item?.description ?? "",
      is_mass_leave: item?.is_mass_leave ?? false,
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (values: HolidaySchemaType) => {
      const state = await SaveHoliday({ status: "idle" }, values);

      if (state.status === "error") throw state;

      return state;
    },
    onSuccess: (state) => {
      toast.success(translateMessage(state.message) || t(isUpdate ? "toast.updated" : "toast.created"));
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error: unknown) => {
      if (!isActionState(error)) {
        toast.error(t("toast.saveFailed"), { description: error instanceof Error ? error.message : undefined });
        return;
      }

      toast.error(translateMessage(error.message) || t("toast.saveFailed"), {
        description: translateMessage(error.errors?._form?.[0]) || undefined,
      });

      Object.entries(error.errors ?? {}).forEach(([field, messages]) => {
        if (field === "_form" || messages.length === 0) return;
        form.setError(field as FieldPath<HolidaySchemaType>, { type: "server", message: messages[0] });
      });
    },
  });

  const onSubmit = form.handleSubmit((values) => mutate(values));

  return (
    <Dialog open={open} onOpenChange={isPending ? () => {} : onOpenChange}>
      <DialogContent className="max-w-full sm:max-w-110">
        <DialogHeader>
          <DialogTitle>{isUpdate ? t("form.updateTitle") : t("form.createTitle")}</DialogTitle>
          <DialogDescription>{t("form.description")}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <fieldset disabled={isPending} className="flex flex-col gap-4">
              <FormCalendar
                form={form}
                name="date"
                label={t("fields.date")}
                isRequired
                open={isDateOpen}
                onOpenChange={setIsDateOpen}
                onSelect={(date) => {
                  form.setValue("date", toApiDate(date), { shouldDirty: true, shouldValidate: form.formState.isSubmitted });
                  setIsDateOpen(false);
                }}
              />
              <FormInput form={form} name="name" label={t("fields.name")} placeholder={t("form.namePlaceholder")} isRequired />
              <FormInput form={form} name="description" type="textarea" label={t("fields.description")} placeholder={t("form.descriptionPlaceholder")} />
              <FormSwitch form={form} name="is_mass_leave" label={t("form.isMassLeave")} />
              <p className="-mt-2 text-xs text-muted-foreground">{t("form.massLeaveHint")}</p>
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
