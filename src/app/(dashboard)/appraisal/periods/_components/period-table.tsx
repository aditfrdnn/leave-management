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
import { DELAY } from "@/constants/params-constant";
import useDebounce from "@/hooks/use-debounce";
import { useListParams } from "@/hooks/use-list-params";
import type { TAppraisalPeriod } from "@/types/appraisal";
import type { TAppraisalPeriodListParams } from "@/services";
import { Add01Icon, Search01Icon } from "@hugeicons/core-free-icons";
import { GetAppraisalPeriods } from "../../action";
import { APPRAISAL_LIST_QUERY_KEY, APPRAISAL_PERIODS_QUERY_KEY } from "../../_components/query-keys";
import { DeleteAppraisalPeriod } from "../action";
import { periodColumns } from "./period-columns";
import PeriodFormDialog from "./period-form-dialog";
import PeriodStatusDialog from "./period-status-dialog";


export default function PeriodTable() {
  const t = useTranslations("appraisal");
  const locale = useLocale();
  const debounce = useDebounce();
  const queryClient = useQueryClient();
  const { page, setPage, perPage, onLimitChange, search, onSearchChange, table } = useListParams();

  const [isFormOpen, setIsFormOpen] = useState(false);
  // A fresh form per opening, so a create never starts from the last one's input.
  const [formKey, setFormKey] = useState(0);
  const [editedItem, setEditedItem] = useState<TAppraisalPeriod | null>(null);
  const [statusItem, setStatusItem] = useState<TAppraisalPeriod | null>(null);
  const [deletedItem, setDeletedItem] = useState<TAppraisalPeriod | null>(null);

  const params: TAppraisalPeriodListParams = {
    page,
    per_page: perPage,
    search,
    sort_by: table.params.sort,
    sort_dir: table.params.direction,
    columns: table.params.columns,
  };

  const { data, isLoading, isError, error } = useQuery({
    queryKey: [...APPRAISAL_PERIODS_QUERY_KEY, params],
    queryFn: () => GetAppraisalPeriods(params),
    placeholderData: keepPreviousData,
  });

  const pagination = data?.meta?.pagination;

  const columns = useMemo(
    () =>
      periodColumns({
        t,
        locale,
        onClickEdit: (item) => {
          setEditedItem(item);
          setFormKey((key) => key + 1);
          setIsFormOpen(true);
        },
        onClickStatus: (item) => setStatusItem(item),
        onClickDelete: (item) => setDeletedItem(item),
      }),
    [t, locale],
  );

  // Period names and status show on every appraisal list and the "start" cards too.
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: APPRAISAL_PERIODS_QUERY_KEY });
    queryClient.invalidateQueries({ queryKey: APPRAISAL_LIST_QUERY_KEY });
  };

  return (
    <Card className="flex flex-col">
      <div className="flex w-full flex-col gap-2 px-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex w-full flex-wrap items-center gap-2">
          <div className="relative w-full sm:max-w-64">
            <HugeiconsIcon icon={Search01Icon} className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder={t("periods.searchPlaceholder")}
              aria-label={t("periods.searchPlaceholder")}
              defaultValue={search}
              onChange={(event) => {
                const { value } = event.target;
                debounce(() => onSearchChange(value), DELAY);
              }}
            />
          </div>
        </div>
        <Button
          size="sm"
          className="shrink-0 self-start lg:self-auto"
          onClick={() => {
            setEditedItem(null);
            setFormKey((key) => key + 1);
            setIsFormOpen(true);
          }}
        >
          <HugeiconsIcon icon={Add01Icon} className="size-4" />
          {t("periods.createLabel")}
        </Button>
      </div>

      <CardContent className="flex flex-col gap-4 overflow-auto">
        {isError && <p className="text-sm text-destructive">{(error as Error).message}</p>}
        <DataTable
          columns={columns}
          data={data?.data ?? []}
          isLoading={isLoading}
          noResultMessage={search || params.columns ? t("periods.emptySearch") : t("periods.empty")}
          page={page}
          onPageChanged={(nextPage) => setPage(Number(nextPage))}
          limit={perPage}
          onLimitChanged={(nextLimit) => onLimitChange(Number(nextLimit))}
          currentPage={pagination?.current_page ?? 1}
          lastPage={pagination?.last_page ?? 1}
          {...table.tableProps}
          facets={data?.meta?.facets}
        />

        <PeriodFormDialog
          key={formKey}
          open={isFormOpen}
          onOpenChange={(open) => {
            setIsFormOpen(open);
            if (!open) setEditedItem(null);
          }}
          item={editedItem}
          onSuccess={refresh}
        />

        <PeriodStatusDialog item={statusItem} onOpenChange={(open) => !open && setStatusItem(null)} onSuccess={refresh} />

        <DeleteDialog
          open={!!deletedItem}
          onOpenChange={(open) => !open && setDeletedItem(null)}
          id={deletedItem?.id ?? ""}
          name={deletedItem?.name ?? ""}
          action={DeleteAppraisalPeriod}
          onSuccess={refresh}
        />
      </CardContent>
    </Card>
  );
}
