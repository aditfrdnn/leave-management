import { ColumnDef } from "@tanstack/react-table";
import type { useTranslations } from "next-intl";

import { dateFormatter } from "@/lib/utils/utils";
import type { TLeave } from "@/types/leave";
import LeaveStatusBadge from "./leave-status-badge";

/** `useTranslations("leave")`, passed in because column factories cannot call hooks. */
type TLeaveTranslator = ReturnType<typeof useTranslations<"leave">>;

export const leaveRequestColumns = ({ t, locale }: { t: TLeaveTranslator; locale: string }): ColumnDef<TLeave>[] => [
  {
    id: "no",
    enableHiding: false,
    header: t("history.columns.no"),
    cell: ({ row }) => <p>{row.index + 1}.</p>,
  },
  {
    accessorKey: "subject",
    header: t("history.columns.subject"),
    meta: { sortKey: "subject" },
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
    id: "leave_type",
    accessorFn: (row) => row.leave_type?.name ?? "",
    header: t("history.columns.leaveType"),
    meta: { filterKey: "leave_type" },
    cell: ({ row }) => <p className="whitespace-nowrap">{row.original.leave_type?.name ?? "-"}</p>,
  },
  {
    accessorKey: "duration",
    header: t("history.columns.duration"),
    cell: ({ row }) => <p className="whitespace-nowrap">{row.original.duration || "-"}</p>,
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
      filterKey: "status",
      filterLabel: (value) =>
        value === "1" ? t("status.approved") : value === "2" ? t("status.rejected") : t("status.pending"),
    },
    cell: ({ row }) => <LeaveStatusBadge status={Number(row.original.status)} />,
  },
  {
    accessorKey: "submitted_at",
    header: t("history.columns.submittedAt"),
    meta: { sortKey: "submitted_at" },
    cell: ({ row }) => <p className="whitespace-nowrap">{dateFormatter(row.original.submitted_at ?? row.original.created_at, locale)}</p>,
  },
];
