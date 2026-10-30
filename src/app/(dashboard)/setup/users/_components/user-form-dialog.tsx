"use client";

import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useForm, useWatch, type FieldPath } from "react-hook-form";
import { toast } from "sonner";

import FormComboBox from "@/components/common/form-combobox";
import FormInput from "@/components/common/form-input";
import FormSelect from "@/components/common/form-select";
import FormSwitch from "@/components/common/form-switch";
import LoadingButton from "@/components/common/loading-button";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { useAuth } from "@/hooks/use-auth";
import { useTranslateMessage } from "@/hooks/use-translate-message";
import { isActionState } from "@/lib/action-state";
import type { TUserItem } from "@/types/setup";
import { userSchema, type UserSchemaType } from "@/validations/setup-validations";
import { CreateUser, GetEmployeeOptions, GetRoleOptions, UpdateUser } from "../action";

export const ROLE_OPTIONS_QUERY_KEY = ["setup", "options", "roles"] as const;

function buildFormData(values: UserSchemaType) {
  const formData = new FormData();
  formData.append("id", values.id);
  formData.append("name", values.name);
  formData.append("email", values.email);
  formData.append("password", values.password);
  formData.append("password_confirmation", values.password_confirmation);
  formData.append("role_id", values.role_id);
  formData.append("employee_id", values.employee_id);
  formData.append("is_active", values.is_active ? "1" : "0");

  return formData;
}

function toFormValues(item: TUserItem | null): UserSchemaType {
  return {
    id: item ? String(item.id) : "",
    name: item?.name ?? "",
    email: item?.email ?? "",
    password: "",
    password_confirmation: "",
    role_id: item?.role ? String(item.role.id) : "",
    employee_id: item?.employee ? String(item.employee.id) : "",
    is_active: item ? item.status === "active" : true,
  };
}

/**
 * One dialog for create and update. The password is required on create and optional on edit;
 * the signed-in user cannot change their own role or status (the API refuses it too).
 */
