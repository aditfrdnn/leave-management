import { ColumnDef } from "@tanstack/react-table";
import type { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import type { TPermissionItem } from "@/types/setup";
import { Delete02Icon, PencilEdit02Icon } from "@hugeicons/core-free-icons";

/** `useTranslations("setup")`, passed in because column factories cannot call hooks. */
type TSetupTranslator = ReturnType<typeof useTranslations<"setup">>;

/** A known group (`leave`, `setup`) gets its translated name; any other shows as typed. */
export function permissionGroupLabel(t: TSetupTranslator, groupName: string) {
  const key = `shared.permissionGroups.${groupName}`;

  return t.has(key as never) ? t(key as never) : groupName;
}

export const permissionColumns = ({
  t,
  current_page,
  per_page,
  onClickEdit,
  onClickDelete,
}: {
  t: TSetupTranslator;
  current_page: number;
  per_page: number;
  onClickEdit: (item: TPermissionItem) => void;
  onClickDelete: (item: TPermissionItem) => void;
}): ColumnDef<TPermissionItem>[] => [
  {
    id: "no",
    enableHiding: false,
    header: t("shared.columns.no"),
    cell: ({ row }) => <p>{(current_page - 1) * per_page + row.index + 1}.</p>,
  },
  {
    accessorKey: "title",
    header: t("permissions.fields.title"),
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <span className="font-mono text-xs whitespace-nowrap">{row.original.title}</span>
      </div>
    ),
  },
  {
    accessorKey: "label",
    header: t("permissions.fields.label"),
    cell: ({ row }) => <p className="min-w-40 font-medium">{row.original.label || "-"}</p>,
  },
  {
    accessorKey: "group_name",
    header: t("permissions.fields.group"),
    meta: { filterKey: "group", filterLabel: (value) => permissionGroupLabel(t, value) },
    cell: ({ row }) => <Badge variant="secondary">{permissionGroupLabel(t, row.original.group_name)}</Badge>,
  },
  {
    accessorKey: "roles_count",
    header: t("permissions.columns.roles"),
    cell: ({ row }) => <p className="whitespace-nowrap tabular-nums">{t("permissions.columns.roleCount", { count: row.original.roles_count ?? 0 })}</p>,
  },
  {
    id: "actions",
    enableHiding: false,
    header: () => <span className="sr-only">{t("shared.columns.actions")}</span>,
    cell: ({ row }) => {
      const canDelete = (row.original.roles_count ?? 0) === 0;

      return (
        <div className="flex items-center justify-end gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={t("shared.actions.editItem", { name: row.original.title })}
            onClick={() => onClickEdit(row.original)}
          >
            <HugeiconsIcon icon={PencilEdit02Icon} className="size-4 text-muted-foreground" />
          </Button>
          {canDelete && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={t("shared.actions.deleteItem", { name: row.original.title })}
              onClick={() => onClickDelete(row.original)}
            >
              <HugeiconsIcon icon={Delete02Icon} className="size-4 text-destructive" />
            </Button>
          )}
        </div>
      );
    },
  },
];
