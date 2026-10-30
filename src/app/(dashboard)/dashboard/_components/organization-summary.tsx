"use client";

import { useLocale, useTranslations } from "next-intl";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { Reveal } from "@/components/common/loader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { dateFormatter } from "@/lib/utils/utils";
import type { TDashboardOrganization } from "@/types/dashboard";
import { Calendar03Icon, Clock01Icon, UserGroupIcon, UserMinus01Icon } from "@hugeicons/core-free-icons";
import StatCard from "./stat-card";

/** Requests (count) and days (sum of approved portions) share one chart: two bars per month. */
function MonthlyChart({ data, year }: { data: TDashboardOrganization["monthly"]; year: number }) {
  const t = useTranslations("dashboard.organization");
  const locale = useLocale();
  const monthName = new Intl.DateTimeFormat(locale === "id" ? "id-ID" : "en-GB", { month: "short" });

  const config = {
    requests: { label: t("monthly.requests"), color: "var(--chart-2)" },
    days: { label: t("monthly.days"), color: "var(--chart-4)" },
  } satisfies ChartConfig;

  const rows = data.map((row) => ({ ...row, label: monthName.format(new Date(year, row.month - 1, 1)) }));

  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>{t("monthly.title")}</CardTitle>
        <CardDescription>{t("monthly.description", { year })}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="aspect-auto h-64 w-full">
          <BarChart data={rows} margin={{ left: -16, right: 8 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={40} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar dataKey="requests" fill="var(--color-requests)" radius={4} />
            <Bar dataKey="days" fill="var(--color-days)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

/** Horizontal bars of approved days per category (leave type or department). */
function BreakdownChart({
  title,
  description,
  rows,
  empty,
}: {
  title: string;
  description: string;
  rows: { name: string; days: number; requests: number }[];
  empty: string;
}) {
  const t = useTranslations("dashboard.organization");
  const config = { days: { label: t("monthly.days"), color: "var(--chart-3)" } } satisfies ChartConfig;
  const sorted = [...rows].sort((a, b) => b.days - a.days).slice(0, 8);

  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {sorted.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">{empty}</p>
        ) : (
          <ChartContainer config={config} className="aspect-auto w-full" style={{ height: Math.max(120, sorted.length * 40) }}>
            <BarChart data={sorted} layout="vertical" margin={{ left: 8, right: 16 }}>
              <CartesianGrid horizontal={false} />
              <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="name" width={120} tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="days" fill="var(--color-days)" radius={4} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}

export default function OrganizationSummary({ organization, year }: { organization: TDashboardOrganization; year: number }) {
  const t = useTranslations("dashboard.organization");
  const locale = useLocale();
  const { totals } = organization;

  return (
    <section aria-label={t("title")} className="flex flex-col gap-3">
      <div className="flex flex-col">
        <h2 className="type-section-title">{t("title")}</h2>
        <p className="text-sm text-muted-foreground">{t("description", { year })}</p>
      </div>

      <Reveal className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t("employees")} value={organization.employee_count} caption={t("employeesCaption")} icon={UserGroupIcon} tone="bg-primary/10 text-primary" />
        <StatCard
          label={t("onLeaveToday")}
          value={organization.on_leave_today.length}
          caption={t("onLeaveWeek", { count: organization.on_leave_this_week })}
          icon={UserMinus01Icon}
          tone="bg-muted text-muted-foreground"
        />
        <StatCard
          label={t("pending")}
          value={totals.pending}
          caption={t("submitted", { count: totals.submitted })}
          icon={Clock01Icon}
          tone="bg-yellow/12 text-yellow-strong"
        />
        <StatCard
          label={t("approved")}
          value={totals.approved}
          caption={t("rejectedCancelled", { rejected: totals.rejected, cancelled: totals.cancelled })}
          icon={Calendar03Icon}
          tone="bg-green/10 text-green-strong"
        />
      </Reveal>

      <div className="grid min-w-0 gap-4 xl:grid-cols-3">
        <div className="min-w-0 xl:col-span-2">
          <MonthlyChart data={organization.monthly} year={year} />
        </div>
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>{t("today.title")}</CardTitle>
            <CardDescription>{t("today.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            {organization.on_leave_today.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">{t("today.empty")}</p>
            ) : (
              <ul className="flex flex-col divide-y">
                {organization.on_leave_today.map((item) => (
                  <li key={item.id} className="flex flex-col py-2.5 text-sm first:pt-0 last:pb-0">
                    <span className="font-medium">
                      {item.user.name}
                      {item.user.department?.alias ? <span className="text-muted-foreground"> · {item.user.department.alias}</span> : null}
                    </span>
                    <span className="text-muted-foreground">
                      {item.leave_type?.name ?? "-"} · {t("today.until", { date: dateFormatter(item.end_date, locale) })}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid min-w-0 gap-4 lg:grid-cols-2">
        <BreakdownChart
          title={t("byType.title")}
          description={t("byType.description")}
          rows={organization.by_type.map((row) => ({ name: row.leave_type, days: row.days, requests: row.requests }))}
          empty={t("empty")}
        />
        <BreakdownChart
          title={t("byDepartment.title")}
          description={t("byDepartment.description")}
          rows={organization.by_department.map((row) => ({ name: row.department, days: row.days, requests: row.requests }))}
          empty={t("empty")}
        />
      </div>
    </section>
  );
}
