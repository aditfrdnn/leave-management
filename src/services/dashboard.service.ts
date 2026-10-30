import { dashboard } from "@/constants/endpoint-constant";
import instance from "@/lib/axios/instance";
import type { TApiResponse } from "@/types/api";
import type { TDashboard } from "@/types/dashboard";

export const dashboardService = {
  async getDashboard(year: number) {
    const { data } = await instance.get<TApiResponse<TDashboard>>(dashboard, { params: { year } });

    return data;
  },
};
