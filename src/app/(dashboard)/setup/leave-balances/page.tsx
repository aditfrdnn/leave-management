import { useTranslations } from "next-intl";

import PageHeader from "@/components/common/page-header";
import PermissionGate from "@/components/common/permission-gate";
import { PERMISSIONS_CONSTANT } from "@/constants/permission-constant";
import LeaveBalanceTable from "./_components/leave-balance-table";

export default function LeaveBalancesPage() {
  const t = useTranslations("setup.leaveBalances");

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title={t("page.title")} description={t("page.description")} />
      <PermissionGate permission={PERMISSIONS_CONSTANT.LEAVE_MANAGE_BALANCE} title={t("page.title")}>
        <LeaveBalanceTable />
      </PermissionGate>
    </div>
  );
}
