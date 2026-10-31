import { ColumnDef } from "@tanstack/react-table";
import type { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import type { TAppraisalPeriod } from "@/types/appraisal";
import { Delete02Icon, PencilEdit02Icon, SquareLock02Icon, SquareUnlock02Icon } from "@hugeicons/core-free-icons";
import { formatDay, periodRanges } from "../../_components/appraisal-format";
import { PeriodStatusBadge } from "../../_components/appraisal-status-badge";

type TAppraisalTranslator = ReturnType<typeof useTranslations<"appraisal">>;

export const periodColumns = ({
  t,
  locale,
  onClickEdit,
  onClickStatus,
  onClickDelete,
}: {
  t: TAppraisalTranslator;
  locale: string;
  onClickEdit: (item: TAppraisalPeriod) => void;
  onClickStatus: (item: TAppraisalPeriod) => void;
  onClickDelete: (item: TAppraisalPeriod) => void;
}): ColumnDef<TAppraisalPeriod>[] => {
  const joinRange = (values: { start: string; end: string }) => t("format.range", values);

  return [
    {
      accessorKey: "name",
      header: t("periods.fields.name"),
      cell: ({ row }) => (
        <div className="flex min-w-40 flex-col">
          <span className="font-medium">{row.original.name}</span>
          <span className="text-xs text-muted-foreground">
            {row.original.template.code} {row.original.template.revision}
          </span>
        </div>
      ),
    },
    {
      id: "ranges",
      header: t("periods.fields.ranges"),
      cell: ({ row }) => {
        const ranges = periodRanges(row.original, locale, joinRange);

        return (
          <div className="flex flex-col text-xs whitespace-nowrap">
            <span>
              <span className="text-muted-foreground">{t("periods.fields.review")}: </span>
              {ranges.review}
            </span>
            <span>
              <span className="text-muted-foreground">{t("periods.fields.target")}: </span>
              {ranges.target}
            </span>
          </div>
        );
      },
    },
    {
      id: "due_date",
      header: t("periods.fields.dueDate"),
      cell: ({ row }) => <p className="whitespace-nowrap">{row.original.due_date ? formatDay(row.original.due_date, locale) : t("periods.noDueDate")}</p>,
    },
    {
      id: "counts",
      header: t("periods.fields.appraisals"),
      cell: ({ row }) => {
        const { counts } = row.original;
        if (!counts) return <p className="text-muted-foreground">-</p>;

        return (
          <div className="flex flex-col">
            <span className="font-medium tabular-nums">{counts.total}</span>
            <span className="text-xs whitespace-nowrap text-muted-foreground">
              {t("periods.countsBreakdown", {
                draft: counts.draft,
                submitted: counts.submitted,
                assessed: counts.assessed,
              })}
            </span>
          </div>
        );
      },
    },
    {
      id: "status",
      header: t("periods.fields.status"),
      cell: ({ row }) => <PeriodStatusBadge status={row.original.status} />,
    },
    {
      id: "actions",
      enableHiding: false,
      header: () => <span className="sr-only">{t("columns.actions")}</span>,
      cell: ({ row }) => {
        const item = row.original;
        const isOpen = item.status === "open";
        const canDelete = !item.counts || item.counts.total === 0;

        return (
          <div className="flex items-center justify-end gap-1">
            <Button type="button" variant="ghost" size="icon-sm" aria-label={t("periods.actions.editItem", { name: item.name })} onClick={() => onClickEdit(item)}>
              <HugeiconsIcon icon={PencilEdit02Icon} className="size-4 text-muted-foreground" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={t(isOpen ? "periods.actions.closeItem" : "periods.actions.reopenItem", { name: item.name })}
              title={t(isOpen ? "periods.actions.close" : "periods.actions.reopen")}
              onClick={() => onClickStatus(item)}
            >
              <HugeiconsIcon icon={isOpen ? SquareLock02Icon : SquareUnlock02Icon} className="size-4 text-muted-foreground" />
            </Button>
            {canDelete && (
              <Button type="button" variant="ghost" size="icon-sm" aria-label={t("periods.actions.deleteItem", { name: item.name })} onClick={() => onClickDelete(item)}>
                <HugeiconsIcon icon={Delete02Icon} className="size-4 text-destructive" />
              </Button>
            )}
          </div>
        );
      },
    },
  ];
};
