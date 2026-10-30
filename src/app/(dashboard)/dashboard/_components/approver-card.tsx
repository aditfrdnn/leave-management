"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { dateFormatter } from "@/lib/utils/utils";
import type { TDashboardApprover } from "@/types/dashboard";
import { ArrowRight01Icon, InboxIcon } from "@hugeicons/core-free-icons";

/** What waits on the signed-in approver, with a way straight into the inbox. */
export default function ApproverCard({ approver }: { approver: TDashboardApprover }) {
  const t = useTranslations("dashboard.approver");
  const locale = useLocale();
  const oldest = approver.oldest_waiting;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-yellow/12 text-yellow-strong">
            <HugeiconsIcon icon={InboxIcon} className="size-5" />
          </div>
          <div className="flex flex-col">
            <span className="type-stat tabular-nums">{approver.waiting_count}</span>
            <span className="text-xs text-muted-foreground">{t("waiting", { count: approver.waiting_count })}</span>
          </div>
        </div>

        {oldest ? (
          <div className="rounded-lg border p-3 text-sm">
            <p className="text-xs text-muted-foreground">{t("oldest")}</p>
            <p className="font-medium">{oldest.user?.name ?? "-"}</p>
            <p className="text-muted-foreground">
              {oldest.leave_type?.name ?? oldest.subject} · {dateFormatter(oldest.start_date, locale)}
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{t("clear")}</p>
        )}

        <p className="text-xs text-muted-foreground">{t("decided", { count: approver.decided_this_month })}</p>

        <Button asChild variant="outline" size="sm" className="mt-auto self-start">
          <Link href="/approvals">
            {t("open")}
            <HugeiconsIcon icon={ArrowRight01Icon} className="size-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
