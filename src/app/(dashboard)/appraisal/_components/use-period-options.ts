"use client";

import { useQuery } from "@tanstack/react-query";

import { GetAppraisalPeriods } from "../action";
import { APPRAISAL_PERIODS_QUERY_KEY, PERIOD_OPTIONS_PARAMS } from "./query-keys";

/** Every period, newest review first, for filters and the "start" cards. */
export function usePeriodOptions() {
  return useQuery({
    queryKey: [...APPRAISAL_PERIODS_QUERY_KEY, PERIOD_OPTIONS_PARAMS],
    queryFn: () => GetAppraisalPeriods(PERIOD_OPTIONS_PARAMS),
    select: (response) => [...(response.data ?? [])].sort((a, b) => b.review_start.localeCompare(a.review_start)),
  });
}
