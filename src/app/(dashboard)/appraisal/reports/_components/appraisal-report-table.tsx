"use client";

import { useMemo, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";

import { DataTable } from "@/components/common/data-table";
import { Card, CardContent } from "@/components/ui/card";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DELAY } from "@/constants/params-constant";
import useDebounce from "@/hooks/use-debounce";
import { useListParams } from "@/hooks/use-list-params";
import type { TAppraisalListParams, TAppraisalStatus } from "@/types/appraisal";
import { Search01Icon } from "@hugeicons/core-free-icons";
import { GetAppraisals } from "../../action";
import { appraisalColumns } from "../../_components/appraisal-columns";
import PeriodSelect from "../../_components/period-select";
import { APPRAISAL_LIST_QUERY_KEY } from "../../_components/query-keys";
import { usePeriodOptions } from "../../_components/use-period-options";

const ALL = "all";
const STATUSES: TAppraisalStatus[] = ["draft", "submitted", "assessed"];

/** Every appraisal of one period (scope=all), newest period first, with the PDF per row. */
export default function AppraisalReportTable() {
  const t = useTranslations("appraisal");
  const locale = useLocale();
  const debounce = useDebounce();
  const { page, setPage, perPage, onLimitChange, search, onSearchChange, resetPage } = useListParams();
  const { data: periods = [], isLoading: isPeriodsLoading } = usePeriodOptions();

  const [pickedPeriodId, setPickedPeriodId] = useState<string | null>(null);
  const [status, setStatus] = useState<TAppraisalStatus | typeof ALL>(ALL);

  // Until someone picks, the newest period is shown.
  const periodId = pickedPeriodId ?? (periods[0] ? String(periods[0].id) : "");
  const period = periods.find((item) => String(item.id) === periodId);

  const params: TAppraisalListParams = {
    scope: "all",
    page,
    per_page: perPage,
    search,
    period_id: periodId ? Number(periodId) : undefined,
    status: status === ALL ? undefined : status,
  };

  const { data, isLoading, isError, error } = useQuery({
    queryKey: [...APPRAISAL_LIST_QUERY_KEY, params],
    queryFn: () => GetAppraisals(params),
    enabled: !!periodId,
    placeholderData: keepPreviousData,
  });

  const pagination = data?.meta?.pagination;
  const columns = useMemo(
    () =>
      appraisalColumns({
        t,
        locale,
        current_page: pagination?.current_page ?? 1,
        per_page: pagination?.per_page ?? perPage,
        showEmployee: true,
        showAssessor: true,
        showPdf: true,
      }),
    [t, locale, pagination, perPage],
  );

  return (
    <Card className="flex flex-col">
      <div className="flex w-full flex-col gap-2 px-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <PeriodSelect
            periods={periods}
            value={periodId}
            disabled={periods.length === 0}
            onChange={(value) => {
              setPickedPeriodId(value);
              resetPage();
            }}
          />
          <Select
            value={status}
            onValueChange={(value) => {
              setStatus(value as TAppraisalStatus | typeof ALL);
              resetPage();
            }}
          >
            <SelectTrigger className="w-full rounded-lg sm:w-44" aria-label={t("list.statusLabel")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>{t("list.allStatuses")}</SelectItem>
              {STATUSES.map((value) => (
                <SelectItem key={value} value={value}>
                  {t(`status.${value}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="relative w-full sm:w-64">
            <HugeiconsIcon icon={Search01Icon} className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder={t("list.searchPlaceholder")}
              aria-label={t("list.searchPlaceholder")}
              defaultValue={search}
              onChange={(event) => {
                const { value } = event.target;
                debounce(() => onSearchChange(value), DELAY);
              }}
            />
          </div>
        </div>
      </div>

      {period?.counts && (
        <dl className="flex flex-wrap gap-x-5 gap-y-1 px-6 text-xs text-muted-foreground">
          <div className="flex gap-1">
            <dt>{t("reports.total")}</dt>
            <dd className="font-medium text-foreground tabular-nums">{period.counts.total}</dd>
          </div>
          {STATUSES.map((value) => (
            <div key={value} className="flex gap-1">
              <dt>{t(`status.${value}`)}</dt>
              <dd className="font-medium text-foreground tabular-nums">{period.counts?.[value] ?? 0}</dd>
            </div>
          ))}
        </dl>
      )}

      <CardContent className="flex flex-col gap-4 overflow-auto">
        {isError && <p className="text-sm text-destructive">{(error as Error).message}</p>}
        <DataTable
          columns={columns}
          data={data?.data ?? []}
          isLoading={isLoading || isPeriodsLoading}
          noResultMessage={!periodId ? t("reports.noPeriods") : search || status !== ALL ? t("list.emptySearch") : t("reports.empty")}
          page={page}
          onPageChanged={(nextPage) => setPage(Number(nextPage))}
          limit={perPage}
          onLimitChanged={(nextLimit) => onLimitChange(Number(nextLimit))}
          currentPage={pagination?.current_page ?? 1}
          lastPage={pagination?.last_page ?? 1}
        />
      </CardContent>
    </Card>
  );
}
