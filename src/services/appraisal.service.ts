import {
  appraisal,
  appraisalAction,
  appraisalAnswers,
  appraisalPeriod,
  appraisalPeriodClose,
  appraisalPeriodReopen,
  appraisalPeriods,
  appraisals,
  appraisalTemplates,
} from "@/constants/endpoint-constant";
import type { TTableColumnFilters } from "@/types/table";
import instance from "@/lib/axios/instance";
import type { TApiPaginated, TApiResponse } from "@/types/api";
import type {
  TAppraisalAnswers,
  TAppraisalDetail,
  TAppraisalListParams,
  TAppraisalListResponse,
  TAppraisalPeriod,
  TAppraisalPeriodPayload,
  TAppraisalTemplateItem,
} from "@/types/appraisal";
import { toQueryParams } from "./to-query-params";

/** Query of `GET /api/appraisal-periods` (docs/appraisal-module.md §5). */
export type TAppraisalPeriodListParams = {
  page?: number;
  per_page?: number;
  search?: string;
  sort_by?: string;
  sort_dir?: "asc" | "desc";
  /** Header filters: `columns[key][]=value` (docs/data-table.md). */
  columns?: TTableColumnFilters;
};

/** Appraisal periods and appraisals (docs/appraisal-module.md §3–§5). Templates live in `appraisal-template.service.ts`. */
export const appraisalService = {
  /* -------------------------------- Periods -------------------------------- */

  async getPeriods(params: TAppraisalPeriodListParams) {
    const { data } = await instance.get<TApiPaginated<TAppraisalPeriod>>(appraisalPeriods, { params: toQueryParams(params) });

    return data;
  },

  async createPeriod(payload: TAppraisalPeriodPayload) {
    const { data } = await instance.post<TApiResponse<TAppraisalPeriod>>(appraisalPeriods, payload);

    return data;
  },

  /** The template can change only while the period has no appraisals. */
  async updatePeriod(id: string, payload: TAppraisalPeriodPayload) {
    const { data } = await instance.put<TApiResponse<TAppraisalPeriod>>(appraisalPeriod(id), payload);

    return data;
  },

  async closePeriod(id: string) {
    const { data } = await instance.patch<TApiResponse<TAppraisalPeriod>>(appraisalPeriodClose(id));

    return data;
  },

  async reopenPeriod(id: string) {
    const { data } = await instance.patch<TApiResponse<TAppraisalPeriod>>(appraisalPeriodReopen(id));

    return data;
  },

  /** 409 when the period has appraisals. */
  async deletePeriod(id: string) {
    const { data } = await instance.delete<TApiResponse<null>>(appraisalPeriod(id));

    return data;
  },

  /** Templates a new period may use: the first 100, filtered to active ones by the caller. */
  async getActiveTemplates() {
    const { data } = await instance.get<TApiPaginated<TAppraisalTemplateItem>>(appraisalTemplates, {
      params: { per_page: 100, is_active: 1 },
    });

    return data;
  },

  /* ------------------------------- Appraisals ------------------------------ */

  /** `scope=mine` (default), `team` (I assess) or `all` (`appraisal.view_all`). */
  async getAppraisals(params: TAppraisalListParams) {
    const { data } = await instance.get<TAppraisalListResponse>(appraisals, { params: toQueryParams(params) });

    return data;
  },

  /** Starts my appraisal in an open period, prefilled from last year's targets. */
  async createAppraisal(periodId: string) {
    const { data } = await instance.post<TApiResponse<TAppraisalDetail>>(appraisals, { period_id: periodId });

    return data;
  },

  async getAppraisal(id: string) {
    const { data } = await instance.get<TApiResponse<TAppraisalDetail>>(appraisal(id));

    return data;
  },

  /** Partial answers; the API merges only the keys my role may write (§4). */
  async saveAnswers(id: string, answers: TAppraisalAnswers) {
    const { data } = await instance.put<TApiResponse<TAppraisalDetail>>(appraisalAnswers(id), { answers });

    return data;
  },

  async submitAppraisal(id: string) {
    const { data } = await instance.post<TApiResponse<TAppraisalDetail>>(appraisalAction(id, "submit"));

    return data;
  },

  async returnAppraisal(id: string, payload: { note: string }) {
    const { data } = await instance.post<TApiResponse<TAppraisalDetail>>(appraisalAction(id, "return"), payload);

    return data;
  },

  async assessAppraisal(id: string) {
    const { data } = await instance.post<TApiResponse<TAppraisalDetail>>(appraisalAction(id, "assess"));

    return data;
  },

};
