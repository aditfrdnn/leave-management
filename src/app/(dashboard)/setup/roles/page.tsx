import { useTranslations } from "next-intl";

import PageHeader from "@/components/common/page-header";
import PermissionGate from "@/components/common/permission-gate";
import { PERMISSIONS_CONSTANT } from "@/constants/permission-constant";
import RoleTable from "./_components/role-table";

export default function RolesPage() {
  const t = useTranslations("setup.roles");

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title={t("page.title")} description={t("page.description")} />
      <PermissionGate permission={PERMISSIONS_CONSTANT.ROLES_MANAGE} title={t("page.title")}>
        <RoleTable />
      </PermissionGate>
    </div>
  );
}
