"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { dateFormatter } from "@/lib/utils/utils";
import type { TLeave } from "@/types/leave";
import LeaveStatusBadge from "../../_components/leave-status-badge";

export default function UpcomingLeaves({ items }: { items: TLeave[] }) {
  const t = useTranslations("dashboard.upcoming");
  const tLeave = useTranslations("leave");
  const locale = useLocale();

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
        <CardAction>
          <Button asChild variant="ghost" size="sm">
            <Link href="/leave-requests">{t("viewAll")}</Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">{t("empty")}</p>
        ) : (
          <ul className="flex flex-col divide-y">
            {items.map((item) => (
              <li key={item.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-3 first:pt-0 last:pb-0">
                <div className="flex min-w-0 flex-col">
                  <span className="truncate font-medium">{item.leave_type?.name ?? item.subject}</span>
                  <span className="text-sm text-muted-foreground">
                    {dateFormatter(item.start_date, locale)}
                    {item.end_date !== item.start_date ? ` – ${dateFormatter(item.end_date, locale)}` : ""}
                    {" · "}
                    {tLeave("detail.days", { count: Number(item.duration) || 0 })}
                  </span>
                </div>
                <LeaveStatusBadge status={Number(item.status)} />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
