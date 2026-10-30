import type { ReactNode } from "react";
import type { IconSvgElement } from "@hugeicons/react";

import { Card, CardContent } from "@/components/ui/card";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { cn } from "@/lib/utils/utils";

/** One number with its label and caption, the same tile next-pdi's dashboard uses. */
export default function StatCard({
  label,
  value,
  caption,
  icon,
  tone,
  children,
}: {
  label: string;
  value: ReactNode;
  caption?: ReactNode;
  icon: IconSvgElement;
  /** Background + text classes for the icon chip. */
  tone: string;
  children?: ReactNode;
}) {
  return (
    <Card className="gap-0 py-4">
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="type-stat tabular-nums">{value}</p>
            {caption && <p className="text-xs text-muted-foreground">{caption}</p>}
          </div>
          <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg", tone)}>
            <HugeiconsIcon icon={icon} className="size-5" />
          </div>
        </div>
        {children}
      </CardContent>
    </Card>
  );
}
