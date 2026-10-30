import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { cn } from "@/lib/utils/utils";
import type { TAppraisalPeriodStatus, TAppraisalStatus } from "@/types/appraisal";
import { CheckmarkBadge01Icon, CheckmarkCircle02Icon, Clock01Icon, File02Icon, SquareLock02Icon, SquareUnlock02Icon } from "@hugeicons/core-free-icons";

const APPRAISAL_STATUS_TONE = {
  draft: { className: "bg-muted text-muted-foreground", icon: File02Icon },
  submitted: { className: "bg-yellow/12 text-yellow-strong", icon: Clock01Icon },
  assessed: { className: "bg-primary/10 text-primary", icon: CheckmarkCircle02Icon },
  acknowledged: { className: "bg-green/10 text-green-strong", icon: CheckmarkBadge01Icon },
} as const;

const PERIOD_STATUS_TONE = {
  open: { className: "bg-green/10 text-green-strong", icon: SquareUnlock02Icon },
  closed: { className: "bg-muted text-muted-foreground", icon: SquareLock02Icon },
} as const;

/** An appraisal's status: icon + label + tone, never color only. */
export function AppraisalStatusBadge({ status, className }: { status: TAppraisalStatus; className?: string }) {
  const t = useTranslations("appraisal.status");
  const tone = APPRAISAL_STATUS_TONE[status] ?? APPRAISAL_STATUS_TONE.draft;

  return (
    <Badge variant="outline" className={cn("gap-1 border-none", tone.className, className)}>
      <HugeiconsIcon icon={tone.icon} className="size-3" />
      {t(status)}
    </Badge>
  );
}

export function PeriodStatusBadge({ status, className }: { status: TAppraisalPeriodStatus; className?: string }) {
  const t = useTranslations("appraisal.periodStatus");
  const tone = PERIOD_STATUS_TONE[status] ?? PERIOD_STATUS_TONE.closed;

  return (
    <Badge variant="outline" className={cn("gap-1 border-none", tone.className, className)}>
      <HugeiconsIcon icon={tone.icon} className="size-3" />
      {t(status)}
    </Badge>
  );
}
