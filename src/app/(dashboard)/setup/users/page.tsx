import { useTranslations } from "next-intl";

import PageHeader from "@/components/common/page-header";
import PermissionGate from "@/components/common/permission-gate";
import { PERMISSIONS_CONSTANT } from "@/constants/permission-constant";
import UserTable from "./_components/user-table";

export default function UsersPage() {
  const t = useTranslations("setup.users");

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title={t("page.title")} description={t("page.description")} />
      <PermissionGate permission={PERMISSIONS_CONSTANT.USERS_MANAGE} title={t("page.title")}>
        <UserTable />
      </PermissionGate>
    </div>
  );
}
