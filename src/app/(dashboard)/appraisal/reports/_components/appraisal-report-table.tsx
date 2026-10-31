"use client";

import { useMemo } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";

import { DataTable } from "@/components/common/data-table";
import { Card, CardContent } from "@/components/ui/card";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { Input } from "@/components/ui/input";
import { DELAY } from "@/constants/params-constant";
import useDebounce from "@/hooks/use-debounce";
import { useListParams } from "@/hooks/use-list-params";
import type { TAppraisalListParams } from "@/types/appraisal";
import { Search01Icon } from "@hugeicons/core-free-icons";
import { GetAppraisals } from "../../action";
import { appraisalColumns } from "../../_components/appraisal-columns";
import { APPRAISAL_LIST_QUERY_KEY } from "../../_components/query-keys";


/** Every appraisal (scope=all) with the PDF per row; period, employee, assessor and status are header filters. */
export default function AppraisalReportTable() {
  const t = useTranslations("appraisal");
  const locale = useLocale();
  const debounce = useDebounce();
  const { page, setPage, perPage, onLimitChange, search, onSearchChange, table } = useListParams();

  const params: TAppraisalListParams = {
    scope: "all",
    page,
    per_page: perPage,
    search,
    sort_by: table.params.sort as TAppraisalListParams["sort_by"],
    sort_dir: table.params.direction,
    columns: table.params.columns,
  };

  const { data, isLoading, isError, error } = useQuery({
    queryKey: [...APPRAISAL_LIST_QUERY_KEY, params],
    queryFn: () => GetAppraisals(params),
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
          noResultMessage={search || params.columns ? t("list.emptySearch") : t("reports.empty")}
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
  );
}
