import { useTranslations } from "next-intl";

import PageHeader from "@/components/common/page-header";
import PermissionGate from "@/components/common/permission-gate";
import { PERMISSIONS_CONSTANT } from "@/constants/permission-constant";
import HolidayTable from "./_components/holiday-table";

export default function HolidaysPage() {
  const t = useTranslations("setup.holidays");

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title={t("page.title")} description={t("page.description")} />
      <PermissionGate permission={PERMISSIONS_CONSTANT.HOLIDAYS_MANAGE} title={t("page.title")}>
        <HolidayTable />
      </PermissionGate>
    </div>
  );
}
