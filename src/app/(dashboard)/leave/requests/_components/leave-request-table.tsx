"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";

import { DataTable } from "@/components/common/data-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { Input } from "@/components/ui/input";
import { LEAVE_STATUS } from "@/constants/leave-constant";
import { DELAY } from "@/constants/params-constant";
import { PERMISSIONS_CONSTANT } from "@/constants/permission-constant";
import { useAuth } from "@/hooks/use-auth";
import useDebounce from "@/hooks/use-debounce";
import { useListParams } from "@/hooks/use-list-params";
import { usePermission } from "@/lib/permission";
import type { TLeave, TLeaveScope, TLeaveSortKey } from "@/types/leave";
import { Add01Icon, Cancel01Icon, CheckmarkCircle02Icon, Search01Icon } from "@hugeicons/core-free-icons";
import ApprovalDecisionDialog from "../../_components/approval-decision-dialog";
import CancelLeaveDialog from "../../_components/cancel-leave-dialog";
import LeaveDetailSheet, { LEAVE_DETAIL_QUERY_KEY } from "../../_components/leave-detail-sheet";
import { GetLeaveRequests } from "../action";
import { leaveRequestColumns } from "./leave-request-columns";
import LeaveRequestFormDialog from "./leave-request-form-dialog";

export const LEAVE_REQUESTS_QUERY_KEY = ["leave", "requests"] as const;

/**
 * One table for the leave I asked for and, for approvers, the leave I decide on (docs/setup-module.md §13).
 * The API pages, sorts and filters; a row opens the detail sheet, where I cancel my own pending request
 * or approve/reject one that waits for me.
 */
