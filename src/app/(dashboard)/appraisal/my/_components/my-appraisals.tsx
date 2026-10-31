"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";

import { DataTable } from "@/components/common/data-table";
import LoadingButton from "@/components/common/loading-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { useListParams } from "@/hooks/use-list-params";
import { useTranslateMessage } from "@/hooks/use-translate-message";
import { isActionState } from "@/lib/action-state";
import type { TAppraisalListParams, TAppraisalPeriod } from "@/types/appraisal";
import { Calendar03Icon, PencilEdit02Icon } from "@hugeicons/core-free-icons";
import { GetAppraisals } from "../../action";
import { appraisalColumns } from "../../_components/appraisal-columns";
import { formatDay, periodRanges } from "../../_components/appraisal-format";
import { PeriodStatusBadge } from "../../_components/appraisal-status-badge";
import { APPRAISAL_LIST_QUERY_KEY } from "../../_components/query-keys";
import { usePeriodOptions } from "../../_components/use-period-options";
import { StartAppraisal } from "../action";

/** One appraisal per period, so 100 covers every period I ever had. */
const ALL_MINE: TAppraisalListParams = { scope: "mine", page: 1, per_page: 100 };

/** My appraisals across periods, plus a "start" card for each open period I have not started. */
export default function MyAppraisals() {
  const t = useTranslations("appraisal");
  const locale = useLocale();
  const router = useRouter();
  const queryClient = useQueryClient();
  const translateMessage = useTranslateMessage();
  const { page, setPage, perPage, onLimitChange, table } = useListParams();

  const params: TAppraisalListParams = {
    scope: "mine",
    page,
    per_page: perPage,
    sort_by: table.params.sort as TAppraisalListParams["sort_by"],
    sort_dir: table.params.direction,
    columns: table.params.columns,
  };

  const { data, isLoading, isError, error } = useQuery({
    queryKey: [...APPRAISAL_LIST_QUERY_KEY, params],
    queryFn: () => GetAppraisals(params),
    placeholderData: keepPreviousData,
  });
  const { data: allMine } = useQuery({
    queryKey: [...APPRAISAL_LIST_QUERY_KEY, ALL_MINE],
    queryFn: () => GetAppraisals(ALL_MINE),
  });
  const { data: periods } = usePeriodOptions();

  const startedPeriodIds = useMemo(() => new Set((allMine?.data ?? []).map((item) => item.period.id)), [allMine]);
  const startable = allMine ? (periods ?? []).filter((period) => period.status === "open" && !startedPeriodIds.has(period.id)) : [];

  const { mutate: start, isPending: isStarting, variables: startingId } = useMutation({
    mutationFn: async (periodId: string) => {
      const state = await StartAppraisal(periodId);

      if (state.status === "error") throw state;

      return state;
    },
    onSuccess: (state) => {
      toast.success(translateMessage(state.message) || t("my.started"));
      queryClient.invalidateQueries({ queryKey: APPRAISAL_LIST_QUERY_KEY });
      if (state.data?.id) router.push(`/appraisal/${state.data.id}`);
    },
    onError: (failure: unknown) => {
      queryClient.invalidateQueries({ queryKey: APPRAISAL_LIST_QUERY_KEY });
      const description = isActionState(failure) ? translateMessage(failure.errors?._form?.[0] ?? failure.message) : failure instanceof Error ? failure.message : undefined;

      toast.error(t("my.startFailed"), { description });
    },
  });

  const pagination = data?.meta?.pagination;
  const columns = useMemo(
    () =>
      appraisalColumns({
        t,
        locale,
        current_page: pagination?.current_page ?? 1,
        per_page: pagination?.per_page ?? perPage,
        showEmployee: false,
        showAssessor: true,
        showPdf: false,
      }),
    [t, locale, pagination, perPage],
  );

  const joinRange = (values: { start: string; end: string }) => t("format.range", values);

  return (
    <div className="flex flex-col gap-4">
      {startable.length > 0 && (
        <section aria-labelledby="appraisal-start-heading" className="flex flex-col gap-2">
          <h2 id="appraisal-start-heading" className="type-section-title">
            {t("my.startTitle")}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {startable.map((period: TAppraisalPeriod) => {
              const ranges = periodRanges(period, locale, joinRange);

              return (
                <Card key={period.id} className="gap-3">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle>{period.name}</CardTitle>
                      <PeriodStatusBadge status={period.status} />
                    </div>
                    <CardDescription>{t("my.reviewRange", { range: ranges.review })}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <HugeiconsIcon icon={Calendar03Icon} className="size-3.5" />
                      {period.due_date ? t("my.dueDate", { date: formatDay(period.due_date, locale) }) : t("my.noDueDate")}
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button size="sm" disabled={isStarting} onClick={() => start(period.id)}>
                      {isStarting && startingId === period.id ? (
                        <LoadingButton />
                      ) : (
                        <>
                          <HugeiconsIcon icon={PencilEdit02Icon} className="size-4" />
                          {t("my.start")}
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t("my.listTitle")}</CardTitle>
          <CardDescription>{t("my.listDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 overflow-auto">
          {isError && <p className="text-sm text-destructive">{(error as Error).message}</p>}
          <DataTable
            columns={columns}
            data={data?.data ?? []}
            isLoading={isLoading}
            noResultMessage={t("my.empty")}
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
    </div>
  );
}
