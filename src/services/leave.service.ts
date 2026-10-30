import {
  approvers,
  leaveApprovals,
  leaveApprove,
  leaveReject,
  leaveRequest,
  leaveRequestCancel,
  leaveRequests,
  holidayCalendar,
  leaveTypes,
  myLeaveBalance,
} from "@/constants/endpoint-constant";
import instance from "@/lib/axios/instance";
import type { TApiPaginated, TApiResponse, TDropdownOption } from "@/types/api";
import type {
  THolidayDay,
  TApprovalDecisionPayload,
  TApprovalItem,
  TApprovalListParams,
  TLeaveListParams,
  TApprover,
  TLeave,
  TLeaveDetail,
  TLeaveRequestPayload,
} from "@/types/leave";
import type { TMyLeaveBalance } from "@/types/setup";
import { toQueryParams } from "./to-query-params";

export const leaveService = {
  async getHolidayCalendar(params: { from: string; to: string }) {
    const { data } = await instance.get<TApiResponse<THolidayDay[]>>(holidayCalendar, { params });

    return data;
  },

  /** The signed-in user's annual leave balance (docs/setup-module.md §10); null without an employee record. */
  async getMyLeaveBalance() {
    const { data } = await instance.get<TApiResponse<TMyLeaveBalance>>(myLeaveBalance);

    return data;
  },

  /** The signed-in user's requests; the API returns the whole list (no paging yet). */
  async getLeaveRequests(params: TLeaveListParams) {
    const { data } = await instance.get<TApiPaginated<TLeave>>(leaveRequests, { params: toQueryParams(params) });

    return data;
  },

  async getLeaveRequest(id: number | string) {
    const { data } = await instance.get<TApiResponse<TLeaveDetail>>(leaveRequest(id));

    return data;
  },

  async createLeaveRequest(payload: TLeaveRequestPayload) {
    const { data } = await instance.post<TApiResponse<TLeave>>(leaveRequests, payload);

    return data;
  },

  /** Only while the request is still pending. */
  async cancelLeaveRequest(id: number | string) {
    const { data } = await instance.patch<TApiResponse<TLeave>>(leaveRequestCancel(id));

    return data;
  },

  /* ------------------------------- Approvals ------------------------------- */

  async getApprovals(params: TApprovalListParams) {
    const { data } = await instance.get<TApiPaginated<TApprovalItem>>(leaveApprovals, { params: toQueryParams(params) });

    return data;
  },

  async approveLeaveRequest(id: number | string, payload: TApprovalDecisionPayload) {
    const { data } = await instance.patch<TApiResponse<TLeave>>(leaveApprove(id), payload);

    return data;
  },

  async rejectLeaveRequest(id: number | string, payload: TApprovalDecisionPayload) {
    const { data } = await instance.patch<TApiResponse<TLeave>>(leaveReject(id), payload);

    return data;
  },

  /* ------------------------------- Dropdowns ------------------------------- */

  async getLeaveTypes() {
    const { data } = await instance.get<TApiResponse<TDropdownOption[]>>(leaveTypes);

    return data;
  },

  async getApprovers() {
    const { data } = await instance.get<TApiResponse<TApprover[]>>(approvers);

    return data;
  },
};
