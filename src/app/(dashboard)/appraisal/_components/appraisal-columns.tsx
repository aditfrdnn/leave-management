import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import type { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { appraisalPdf } from "@/constants/endpoint-constant";
import { dateFormatter } from "@/lib/utils/utils";
import type { TAppraisalItem } from "@/types/appraisal";
import { Download04Icon, ViewIcon } from "@hugeicons/core-free-icons";
import { AppraisalStatusBadge } from "./appraisal-status-badge";

type TAppraisalTranslator = ReturnType<typeof useTranslations<"appraisal">>;

/**
 * Columns shared by My, Team and Reports. `showEmployee` lists whose appraisal it is (team/all);
 * `showPdf` adds the download next to "View".
 */
export const appraisalColumns = ({
  t,
  locale,
  current_page,
  per_page,
  showEmployee,
  showAssessor,
  showPdf,
}: {
  t: TAppraisalTranslator;
  locale: string;
  current_page: number;
  per_page: number;
  showEmployee: boolean;
  showAssessor: boolean;
  showPdf: boolean;
}): ColumnDef<TAppraisalItem>[] => {
  const columns: ColumnDef<TAppraisalItem>[] = [
    {
      id: "no",
      enableHiding: false,
      header: t("columns.no"),
      cell: ({ row }) => <p>{(current_page - 1) * per_page + row.index + 1}.</p>,
    },
  ];

  if (showEmployee) {
    columns.push({
      id: "employee",
      header: t("columns.employee"),
      cell: ({ row }) => {
        const { employee } = row.original;

        return (
          <div className="flex min-w-40 flex-col">
            <span className="font-medium">{employee.name}</span>
            <span className="text-xs text-muted-foreground">
              {[employee.employee_number, employee.position, employee.department?.alias].filter(Boolean).join(" · ")}
            </span>
          </div>
        );
      },
    });
  }

  columns.push({
    id: "period",
    header: t("columns.period"),
    cell: ({ row }) => <p className="font-medium whitespace-nowrap">{row.original.period.name}</p>,
  });

  if (showAssessor) {
    columns.push({
      id: "assessor",
      header: t("columns.assessor"),
      cell: ({ row }) => <p className="whitespace-nowrap">{row.original.assessor?.name ?? "-"}</p>,
    });
  }

  columns.push(
    {
      id: "status",
      header: t("columns.status"),
      cell: ({ row }) => <AppraisalStatusBadge status={row.original.status} />,
    },
    {
      id: "updated_at",
      header: t("columns.lastActivity"),
      cell: ({ row }) => {
        const { assessed_at, submitted_at, updated_at } = row.original;

        return <p className="whitespace-nowrap">{dateFormatter(assessed_at ?? submitted_at ?? updated_at, locale)}</p>;
      },
    },
    {
      id: "actions",
      enableHiding: false,
      header: () => <span className="sr-only">{t("columns.actions")}</span>,
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          {/* The API refuses the PDF to the appraised employee (e.g. HR viewing their own row). */}
          {showPdf && row.original.can_download !== false && (
            <Button asChild variant="ghost" size="sm">
              <a href={appraisalPdf(row.original.id)} target="_blank" rel="noopener noreferrer" aria-label={t("list.downloadPdfFor", { name: row.original.employee.name })}>
                <HugeiconsIcon icon={Download04Icon} className="size-4 text-muted-foreground" />
                <span className="hidden sm:inline">{t("list.downloadPdf")}</span>
              </a>
            </Button>
          )}
          <Button asChild variant="ghost" size="sm">
            <Link href={`/appraisal/${row.original.id}`} aria-label={t("list.viewFor", { name: row.original.employee.name })}>
              <HugeiconsIcon icon={ViewIcon} className="size-4 text-muted-foreground" />
              <span className="hidden sm:inline">{t("list.view")}</span>
            </Link>
          </Button>
        </div>
      ),
    },
  );

  return columns;
};
