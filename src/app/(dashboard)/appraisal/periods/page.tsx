import { useTranslations } from "next-intl";

import PageHeader from "@/components/common/page-header";
import PermissionGate from "@/components/common/permission-gate";
import { PERMISSIONS_CONSTANT } from "@/constants/permission-constant";
import PeriodTable from "./_components/period-table";

export default function AppraisalPeriodsPage() {
  const t = useTranslations("appraisal.page.periods");

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title={t("title")} description={t("description")} />
      <PermissionGate permission={PERMISSIONS_CONSTANT.APPRAISAL_MANAGE_PERIODS} title={t("title")}>
        <PeriodTable />
      </PermissionGate>
    </div>
  );
}
