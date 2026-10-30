import { useTranslations } from "next-intl";

import PageHeader from "@/components/common/page-header";
import PermissionGate from "@/components/common/permission-gate";
import { PERMISSIONS_CONSTANT } from "@/constants/permission-constant";
import MyAppraisals from "./_components/my-appraisals";

export default function MyAppraisalsPage() {
  const t = useTranslations("appraisal.page.my");

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title={t("title")} description={t("description")} />
      <PermissionGate permission={PERMISSIONS_CONSTANT.APPRAISAL_FILL} title={t("title")}>
        <MyAppraisals />
      </PermissionGate>
    </div>
  );
}
