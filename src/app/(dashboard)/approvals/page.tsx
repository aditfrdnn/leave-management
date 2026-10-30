import { useTranslations } from "next-intl";

import PageHeader from "@/components/common/page-header";
import PermissionGate from "@/components/common/permission-gate";
import { PERMISSIONS_CONSTANT } from "@/constants/permission-constant";
import ApprovalTable from "./_components/approval-table";

export default function ApprovalsPage() {
  const t = useTranslations("leave.approvals");

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title={t("page.title")} description={t("page.description")} />
      <PermissionGate permission={PERMISSIONS_CONSTANT.LEAVE_APPROVE} title={t("page.title")}>
        <ApprovalTable />
      </PermissionGate>
    </div>
  );
}