export default function LeaveRequestTable() {
  const t = useTranslations("leave");
  const locale = useLocale();
  const debounce = useDebounce();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  // Links for approvers (email, dashboard) arrive as ?scope=approvals: open on what still waits for a decision.
  const { page, setPage, perPage, onLimitChange, search, onSearchChange, table } = useListParams({
    defaultFilters: searchParams.get("scope") === "approvals" ? { status: [String(LEAVE_STATUS.PENDING)] } : {},
  });
  const { user } = useAuth();
  // Until /api/me answers we do not know whether to show approver tabs; wait instead of flashing "mine".
  const { allowed: canApprove, loading: isPermissionLoading } = usePermission(PERMISSIONS_CONSTANT.LEAVE_APPROVE);

  const [detailId, setDetailId] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const [isFormOpen, setIsFormOpen] = useState(false);

  // "New request" links elsewhere (dashboard) arrive as ?new=1 and open the dialog; closing it drops the flag.
  const openedFromLink = searchParams.get("new") === "1";
  const formOpen = isFormOpen || openedFromLink;
  const onFormOpenChange = (open: boolean) => {
    setIsFormOpen(open);
    if (!open && openedFromLink) router.replace(pathname, { scroll: false });
  };
  const [cancelTarget, setCancelTarget] = useState<{ id: string; subject: string } | null>(null);
  const [decision, setDecision] = useState<{ item: TLeave; decision: "approve" | "reject" } | null>(null);

  // One list: my own requests and, for approvers, the ones I decide on. Requester and status are header filters.
  const scope: TLeaveScope = canApprove ? "all" : "mine";

  const params = {
    scope,
    page,
    per_page: perPage,
    search,
    columns: table.params.columns,
    sort_by: table.params.sort as TLeaveSortKey | undefined,
    sort_dir: table.params.direction,
  };

  const { data, isLoading, isError, error } = useQuery({
    queryKey: [...LEAVE_REQUESTS_QUERY_KEY, params],
    queryFn: () => GetLeaveRequests(params),
    enabled: !isPermissionLoading,
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
        showRequester: scope !== "mine",
        onClickDetail: (item) => setDetailId(item.id),
        onClickDecide: (item, value) => setDecision({ item, decision: value }),
      }),
    [t, locale, pagination, perPage, scope],
  );
  const awaitingMyDecision = data?.meta?.awaiting_my_decision ?? 0;

  const afterCancel = () => {
    queryClient.invalidateQueries({ queryKey: LEAVE_REQUESTS_QUERY_KEY });
    queryClient.invalidateQueries({ queryKey: ["leave", "my-balance"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    if (cancelTarget) queryClient.invalidateQueries({ queryKey: LEAVE_DETAIL_QUERY_KEY(cancelTarget.id) });
  };

  const afterDecision = () => {
    queryClient.invalidateQueries({ queryKey: LEAVE_REQUESTS_QUERY_KEY });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    if (decision) queryClient.invalidateQueries({ queryKey: LEAVE_DETAIL_QUERY_KEY(decision.item.id) });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t(`history.titles.${scope}`)}</CardTitle>
        <CardDescription>{t(`history.descriptions.${scope}`)}</CardDescription>
      </CardHeader>

      <div className="flex w-full flex-col gap-2 px-6 lg:flex-row lg:items-center lg:justify-between">
        <p className="text-xs text-muted-foreground" aria-live="polite">
          {canApprove && awaitingMyDecision > 0
            ? t("history.awaitingCount", { count: awaitingMyDecision })
            : pagination
              ? t("history.count", { count: pagination.total })
              : ""}
        </p>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
        <div className="relative w-full sm:w-72">
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
          <Button size="sm" className="self-start sm:self-auto" onClick={() => setIsFormOpen(true)}>
            <HugeiconsIcon icon={Add01Icon} className="size-4" />
            {t("form.newRequest")}
          </Button>
        </div>
      </div>

      <CardContent className="flex flex-col gap-4 overflow-auto">
        {isError && <p className="text-sm text-destructive">{(error as Error).message}</p>}
        <DataTable
          columns={columns}
          data={data?.data ?? []}
          isLoading={isLoading || isPermissionLoading}
          noResultMessage={
            search || params.columns ? t("history.emptySearch") : t("history.empty")
          }
          page={page}
          onPageChanged={(nextPage) => setPage(Number(nextPage))}
          limit={perPage}
          onLimitChanged={(nextLimit) => onLimitChange(Number(nextLimit))}
          currentPage={pagination?.current_page ?? 1}
          lastPage={pagination?.last_page ?? 1}
          {...table.tableProps}
          facets={data?.meta?.facets}
        />

        <LeaveDetailSheet
          leaveId={detailId}
          onOpenChange={(open) => !open && setDetailId(null)}
          footer={(detail) => {
            if (Number(detail.status) !== LEAVE_STATUS.PENDING) return null;

            const isMine = detail.user?.id === user?.id;
            const myStep = detail.approvals?.find((step) => step.approval_by?.id === user?.id);
            const awaitingMe = myStep !== undefined && Number(myStep.approval_action) === 0;
            if (!isMine && !awaitingMe) return null;

            return (
              <div className="flex flex-wrap justify-end gap-2 border-t pt-4">
                {isMine && (
                  <Button type="button" variant="outline" size="sm" onClick={() => setCancelTarget({ id: detail.id, subject: detail.subject })}>
                    <HugeiconsIcon icon={Cancel01Icon} className="size-4" />
                    {t("detail.cancel")}
                  </Button>
                )}
                {awaitingMe && (
                  <>
                    <Button type="button" variant="outline" size="sm" onClick={() => setDecision({ item: detail, decision: "reject" })}>
                      <HugeiconsIcon icon={Cancel01Icon} className="size-4 text-destructive" />
                      {t("history.reject")}
                    </Button>
                    <Button type="button" size="sm" onClick={() => setDecision({ item: detail, decision: "approve" })}>
                      <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-4" />
                      {t("history.approve")}
                    </Button>
                  </>
                )}
              </div>
            );
          }}
        />

        <LeaveRequestFormDialog open={formOpen} onOpenChange={onFormOpenChange} />

        <ApprovalDecisionDialog
          item={decision?.item ?? null}
          decision={decision?.decision ?? "approve"}
          onOpenChange={(open) => !open && setDecision(null)}
          onSuccess={afterDecision}
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
