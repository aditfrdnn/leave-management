import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { getLeaveStatusConfig } from "@/lib/status-config";
import { cn } from "@/lib/utils/utils";

/** A leave request's status: tone from `lib/status-config.ts`, icon + label so it is never color-only. */
export default function LeaveStatusBadge({ status, className }: { status: number; className?: string }) {
  const t = useTranslations();
  const config = getLeaveStatusConfig(status);

  return (
    <Badge variant="outline" className={cn("gap-1", config.className, className)}>
      <HugeiconsIcon icon={config.icon} className="size-3" />
      {t(config.labelKey)}
    </Badge>
  );
}
