import { useTranslations } from "next-intl";

import PageHeader from "@/components/common/page-header";
import PermissionGate from "@/components/common/permission-gate";
import { PERMISSIONS_CONSTANT } from "@/constants/permission-constant";
import TeamAppraisalTable from "./_components/team-appraisal-table";

export default function TeamAppraisalsPage() {
  const t = useTranslations("appraisal.page.team");

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title={t("title")} description={t("description")} />
      <PermissionGate permission={PERMISSIONS_CONSTANT.APPRAISAL_ASSESS} title={t("title")}>
        <TeamAppraisalTable />
      </PermissionGate>
    </div>
  );
}
