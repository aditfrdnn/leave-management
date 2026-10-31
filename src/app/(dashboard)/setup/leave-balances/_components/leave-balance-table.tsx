"use client";

import { useMemo, useState } from "react";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";

import { DataTable } from "@/components/common/data-table";
import { Card, CardContent } from "@/components/ui/card";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { Input } from "@/components/ui/input";
import { DELAY } from "@/constants/params-constant";
import useDebounce from "@/hooks/use-debounce";
import { useListParams } from "@/hooks/use-list-params";
import type { TLeaveBalanceItem, TLeaveBalanceListParams, TLeaveBalanceSortKey } from "@/types/setup";
import { InformationCircleIcon, Search01Icon } from "@hugeicons/core-free-icons";
import { GetLeaveBalances } from "../action";
import BalanceHistorySheet, { LEAVE_BALANCE_HISTORY_KEY } from "./balance-history-sheet";
import { leaveBalanceColumns } from "./leave-balance-columns";
import SetBalanceDialog from "./set-balance-dialog";

export const LEAVE_BALANCES_QUERY_KEY = ["setup", "leave-balances"] as const;


export default function LeaveBalanceTable() {
  const t = useTranslations("setup");
  const locale = useLocale();
  const debounce = useDebounce();
  const queryClient = useQueryClient();
  const { page, setPage, perPage, onLimitChange, search, onSearchChange, table } = useListParams();

  const [editedItem, setEditedItem] = useState<TLeaveBalanceItem | null>(null);
  const [historyItem, setHistoryItem] = useState<TLeaveBalanceItem | null>(null);

  const params: TLeaveBalanceListParams = {
    page,
    per_page: perPage,
    search,
    columns: table.params.columns,
    sort_by: table.params.sort as TLeaveBalanceSortKey | undefined,
    sort_dir: table.params.direction,
  };

  const { data, isLoading, isError, error } = useQuery({
    queryKey: [...LEAVE_BALANCES_QUERY_KEY, params],
    queryFn: () => GetLeaveBalances(params),
    placeholderData: keepPreviousData,
  });

  const rows = useMemo(() => data?.data ?? [], [data]);
  const pagination = data?.meta?.pagination;

  // "Save & next": the next employee on this page, after the current one, not set yet.
  const nextItem = useMemo(() => {
    if (!editedItem) return null;
    const index = rows.findIndex((row) => row.employee.id === editedItem.employee.id);

    return rows.slice(index + 1).find((row) => !row.is_set) ?? null;
  }, [rows, editedItem]);

  const columns = useMemo(
    () =>
      leaveBalanceColumns({
        t,
        locale,
        current_page: pagination?.current_page ?? 1,
        per_page: pagination?.per_page ?? perPage,
        onClickSet: (item) => setEditedItem(item),
        onClickHistory: (item) => setHistoryItem(item),
      }),
    [t, locale, pagination, perPage],
  );

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: LEAVE_BALANCES_QUERY_KEY });
    if (editedItem) queryClient.invalidateQueries({ queryKey: LEAVE_BALANCE_HISTORY_KEY(editedItem.employee.id) });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-3 rounded-xl border bg-card px-4 py-3 text-sm">
        <HugeiconsIcon icon={InformationCircleIcon} className="mt-0.5 size-4 shrink-0 text-primary" />
        <p className="text-muted-foreground">{t("leaveBalances.howItWorks")}</p>
      </div>

      <Card className="flex flex-col">
        <div className="flex w-full flex-wrap items-center gap-2 px-6">
          <div className="relative w-full sm:max-w-72">
            <HugeiconsIcon icon={Search01Icon} className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder={t("leaveBalances.searchPlaceholder")}
              defaultValue={search}
              onChange={(event) => {
                const { value } = event.target;
                debounce(() => onSearchChange(value), DELAY);
              }}
            />
          </div>
        </div>

        <CardContent className="flex flex-col gap-4 overflow-auto">
          {isError && <p className="text-sm text-destructive">{(error as Error).message}</p>}
          <DataTable
            columns={columns}
            data={rows}
            isLoading={isLoading}
            noResultMessage={search || params.columns ? t("leaveBalances.emptySearch") : t("leaveBalances.empty")}
            page={page}
            onPageChanged={(nextPage) => setPage(Number(nextPage))}
            limit={perPage}
            onLimitChanged={(nextLimit) => onLimitChange(Number(nextLimit))}
            currentPage={pagination?.current_page ?? 1}
            lastPage={pagination?.last_page ?? 1}
            {...table.tableProps}
          facets={data?.meta?.facets}
          />
        </CardContent>
      </Card>

      <SetBalanceDialog
        item={editedItem}
        nextItem={nextItem}
        onOpenChange={(open) => !open && setEditedItem(null)}
        onSaved={refresh}
        onNext={(item) => setEditedItem(item)}
      />
      <BalanceHistorySheet item={historyItem} onOpenChange={(open) => !open && setHistoryItem(null)} />
    </div>
  );
}
