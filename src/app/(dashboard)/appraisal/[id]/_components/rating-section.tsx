"use client";

import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { Separator } from "@/components/ui/separator";
import type { TRatingAnswer } from "@/types/appraisal";
import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { isApplicable, looseSectionErrors, type TAnswerErrors, type TRatingSection } from "./answers";
import RatingControl from "./rating-control";
import SectionCard from "./section-card";

/** Bagian I–III: per item the code, title and points, then self and final ratings side by side. */
export default function RatingSection({
  section,
  title,
  instructions,
  value,
  onChange,
  isLeader,
  selfEditable,
  finalEditable,
  showFinal,
  errors,
}: {
  section: TRatingSection;
  title: string;
  instructions: string;
  value: Record<string, TRatingAnswer>;
  onChange: (itemKey: string, side: keyof TRatingAnswer, rating: number) => void;
  isLeader: boolean;
  selfEditable: boolean;
  finalEditable: boolean;
  /** The employee sees the assessor's rating only once the assessment is done. */
  showFinal: boolean;
  errors: TAnswerErrors;
}) {
  const t = useTranslations("appraisal.form.rating");
  const items = section.items.filter((item) => isApplicable(item, isLeader));
  const itemKeys = new Set(items.map((item) => item.key));

  return (
    <SectionCard id={section.key} title={title} instructions={instructions} errors={looseSectionErrors(errors, section.key, (head) => itemKeys.has(head))}>
      {items.map((item, index) => {
        const answer = value[item.key] ?? { self: null, final: null };
        const itemError = (side: string) => errors[`${section.key}.${item.key}.${side}`];

        return (
          <div key={item.key} className="flex flex-col gap-3">
            {index > 0 && <Separator />}
            <div className="flex flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="font-mono">
                  {item.code}
                </Badge>
                <h3 className="text-sm font-semibold">{item.title}</h3>
                {item.audience === "leaders" && <Badge variant="secondary">{t("leadersOnly")}</Badge>}
              </div>
              {item.points.length > 0 && (
                <ul className="ml-4 list-disc text-sm text-muted-foreground">
                  {item.points.map((point, pointIndex) => (
                    <li key={pointIndex}>{point}</li>
                  ))}
                </ul>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <RatingControl
                label={t("self")}
                scale={section.scale}
                levels={item.levels}
                value={answer.self}
                readOnly={!selfEditable}
                onChange={(rating) => onChange(item.key, "self", rating)}
                error={itemError("self")}
              />
              {showFinal ? (
                <RatingControl
                  label={t("final")}
                  tone="final"
                  scale={section.scale}
                  levels={item.levels}
                  value={answer.final}
                  readOnly={!finalEditable}
                  onChange={(rating) => onChange(item.key, "final", rating)}
                  error={itemError("final")}
                />
              ) : (
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-muted-foreground">{t("final")}</span>
                  <p className="rounded-lg border border-dashed px-3 py-2 text-xs text-muted-foreground">{t("finalHidden")}</p>
                </div>
              )}
            </div>

            <Collapsible>
              <CollapsibleTrigger className="group flex items-center gap-1 rounded-sm text-xs font-medium text-primary outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50">
                <span className="group-data-[state=open]:hidden">{t("showScale")}</span>
                <span className="hidden group-data-[state=open]:inline">{t("hideScale")}</span>
                <HugeiconsIcon icon={ArrowDown01Icon} className="size-3.5 transition-transform group-data-[state=open]:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <ol className="mt-2 flex flex-col gap-1.5 rounded-lg bg-muted/50 p-3 text-xs">
                  {section.scale.map((level, levelIndex) => (
                    <li key={level.value} className="flex gap-2">
                      <span className="w-4 shrink-0 font-semibold tabular-nums">{level.value}</span>
                      <span className="flex flex-col">
                        <span className="font-medium">{level.label}</span>
                        {item.levels[levelIndex] && <span className="text-muted-foreground">{item.levels[levelIndex]}</span>}
                      </span>
                    </li>
                  ))}
                </ol>
              </CollapsibleContent>
            </Collapsible>
          </div>
        );
      })}
    </SectionCard>
  );
}