export default function UserFormDialog({
  open,
  onOpenChange,
  item,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: TUserItem | null;
  onSuccess?: () => void;
}) {
  const t = useTranslations("setup");
  const tCommon = useTranslations("common.actions");
  const translateMessage = useTranslateMessage();
  const { user } = useAuth();
  const isUpdate = !!item;
  const isSelf = !!item && item.id === user?.id;
  const [isEmployeeOpen, setIsEmployeeOpen] = useState(false);

  const form = useForm<UserSchemaType>({
    resolver: zodResolver(userSchema),
    defaultValues: toFormValues(null),
    values: toFormValues(item),
  });

  const employeeId = useWatch({ control: form.control, name: "employee_id" });

  const { data: roles, isLoading: isRolesLoading } = useQuery({
    queryKey: ROLE_OPTIONS_QUERY_KEY,
    queryFn: () => GetRoleOptions(),
    enabled: open,
  });

  const employeeParams = { unlinked: 1 as const, include_id: item?.employee?.id };
  const { data: employees, isLoading: isEmployeesLoading } = useQuery({
    queryKey: ["setup", "options", "employees", employeeParams],
    queryFn: () => GetEmployeeOptions(employeeParams),
    enabled: open,
  });

  const roleItems = useMemo(() => {
    const options = (roles ?? []).map((role) => ({ value: String(role.id), label: role.text }));
    const current = item?.role;
    if (current && !options.some((option) => option.value === String(current.id))) {
      options.unshift({ value: String(current.id), label: current.title });
    }

    return options;
  }, [roles, item]);

  const employeeItems = useMemo(() => {
    const options = (employees ?? []).map((employee) => ({
      value: String(employee.id),
      label: employee.employee_number ? `${employee.employee_number} · ${employee.text}` : employee.text,
    }));
    const current = item?.employee;
    if (current && !options.some((option) => option.value === String(current.id))) {
      options.unshift({ value: String(current.id), label: `${current.employee_number} · ${current.name}` });
    }

    return [{ value: "", label: t("shared.form.none") }, ...options];
  }, [employees, item, t]);

  /** Linking an employee fills in the name and email when they are still empty. */
  const selectEmployee = (value: string) => {
    form.setValue("employee_id", value, { shouldDirty: true, shouldValidate: true });
    setIsEmployeeOpen(false);

    const employee = employees?.find((option) => String(option.id) === value);
    if (!employee) return;

    if (!form.getValues("name").trim()) form.setValue("name", employee.text, { shouldDirty: true, shouldValidate: true });
    if (!form.getValues("email").trim() && employee.email) form.setValue("email", employee.email, { shouldDirty: true, shouldValidate: true });
  };

  const { mutate, isPending } = useMutation({
    mutationFn: async (values: UserSchemaType) => {
      const action = isUpdate ? UpdateUser : CreateUser;
      const state = await action({ status: "idle" }, buildFormData(values));

      if (state.status === "error") throw state;

      return state;
    },
    onSuccess: (state) => {
      toast.success(translateMessage(state.message) || t(isUpdate ? "users.toast.updated" : "users.toast.created"));
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error: unknown) => {
      if (!isActionState(error)) {
        toast.error(t("users.toast.saveFailed"), { description: error instanceof Error ? error.message : undefined });
        return;
      }

      toast.error(translateMessage(error.message) || t("users.toast.saveFailed"), {
        description: translateMessage(error.errors?._form?.[0]) || undefined,
      });

      Object.entries(error.errors ?? {}).forEach(([field, messages]) => {
        if (field === "_form" || messages.length === 0) return;

        form.setError(field as FieldPath<UserSchemaType>, { type: "server", message: messages[0] });
      });
    },
  });

  // A disabled field (a picker still loading, or the self-guarded role/status) is dropped from
  // handleSubmit's values; the validated form state still holds it, so submit that.
  const onSubmit = form.handleSubmit(() => mutate(form.getValues()));

  return (
    <Dialog open={open} onOpenChange={isPending ? () => {} : onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-full overflow-y-auto sm:max-w-150">
        <DialogHeader>
          <DialogTitle>{isUpdate ? t("users.form.updateTitle") : t("users.form.createTitle")}</DialogTitle>
          <DialogDescription>{t("users.form.description")}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={onSubmit} className="flex min-w-0 flex-col gap-4">
            <fieldset disabled={isPending} className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <FormComboBox
                  form={form}
                  name="employee_id"
                  label={t("users.fields.employee")}
                  disabled={isPending || isEmployeesLoading}
                  items={employeeItems}
                  value={employeeId}
                  hint={t("users.form.employeeHint")}
                  searchLabel={t("users.form.employeeSearch")}
                  emptyLabel={t("shared.form.noOptions")}
                  isError={!!form.formState.errors.employee_id}
                  open={isEmployeeOpen}
                  onOpenChange={setIsEmployeeOpen}
                  onSelect={selectEmployee}
                />
              </div>
              <FormInput form={form} name="name" label={t("users.fields.name")} placeholder={t("users.form.namePlaceholder")} isRequired />
              <FormInput form={form} name="email" type="email" label={t("users.fields.email")} placeholder={t("users.form.emailPlaceholder")} isRequired />
              <FormInput
                form={form}
                name="password"
                type="password"
                label={t("users.fields.password")}
                placeholder={isUpdate ? t("users.form.passwordKeepPlaceholder") : t("users.form.passwordPlaceholder")}
                isRequired={!isUpdate}
              />
              <FormInput
                form={form}
                name="password_confirmation"
                type="password"
                label={t("users.fields.passwordConfirmation")}
                placeholder={t("users.form.passwordConfirmationPlaceholder")}
                isRequired={!isUpdate}
              />
              <FormSelect
                form={form}
                name="role_id"
                label={t("users.fields.role")}
                placeholder={t("users.form.rolePlaceholder")}
                items={roleItems}
                disabled={isPending || isRolesLoading || isSelf}
                isRequired
              />
              <div className="flex flex-col gap-1.5 sm:pt-5.5">
                <FormSwitch form={form} name="is_active" label={t("users.fields.active")} disabled={isPending || isSelf} />
              </div>
              {isSelf && <p className="text-xs text-muted-foreground sm:col-span-2">{t("users.form.selfHint")}</p>}
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
