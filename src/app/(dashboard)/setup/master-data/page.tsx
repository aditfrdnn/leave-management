import { redirect } from "next/navigation";

/** The breadcrumb links "Master Data"; it has no screen of its own, so open the first one. */
export default function MasterDataPage() {
  redirect("/setup/master-data/employees");
}
