import { appraisalTemplate, appraisalTemplateDuplicate, appraisalTemplates } from "@/constants/endpoint-constant";
import type { TTableColumnFilters } from "@/types/table";
import instance from "@/lib/axios/instance";
import type { TApiPaginated, TApiResponse } from "@/types/api";
import type { TAppraisalTemplate, TAppraisalTemplateItem, TAppraisalTemplatePayload } from "@/types/appraisal";
import { toQueryParams } from "./to-query-params";

export type TAppraisalTemplateListParams = {
  page?: number;
  per_page?: number;
  search?: string;
  sort_by?: string;
  sort_dir?: "asc" | "desc";
  /** Header filters: `columns[key][]=value` (docs/data-table.md). */
  columns?: TTableColumnFilters;
};

/** Appraisal template endpoints (docs/appraisal-module.md §2, §5). Locked templates answer 409 on PUT/DELETE. */
export const appraisalTemplateService = {
  async getAppraisalTemplates(params: TAppraisalTemplateListParams) {
    const { data } = await instance.get<TApiPaginated<TAppraisalTemplateItem>>(appraisalTemplates, { params: toQueryParams(params) });

    return data;
  },

  async getAppraisalTemplate(id: number | string) {
    const { data } = await instance.get<TApiResponse<TAppraisalTemplate>>(appraisalTemplate(id));

    return data;
  },

  async createAppraisalTemplate(payload: TAppraisalTemplatePayload) {
    const { data } = await instance.post<TApiResponse<TAppraisalTemplate>>(appraisalTemplates, payload);

    return data;
  },

  async updateAppraisalTemplate(id: number | string, payload: TAppraisalTemplatePayload) {
    const { data } = await instance.put<TApiResponse<TAppraisalTemplate>>(appraisalTemplate(id), payload);

    return data;
  },

  /** A new inactive copy; the API suggests the next revision (`Rev.N+1`). */
  async duplicateAppraisalTemplate(id: number | string) {
    const { data } = await instance.post<TApiResponse<TAppraisalTemplate>>(appraisalTemplateDuplicate(id));

    return data;
  },

  async deleteAppraisalTemplate(id: number | string) {
    const { data } = await instance.delete<TApiResponse<null>>(appraisalTemplate(id));

    return data;
  },
};
