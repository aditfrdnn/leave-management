import { ColumnDef } from "@tanstack/react-table";
import type { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import type { TRoleItem } from "@/types/setup";
import { Delete02Icon, LockIcon, PencilEdit02Icon, ViewIcon } from "@hugeicons/core-free-icons";

/** `useTranslations("setup")`, passed in because column factories cannot call hooks. */
type TSetupTranslator = ReturnType<typeof useTranslations<"setup">>;

/** How many permission badges a row shows before "+N". */
const VISIBLE_PERMISSIONS = 3;

export const roleColumns = ({
  t,
  current_page,
  per_page,
  onClickDetail,
  onClickEdit,
  onClickDelete,
}: {
  t: TSetupTranslator;
  current_page: number;
  per_page: number;
  onClickDetail: (item: TRoleItem) => void;
  onClickEdit: (item: TRoleItem) => void;
  onClickDelete: (item: TRoleItem) => void;
}): ColumnDef<TRoleItem>[] => [
  {
    id: "no",
    enableHiding: false,
    header: t("shared.columns.no"),
    cell: ({ row }) => <p>{(current_page - 1) * per_page + row.index + 1}.</p>,
  },
  {
    accessorKey: "title",
    header: t("roles.fields.title"),
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <span className="font-medium whitespace-nowrap">{row.original.title}</span>
        {row.original.is_system && (
          <Badge variant="outline" className="gap-1">
            <HugeiconsIcon icon={LockIcon} className="size-3" />
            {t("shared.system")}
          </Badge>
        )}
      </div>
    ),
  },
  {
    accessorKey: "description",
    header: t("roles.fields.description"),
    cell: ({ row }) => (
      <p className="max-w-xs truncate text-muted-foreground" title={row.original.description ?? undefined}>
        {row.original.description || "-"}
      </p>
    ),
  },
  {
    id: "permissions",
    accessorFn: (row) => row.permission_ids?.length ?? 0,
    header: t("roles.columns.permissions"),
    cell: ({ row }) => {
      const permissions = row.original.permissions ?? [];
      const hidden = permissions.length - VISIBLE_PERMISSIONS;

      return (
        <div className="flex max-w-md flex-wrap items-center gap-1">
          <Badge variant="default" className="tabular-nums">
            {t("roles.columns.permissionCount", { count: row.original.permission_ids?.length ?? permissions.length })}
          </Badge>
          {permissions.slice(0, VISIBLE_PERMISSIONS).map((permission) => (
            <Badge key={permission.id} variant="secondary" title={permission.title}>
              {permission.label || permission.title}
            </Badge>
          ))}
          {hidden > 0 && <span className="text-xs text-muted-foreground">{t("roles.columns.more", { count: hidden })}</span>}
        </div>
      );
    },
  },
  {
    accessorKey: "users_count",
    header: t("roles.columns.users"),
    cell: ({ row }) => <p className="whitespace-nowrap tabular-nums">{t("roles.columns.userCount", { count: row.original.users_count ?? 0 })}</p>,
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
          aria-label={t("shared.actions.viewItem", { name: row.original.title })}
          onClick={() => onClickDetail(row.original)}
        >
          <HugeiconsIcon icon={ViewIcon} className="size-4 text-muted-foreground" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={t("shared.actions.editItem", { name: row.original.title })}
          onClick={() => onClickEdit(row.original)}
        >
          <HugeiconsIcon icon={PencilEdit02Icon} className="size-4 text-muted-foreground" />
        </Button>
        {!row.original.is_system && (
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
    ),
  },
];
