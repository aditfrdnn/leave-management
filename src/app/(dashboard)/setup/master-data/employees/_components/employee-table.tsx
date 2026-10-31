"use client";

import { useMemo, useState } from "react";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";

import { DataTable } from "@/components/common/data-table";
import DeleteDialog from "@/components/common/delete-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DELAY } from "@/constants/params-constant";
import useDebounce from "@/hooks/use-debounce";
import { useListParams } from "@/hooks/use-list-params";
import type { TActiveStatus, TEmployeeCareer, TEmployeeItem, TEmployeeListParams, TEmployeeSortKey, TEmploymentType } from "@/types/setup";
import { ACTIVE_STATUSES, EMPLOYMENT_TYPES } from "@/validations/setup-validations";
import { Add01Icon, Search01Icon } from "@hugeicons/core-free-icons";
import { DeleteEmployee, GetDepartmentOptions, GetEmployees } from "../action";
import CareerFormDialog, { type TCareerFormTarget } from "./career-form-dialog";
import CareerHistorySheet from "./career-history-sheet";
import { employeeColumns } from "./employee-columns";
import EmployeeFormDialog, { DEPARTMENT_OPTIONS_QUERY_KEY } from "./employee-form-dialog";

export const EMPLOYEES_QUERY_KEY = ["setup", "employees"] as const;

const ALL = "all";

