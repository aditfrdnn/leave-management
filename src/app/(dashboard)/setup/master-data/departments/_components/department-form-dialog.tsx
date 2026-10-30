"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useForm, type FieldPath } from "react-hook-form";
import { toast } from "sonner";

import FormInput from "@/components/common/form-input";
import LoadingButton from "@/components/common/loading-button";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { useTranslateMessage } from "@/hooks/use-translate-message";
import { isActionState } from "@/lib/action-state";
import type { TDepartmentItem } from "@/types/setup";
import { departmentSchema, type DepartmentSchemaType } from "@/validations/setup-validations";
import { CreateDepartment, UpdateDepartment } from "../action";

function buildFormData(values: DepartmentSchemaType) {
  const formData = new FormData();
  formData.append("id", values.id);
  formData.append("name", values.name);
  formData.append("alias", values.alias);

  return formData;
}

/** One dialog for create and update; `item` switches it to update. */
export default function DepartmentFormDialog({
  open,
  onOpenChange,
  item,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: TDepartmentItem | null;
  onSuccess?: () => void;
}) {
  const t = useTranslations("setup.departments");
  const tCommon = useTranslations("common.actions");
  const translateMessage = useTranslateMessage();
  const isUpdate = !!item;

  const form = useForm<DepartmentSchemaType>({
    resolver: zodResolver(departmentSchema),
    defaultValues: { id: "", name: "", alias: "" },
    values: { id: item ? String(item.id) : "", name: item?.name ?? "", alias: item?.alias ?? "" },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (values: DepartmentSchemaType) => {
      const action = isUpdate ? UpdateDepartment : CreateDepartment;
      const state = await action({ status: "idle" }, buildFormData(values));

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

        form.setError(field as FieldPath<DepartmentSchemaType>, { type: "server", message: messages[0] });
      });
    },
  });

  const onSubmit = form.handleSubmit((values) => mutate(values));

  return (
    <Dialog open={open} onOpenChange={isPending ? () => {} : onOpenChange}>
      <DialogContent className="max-w-full sm:max-w-120">
        <DialogHeader>
          <DialogTitle>{isUpdate ? t("form.updateTitle") : t("form.createTitle")}</DialogTitle>
          <DialogDescription>{t("form.description")}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <fieldset disabled={isPending} className="flex flex-col gap-4">
              <FormInput form={form} name="name" label={t("fields.name")} placeholder={t("form.namePlaceholder")} isRequired />
              <FormInput form={form} name="alias" label={t("fields.alias")} placeholder={t("form.aliasPlaceholder")} isRequired />
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
