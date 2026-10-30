import { useLocale, useTranslations } from "next-intl";

import { Card, CardContent } from "@/components/ui/card";
import type { TAppraisalDetail } from "@/types/appraisal";
import { formatDay } from "../../_components/appraisal-format";
import { AppraisalStatusBadge } from "../../_components/appraisal-status-badge";

/** Who is assessed by whom, in which period: the form's header block (snapshot first, live data as fallback). */
export default function AppraisalHeader({ detail, ranges }: { detail: TAppraisalDetail; ranges: { review: string; target: string } }) {
  const t = useTranslations("appraisal.form.header");
  const locale = useLocale();
  const employee = detail.snapshot?.employee;
  const assessor = detail.snapshot?.assessor;

  const rows: { label: string; value: string }[] = [
    { label: t("employee"), value: employee?.name ?? detail.employee.name },
    { label: t("employeeNumber"), value: employee?.employee_number ?? detail.employee.employee_number },
    { label: t("position"), value: employee?.position ?? detail.employee.position ?? "-" },
    { label: t("department"), value: employee?.department ?? detail.employee.department?.name ?? "-" },
    { label: t("assessor"), value: assessor?.name ?? detail.assessor?.name ?? "-" },
    { label: t("assessorPosition"), value: assessor?.position ?? "-" },
    { label: t("reviewPeriod"), value: ranges.review },
    { label: t("targetPeriod"), value: ranges.target },
    { label: t("dueDate"), value: formatDay(detail.period.due_date, locale) },
  ];

  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex min-w-0 flex-col">
            <p className="type-overline text-muted-foreground">
              {detail.template.code} {detail.template.revision}
            </p>
            <h2 className="type-heading">{detail.template.schema.title}</h2>
            <p className="text-sm text-muted-foreground">{detail.period.name}</p>
          </div>
          <AppraisalStatusBadge status={detail.status} />
        </div>
        <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((row) => (
            <div key={row.label} className="flex min-w-0 flex-col">
              <dt className="text-xs text-muted-foreground">{row.label}</dt>
              <dd className="text-sm font-medium break-words">{row.value}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}
