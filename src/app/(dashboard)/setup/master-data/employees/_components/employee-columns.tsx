import { ColumnDef } from "@tanstack/react-table";
import type { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { dateFormatter } from "@/lib/utils/utils";
import type { TActiveStatus, TEmployeeItem } from "@/types/setup";
import {
  CheckmarkCircle02Icon,
  Delete02Icon,
  Link01Icon,
  MinusSignCircleIcon,
  PencilEdit02Icon,
  WorkHistoryIcon,
} from "@hugeicons/core-free-icons";

/** `useTranslations("setup")`, passed in because column factories cannot call hooks. */
type TSetupTranslator = ReturnType<typeof useTranslations<"setup">>;

function StatusBadge({ t, status }: { t: TSetupTranslator; status: TActiveStatus }) {
  const active = status === "active";

  return (
    <Badge variant={active ? "success" : "secondary"} className="gap-1">
      <HugeiconsIcon icon={active ? CheckmarkCircle02Icon : MinusSignCircleIcon} className="size-3" />
      {t(`shared.status.${active ? "active" : "inactive"}`)}
    </Badge>
  );
}

export const employeeColumns = ({
  t,
  locale,
  current_page,
  per_page,
  onClickEdit,
  onClickCareers,
  onClickDelete,
}: {
  t: TSetupTranslator;
  locale: string;
  current_page: number;
  per_page: number;
  onClickEdit: (item: TEmployeeItem) => void;
  onClickCareers: (item: TEmployeeItem) => void;
  onClickDelete: (item: TEmployeeItem) => void;
}): ColumnDef<TEmployeeItem>[] => [
  {
    id: "no",
    enableHiding: false,
    header: t("shared.columns.no"),
    cell: ({ row }) => <p>{(current_page - 1) * per_page + row.index + 1}.</p>,
  },
  {
    accessorKey: "employee_number",
    header: t("employees.fields.employeeNumber"),
    meta: { sortKey: "employee_number" },
    cell: ({ row }) => <p className="font-mono text-xs whitespace-nowrap">{row.original.employee_number}</p>,
  },
  {
    accessorKey: "name",
    header: t("employees.fields.name"),
    meta: { sortKey: "name" },
    cell: ({ row }) => (
      <div className="flex min-w-40 flex-col">
        <span className="font-medium">{row.original.name}</span>
        <span className="text-xs text-muted-foreground">{row.original.position || row.original.email || "-"}</span>
      </div>
    ),
  },
  {
    id: "department",
    accessorFn: (row) => row.department?.name ?? "",
    header: t("employees.fields.department"),
    cell: ({ row }) =>
      row.original.department ? (
        <span className="whitespace-nowrap" title={row.original.department.name}>
          {row.original.department.alias || row.original.department.name}
        </span>
      ) : (
        <span className="text-muted-foreground">-</span>
      ),
  },
  {
    id: "supervisor",
    accessorFn: (row) => row.supervisor?.name ?? "",
    header: t("employees.fields.supervisor"),
    cell: ({ row }) => <p className="whitespace-nowrap">{row.original.supervisor?.name ?? "-"}</p>,
  },
  {
    accessorKey: "employment_type",
    header: t("employees.fields.employmentType"),
    cell: ({ row }) => <Badge variant="secondary">{t(`employees.employmentTypes.${row.original.employment_type}`)}</Badge>,
  },
  {
    accessorKey: "grade",
    header: t("employees.fields.grade"),
    cell: ({ row }) =>
      row.original.grade != null ? (
        <span className="whitespace-nowrap tabular-nums">{t("employees.careers.grade", { grade: row.original.grade })}</span>
      ) : (
        <span className="text-muted-foreground">-</span>
      ),
  },
  {
    accessorKey: "join_date",
    header: t("employees.fields.joinDate"),
    meta: { sortKey: "join_date" },
    cell: ({ row }) => <p className="whitespace-nowrap">{row.original.join_date ? dateFormatter(row.original.join_date, locale) : "-"}</p>,
  },
  {
    accessorKey: "status",
    header: t("shared.columns.status"),
    cell: ({ row }) => <StatusBadge t={t} status={row.original.status} />,
  },
  {
    id: "account",
    accessorFn: (row) => row.user?.email ?? "",
    header: t("employees.columns.account"),
    cell: ({ row }) =>
      row.original.user ? (
        <Badge variant="default" className="gap-1" title={row.original.user.email}>
          <HugeiconsIcon icon={Link01Icon} className="size-3" />
          {row.original.user.role?.title ?? t("employees.columns.linked")}
        </Badge>
      ) : (
        <span className="text-xs whitespace-nowrap text-muted-foreground">{t("employees.columns.notLinked")}</span>
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
          title={t("employees.careers.title")}
          aria-label={t("employees.careers.showItem", { name: row.original.name })}
          onClick={() => onClickCareers(row.original)}
        >
          <HugeiconsIcon icon={WorkHistoryIcon} className="size-4 text-muted-foreground" />
        </Button>
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
