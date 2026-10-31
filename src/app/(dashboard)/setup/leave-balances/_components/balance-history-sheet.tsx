"use client";

import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";

import { SectionLoader } from "@/components/common/loader";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn, dateFormatter, dateTimeFormatter } from "@/lib/utils/utils";
import type { TLeaveBalanceItem } from "@/types/setup";
import { GetLeaveBalanceEntries } from "../action";
import { formatDays, formatPeriod } from "./format";

export const LEAVE_BALANCE_HISTORY_KEY = (employeeId: string) => ["setup", "leave-balances", "history", employeeId] as const;

/** Every change to one employee's balance, newest first: HR settings, monthly accruals, approved leave. */
export default function BalanceHistorySheet({
  item,
  onOpenChange,
}: {
  item: TLeaveBalanceItem | null;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("setup.leaveBalances");
  const locale = useLocale();
  const [page, setPage] = useState(1);
  const employeeId = item?.employee.id ?? "";

  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: [...LEAVE_BALANCE_HISTORY_KEY(employeeId), page],
    queryFn: () => GetLeaveBalanceEntries(employeeId, page),
    enabled: item !== null,
    placeholderData: keepPreviousData,
  });

  const pagination = data?.meta?.pagination;

  return (
    <Sheet
      open={item !== null}
      onOpenChange={(open) => {
        if (!open) setPage(1);
        onOpenChange(open);
      }}
    >
      <SheetContent className="w-full gap-4 overflow-y-auto sm:max-w-120">
        <SheetHeader>
          <SheetTitle>{t("history.title")}</SheetTitle>
          <SheetDescription>
            {item?.employee.name} · {t("history.current", { value: item ? formatDays(item.balance, locale) : "-" })}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-4 px-4 pb-6">
          {isLoading && <SectionLoader className="min-h-40" />}
          {isError && <p className="text-sm text-destructive">{(error as Error).message}</p>}

          {data && data.data.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">{t("history.empty")}</p>}

          {data && data.data.length > 0 && (
            <ol className={cn("flex flex-col divide-y rounded-lg border", isFetching && "opacity-60")}>
              {data.data.map((entry) => (
                <li key={entry.id} className="flex items-start justify-between gap-4 px-3 py-2.5 text-sm">
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="font-medium">
                      {entry.type === "accrual"
                        ? t("history.types.accrual", { period: formatPeriod(entry.period, locale) ?? "" })
                        : t(`history.types.${entry.type}`)}
                    </span>
                    {entry.leave_request && (
                      <span className="text-muted-foreground">
                        {entry.leave_request.subject} · {dateFormatter(entry.leave_request.start_date, locale)}
                        {entry.leave_request.end_date !== entry.leave_request.start_date
                          ? ` – ${dateFormatter(entry.leave_request.end_date, locale)}`
                          : ""}
                      </span>
                    )}
                    {entry.note && <span className="text-muted-foreground">“{entry.note}”</span>}
                    <span className="text-xs text-muted-foreground">
                      {dateTimeFormatter(entry.created_at, locale)}
                      {entry.created_by ? ` · ${entry.created_by.name}` : ` · ${t("history.system")}`}
                    </span>
                  </div>
                  <div className="flex shrink-0 flex-col items-end">
                    <span className={cn("font-semibold tabular-nums", entry.amount > 0 ? "text-green-strong" : entry.amount < 0 ? "text-destructive" : "")}>
                      {formatDays(entry.amount, locale, true)}
                    </span>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {t("history.after", { value: formatDays(entry.balance_after, locale) })}
                    </span>
                  </div>
                </li>
              ))}
            </ol>
          )}

          {pagination && pagination.last_page > 1 && (
            <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
              <Button type="button" size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>
                {t("history.newer")}
              </Button>
              <span className="tabular-nums">
                {pagination.current_page} / {pagination.last_page}
              </span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={page >= pagination.last_page}
                onClick={() => setPage((value) => value + 1)}
              >
                {t("history.older")}
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
