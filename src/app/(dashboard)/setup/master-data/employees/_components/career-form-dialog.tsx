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
import type { TEmployeeCareer, TEmployeeItem } from "@/types/setup";
import { EMPLOYMENT_TYPES, employeeCareerSchema, type EmployeeCareerSchemaType } from "@/validations/setup-validations";
import { CreateEmployeeCareer, GetDepartmentOptions, UpdateEmployeeCareer } from "../action";
import { DEPARTMENT_OPTIONS_QUERY_KEY, toDepartmentItems } from "./employee-form-dialog";

const FIELDS = [
  "id",
  "employee_id",
  "effective_date",
  "employment_type",
  "grade",
  "position",
  "department_id",
  "note",
] as const satisfies readonly (keyof EmployeeCareerSchemaType)[];

function buildFormData(values: EmployeeCareerSchemaType) {
  const formData = new FormData();
  FIELDS.forEach((field) => formData.append(field, values[field]));

  return formData;
}

/** A new row starts from the employee's current values, so HR changes only what moved. */
function toFormValues(employee: TEmployeeItem | null, career: TEmployeeCareer | null): EmployeeCareerSchemaType {
  const source = career ?? employee;

  return {
    id: career ? String(career.id) : "",
    employee_id: employee ? String(employee.id) : "",
    effective_date: career ? career.effective_date.slice(0, 10) : "",
    employment_type: source?.employment_type ?? "permanent",
    grade: source?.grade != null ? String(source.grade) : "",
    position: source?.position ?? "",
    department_id: source?.department ? String(source.department.id) : "",
    note: career?.note ?? "",
  };
}

export type TCareerFormTarget = { employee: TEmployeeItem; career: TEmployeeCareer | null };

/** Adds or edits one career row. `target.career` switches it to update. */
export default function CareerFormDialog({
  target,
  onOpenChange,
  onSaved,
}: {
  target: TCareerFormTarget | null;
  onOpenChange: (open: boolean) => void;
  /** `employee` is the refreshed employee when the API returns it. */
  onSaved: (employee?: TEmployeeItem) => void;
}) {
  const t = useTranslations("setup");
  const tCommon = useTranslations("common.actions");
  const translateMessage = useTranslateMessage();
  const open = target !== null;
  const employee = target?.employee ?? null;
  const career = target?.career ?? null;
  const isUpdate = !!career;

  const [isDateOpen, setIsDateOpen] = useState(false);
  const [isDepartmentOpen, setIsDepartmentOpen] = useState(false);

  const form = useForm<EmployeeCareerSchemaType>({
    resolver: zodResolver(employeeCareerSchema),
    defaultValues: toFormValues(null, null),
    values: toFormValues(employee, career),
  });

  const departmentId = useWatch({ control: form.control, name: "department_id" });

  const { data: departments, isLoading: isDepartmentsLoading } = useQuery({
    queryKey: DEPARTMENT_OPTIONS_QUERY_KEY,
    queryFn: () => GetDepartmentOptions(),
    enabled: open,
  });

  const currentDepartment = career ? career.department : (employee?.department ?? null);
  const departmentItems = useMemo(
    () => toDepartmentItems(departments, currentDepartment, t("shared.form.none")),
    [departments, currentDepartment, t],
  );

  const { mutate, isPending } = useMutation({
    mutationFn: async (values: EmployeeCareerSchemaType) => {
      const action = isUpdate ? UpdateEmployeeCareer : CreateEmployeeCareer;
      const state = await action({ status: "idle" }, buildFormData(values));

      if (state.status === "error") throw state;

      return state;
    },
    onSuccess: (state) => {
      toast.success(translateMessage(state.message) || t(isUpdate ? "employees.careers.toast.updated" : "employees.careers.toast.created"));
      onOpenChange(false);
      onSaved(state.data?.employee);
    },
    onError: (error: unknown) => {
      if (!isActionState(error)) {
        toast.error(t("employees.careers.toast.saveFailed"), { description: error instanceof Error ? error.message : undefined });
        return;
      }

      toast.error(translateMessage(error.message) || t("employees.careers.toast.saveFailed"), {
        description: translateMessage(error.errors?._form?.[0]) || undefined,
      });

      Object.entries(error.errors ?? {}).forEach(([field, messages]) => {
        if (field === "_form" || messages.length === 0) return;

        form.setError(field as FieldPath<EmployeeCareerSchemaType>, { type: "server", message: messages[0] });
      });
    },
  });

  // The department picker is disabled while loading, which drops it from handleSubmit's values.
  const onSubmit = form.handleSubmit(() => mutate(form.getValues()));

  return (
    <Dialog open={open} onOpenChange={isPending ? () => {} : onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-full overflow-y-auto sm:max-w-140">
        <DialogHeader>
          <DialogTitle>{isUpdate ? t("employees.careers.form.updateTitle") : t("employees.careers.form.createTitle")}</DialogTitle>
          <DialogDescription>
            {employee ? `${employee.name} · ${employee.employee_number}` : null}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={onSubmit} className="flex min-w-0 flex-col gap-4">
            <fieldset disabled={isPending} className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <FormCalendar
                  form={form}
                  name="effective_date"
                  label={t("employees.careers.fields.effectiveDate")}
                  isRequired
                  open={isDateOpen}
                  onOpenChange={setIsDateOpen}
                  onSelect={(date) => {
                    form.setValue("effective_date", toApiDate(date), { shouldDirty: true, shouldValidate: true });
                    setIsDateOpen(false);
                  }}
                />
                <p className="text-xs text-muted-foreground">{t("employees.careers.form.effectiveDateHint")}</p>
              </div>
              <FormSelect
                form={form}
                name="employment_type"
                label={t("employees.fields.employmentType")}
                items={EMPLOYMENT_TYPES.map((type) => ({ value: type, label: t(`employees.employmentTypes.${type}`) }))}
                isRequired
              />
              <FormInput
                form={form}
                name="position"
                label={t("employees.fields.position")}
                placeholder={t("employees.careers.form.positionPlaceholder")}
                isRequired
              />
              <FormInput form={form} name="grade" type="number" label={t("employees.fields.grade")} placeholder={t("employees.form.gradePlaceholder")} />
              <div className="sm:col-span-2">
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
                    form.setValue("department_id", value, { shouldDirty: true, shouldValidate: true });
                    setIsDepartmentOpen(false);
                  }}
                />
              </div>
              <div className="sm:col-span-2">
                <FormInput
                  form={form}
                  name="note"
                  type="textarea"
                  label={t("employees.careers.fields.note")}
                  placeholder={t("employees.careers.form.notePlaceholder")}
                />
              </div>
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
