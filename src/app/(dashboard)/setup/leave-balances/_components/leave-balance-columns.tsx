import { ColumnDef } from "@tanstack/react-table";
import type { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { cn, dateFormatter } from "@/lib/utils/utils";
import type { TLeaveBalanceItem } from "@/types/setup";
import { Clock04Icon, PencilEdit02Icon } from "@hugeicons/core-free-icons";
import { formatDays, formatPeriod } from "./format";

type TSetupTranslator = ReturnType<typeof useTranslations<"setup">>;

export const leaveBalanceColumns = ({
  t,
  locale,
  current_page,
  per_page,
  onClickSet,
  onClickHistory,
}: {
  t: TSetupTranslator;
  locale: string;
  current_page: number;
  per_page: number;
  onClickSet: (item: TLeaveBalanceItem) => void;
  onClickHistory: (item: TLeaveBalanceItem) => void;
}): ColumnDef<TLeaveBalanceItem>[] => [
  {
    id: "no",
    enableHiding: false,
    header: t("shared.columns.no"),
    cell: ({ row }) => <p>{(current_page - 1) * per_page + row.index + 1}.</p>,
  },
  {
    id: "name",
    accessorFn: (row) => row.employee.name,
    header: t("leaveBalances.columns.employee"),
    meta: { sortKey: "name" },
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-medium whitespace-nowrap">{row.original.employee.name}</span>
        <span className="text-xs text-muted-foreground tabular-nums">{row.original.employee.employee_number}</span>
      </div>
    ),
  },
  {
    id: "department",
    accessorFn: (row) => row.employee.department?.alias ?? "",
    header: t("leaveBalances.columns.department"),
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="whitespace-nowrap">{row.original.employee.department?.alias ?? "-"}</span>
        <span className="text-xs text-muted-foreground">{row.original.employee.position ?? ""}</span>
      </div>
    ),
  },
  {
    id: "balance",
    accessorFn: (row) => row.balance,
    header: () => <span className="block text-right">{t("leaveBalances.columns.balance")}</span>,
    meta: { sortKey: "balance", label: t("leaveBalances.columns.balance") },
    cell: ({ row }) => (
      <div className="flex items-center justify-end gap-2">
        {!row.original.is_set && (
          <Badge variant="outline" className="border-none bg-yellow/12 text-yellow-strong">
            {t("leaveBalances.notSet")}
          </Badge>
        )}
        <span className={cn("text-base font-semibold tabular-nums", row.original.balance < 0 && "text-destructive")}>
          {formatDays(row.original.balance, locale)}
        </span>
        <span className="text-xs text-muted-foreground">{t("leaveBalances.daysUnit")}</span>
      </div>
    ),
  },
  {
    id: "used",
    accessorFn: (row) => row.used_this_year,
    header: () => <span className="block text-right">{t("leaveBalances.columns.usedThisYear")}</span>,
    meta: { label: t("leaveBalances.columns.usedThisYear") },
    cell: ({ row }) => <p className="text-right tabular-nums">{formatDays(row.original.used_this_year, locale)}</p>,
  },
  {
    id: "updates",
    header: t("leaveBalances.columns.lastUpdates"),
    cell: ({ row }) => (
      <div className="flex flex-col text-xs whitespace-nowrap text-muted-foreground">
        <span>
          {t("leaveBalances.lastSet")}: {row.original.last_set_at ? dateFormatter(row.original.last_set_at, locale) : "-"}
        </span>
        <span>
          {t("leaveBalances.lastAccrual")}: {formatPeriod(row.original.last_accrual_period, locale) ?? "-"}
        </span>
      </div>
    ),
  },
  {
    id: "actions",
    enableHiding: false,
    header: () => <span className="sr-only">{t("shared.columns.actions")}</span>,
    cell: ({ row }) => (
      <div className="flex items-center justify-end gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={t("leaveBalances.actions.history", { name: row.original.employee.name })}
          onClick={() => onClickHistory(row.original)}
        >
          <HugeiconsIcon icon={Clock04Icon} className="size-4 text-muted-foreground" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={t("leaveBalances.actions.set", { name: row.original.employee.name })}
          onClick={() => onClickSet(row.original)}
        >
          <HugeiconsIcon icon={PencilEdit02Icon} className="size-4 text-muted-foreground" />
        </Button>
      </div>
    ),
  },
];
