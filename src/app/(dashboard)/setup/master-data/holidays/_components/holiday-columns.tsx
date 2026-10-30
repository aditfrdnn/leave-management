import { ColumnDef } from "@tanstack/react-table";
import { parse } from "date-fns";
import type { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import type { THolidayItem } from "@/types/setup";
import { Delete02Icon, PencilEdit02Icon } from "@hugeicons/core-free-icons";

type TSetupTranslator = ReturnType<typeof useTranslations<"setup">>;

export const holidayColumns = ({
  t,
  locale,
  onClickEdit,
  onClickDelete,
}: {
  t: TSetupTranslator;
  locale: string;
  onClickEdit: (item: THolidayItem) => void;
  onClickDelete: (item: THolidayItem) => void;
}): ColumnDef<THolidayItem>[] => {
  const intl = locale === "id" ? "id-ID" : "en-GB";
  const dayMonth = new Intl.DateTimeFormat(intl, { day: "numeric", month: "short" });
  const weekday = new Intl.DateTimeFormat(intl, { weekday: "long" });

  return [
    {
      accessorKey: "date",
      header: t("holidays.fields.date"),
      meta: { sortKey: "date" },
      cell: ({ row }) => {
        const date = parse(row.original.date, "yyyy-MM-dd", new Date());

        return (
          <div className="flex flex-col">
            <span className="font-medium whitespace-nowrap tabular-nums">{dayMonth.format(date)}</span>
            <span className="text-xs text-muted-foreground">{weekday.format(date)}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "name",
      header: t("holidays.fields.name"),
      meta: { sortKey: "name" },
      cell: ({ row }) => (
        <div className="flex max-w-md flex-col">
          <span className="font-medium">{row.original.name}</span>
          {row.original.description && <span className="truncate text-xs text-muted-foreground">{row.original.description}</span>}
        </div>
      ),
    },
    {
      id: "type",
      header: t("holidays.fields.type"),
      cell: ({ row }) =>
        row.original.is_mass_leave ? (
          <Badge variant="outline" className="border-none bg-yellow/12 text-yellow-strong">
            {t("holidays.types.mass_leave")}
          </Badge>
        ) : (
          <Badge variant="outline" className="border-none bg-destructive/10 text-destructive">
            {t("holidays.types.public")}
          </Badge>
        ),
    },
    {
      id: "actions",
      enableHiding: false,
      header: () => <span className="sr-only">{t("shared.columns.actions")}</span>,
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          <Button type="button" variant="ghost" size="icon-sm" aria-label={t("shared.actions.editItem", { name: row.original.name })} onClick={() => onClickEdit(row.original)}>
            <HugeiconsIcon icon={PencilEdit02Icon} className="size-4 text-muted-foreground" />
          </Button>
          <Button type="button" variant="ghost" size="icon-sm" aria-label={t("shared.actions.deleteItem", { name: row.original.name })} onClick={() => onClickDelete(row.original)}>
            <HugeiconsIcon icon={Delete02Icon} className="size-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];
};
