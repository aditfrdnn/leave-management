import { approvers, leaveRequests, leaveTypes } from "@/constants/endpoint-constant";
import instance from "@/lib/axios/instance";
import type { TApiResponse, TDropdownOption } from "@/types/api";
import type { TApprover, TLeave, TLeaveRequestPayload } from "@/types/leave";

export const leaveService = {
  /** The signed-in user's requests; the API returns the whole list (no paging yet). */
  async getLeaveRequests() {
    const { data } = await instance.get<TApiResponse<TLeave[]>>(leaveRequests);

    return data;
  },

  async createLeaveRequest(payload: TLeaveRequestPayload) {
    const { data } = await instance.post<TApiResponse<TLeave>>(leaveRequests, payload);

    return data;
  },

  async getLeaveTypes() {
    const { data } = await instance.get<TApiResponse<TDropdownOption[]>>(leaveTypes);

    return data;
  },

  async getApprovers() {
    const { data } = await instance.get<TApiResponse<TApprover[]>>(approvers);

    return data;
  },
};
