"use client";

import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useForm, useWatch, type FieldPath } from "react-hook-form";
import { toast } from "sonner";

import FormCalendar from "@/components/common/form-calendar";
import FormComboBox from "@/components/common/form-combobox";
import FormInput from "@/components/common/form-input";
import FormSelect from "@/components/common/form-select";
import LoadingButton from "@/components/common/loading-button";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { useTranslateMessage } from "@/hooks/use-translate-message";
import { isActionState } from "@/lib/action-state";
import { toApiDate } from "@/lib/utils/utils";
import type { TEmployeeItem } from "@/types/setup";
import { ACTIVE_STATUSES, EMPLOYMENT_TYPES, employeeSchema, type EmployeeSchemaType } from "@/validations/setup-validations";
import { CreateEmployee, GetDepartmentOptions, GetEmployeeOptions, UpdateEmployee } from "../action";

export const DEPARTMENT_OPTIONS_QUERY_KEY = ["setup", "options", "departments"] as const;

const FIELDS = [
  "id",
  "employee_number",
  "name",
  "email",
  "phone_number",
  "position",
  "department_id",
  "supervisor_id",
  "join_date",
  "employment_type",
  "status",
] as const satisfies readonly (keyof EmployeeSchemaType)[];

function buildFormData(values: EmployeeSchemaType) {
  const formData = new FormData();
  FIELDS.forEach((field) => formData.append(field, values[field]));

  return formData;
}

function toFormValues(item: TEmployeeItem | null): EmployeeSchemaType {
  return {
    id: item ? String(item.id) : "",
    employee_number: item?.employee_number ?? "",
    name: item?.name ?? "",
    email: item?.email ?? "",
    phone_number: item?.phone_number ?? "",
    position: item?.position ?? "",
    department_id: item?.department ? String(item.department.id) : "",
    supervisor_id: item?.supervisor ? String(item.supervisor.id) : "",
    join_date: item?.join_date ? item.join_date.slice(0, 10) : "",
    employment_type: item?.employment_type ?? "permanent",
    status: item?.status ?? "active",
  };
}

