"use client";

import { useTranslations } from "next-intl";

import { Reveal } from "@/components/common/loader";
import { Progress } from "@/components/ui/progress";
import type { TDashboardMe } from "@/types/dashboard";
import { Calendar03Icon, CheckmarkCircle02Icon, Clock01Icon, SunCloud02Icon } from "@hugeicons/core-free-icons";
import StatCard from "./stat-card";

const formatDays = (value: number) => (Number.isInteger(value) ? String(value) : value.toFixed(1));

export default function MySummary({ me, year }: { me: TDashboardMe; year: number }) {
  const t = useTranslations("dashboard.me");
  const annual = me.annual_leave;
  const usedPercent = annual && annual.quota > 0 ? Math.min(100, (annual.used / annual.quota) * 100) : 0;

  return (
    <section aria-label={t("title")} className="flex flex-col gap-3">
      <h2 className="type-section-title">{t("title")}</h2>
      <Reveal className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t("annual.label")}
          value={annual ? formatDays(annual.remaining) : "-"}
          caption={annual ? t("annual.caption", { used: formatDays(annual.used), quota: formatDays(annual.quota) }) : t("annual.none")}
          icon={SunCloud02Icon}
          tone="bg-primary/10 text-primary"
        >
          {annual && <Progress value={usedPercent} aria-label={t("annual.progress")} className="h-1.5" />}
        </StatCard>
        <StatCard
          label={t("daysTaken.label")}
          value={formatDays(me.days_taken)}
          caption={t("daysTaken.caption", { year })}
          icon={Calendar03Icon}
          tone="bg-muted text-muted-foreground"
        />
        <StatCard
          label={t("pending.label")}
          value={me.counts.pending}
          caption={t("pending.caption")}
          icon={Clock01Icon}
          tone="bg-yellow/12 text-yellow-strong"
        />
        <StatCard
          label={t("approved.label")}
          value={me.counts.approved}
          caption={t("approved.caption", { rejected: me.counts.rejected, cancelled: me.counts.cancelled })}
          icon={CheckmarkCircle02Icon}
          tone="bg-green/10 text-green-strong"
        />
      </Reveal>
    </section>
  );
}
