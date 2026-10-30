"use client";

import { useMemo, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";

import { DataTable } from "@/components/common/data-table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DELAY } from "@/constants/params-constant";
import useDebounce from "@/hooks/use-debounce";
import { useListParams } from "@/hooks/use-list-params";
import type { TAppraisalListParams, TAppraisalStatus } from "@/types/appraisal";
import { Search01Icon } from "@hugeicons/core-free-icons";
import { GetAppraisals } from "../../action";
import { appraisalColumns } from "../../_components/appraisal-columns";
import PeriodSelect, { ALL_PERIODS } from "../../_components/period-select";
import { APPRAISAL_LIST_QUERY_KEY } from "../../_components/query-keys";
import { usePeriodOptions } from "../../_components/use-period-options";

type TTeamTab = "submitted" | "all" | "draft" | "assessed" | "acknowledged";

/** "Needs assessment" first: that is the assessor's to-do list. */
const TABS: TTeamTab[] = ["submitted", "all", "draft", "assessed", "acknowledged"];

/** Appraisals I assess (scope=team), by status tab, period and employee search. */
export default function TeamAppraisalTable() {
  const t = useTranslations("appraisal");
  const locale = useLocale();
  const debounce = useDebounce();
  const { page, setPage, perPage, onLimitChange, search, onSearchChange, resetPage } = useListParams();
  const { data: periods = [] } = usePeriodOptions();

  const [tab, setTab] = useState<TTeamTab>("submitted");
  const [periodId, setPeriodId] = useState<string>(ALL_PERIODS);

  const params: TAppraisalListParams = {
    scope: "team",
    page,
    per_page: perPage,
    search,
    status: tab === "all" ? undefined : (tab as TAppraisalStatus),
    period_id: periodId === ALL_PERIODS ? undefined : Number(periodId),
  };

  const { data, isLoading, isError, error } = useQuery({
    queryKey: [...APPRAISAL_LIST_QUERY_KEY, params],
    queryFn: () => GetAppraisals(params),
    placeholderData: keepPreviousData,
  });

  const pagination = data?.meta?.pagination;
  const awaiting = data?.meta?.awaiting_my_assessment ?? 0;

  const columns = useMemo(
    () =>
      appraisalColumns({
        t,
        locale,
        current_page: pagination?.current_page ?? 1,
        per_page: pagination?.per_page ?? perPage,
        showEmployee: true,
        showAssessor: false,
        showPdf: true,
      }),
    [t, locale, pagination, perPage],
  );

  return (
    <Card className="flex flex-col">
      <div className="flex w-full flex-col gap-2 px-6 xl:flex-row xl:items-center xl:justify-between">
        <Tabs
          value={tab}
          onValueChange={(value) => {
            setTab(value as TTeamTab);
            resetPage();
          }}
          className="min-w-0 max-w-full overflow-x-auto"
        >
          <TabsList aria-label={t("team.tabs.label")}>
            {TABS.map((value) => (
              <TabsTrigger key={value} value={value} className="gap-1.5">
                {t(`team.tabs.${value}`)}
                {value === "submitted" && awaiting > 0 && (
                  <Badge className="h-4.5 min-w-4.5 rounded-full px-1 text-2xs tabular-nums" aria-label={t("team.awaitingCount", { count: awaiting })}>
                    {awaiting}
                  </Badge>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center xl:w-auto">
          <PeriodSelect
            periods={periods}
            value={periodId}
            allowAll
            onChange={(value) => {
              setPeriodId(value);
              resetPage();
            }}
          />
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

      <CardContent className="flex flex-col gap-4 overflow-auto">
        {isError && <p className="text-sm text-destructive">{(error as Error).message}</p>}
        <DataTable
          columns={columns}
          data={data?.data ?? []}
          isLoading={isLoading}
          noResultMessage={search || periodId !== ALL_PERIODS ? t("list.emptySearch") : tab === "submitted" ? t("team.emptyAwaiting") : t("team.empty")}
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
