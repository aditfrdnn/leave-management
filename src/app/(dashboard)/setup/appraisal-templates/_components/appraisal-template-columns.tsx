import { ColumnDef } from "@tanstack/react-table";
import type { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { dateFormatter } from "@/lib/utils/utils";
import type { TAppraisalTemplateItem } from "@/types/appraisal";
import { CheckmarkCircle02Icon, Copy01Icon, Delete02Icon, LockIcon, MinusSignCircleIcon, PencilEdit02Icon } from "@hugeicons/core-free-icons";

type TSetupTranslator = ReturnType<typeof useTranslations<"setup">>;

export const appraisalTemplateColumns = ({
  t,
  locale,
  current_page,
  per_page,
  busyId,
  onClickEdit,
  onClickDuplicate,
  onClickDelete,
}: {
  t: TSetupTranslator;
  locale: string;
  current_page: number;
  per_page: number;
  /** The row whose duplicate is in flight; its buttons are disabled. */
  busyId: number | null;
  onClickEdit: (item: TAppraisalTemplateItem) => void;
  onClickDuplicate: (item: TAppraisalTemplateItem) => void;
  onClickDelete: (item: TAppraisalTemplateItem) => void;
}): ColumnDef<TAppraisalTemplateItem>[] => [
  {
    id: "no",
    enableHiding: false,
    header: t("shared.columns.no"),
    cell: ({ row }) => <p>{(current_page - 1) * per_page + row.index + 1}.</p>,
  },
  {
    accessorKey: "code",
    header: t("appraisalTemplates.fields.code"),
    cell: ({ row }) => <span className="font-mono text-xs whitespace-nowrap">{row.original.code}</span>,
  },
  {
    accessorKey: "name",
    header: t("appraisalTemplates.fields.name"),
    cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
  },
  {
    accessorKey: "revision",
    header: t("appraisalTemplates.fields.revision"),
    cell: ({ row }) => <span className="whitespace-nowrap">{row.original.revision}</span>,
  },
  {
    accessorKey: "is_active",
    header: t("shared.columns.status"),
    cell: ({ row }) => {
      const active = row.original.is_active;

      return (
        <Badge variant={active ? "success" : "secondary"} className="gap-1">
          <HugeiconsIcon icon={active ? CheckmarkCircle02Icon : MinusSignCircleIcon} className="size-3" />
          {t(`shared.status.${active ? "active" : "inactive"}`)}
        </Badge>
      );
    },
  },
  {
    accessorKey: "periods_count",
    header: t("appraisalTemplates.columns.usage"),
    cell: ({ row }) =>
      row.original.periods_count > 0 ? (
        <Badge variant="outline" className="gap-1 whitespace-nowrap">
          <HugeiconsIcon icon={LockIcon} className="size-3" />
          {t("appraisalTemplates.columns.usedBy", { count: row.original.periods_count })}
        </Badge>
      ) : (
        <span className="text-xs whitespace-nowrap text-muted-foreground">{t("appraisalTemplates.columns.unused")}</span>
      ),
  },
  {
    accessorKey: "updated_at",
    header: t("appraisalTemplates.columns.updatedAt"),
    cell: ({ row }) => <span className="whitespace-nowrap tabular-nums">{dateFormatter(row.original.updated_at, locale)}</span>,
  },
  {
    id: "actions",
    enableHiding: false,
    header: () => <span className="sr-only">{t("shared.columns.actions")}</span>,
    cell: ({ row }) => {
      const name = `${row.original.code} ${row.original.revision}`;
      const busy = busyId === row.original.id;

      return (
        <div className="flex items-center justify-end gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={t("shared.actions.editItem", { name })}
            title={t("shared.actions.editItem", { name })}
            onClick={() => onClickEdit(row.original)}
          >
            <HugeiconsIcon icon={PencilEdit02Icon} className="size-4 text-muted-foreground" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={busyId !== null}
            aria-busy={busy}
            aria-label={t("appraisalTemplates.actions.duplicateItem", { name })}
            title={t("appraisalTemplates.actions.duplicateItem", { name })}
            onClick={() => onClickDuplicate(row.original)}
          >
            <HugeiconsIcon icon={Copy01Icon} className="size-4 text-muted-foreground" />
          </Button>
          {row.original.periods_count === 0 && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={t("shared.actions.deleteItem", { name })}
              title={t("shared.actions.deleteItem", { name })}
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
