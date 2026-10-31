import { ColumnDef } from "@tanstack/react-table";
import type { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { dateFormatter } from "@/lib/utils/utils";
import type { TUserItem } from "@/types/setup";
import { CheckmarkCircle02Icon, Delete02Icon, MinusSignCircleIcon, PencilEdit02Icon } from "@hugeicons/core-free-icons";

/** `useTranslations("setup")`, passed in because column factories cannot call hooks. */
type TSetupTranslator = ReturnType<typeof useTranslations<"setup">>;

export const userColumns = ({
  t,
  locale,
  current_page,
  per_page,
  currentUserId,
  onClickEdit,
  onClickDelete,
}: {
  t: TSetupTranslator;
  locale: string;
  current_page: number;
  per_page: number;
  /** The signed-in user: their own row has no delete. */
  currentUserId: string | undefined;
  onClickEdit: (item: TUserItem) => void;
  onClickDelete: (item: TUserItem) => void;
}): ColumnDef<TUserItem>[] => [
  {
    id: "no",
    enableHiding: false,
    header: t("shared.columns.no"),
    cell: ({ row }) => <p>{(current_page - 1) * per_page + row.index + 1}.</p>,
  },
  {
    accessorKey: "name",
    header: t("users.fields.name"),
    meta: { sortKey: "name" },
    cell: ({ row }) => (
      <div className="flex min-w-40 items-center gap-2">
        <span className="font-medium">{row.original.name}</span>
        {row.original.id === currentUserId && <Badge variant="outline">{t("users.columns.you")}</Badge>}
      </div>
    ),
  },
  {
    accessorKey: "email",
    header: t("users.fields.email"),
    meta: { sortKey: "email" },
    cell: ({ row }) => <p className="break-all">{row.original.email}</p>,
  },
  {
    id: "role",
    accessorFn: (row) => row.role?.title ?? "",
    header: t("users.fields.role"),
    meta: { filterKey: "role", blankLabel: t("users.columns.noRole") },
    cell: ({ row }) =>
      row.original.role ? (
        <Badge variant="secondary">{row.original.role.title}</Badge>
      ) : (
        <span className="text-xs whitespace-nowrap text-muted-foreground">{t("users.columns.noRole")}</span>
      ),
  },
  {
    id: "employee",
    accessorFn: (row) => row.employee?.name ?? "",
    header: t("users.fields.employee"),
    cell: ({ row }) => {
      const { employee } = row.original;

      if (!employee) return <span className="text-xs whitespace-nowrap text-muted-foreground">{t("users.columns.noEmployee")}</span>;

      return (
        <div className="flex min-w-36 flex-col">
          <span className="font-mono text-xs">{employee.employee_number}</span>
          <span className="text-xs text-muted-foreground">
            {[employee.position, employee.department?.alias].filter(Boolean).join(" · ") || employee.name}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: t("shared.columns.status"),
    meta: { filterKey: "status", filterLabel: (value) => t(`shared.status.${value}` as "shared.status.active") },
    cell: ({ row }) => {
      const active = row.original.status === "active";

      return (
        <Badge variant={active ? "success" : "secondary"} className="gap-1">
          <HugeiconsIcon icon={active ? CheckmarkCircle02Icon : MinusSignCircleIcon} className="size-3" />
          {t(`shared.status.${active ? "active" : "inactive"}`)}
        </Badge>
      );
    },
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
        {row.original.id !== currentUserId && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={t("shared.actions.deleteItem", { name: row.original.name })}
            onClick={() => onClickDelete(row.original)}
          >
            <HugeiconsIcon icon={Delete02Icon} className="size-4 text-destructive" />
          </Button>
        )}
      </div>
    ),
  },
];
