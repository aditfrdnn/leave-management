import { redirect } from "next/navigation";

/** The module root has no screen of its own; the breadcrumb and old links land on the leave dashboard. */
export default function LeaveIndexPage() {
  redirect("/leave/dashboard");
}
