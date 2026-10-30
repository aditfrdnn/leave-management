import { ColumnDef } from "@tanstack/react-table";
import type { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { dateFormatter } from "@/lib/utils/utils";
import type { TApprovalItem } from "@/types/leave";
import { Cancel01Icon, CheckmarkCircle02Icon, ViewIcon } from "@hugeicons/core-free-icons";
import LeaveStatusBadge from "../../_components/leave-status-badge";

/** `useTranslations("leave")`, passed in because column factories cannot call hooks. */
type TLeaveTranslator = ReturnType<typeof useTranslations<"leave">>;

export const approvalColumns = ({
  t,
  locale,
  current_page,
  per_page,
  onClickDetail,
  onClickApprove,
  onClickReject,
}: {
  t: TLeaveTranslator;
  locale: string;
  current_page: number;
  per_page: number;
  onClickDetail: (item: TApprovalItem) => void;
  onClickApprove: (item: TApprovalItem) => void;
  onClickReject: (item: TApprovalItem) => void;
}): ColumnDef<TApprovalItem>[] => [
  {
    id: "no",
    enableHiding: false,
    header: t("history.columns.no"),
    cell: ({ row }) => <p>{(current_page - 1) * per_page + row.index + 1}.</p>,
  },
  {
    id: "requester",
    accessorFn: (row) => row.user?.name ?? "",
    header: t("approvals.columns.requester"),
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-medium whitespace-nowrap">{row.original.user?.name ?? "-"}</span>
        <span className="text-xs text-muted-foreground">{row.original.user?.department?.alias ?? ""}</span>
      </div>
    ),
  },
  {
    accessorKey: "subject",
    header: t("history.columns.subject"),
    cell: ({ row }) => <p className="whitespace-nowrap">{row.original.subject || "-"}</p>,
  },
  {
    id: "leave_type",
    accessorFn: (row) => row.leave_type?.name ?? "",
    header: t("history.columns.leaveType"),
    cell: ({ row }) => <p className="whitespace-nowrap">{row.original.leave_type?.name ?? "-"}</p>,
  },
  {
    accessorKey: "start_date",
    header: t("history.columns.dates"),
    cell: ({ row }) => (
      <p className="whitespace-nowrap">
        {dateFormatter(row.original.start_date, locale)}
        {row.original.end_date !== row.original.start_date ? ` – ${dateFormatter(row.original.end_date, locale)}` : ""}
        <span className="text-muted-foreground"> · {t("detail.days", { count: Number(row.original.duration) })}</span>
      </p>
    ),
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
    header: t("history.columns.status"),
    cell: ({ row }) => <LeaveStatusBadge status={Number(row.original.status)} />,
  },
  {
    id: "actions",
    enableHiding: false,
    header: () => <span className="sr-only">{t("approvals.columns.actions")}</span>,
    cell: ({ row }) => {
      const pending = Number(row.original.status) === 0 && Number(row.original.approval?.approval_action ?? 0) === 0;

      return (
        <div className="flex items-center justify-end gap-1">
          <Button type="button" variant="ghost" size="icon-sm" aria-label={t("approvals.actions.view")} onClick={() => onClickDetail(row.original)}>
            <HugeiconsIcon icon={ViewIcon} className="size-4 text-muted-foreground" />
          </Button>
          {pending && (
            <>
              <Button type="button" variant="ghost" size="icon-sm" aria-label={t("approvals.actions.approve")} onClick={() => onClickApprove(row.original)}>
                <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-4 text-green-strong" />
              </Button>
              <Button type="button" variant="ghost" size="icon-sm" aria-label={t("approvals.actions.reject")} onClick={() => onClickReject(row.original)}>
                <HugeiconsIcon icon={Cancel01Icon} className="size-4 text-destructive" />
              </Button>
            </>
          )}
        </div>
      );
    },
  },
];
