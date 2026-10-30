"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";

import { DataTable } from "@/components/common/data-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GetLeaveRequests } from "../action";
import { leaveRequestColumns } from "./leave-request-columns";

export const LEAVE_REQUESTS_QUERY_KEY = ["leave", "requests"] as const;

/**
 * The API returns the whole list, so the table sorts and filters its own rows
 * (`meta.sortKey` / `meta.filterKey` without the server-side props).
 */
export default function LeaveRequestTable() {
  const t = useTranslations("leave");
  const locale = useLocale();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: LEAVE_REQUESTS_QUERY_KEY,
    queryFn: GetLeaveRequests,
  });

  const columns = useMemo(() => leaveRequestColumns({ t, locale }), [t, locale]);

  const rows = useMemo(
    () => [...(data ?? [])].sort((a, b) => (b.submitted_at ?? b.created_at).localeCompare(a.submitted_at ?? a.created_at)),
    [data],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("history.title")}</CardTitle>
        <CardDescription>{t("history.description")}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 overflow-auto">
        {isError && <p className="text-sm text-destructive">{(error as Error).message}</p>}
        <DataTable
          columns={columns}
          data={rows}
          isLoading={isLoading}
          noResultMessage={t("history.empty")}
          currentPage={1}
          lastPage={1}
        />
      </CardContent>
    </Card>
  );
}
