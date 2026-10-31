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
import type { TPermissionItem } from "@/types/setup";
import { permissionSchema, type PermissionSchemaType } from "@/validations/setup-validations";
import { CreatePermission, UpdatePermission } from "../action";

function buildFormData(values: PermissionSchemaType) {
  const formData = new FormData();
  formData.append("id", values.id);
  formData.append("title", values.title);
  formData.append("label", values.label);
  formData.append("group_name", values.group_name);

  return formData;
}

/** One dialog for create and update. Any permission key can change; the hint says what a rename affects. */
export default function PermissionFormDialog({
  open,
  onOpenChange,
  item,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: TPermissionItem | null;
  onSuccess?: () => void;
}) {
  const t = useTranslations("setup.permissions");
  const tCommon = useTranslations("common.actions");
  const translateMessage = useTranslateMessage();
  const isUpdate = !!item;

  const form = useForm<PermissionSchemaType>({
    resolver: zodResolver(permissionSchema),
    defaultValues: { id: "", title: "", label: "", group_name: "" },
    values: {
      id: item ? String(item.id) : "",
      title: item?.title ?? "",
      label: item?.label ?? "",
      group_name: item?.group_name ?? "",
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (values: PermissionSchemaType) => {
      const action = isUpdate ? UpdatePermission : CreatePermission;
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

        form.setError(field as FieldPath<PermissionSchemaType>, { type: "server", message: messages[0] });
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
              <div className="flex flex-col gap-1">
                <FormInput
                  form={form}
                  name="title"
                  label={t("fields.title")}
                  placeholder={t("form.titlePlaceholder")}
                  isRequired
                />
                <p className="text-xs text-muted-foreground">{isUpdate ? t("form.titleChangeHint") : t("form.titleHint")}</p>
              </div>
              <FormInput form={form} name="label" label={t("fields.label")} placeholder={t("form.labelPlaceholder")} isRequired />
              <FormInput form={form} name="group_name" label={t("fields.group")} placeholder={t("form.groupPlaceholder")} isRequired />
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
