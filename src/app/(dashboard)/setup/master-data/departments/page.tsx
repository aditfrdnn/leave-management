import { useTranslations } from "next-intl";

import PageHeader from "@/components/common/page-header";
import PermissionGate from "@/components/common/permission-gate";
import { PERMISSIONS_CONSTANT } from "@/constants/permission-constant";
import DepartmentTable from "./_components/department-table";

export default function DepartmentsPage() {
  const t = useTranslations("setup.departments");

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title={t("page.title")} description={t("page.description")} />
      <PermissionGate permission={PERMISSIONS_CONSTANT.DEPARTMENTS_MANAGE} title={t("page.title")}>
        <DepartmentTable />
      </PermissionGate>
    </div>
  );
}
