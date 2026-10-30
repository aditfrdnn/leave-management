import { useTranslations } from "next-intl";

import PageHeader from "@/components/common/page-header";
import PermissionGate from "@/components/common/permission-gate";
import { PERMISSIONS_CONSTANT } from "@/constants/permission-constant";
import AppraisalTemplateTable from "./_components/appraisal-template-table";

export default function AppraisalTemplatesPage() {
  const t = useTranslations("setup.appraisalTemplates");

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title={t("page.title")} description={t("page.description")} />
      <PermissionGate permission={PERMISSIONS_CONSTANT.APPRAISAL_MANAGE_TEMPLATES} title={t("page.title")}>
        <AppraisalTemplateTable />
      </PermissionGate>
    </div>
  );
}
