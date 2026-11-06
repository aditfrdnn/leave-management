import {
  department,
  departmentOptions,
  departments,
  employee,
  employeeCareer,
  employeeCareers,
  employeeInvitation,
  employeeInvitations,
  employeeOptions,
  employeeRestore,
  employees,
  holiday,
  holidays,
  leaveBalance,
  leaveBalanceEntries,
  leaveBalances,
} from "@/constants/endpoint-constant";
import instance from "@/lib/axios/instance";
import type { TApiPaginated, TApiResponse } from "@/types/api";
import type {
  TDepartmentItem,
  TDepartmentListParams,
  TDepartmentOption,
  TDepartmentPayload,
  TEmployeeCareer,
  TEmployeeCareerPayload,
  TEmployeeAccount,
  TEmployeeBulkInvitation,
  TEmployeeCareerResult,
  TEmployeeItem,
  TEmployeeListParams,
  TEmployeeOption,
  TEmployeeOptionParams,
  TEmployeePayload,
  TEmployeeSaveResult,
  TOption,
  THolidayItem,
  THolidayListParams,
  THolidayPayload,
  TLeaveBalanceEntry,
  TLeaveBalanceItem,
  TLeaveBalanceListParams,
  TLeaveBalancePayload,
} from "@/types/setup";
import { toQueryParams } from "./to-query-params";

/** Setup module endpoints (docs/setup-module.md §3–§7). */
export const setupService = {
  /* ------------------------------- Employees ------------------------------- */

  async getEmployees(params: TEmployeeListParams) {
    const { data } = await instance.get<TApiPaginated<TEmployeeItem>>(employees, { params: toQueryParams(params) });

    return data;
  },

  async getEmployee(id: string) {
    const { data } = await instance.get<TApiResponse<TEmployeeItem>>(employee(id));

    return data;
  },

  async createEmployee(payload: TEmployeePayload) {
    const { data } = await instance.post<TApiResponse<TEmployeeSaveResult>>(employees, payload);

    return data;
  },

  async updateEmployee(id: string, payload: TEmployeePayload) {
    const { data } = await instance.put<TApiResponse<TEmployeeSaveResult>>(employee(id), payload);

    return data;
  },

  /** New IAM activation link (the old one stops working), sent on WhatsApp when the employee has a phone. */
  async sendEmployeeInvitation(id: string) {
    const { data } = await instance.post<TApiResponse<TEmployeeAccount>>(employeeInvitation(id));

    return data;
  },

  /** Invites several employees; one result per employee. */
  async sendEmployeeInvitations(ids: string[]) {
    const { data } = await instance.post<TApiResponse<TEmployeeBulkInvitation[]>>(employeeInvitations, { ids });

    return data;
  },

  /** Deletes the employee, or archives them when they have an account (`data.archived`). */
  async deleteEmployee(id: string) {
    const { data } = await instance.delete<TApiResponse<{ archived: boolean }>>(employee(id));

    return data;
  },

  async restoreEmployee(id: string) {
    const { data } = await instance.post<TApiResponse<TEmployeeSaveResult>>(employeeRestore(id));

    return data;
  },

  /* ---------------------------- Career history ---------------------------- */

  async getEmployeeCareers(employeeId: string) {
    const { data } = await instance.get<TApiResponse<TEmployeeCareer[]>>(employeeCareers(employeeId));

    return data;
  },

  async createEmployeeCareer(employeeId: string, payload: TEmployeeCareerPayload) {
    const { data } = await instance.post<TApiResponse<TEmployeeCareerResult>>(employeeCareers(employeeId), payload);

    return data;
  },

  async updateEmployeeCareer(employeeId: string, careerId: string, payload: TEmployeeCareerPayload) {
    const { data } = await instance.put<TApiResponse<TEmployeeCareerResult>>(employeeCareer(employeeId, careerId), payload);

    return data;
  },

  /** 409 when it is the employee's only career row. */
  async deleteEmployeeCareer(employeeId: string, careerId: string) {
    const { data } = await instance.delete<TApiResponse<null>>(employeeCareer(employeeId, careerId));

    return data;
  },

  /* --------------------------- Annual leave balance -------------------------- */

  async getLeaveBalances(params: TLeaveBalanceListParams) {
    const { data } = await instance.get<TApiPaginated<TLeaveBalanceItem>>(leaveBalances, { params: toQueryParams(params) });

    return data;
  },

  async getLeaveBalanceEntries(employeeId: string, params: { page?: number; per_page?: number }) {
    const { data } = await instance.get<TApiPaginated<TLeaveBalanceEntry>>(leaveBalanceEntries(employeeId), {
      params: toQueryParams(params),
    });

    return data;
  },

  async setLeaveBalance(employeeId: string, payload: TLeaveBalancePayload) {
    const { data } = await instance.put<TApiResponse<TLeaveBalanceItem>>(leaveBalance(employeeId), payload);

    return data;
  },

  /* -------------------------------- Holidays --------------------------------- */

  async getHolidays(params: THolidayListParams) {
    const { data } = await instance.get<TApiPaginated<THolidayItem>>(holidays, { params: toQueryParams(params) });

    return data;
  },

  async createHoliday(payload: THolidayPayload) {
    const { data } = await instance.post<TApiResponse<THolidayItem>>(holidays, payload);

    return data;
  },

  async updateHoliday(id: string, payload: THolidayPayload) {
    const { data } = await instance.put<TApiResponse<THolidayItem>>(holiday(id), payload);

    return data;
  },

  async deleteHoliday(id: string) {
    const { data } = await instance.delete<TApiResponse<null>>(holiday(id));

    return data;
  },

  /* ------------------------------ Departments ------------------------------ */

  async getDepartments(params: TDepartmentListParams) {
    const { data } = await instance.get<TApiPaginated<TDepartmentItem>>(departments, { params: toQueryParams(params) });

    return data;
  },

  async getDepartment(id: string) {
    const { data } = await instance.get<TApiResponse<TDepartmentItem>>(department(id));

    return data;
  },

  async createDepartment(payload: TDepartmentPayload) {
    const { data } = await instance.post<TApiResponse<TDepartmentItem>>(departments, payload);

    return data;
  },

  async updateDepartment(id: string, payload: TDepartmentPayload) {
    const { data } = await instance.put<TApiResponse<TDepartmentItem>>(department(id), payload);

    return data;
  },

  async deleteDepartment(id: string) {
    const { data } = await instance.delete<TApiResponse<null>>(department(id));

    return data;
  },

  /* ------------------------------- Dropdowns ------------------------------- */

  async getDepartmentOptions(search?: string) {
    const { data } = await instance.get<TApiResponse<TDepartmentOption[]>>(departmentOptions, { params: toQueryParams({ search }) });

    return data;
  },

  async getEmployeeOptions(params: TEmployeeOptionParams = {}) {
    const { data } = await instance.get<TApiResponse<TEmployeeOption[]>>(employeeOptions, { params: toQueryParams(params) });

    return data;
  },
};