/** One dialog for create and update; `item` switches it to update. */
export default function EmployeeFormDialog({
  open,
  onOpenChange,
  item,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: TEmployeeItem | null;
  onSuccess?: () => void;
}) {
  const t = useTranslations("setup");
  const tCommon = useTranslations("common.actions");
  const translateMessage = useTranslateMessage();
  const isUpdate = !!item;

  const [isDepartmentOpen, setIsDepartmentOpen] = useState(false);
  const [isSupervisorOpen, setIsSupervisorOpen] = useState(false);
  const [isJoinDateOpen, setIsJoinDateOpen] = useState(false);

  const form = useForm<EmployeeSchemaType>({
    resolver: zodResolver(employeeSchema),
    defaultValues: toFormValues(null),
    values: toFormValues(item),
  });

  const [departmentId, supervisorId] = useWatch({ control: form.control, name: ["department_id", "supervisor_id"] });

  const { data: departments, isLoading: isDepartmentsLoading } = useQuery({
    queryKey: DEPARTMENT_OPTIONS_QUERY_KEY,
    queryFn: () => GetDepartmentOptions(),
    enabled: open,
  });

  const supervisorParams = { exclude_id: item?.id };
  const { data: supervisors, isLoading: isSupervisorsLoading } = useQuery({
    queryKey: ["setup", "options", "employees", supervisorParams],
    queryFn: () => GetEmployeeOptions(supervisorParams),
    enabled: open,
  });

  // The edited row's current department/supervisor may sit outside the 50 options the API returns.
  const departmentItems = useMemo(() => {
    const options = (departments ?? []).map((option) => ({ value: String(option.id), label: option.alias ? `${option.text} (${option.alias})` : option.text }));
    const current = item?.department;
    if (current && !options.some((option) => option.value === String(current.id))) {
      options.unshift({ value: String(current.id), label: current.alias ? `${current.name} (${current.alias})` : current.name });
    }

    return [{ value: "", label: t("shared.form.none") }, ...options];
  }, [departments, item, t]);

  const supervisorItems = useMemo(() => {
    const options = (supervisors ?? [])
      .filter((option) => option.id !== item?.id)
      .map((option) => ({ value: String(option.id), label: option.employee_number ? `${option.employee_number} · ${option.text}` : option.text }));
    const current = item?.supervisor;
    if (current && !options.some((option) => option.value === String(current.id))) {
      options.unshift({ value: String(current.id), label: `${current.employee_number} · ${current.name}` });
    }

    return [{ value: "", label: t("shared.form.none") }, ...options];
  }, [supervisors, item, t]);

  const { mutate, isPending } = useMutation({
    mutationFn: async (values: EmployeeSchemaType) => {
      const action = isUpdate ? UpdateEmployee : CreateEmployee;
      const state = await action({ status: "idle" }, buildFormData(values));

      if (state.status === "error") throw state;

      return state;
    },
    onSuccess: (state) => {
      toast.success(translateMessage(state.message) || t(isUpdate ? "employees.toast.updated" : "employees.toast.created"));
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error: unknown) => {
      if (!isActionState(error)) {
        toast.error(t("employees.toast.saveFailed"), { description: error instanceof Error ? error.message : undefined });
        return;
      }

      toast.error(translateMessage(error.message) || t("employees.toast.saveFailed"), {
        description: translateMessage(error.errors?._form?.[0]) || undefined,
      });

      Object.entries(error.errors ?? {}).forEach(([field, messages]) => {
        if (field === "_form" || messages.length === 0) return;

        form.setError(field as FieldPath<EmployeeSchemaType>, { type: "server", message: messages[0] });
      });
    },
  });

  // A disabled field (a picker still loading, or the self-guarded role/status) is dropped from
  // handleSubmit's values; the validated form state still holds it, so submit that.
  const onSubmit = form.handleSubmit(() => mutate(form.getValues()));

  const setField = (name: "department_id" | "supervisor_id" | "join_date", value: string) =>
    form.setValue(name, value, { shouldDirty: true, shouldValidate: true });

  return (
    <Dialog open={open} onOpenChange={isPending ? () => {} : onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-full overflow-y-auto sm:max-w-175">
        <DialogHeader>
          <DialogTitle>{isUpdate ? t("employees.form.updateTitle") : t("employees.form.createTitle")}</DialogTitle>
          <DialogDescription>{t("employees.form.description")}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={onSubmit} className="flex min-w-0 flex-col gap-4">
            <fieldset disabled={isPending} className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
              <FormInput
                form={form}
                name="employee_number"
                label={t("employees.fields.employeeNumber")}
                placeholder={t("employees.form.employeeNumberPlaceholder")}
                isRequired
              />
              <FormInput form={form} name="name" label={t("employees.fields.name")} placeholder={t("employees.form.namePlaceholder")} isRequired />
              <FormInput form={form} name="email" type="email" label={t("employees.fields.email")} placeholder={t("employees.form.emailPlaceholder")} />
              <FormInput form={form} name="phone_number" type="tel" label={t("employees.fields.phone")} placeholder={t("employees.form.phonePlaceholder")} />
              <FormInput form={form} name="position" label={t("employees.fields.position")} placeholder={t("employees.form.positionPlaceholder")} />
              <FormCalendar
                form={form}
                name="join_date"
                label={t("employees.fields.joinDate")}
                open={isJoinDateOpen}
                onOpenChange={setIsJoinDateOpen}
                onSelect={(date) => {
                  setField("join_date", toApiDate(date));
                  setIsJoinDateOpen(false);
                }}
              />
              <FormComboBox
                form={form}
                name="department_id"
                label={t("employees.fields.department")}
                disabled={isPending || isDepartmentsLoading}
                items={departmentItems}
                value={departmentId}
                hint={t("employees.form.departmentHint")}
                searchLabel={t("employees.form.departmentSearch")}
                emptyLabel={t("shared.form.noOptions")}
                isError={!!form.formState.errors.department_id}
                open={isDepartmentOpen}
                onOpenChange={setIsDepartmentOpen}
                onSelect={(value) => {
                  setField("department_id", value);
                  setIsDepartmentOpen(false);
                }}
              />
              <FormComboBox
                form={form}
                name="supervisor_id"
                label={t("employees.fields.supervisor")}
                disabled={isPending || isSupervisorsLoading}
                items={supervisorItems}
                value={supervisorId}
                hint={t("employees.form.supervisorHint")}
                searchLabel={t("employees.form.supervisorSearch")}
                emptyLabel={t("shared.form.noOptions")}
                isError={!!form.formState.errors.supervisor_id}
                open={isSupervisorOpen}
                onOpenChange={setIsSupervisorOpen}
                onSelect={(value) => {
                  setField("supervisor_id", value);
                  setIsSupervisorOpen(false);
                }}
              />
              <FormSelect
                form={form}
                name="employment_type"
                label={t("employees.fields.employmentType")}
                items={EMPLOYMENT_TYPES.map((type) => ({ value: type, label: t(`employees.employmentTypes.${type}`) }))}
                isRequired
              />
              <FormSelect
                form={form}
                name="status"
                label={t("shared.columns.status")}
                items={ACTIVE_STATUSES.map((status) => ({ value: status, label: t(`shared.status.${status}`) }))}
                isRequired
              />
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
