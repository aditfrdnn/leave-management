import { useTranslations } from "next-intl";

import PageHeader from "@/components/common/page-header";
import LeaveRequestForm from "./_components/leave-request-form";
import LeaveRequestTable from "./_components/leave-request-table";

export default function LeaveRequestsPage() {
  const t = useTranslations("leave");

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title={t("page.title")} description={t("page.description")} />
      <div className="grid min-w-0 items-start gap-4 xl:grid-cols-5">
        <div className="min-w-0 xl:col-span-2">
          <LeaveRequestForm />
        </div>
        <div className="min-w-0 xl:col-span-3">
          <LeaveRequestTable />
        </div>
      </div>
    </div>
  );
}
