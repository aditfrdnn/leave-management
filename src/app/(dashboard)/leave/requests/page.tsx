import { useTranslations } from "next-intl";

import PageHeader from "@/components/common/page-header";
import LeaveRequestTable from "./_components/leave-request-table";

export default function LeaveRequestsPage() {
  const t = useTranslations("leave");

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title={t("page.title")} description={t("page.description")} />
      <LeaveRequestTable />
    </div>
  );
}
