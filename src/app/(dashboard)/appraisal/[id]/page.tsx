import { notFound } from "next/navigation";

import AppraisalForm from "./_components/appraisal-form";

/** The appraisal form; access is decided by the API (owner, assessor or `appraisal.view_all`), a 403 shows the error state. */
export default async function AppraisalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!/^\d+$/.test(id)) notFound();

  return <AppraisalForm id={Number(id)} />;
}
