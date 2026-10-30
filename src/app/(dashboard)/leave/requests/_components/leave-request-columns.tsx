import { ColumnDef } from "@tanstack/react-table";
import type { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { getLeaveStatusConfig } from "@/lib/status-config";
import { dateFormatter } from "@/lib/utils/utils";
import type { TLeave } from "@/types/leave";
import { Cancel01Icon, CheckmarkCircle02Icon, ViewIcon } from "@hugeicons/core-free-icons";
import LeaveStatusBadge from "../../_components/leave-status-badge";

/** `useTranslations("leave")`, passed in because column factories cannot call hooks. */
type TLeaveTranslator = ReturnType<typeof useTranslations<"leave">>;

export const leaveRequestColumns = ({
  t,
  locale,
  current_page,
  per_page,
  showRequester,
  onClickDetail,
  onClickDecide,
}: {
  t: TLeaveTranslator;
  locale: string;
  current_page: number;
  per_page: number;
  /** Rows of other people are listed (approver scopes), so name who asked. */
  showRequester: boolean;
  onClickDetail: (item: TLeave) => void;
  onClickDecide: (item: TLeave, decision: "approve" | "reject") => void;
}): ColumnDef<TLeave>[] => [
  {
    id: "no",
    enableHiding: false,
    header: t("history.columns.no"),
    cell: ({ row }) => <p>{(current_page - 1) * per_page + row.index + 1}.</p>,
  },
  ...(showRequester
    ? [
        {
          id: "requester",
          accessorFn: (row: TLeave) => row.user?.name ?? "",
          header: t("history.columns.requester"),
          cell: ({ row }: { row: { original: TLeave } }) => (
            <div className="flex flex-col">
              <span className="font-medium whitespace-nowrap">{row.original.is_mine ? t("history.you") : (row.original.user?.name ?? "-")}</span>
              <span className="text-xs text-muted-foreground">{row.original.user?.department?.alias ?? ""}</span>
            </div>
          ),
        } satisfies ColumnDef<TLeave>,
      ]
    : []),
  {
    accessorKey: "subject",
    header: t("history.columns.subject"),
    cell: ({ row }) => <p className="font-medium whitespace-nowrap">{row.original.subject || "-"}</p>,
  },
  {
    accessorKey: "start_date",
    header: t("history.columns.dates"),
    meta: { sortKey: "start_date" },
    cell: ({ row }) => (
      <p className="whitespace-nowrap">
        {dateFormatter(row.original.start_date, locale)}
        {row.original.end_date && row.original.end_date !== row.original.start_date
          ? ` – ${dateFormatter(row.original.end_date, locale)}`
          : ""}
      </p>
    ),
  },
  {
    accessorKey: "duration",
    header: t("history.columns.duration"),
    meta: { sortKey: "duration" },
    cell: ({ row }) => <p className="whitespace-nowrap">{t("detail.days", { count: Number(row.original.duration) || 0 })}</p>,
  },
  {
    accessorKey: "reason",
    header: t("history.columns.reason"),
    cell: ({ row }) => (
      <p className="max-w-xs truncate text-muted-foreground" title={row.original.reason}>
        {row.original.reason || "-"}
      </p>
    ),
  },
  {
    id: "status",
    accessorFn: (row) => String(row.status),
    header: t("history.columns.status"),
    meta: {
      sortKey: "status",
      filterKey: "status",
      // The factory gets the namespaced translator, so strip the `leave.` prefix of the key.
      filterLabel: (value) => t(getLeaveStatusConfig(Number(value)).labelKey.replace("leave.", "") as "status.pending"),
    },
    cell: ({ row }) => <LeaveStatusBadge status={Number(row.original.status)} />,
  },
  {
    accessorKey: "submitted_at",
    header: t("history.columns.submittedAt"),
    meta: { sortKey: "created_at" },
    cell: ({ row }) => <p className="whitespace-nowrap">{dateFormatter(row.original.submitted_at ?? row.original.created_at, locale)}</p>,
  },
  {
    id: "actions",
    enableHiding: false,
    header: () => <span className="sr-only">{t("history.columns.actions")}</span>,
    cell: ({ row }) => {
      // My decision is due: the request is still pending and my approval step has not been taken.
      const awaitingMe = Number(row.original.status) === 0 && row.original.my_approval?.approval_action === 0;

      return (
        <div className="flex items-center justify-end gap-1">
          <Button type="button" variant="ghost" size="icon-sm" aria-label={t("history.view")} onClick={() => onClickDetail(row.original)}>
            <HugeiconsIcon icon={ViewIcon} className="size-4 text-muted-foreground" />
          </Button>
          {awaitingMe && (
            <>
              <Button type="button" variant="ghost" size="icon-sm" aria-label={t("history.approve")} onClick={() => onClickDecide(row.original, "approve")}>
                <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-4 text-green-strong" />
              </Button>
              <Button type="button" variant="ghost" size="icon-sm" aria-label={t("history.reject")} onClick={() => onClickDecide(row.original, "reject")}>
                <HugeiconsIcon icon={Cancel01Icon} className="size-4 text-destructive" />
              </Button>
            </>
          )}
        </div>
      );
    },
  },
];
