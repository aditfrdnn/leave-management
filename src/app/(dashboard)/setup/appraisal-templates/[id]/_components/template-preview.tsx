"use client";

import { useTranslations } from "next-intl";
import { useWatch } from "react-hook-form";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { AppraisalTemplateSchemaType } from "@/validations/appraisal-template-validations";
import type { TTemplateForm } from "./editor-fields";

type TSection = AppraisalTemplateSchemaType["schema"]["sections"][number];

/** Read-only rendering of the form as it stands, so HR can check the result before saving. */
export default function TemplatePreview({ form }: { form: TTemplateForm }) {
  const t = useTranslations("setup.appraisalTemplates");
  const values = useWatch({ control: form.control }) as AppraisalTemplateSchemaType;
  const sections = values.schema?.sections ?? [];

  const fillPeriods = (text: string | undefined) =>
    (text ?? "").replaceAll("{review_period}", t("preview.sampleReview")).replaceAll("{target_period}", t("preview.sampleTarget"));

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="flex min-w-0 flex-col gap-1 text-center">
        <p className="text-xs text-muted-foreground">
          {[values.code, values.revision].filter(Boolean).join(" · ")}
        </p>
        <h2 className="type-heading break-words">{values.schema?.title || "-"}</h2>
        <p className="text-xs text-muted-foreground">{t("preview.sampleNote")}</p>
      </div>

      {sections.length === 0 && <p className="text-sm text-muted-foreground">{t("preview.empty")}</p>}

      {sections.map((section, index) => (
        <Card key={index} className="min-w-0 gap-3">
          <CardHeader className="flex min-w-0 flex-col gap-1 px-4 sm:px-6">
            <span className="type-overline text-muted-foreground">{t("editor.sections.number", { number: index + 1 })}</span>
            <h3 className="type-section-title break-words">{fillPeriods(section.title) || "-"}</h3>
            {section.instructions && <p className="text-sm whitespace-pre-line text-muted-foreground">{fillPeriods(section.instructions)}</p>}
          </CardHeader>
          <CardContent className="min-w-0 px-4 sm:px-6">
            <SectionPreview section={section} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ScaleChips({ scale }: { scale?: { label: string }[] }) {
  return (
    <ol className="flex flex-wrap gap-1.5">
      {(scale ?? []).map((level, index) => (
        <li key={index}>
          <Badge variant="outline" className="gap-1">
            <span className="tabular-nums">{index + 1}</span>
            {level.label || "-"}
          </Badge>
        </li>
      ))}
    </ol>
  );
}

function SectionPreview({ section }: { section: TSection }) {
  const t = useTranslations("setup.appraisalTemplates");

  switch (section.kind) {
    case "rating":
      return (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full min-w-200 border-collapse text-sm">
            <caption className="sr-only">{section.title}</caption>
            <thead className="bg-muted/50 text-left text-xs">
              <tr>
                <th scope="col" className="w-56 px-3 py-2 font-medium">
                  {t("preview.item")}
                </th>
                {(section.scale ?? []).map((level, index) => (
                  <th key={index} scope="col" className="px-3 py-2 align-bottom font-medium">
                    <span className="block text-muted-foreground tabular-nums">{index + 1}</span>
                    {level.label || "-"}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(section.items ?? []).map((item, index) => (
                <tr key={index} className="border-t align-top">
                  <th scope="row" className="px-3 py-2 text-left font-normal">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-medium">{item.title || "-"}</span>
                      {item.code && <span className="font-mono text-xs text-muted-foreground">({item.code})</span>}
                      {item.audience === "leaders" && <Badge variant="warning">{t("editor.items.audience.leaders")}</Badge>}
                    </div>
                    {(item.points ?? []).some((point) => point.trim()) && (
                      <ul className="mt-1 list-disc pl-4 text-xs text-muted-foreground">
                        {item.points
                          .filter((point) => point.trim())
                          .map((point, pointIndex) => (
                            <li key={pointIndex}>{point}</li>
                          ))}
                      </ul>
                    )}
                  </th>
                  {(section.scale ?? []).map((_, level) => (
                    <td key={level} className="px-3 py-2 text-xs whitespace-pre-line text-muted-foreground">
                      {item.levels?.[level] || "-"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "kpi_review":
      return (
        <div className="flex flex-col gap-2">
          <ScaleChips scale={section.scale} />
          <p className="text-sm text-muted-foreground">{t("preview.kpiReview", { min: section.min_rows, max: section.max_rows })}</p>
        </div>
      );
    case "kpi_target":
      return <p className="text-sm text-muted-foreground">{t("preview.kpiTarget", { min: section.min_rows, max: section.max_rows })}</p>;
    case "text":
      return (
        <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {(section.fields ?? []).map((field, index) => (
            <div key={index} className="flex min-w-0 flex-col gap-1 rounded-lg border p-3">
                <dt className="flex flex-wrap items-center justify-between gap-2 text-sm font-medium">
                  <span className="break-words">{field.label || "-"}</span>
                  <Badge variant="secondary">{t(`editor.fields.filledBy.${field.filled_by}`)}</Badge>
                </dt>
                <dd className="h-12 rounded-md border border-dashed" aria-hidden />
            </div>
          ))}
        </dl>
      );
    default:
      return null;
  }
}
