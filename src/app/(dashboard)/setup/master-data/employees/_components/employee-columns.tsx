import { ColumnDef } from "@tanstack/react-table";
import type { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { dateFormatter } from "@/lib/utils/utils";
import type { TActiveStatus, TEmployeeItem } from "@/types/setup";
import {
  Archive02Icon,
  ArrowTurnBackwardIcon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  Delete02Icon,
  Loading03Icon,
  MailSend01Icon,
  MinusSignCircleIcon,
  PencilEdit02Icon,
  WorkHistoryIcon,
} from "@hugeicons/core-free-icons";

/** `useTranslations("setup")`, passed in because column factories cannot call hooks. */
type TSetupTranslator = ReturnType<typeof useTranslations<"setup">>;

/** Who can be sent an IAM invitation: a current, active employee with an email who has not signed in yet. */
export const canInvite = (item: TEmployeeItem) =>
  !item.archived_at && item.status === "active" && !!item.email && item.account_status !== "active";

function StatusBadge({ t, status }: { t: TSetupTranslator; status: TActiveStatus }) {
  const active = status === "active";

  return (
    <Badge variant={active ? "success" : "secondary"} className="gap-1">
      <HugeiconsIcon icon={active ? CheckmarkCircle02Icon : MinusSignCircleIcon} className="size-3" />
      {t(`shared.status.${active ? "active" : "inactive"}`)}
    </Badge>
  );
}

/** Where the employee's sign-in stands, with the HR Lite role they hold (or will get). */
function AccountCell({ t, item }: { t: TSetupTranslator; item: TEmployeeItem }) {
  const status = item.account_status;
  const role = item.user?.role?.title;

  return (
    <div className="flex min-w-32 flex-col gap-0.5">
      <Badge
        variant={status === "active" ? "success" : status === "invited" ? "warning" : "secondary"}
        className="gap-1"
        title={item.user?.email}
      >
        <HugeiconsIcon icon={status === "active" ? CheckmarkCircle02Icon : status === "invited" ? Clock01Icon : MinusSignCircleIcon} className="size-3" />
        {t(`employees.columns.accountStatus.${status}`)}
      </Badge>
      {role && <span className="text-xs whitespace-nowrap text-muted-foreground">{role}</span>}
    </div>
  );
}

export const employeeColumns = ({
  t,
  locale,
  current_page,
  per_page,
  archived,
  onClickEdit,
  onClickCareers,
  onClickDelete,
  onClickInvite,
  onClickRestore,
  invitingId,
  restoringId,
}: {
  t: TSetupTranslator;
  locale: string;
  current_page: number;
  per_page: number;
  /** The Archive list: rows can be restored, not edited, invited or archived again. */
  archived: boolean;
  onClickEdit: (item: TEmployeeItem) => void;
  onClickCareers: (item: TEmployeeItem) => void;
  /** Deletes, or archives an employee who has an account. */
  onClickDelete: (item: TEmployeeItem) => void;
  /** New IAM activation link; offered while the employee has not signed in yet. */
  onClickInvite: (item: TEmployeeItem) => void;
  onClickRestore: (item: TEmployeeItem) => void;
  /** The employee whose invitation is being sent. */
  invitingId: string | null;
  restoringId: string | null;
}): ColumnDef<TEmployeeItem>[] => [
  ...(archived
    ? []
    : [
        {
          id: "select",
          enableHiding: false,
          header: ({ table }) => {
            const invitable = table.getRowModel().rows.filter((row) => canInvite(row.original));
            const selected = invitable.filter((row) => row.getIsSelected()).length;

            return (
              <Checkbox
                aria-label={t("employees.account.inviteSelected", { count: invitable.length })}
                disabled={invitable.length === 0}
                checked={selected === 0 ? false : selected === invitable.length ? true : "indeterminate"}
                onCheckedChange={(value) => invitable.forEach((row) => row.toggleSelected(value === true))}
              />
            );
          },
          cell: ({ row }) => (
            <Checkbox
              aria-label={t("employees.account.inviteItem", { name: row.original.name })}
              disabled={!canInvite(row.original)}
              checked={row.getIsSelected()}
              onCheckedChange={(value) => row.toggleSelected(value === true)}
            />
          ),
        } satisfies ColumnDef<TEmployeeItem>,
      ]),
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
        <span className="text-xs text-muted-foreground">
          {row.original.archived_at
            ? t("employees.archive.archivedOn", { date: dateFormatter(row.original.archived_at, locale) })
            : row.original.position || row.original.email || "-"}
        </span>
      </div>
    ),
  },
  {
    id: "department",
    accessorFn: (row) => row.department?.name ?? "",
    header: t("employees.fields.department"),
    meta: { filterKey: "department" },
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
    meta: { filterKey: "supervisor" },
    cell: ({ row }) => <p className="whitespace-nowrap">{row.original.supervisor?.name ?? "-"}</p>,
  },
  {
    accessorKey: "employment_type",
    header: t("employees.fields.employmentType"),
    meta: { filterKey: "employment_type", filterLabel: (value) => t(`employees.employmentTypes.${value}` as "employees.employmentTypes.permanent") },
    cell: ({ row }) => <Badge variant="secondary">{t(`employees.employmentTypes.${row.original.employment_type}`)}</Badge>,
  },
  {
    accessorKey: "grade",
    header: t("employees.fields.grade"),
    meta: { filterKey: "grade", filterLabel: (value) => t("employees.careers.grade", { grade: value }) },
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
    meta: { filterKey: "status", filterLabel: (value) => t(`shared.status.${value}` as "shared.status.active") },
    cell: ({ row }) => <StatusBadge t={t} status={row.original.status} />,
  },
  {
    id: "account",
    accessorFn: (row) => row.account_status,
    header: t("employees.columns.account"),
    cell: ({ row }) => <AccountCell t={t} item={row.original} />,
  },
  {
    id: "actions",
    enableHiding: false,
    header: () => <span className="sr-only">{t("shared.columns.actions")}</span>,
    cell: ({ row }) => {
      const item = row.original;
      const hasAccount = item.user !== null;

      if (archived) {
        return (
          <div className="flex items-center justify-end gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              title={t("employees.careers.title")}
              aria-label={t("employees.careers.showItem", { name: item.name })}
              onClick={() => onClickCareers(item)}
            >
              <HugeiconsIcon icon={WorkHistoryIcon} className="size-4 text-muted-foreground" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              aria-label={t("employees.archive.restoreItem", { name: item.name })}
              disabled={restoringId !== null}
              onClick={() => onClickRestore(item)}
            >
              <HugeiconsIcon
                icon={restoringId === item.id ? Loading03Icon : ArrowTurnBackwardIcon}
                className={restoringId === item.id ? "size-4 animate-spin" : "size-4"}
              />
              {t("employees.archive.restore")}
            </Button>
          </div>
        );
      }

      return (
        <div className="flex items-center justify-end gap-1">
          {canInvite(item) && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              title={item.account_status === "none" ? t("employees.account.invite") : t("employees.account.resend")}
              aria-label={
                item.account_status === "none"
                  ? t("employees.account.inviteItem", { name: item.name })
                  : t("employees.account.resendItem", { name: item.name })
              }
              disabled={invitingId !== null}
              onClick={() => onClickInvite(item)}
            >
              <HugeiconsIcon
                icon={invitingId === item.id ? Loading03Icon : MailSend01Icon}
                className={invitingId === item.id ? "size-4 animate-spin text-muted-foreground" : "size-4 text-muted-foreground"}
              />
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            title={t("employees.careers.title")}
            aria-label={t("employees.careers.showItem", { name: item.name })}
            onClick={() => onClickCareers(item)}
          >
            <HugeiconsIcon icon={WorkHistoryIcon} className="size-4 text-muted-foreground" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={t("shared.actions.editItem", { name: item.name })}
            onClick={() => onClickEdit(item)}
          >
            <HugeiconsIcon icon={PencilEdit02Icon} className="size-4 text-muted-foreground" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            title={hasAccount ? t("employees.archive.confirm") : undefined}
            aria-label={hasAccount ? t("employees.archive.archiveItem", { name: item.name }) : t("shared.actions.deleteItem", { name: item.name })}
            onClick={() => onClickDelete(item)}
          >
            <HugeiconsIcon icon={hasAccount ? Archive02Icon : Delete02Icon} className="size-4 text-destructive" />
          </Button>
        </div>
      );
    },
  },
];
