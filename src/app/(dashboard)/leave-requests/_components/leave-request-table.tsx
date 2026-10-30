"use client";

import { useMemo, useState } from "react";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";

import { DataTable } from "@/components/common/data-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { Input } from "@/components/ui/input";
import { LEAVE_STATUS } from "@/constants/leave-constant";
import { DELAY } from "@/constants/params-constant";
import useDebounce from "@/hooks/use-debounce";
import { useListParams } from "@/hooks/use-list-params";
import type { TLeaveSortKey } from "@/types/leave";
import type { TTableFacet } from "@/types/table";
import { Cancel01Icon, Search01Icon } from "@hugeicons/core-free-icons";
import CancelLeaveDialog from "../../_components/cancel-leave-dialog";
import LeaveDetailSheet, { LEAVE_DETAIL_QUERY_KEY } from "../../_components/leave-detail-sheet";
import { GetLeaveRequests } from "../action";
import { leaveRequestColumns } from "./leave-request-columns";

export const LEAVE_REQUESTS_QUERY_KEY = ["leave", "requests"] as const;

/** The status filter offers every status the API can store; labels come from the column's `filterLabel`. */
const STATUS_FACETS: TTableFacet[] = Object.values(LEAVE_STATUS).map((value) => ({ value: String(value), label: String(value), count: 0 }));

/**
 * The requester's own history. The API pages, sorts and filters (`useListParams` +
 * `table.tableProps`); a row opens the detail sheet, where a pending request can be cancelled.
 */
export default function LeaveRequestTable() {
  const t = useTranslations("leave");
  const locale = useLocale();
  const debounce = useDebounce();
  const queryClient = useQueryClient();
  const { page, setPage, perPage, onLimitChange, search, onSearchChange, table } = useListParams();

  const [detailId, setDetailId] = useState<number | null>(null);
  const [cancelTarget, setCancelTarget] = useState<{ id: number; subject: string } | null>(null);

  const params = {
    page,
    per_page: perPage,
    search,
    status: table.params.columns?.status?.join(","),
    sort_by: table.params.sort as TLeaveSortKey | undefined,
    sort_dir: table.params.direction,
  };

  const { data, isLoading, isError, error } = useQuery({
    queryKey: [...LEAVE_REQUESTS_QUERY_KEY, params],
    queryFn: () => GetLeaveRequests(params),
    placeholderData: keepPreviousData,
  });

  const pagination = data?.meta?.pagination;

  const columns = useMemo(
    () =>
      leaveRequestColumns({
        t,
        locale,
        current_page: pagination?.current_page ?? 1,
        per_page: pagination?.per_page ?? perPage,
        onClickDetail: (item) => setDetailId(item.id),
      }),
    [t, locale, pagination, perPage],
  );

  const afterCancel = () => {
    queryClient.invalidateQueries({ queryKey: LEAVE_REQUESTS_QUERY_KEY });
    queryClient.invalidateQueries({ queryKey: ["leave", "my-balance"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    if (cancelTarget) queryClient.invalidateQueries({ queryKey: LEAVE_DETAIL_QUERY_KEY(cancelTarget.id) });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("history.title")}</CardTitle>
        <CardDescription>{t("history.description")}</CardDescription>
      </CardHeader>

      <div className="flex w-full flex-col gap-2 px-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          {pagination ? t("history.count", { count: pagination.total }) : ""}
        </p>
        <div className="relative w-full sm:max-w-72">
          <HugeiconsIcon icon={Search01Icon} className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder={t("history.searchPlaceholder")}
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
          data={data?.data ?? []}
          isLoading={isLoading}
          noResultMessage={search || params.status ? t("history.emptySearch") : t("history.empty")}
          page={page}
          onPageChanged={(nextPage) => setPage(Number(nextPage))}
          limit={perPage}
          onLimitChanged={(nextLimit) => onLimitChange(Number(nextLimit))}
          currentPage={pagination?.current_page ?? 1}
          lastPage={pagination?.last_page ?? 1}
          {...table.tableProps}
          facets={{ status: STATUS_FACETS }}
        />

        <LeaveDetailSheet
          leaveId={detailId}
          onOpenChange={(open) => !open && setDetailId(null)}
          footer={(detail) =>
            Number(detail.status) === LEAVE_STATUS.PENDING ? (
              <div className="flex justify-end border-t pt-4">
                <Button type="button" variant="outline" size="sm" onClick={() => setCancelTarget({ id: detail.id, subject: detail.subject })}>
                  <HugeiconsIcon icon={Cancel01Icon} className="size-4" />
                  {t("detail.cancel")}
                </Button>
              </div>
            ) : null
          }
        />

        {cancelTarget && (
          <CancelLeaveDialog
            leaveId={cancelTarget.id}
            subject={cancelTarget.subject}
            open
            onOpenChange={(open) => !open && setCancelTarget(null)}
            onSuccess={afterCancel}
          />
        )}
      </CardContent>
    </Card>
  );
}
