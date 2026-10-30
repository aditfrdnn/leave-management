"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";

import { DataTable } from "@/components/common/data-table";
import { Card, CardContent } from "@/components/ui/card";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DELAY } from "@/constants/params-constant";
import useDebounce from "@/hooks/use-debounce";
import { useListParams } from "@/hooks/use-list-params";
import type { TApprovalItem, TApprovalStatusFilter } from "@/types/leave";
import { Search01Icon } from "@hugeicons/core-free-icons";
import LeaveDetailSheet, { LEAVE_DETAIL_QUERY_KEY } from "../../_components/leave-detail-sheet";
import { GetApprovals } from "../action";
import { approvalColumns } from "./approval-columns";
import ApprovalDecisionDialog, { type TDecision } from "./approval-decision-dialog";

const STATUS_FILTERS: TApprovalStatusFilter[] = ["pending", "approved", "rejected", "all"];

export const APPROVALS_QUERY_KEY = ["leave", "approvals"] as const;

export default function ApprovalTable() {
  const t = useTranslations("leave");
  const locale = useLocale();
  const debounce = useDebounce();
  const queryClient = useQueryClient();
  const { page, setPage, perPage, onLimitChange, search, onSearchChange, resetPage } = useListParams();

  const [status, setStatus] = useState<TApprovalStatusFilter>("pending");
  const [detailId, setDetailId] = useState<number | null>(null);
  const [decision, setDecision] = useState<{ item: TApprovalItem; decision: TDecision } | null>(null);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [...APPROVALS_QUERY_KEY, status, page, perPage, search],
    queryFn: () => GetApprovals({ status, page, per_page: perPage, search }),
  });

  const pagination = data?.meta?.pagination;

  const columns = useMemo(
    () =>
      approvalColumns({
        t,
        locale,
        current_page: pagination?.current_page ?? 1,
        per_page: pagination?.per_page ?? perPage,
        onClickDetail: (item) => setDetailId(item.id),
        onClickApprove: (item) => setDecision({ item, decision: "approve" }),
        onClickReject: (item) => setDecision({ item, decision: "reject" }),
      }),
    [t, locale, pagination, perPage],
  );

  const afterDecision = () => {
    refetch();
    if (decision) queryClient.invalidateQueries({ queryKey: LEAVE_DETAIL_QUERY_KEY(decision.item.id) });
  };

  return (
    <Card className="flex flex-col">
      <div className="flex w-full flex-wrap items-center justify-between gap-2 px-6">
        <Tabs
          className="min-w-0 max-w-full overflow-x-auto"
          value={status}
          onValueChange={(value) => {
            setStatus(value as TApprovalStatusFilter);
            resetPage();
          }}
        >
          <TabsList className="w-full sm:w-auto">
            {STATUS_FILTERS.map((filter) => (
              <TabsTrigger key={filter} value={filter}>
                {t(`approvals.filters.${filter}`)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="relative w-full sm:ml-auto sm:w-72">
          <HugeiconsIcon icon={Search01Icon} className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder={t("approvals.searchPlaceholder")}
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
          noResultMessage={search ? t("approvals.emptySearch") : t(`approvals.empty.${status}`)}
          page={page}
          onPageChanged={(nextPage) => setPage(Number(nextPage))}
          limit={perPage}
          onLimitChanged={(nextLimit) => onLimitChange(Number(nextLimit))}
          currentPage={pagination?.current_page ?? 1}
          lastPage={pagination?.last_page ?? 1}
        />

        <LeaveDetailSheet leaveId={detailId} onOpenChange={(open) => !open && setDetailId(null)} />

        <ApprovalDecisionDialog
          item={decision?.item ?? null}
          decision={decision?.decision ?? "approve"}
          onOpenChange={(open) => !open && setDecision(null)}
          onSuccess={afterDecision}
        />
      </CardContent>
    </Card>
  );
}
