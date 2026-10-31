import { getTranslations } from "next-intl/server";

import PageHeader from "@/components/common/page-header";
import PermissionGate from "@/components/common/permission-gate";
import { PERMISSIONS_CONSTANT } from "@/constants/permission-constant";
import TemplateEditor from "./_components/template-editor";

export default async function AppraisalTemplateEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = await getTranslations("setup.appraisalTemplates");

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title={t("editor.title")} description={t("editor.description")} />
      <PermissionGate permission={PERMISSIONS_CONSTANT.APPRAISAL_MANAGE_TEMPLATES} title={t("editor.title")}>
        <TemplateEditor id={id} />
      </PermissionGate>
    </div>
  );
}
