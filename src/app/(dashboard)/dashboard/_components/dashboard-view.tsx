"use client";

import { useState } from "react";
import Link from "next/link";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

import { SectionLoader } from "@/components/common/loader";
import PageHeader from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { Add01Icon } from "@hugeicons/core-free-icons";
import { GetDashboard } from "../action";
import ApproverCard from "./approver-card";
import MySummary from "./my-summary";
import OrganizationSummary from "./organization-summary";
import UpcomingLeaves from "./upcoming-leaves";

export const DASHBOARD_QUERY_KEY = ["dashboard"] as const;

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = [CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2];

/**
 * One request feeds the whole page. Personal numbers are always there; the approver and
 * organisation sections render only when the API sends them (it decides by permission).
 */
export default function DashboardView() {
  const t = useTranslations("dashboard");
  const { user } = useAuth();
  const [year, setYear] = useState(CURRENT_YEAR);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: [...DASHBOARD_QUERY_KEY, year],
    queryFn: () => GetDashboard(year),
    placeholderData: keepPreviousData,
  });

  const firstName = user?.name?.split(" ")[0] ?? "";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <PageHeader title={t("page.greeting", { name: firstName })} description={t("page.description")} />
        <div className="flex shrink-0 items-center gap-2">
          <Select value={String(year)} onValueChange={(value) => setYear(Number(value))}>
            <SelectTrigger size="sm" className="w-28" aria-label={t("page.year")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {YEARS.map((option) => (
                <SelectItem key={option} value={String(option)}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button asChild size="sm">
            <Link href="/leave-requests">
              <HugeiconsIcon icon={Add01Icon} className="size-4" />
              {t("page.newRequest")}
            </Link>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <SectionLoader className="min-h-80" />
      ) : isError || !data ? (
        <p className="text-sm text-destructive">{(error as Error | null)?.message ?? t("errors.load")}</p>
      ) : (
        <>
          <MySummary me={data.me} year={data.year} />

          <div className="grid min-w-0 gap-4 lg:grid-cols-3">
            <div className={data.approver ? "min-w-0 lg:col-span-2" : "min-w-0 lg:col-span-3"}>
              <UpcomingLeaves items={data.me.upcoming} />
            </div>
            {data.approver && (
              <div className="min-w-0">
                <ApproverCard approver={data.approver} />
              </div>
            )}
          </div>

          {data.organization && <OrganizationSummary organization={data.organization} year={data.year} />}
        </>
      )}
    </div>
  );
}
