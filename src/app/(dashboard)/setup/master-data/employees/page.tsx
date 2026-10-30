import { useTranslations } from "next-intl";

import PageHeader from "@/components/common/page-header";
import PermissionGate from "@/components/common/permission-gate";
import { PERMISSIONS_CONSTANT } from "@/constants/permission-constant";
import EmployeeTable from "./_components/employee-table";

export default function EmployeesPage() {
  const t = useTranslations("setup.employees");

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title={t("page.title")} description={t("page.description")} />
      <PermissionGate permission={PERMISSIONS_CONSTANT.EMPLOYEES_MANAGE} title={t("page.title")}>
        <EmployeeTable />
      </PermissionGate>
    </div>
  );
}
