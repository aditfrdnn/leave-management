import { notFound } from "next/navigation";

import { uuidSchema } from "@/validations/id-validations";

import AppraisalForm from "./_components/appraisal-form";

/** The appraisal form; access is decided by the API (owner, assessor or `appraisal.view_all`), a 403 shows the error state. */
export default async function AppraisalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!uuidSchema.safeParse(id).success) notFound();

  return <AppraisalForm id={id} />;
}
