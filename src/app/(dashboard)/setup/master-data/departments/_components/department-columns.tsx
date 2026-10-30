import { ColumnDef } from "@tanstack/react-table";
import type { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { dateFormatter } from "@/lib/utils/utils";
import type { TDepartmentItem } from "@/types/setup";
import { Delete02Icon, PencilEdit02Icon } from "@hugeicons/core-free-icons";

/** `useTranslations("setup")`, passed in because column factories cannot call hooks. */
type TSetupTranslator = ReturnType<typeof useTranslations<"setup">>;

export const departmentColumns = ({
  t,
  locale,
  current_page,
  per_page,
  onClickEdit,
  onClickDelete,
}: {
  t: TSetupTranslator;
  locale: string;
  current_page: number;
  per_page: number;
  onClickEdit: (item: TDepartmentItem) => void;
  onClickDelete: (item: TDepartmentItem) => void;
}): ColumnDef<TDepartmentItem>[] => [
  {
    id: "no",
    enableHiding: false,
    header: t("shared.columns.no"),
    cell: ({ row }) => <p>{(current_page - 1) * per_page + row.index + 1}.</p>,
  },
  {
    accessorKey: "name",
    header: t("departments.fields.name"),
    meta: { sortKey: "name" },
    cell: ({ row }) => <p className="font-medium whitespace-nowrap">{row.original.name || "-"}</p>,
  },
  {
    accessorKey: "alias",
    header: t("departments.fields.alias"),
    meta: { sortKey: "alias" },
    cell: ({ row }) => (
      <Badge variant="secondary" className="font-mono">
        {row.original.alias || "-"}
      </Badge>
    ),
  },
  {
    accessorKey: "employees_count",
    header: t("departments.columns.employees"),
    cell: ({ row }) => (
      <p className="whitespace-nowrap tabular-nums">{t("departments.columns.employeeCount", { count: row.original.employees_count ?? 0 })}</p>
    ),
  },
  {
    accessorKey: "created_at",
    header: t("shared.columns.createdAt"),
    meta: { sortKey: "created_at" },
    cell: ({ row }) => <p className="whitespace-nowrap text-muted-foreground">{dateFormatter(row.original.created_at, locale)}</p>,
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
          aria-label={t("shared.actions.editItem", { name: row.original.name })}
          onClick={() => onClickEdit(row.original)}
        >
          <HugeiconsIcon icon={PencilEdit02Icon} className="size-4 text-muted-foreground" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={t("shared.actions.deleteItem", { name: row.original.name })}
          onClick={() => onClickDelete(row.original)}
        >
          <HugeiconsIcon icon={Delete02Icon} className="size-4 text-destructive" />
        </Button>
      </div>
    ),
  },
];
