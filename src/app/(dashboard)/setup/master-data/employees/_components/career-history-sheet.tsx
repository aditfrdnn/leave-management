"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";

import DeleteDialog from "@/components/common/delete-dialog";
import { SectionLoader } from "@/components/common/loader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn, dateFormatter, dateTimeFormatter } from "@/lib/utils/utils";
import type { TEmployeeCareer, TEmployeeItem } from "@/types/setup";
import { Add01Icon, Delete02Icon, PencilEdit02Icon } from "@hugeicons/core-free-icons";
import { DeleteEmployeeCareer, GetEmployeeCareers } from "../action";

/** Under `["setup", "employees"]`, so refreshing the employee list refetches the open history too. */
export const EMPLOYEE_CAREERS_QUERY_KEY = (employeeId: string) => ["setup", "employees", "careers", employeeId] as const;

/** One employee's position, employment type, grade and department over time, newest first. */
export default function CareerHistorySheet({
  employee,
  onOpenChange,
  onAdd,
  onEdit,
  onChanged,
}: {
  employee: TEmployeeItem | null;
  onOpenChange: (open: boolean) => void;
  onAdd: (employee: TEmployeeItem) => void;
  onEdit: (employee: TEmployeeItem, career: TEmployeeCareer) => void;
  /** After a delete; the employee's current values may have changed. */
  onChanged: () => void;
}) {
  const t = useTranslations("setup");
  const locale = useLocale();
  const [deleted, setDeleted] = useState<TEmployeeCareer | null>(null);
  const employeeId = employee?.id ?? "";

  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: EMPLOYEE_CAREERS_QUERY_KEY(employeeId),
    queryFn: () => GetEmployeeCareers(employeeId),
    enabled: employee !== null,
  });

  const careers = data ?? [];
  // The API keeps at least one row per employee; the last one cannot be deleted.
  const canDelete = careers.length > 1;

  return (
    <Sheet open={employee !== null} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-4 overflow-y-auto sm:max-w-120">
        <SheetHeader>
          <SheetTitle>{t("employees.careers.title")}</SheetTitle>
          <SheetDescription>{employee ? `${employee.name} · ${employee.employee_number}` : null}</SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-4 px-4 pb-6">
          {employee && (
            <Button type="button" size="sm" className="self-start" onClick={() => onAdd(employee)}>
              <HugeiconsIcon icon={Add01Icon} className="size-4" />
              {t("employees.careers.add")}
            </Button>
          )}

          {isLoading && <SectionLoader className="min-h-40" />}
          {isError && <p className="text-sm text-destructive">{(error as Error).message}</p>}

          {data && careers.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">{t("employees.careers.empty")}</p>}

          {careers.length > 0 && (
            <ol className={cn("flex flex-col divide-y rounded-lg border", isFetching && "opacity-60")}>
              {careers.map((career) => (
                <li key={career.id} className={cn("flex items-start justify-between gap-3 px-3 py-2.5 text-sm", career.is_current && "bg-primary/5")}>
                  <div className="flex min-w-0 flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-medium tabular-nums">{dateFormatter(career.effective_date, locale)}</span>
                      {career.is_current && <Badge variant="default">{t("employees.careers.current")}</Badge>}
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge variant="secondary">{t(`employees.employmentTypes.${career.employment_type}`)}</Badge>
                      {career.grade != null && (
                        <Badge variant="outline" className="tabular-nums">
                          {t("employees.careers.grade", { grade: career.grade })}
                        </Badge>
                      )}
                    </div>
                    <span className="break-words">
                      {career.position}
                      {career.department && (
                        <span className="text-muted-foreground"> · {career.department.alias || career.department.name}</span>
                      )}
                    </span>
                    {career.note && <span className="break-words text-muted-foreground">“{career.note}”</span>}
                    <span className="text-xs text-muted-foreground">
                      {t("employees.careers.addedBy", {
                        name: career.created_by?.name ?? t("employees.careers.system"),
                        date: dateTimeFormatter(career.created_at, locale),
                      })}
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={t("employees.careers.editItem", { date: dateFormatter(career.effective_date, locale) })}
                      onClick={() => employee && onEdit(employee, career)}
                    >
                      <HugeiconsIcon icon={PencilEdit02Icon} className="size-4 text-muted-foreground" />
                    </Button>
                    {canDelete && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={t("employees.careers.deleteItem", { date: dateFormatter(career.effective_date, locale) })}
                        onClick={() => setDeleted(career)}
                      >
                        <HugeiconsIcon icon={Delete02Icon} className="size-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>

        <DeleteDialog
          open={!!deleted}
          onOpenChange={(open) => !open && setDeleted(null)}
          id={deleted?.id ?? ""}
          name={deleted ? `${dateFormatter(deleted.effective_date, locale)} · ${deleted.position}` : ""}
          fields={{ employee_id: String(employeeId) }}
          description={t("employees.careers.deleteHint")}
          action={DeleteEmployeeCareer}
          onSuccess={onChanged}
        />
      </SheetContent>
    </Sheet>
  );
}