export default function EmployeeTable() {
  const t = useTranslations("setup");
  const locale = useLocale();
  const debounce = useDebounce();
  const queryClient = useQueryClient();
  const { page, setPage, perPage, onLimitChange, search, onSearchChange, resetPage, table } = useListParams();

  const [departmentId, setDepartmentId] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const [employmentType, setEmploymentType] = useState(ALL);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editedItem, setEditedItem] = useState<TEmployeeItem | null>(null);
  const [deletedItem, setDeletedItem] = useState<TEmployeeItem | null>(null);
  const [careerEmployee, setCareerEmployee] = useState<TEmployeeItem | null>(null);
  const [careerTarget, setCareerTarget] = useState<TCareerFormTarget | null>(null);

  const params: TEmployeeListParams = {
    page,
    per_page: perPage,
    search,
    department_id: departmentId === ALL ? undefined : departmentId,
    status: status === ALL ? undefined : (status as TActiveStatus),
    employment_type: employmentType === ALL ? undefined : (employmentType as TEmploymentType),
    sort_by: table.params.sort as TEmployeeSortKey | undefined,
    sort_dir: table.params.direction,
  };

  const { data, isLoading, isError, error } = useQuery({
    queryKey: [...EMPLOYEES_QUERY_KEY, params],
    queryFn: () => GetEmployees(params),
    placeholderData: keepPreviousData,
  });

  const { data: departments } = useQuery({
    queryKey: DEPARTMENT_OPTIONS_QUERY_KEY,
    queryFn: () => GetDepartmentOptions(),
  });

  const pagination = data?.meta?.pagination;
  const isFiltered = !!(search || params.department_id || params.status || params.employment_type);

  const columns = useMemo(
    () =>
      employeeColumns({
        t,
        locale,
        current_page: pagination?.current_page ?? 1,
        per_page: pagination?.per_page ?? perPage,
        onClickEdit: (item) => {
          setEditedItem(item);
          setIsFormOpen(true);
        },
        onClickCareers: (item) => setCareerEmployee(item),
        onClickDelete: (item) => setDeletedItem(item),
      }),
    [t, locale, pagination, perPage],
  );

  // Saving an employee changes the supervisor and account pickers too.
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: EMPLOYEES_QUERY_KEY });
    queryClient.invalidateQueries({ queryKey: ["setup", "options", "employees"] });
    queryClient.invalidateQueries({ queryKey: ["setup", "users"] });
    queryClient.invalidateQueries({ queryKey: ["setup", "leave-balances"] });
    queryClient.invalidateQueries({ queryKey: ["home", "profile"] });
  };

  // A career change rewrites the employee's current position, type, grade and department; the
  // invalidation above also refetches the open history (its key sits under the employees key).
  const onCareerSaved = (employee?: TEmployeeItem) => {
    refresh();
    if (!employee) return;
    setEditedItem((current) => (current?.id === employee.id ? employee : current));
    setCareerEmployee((current) => (current?.id === employee.id ? employee : current));
  };

  const filterChange = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    resetPage();
  };

  return (
    <Card className="flex flex-col">
      <div className="flex w-full flex-col gap-2 px-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex w-full flex-wrap items-center gap-2">
          <div className="relative w-full sm:max-w-72">
            <HugeiconsIcon icon={Search01Icon} className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder={t("employees.searchPlaceholder")}
              defaultValue={search}
              onChange={(event) => {
                const { value } = event.target;
                debounce(() => onSearchChange(value), DELAY);
              }}
            />
          </div>

          <Select value={departmentId} onValueChange={filterChange(setDepartmentId)}>
            <SelectTrigger className="w-full rounded-lg sm:w-48" aria-label={t("employees.fields.department")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>{t("employees.filters.allDepartments")}</SelectItem>
              {(departments ?? []).map((department) => (
                <SelectItem key={department.id} value={String(department.id)}>
                  {department.text}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={status} onValueChange={filterChange(setStatus)}>
            <SelectTrigger className="w-full rounded-lg sm:w-40" aria-label={t("shared.columns.status")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>{t("shared.filters.allStatuses")}</SelectItem>
              {ACTIVE_STATUSES.map((value) => (
                <SelectItem key={value} value={value}>
                  {t(`shared.status.${value}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={employmentType} onValueChange={filterChange(setEmploymentType)}>
            <SelectTrigger className="w-full rounded-lg sm:w-44" aria-label={t("employees.fields.employmentType")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>{t("employees.filters.allEmploymentTypes")}</SelectItem>
              {EMPLOYMENT_TYPES.map((value) => (
                <SelectItem key={value} value={value}>
                  {t(`employees.employmentTypes.${value}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          size="sm"
          className="self-start"
          onClick={() => {
            setEditedItem(null);
            setIsFormOpen(true);
          }}
        >
          <HugeiconsIcon icon={Add01Icon} className="size-4" />
          {t("employees.createLabel")}
        </Button>
      </div>

      <CardContent className="flex flex-col gap-4 overflow-auto">
        {isError && <p className="text-sm text-destructive">{(error as Error).message}</p>}
        <DataTable
          columns={columns}
          data={data?.data ?? []}
          isLoading={isLoading}
          noResultMessage={isFiltered ? t("employees.emptySearch") : t("employees.empty")}
          page={page}
          onPageChanged={(nextPage) => setPage(Number(nextPage))}
          limit={perPage}
          onLimitChanged={(nextLimit) => onLimitChange(Number(nextLimit))}
          currentPage={pagination?.current_page ?? 1}
          lastPage={pagination?.last_page ?? 1}
          {...table.tableProps}
        />

        <EmployeeFormDialog
          open={isFormOpen}
          onOpenChange={(open) => {
            setIsFormOpen(open);
            if (!open) setEditedItem(null);
          }}
          item={editedItem}
          onSuccess={refresh}
          onChangeCareer={(employee) => setCareerTarget({ employee, career: null })}
          onShowCareers={(employee) => setCareerEmployee(employee)}
        />

        <CareerHistorySheet
          employee={careerEmployee}
          onOpenChange={(open) => !open && setCareerEmployee(null)}
          onAdd={(employee) => setCareerTarget({ employee, career: null })}
          onEdit={(employee: TEmployeeItem, career: TEmployeeCareer) => setCareerTarget({ employee, career })}
          onChanged={() => onCareerSaved()}
        />

        <CareerFormDialog target={careerTarget} onOpenChange={(open) => !open && setCareerTarget(null)} onSaved={onCareerSaved} />

        <DeleteDialog
          open={!!deletedItem}
          onOpenChange={(open) => !open && setDeletedItem(null)}
          id={deletedItem?.id ?? ""}
          name={deletedItem?.name ?? ""}
          action={DeleteEmployee}
          onSuccess={refresh}
        />
      </CardContent>
    </Card>
  );
}
