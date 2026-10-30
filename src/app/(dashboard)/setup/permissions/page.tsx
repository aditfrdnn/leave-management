import { useTranslations } from "next-intl";

import PageHeader from "@/components/common/page-header";
import PermissionGate from "@/components/common/permission-gate";
import { PERMISSIONS_CONSTANT } from "@/constants/permission-constant";
import PermissionTable from "./_components/permission-table";

export default function PermissionsPage() {
  const t = useTranslations("setup.permissions");

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title={t("page.title")} description={t("page.description")} />
      <PermissionGate permission={PERMISSIONS_CONSTANT.ROLES_MANAGE} title={t("page.title")}>
        <PermissionTable />
      </PermissionGate>
    </div>
  );
}
