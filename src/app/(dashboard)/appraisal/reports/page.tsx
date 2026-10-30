import { useTranslations } from "next-intl";

import PageHeader from "@/components/common/page-header";
import PermissionGate from "@/components/common/permission-gate";
import { PERMISSIONS_CONSTANT } from "@/constants/permission-constant";
import AppraisalReportTable from "./_components/appraisal-report-table";

export default function AppraisalReportsPage() {
  const t = useTranslations("appraisal.page.reports");

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title={t("title")} description={t("description")} />
      <PermissionGate permission={PERMISSIONS_CONSTANT.APPRAISAL_VIEW_ALL} title={t("title")}>
        <AppraisalReportTable />
      </PermissionGate>
    </div>
  );
}
