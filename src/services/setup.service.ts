import {
  department,
  departmentOptions,
  departments,
  employee,
  employeeCareer,
  employeeCareers,
  employeeOptions,
  employees,
  holiday,
  holidays,
  leaveBalance,
  leaveBalanceEntries,
  leaveBalances,
  permission,
  permissionGroups,
  permissions,
  role,
  roleOptions,
  roles,
  user,
  users,
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
  TEmployeeCareerResult,
  TEmployeeItem,
  TEmployeeListParams,
  TEmployeeOption,
  TEmployeeOptionParams,
  TEmployeePayload,
  TOption,
  TPermissionGroup,
  TPermissionItem,
  TPermissionListParams,
  TPermissionPayload,
  TRoleDetail,
  TRoleItem,
  TRoleListParams,
  TRolePayload,
  TUserItem,
  TUserListParams,
  TUserPayload,
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
  /* --------------------------------- Users --------------------------------- */

  async getUsers(params: TUserListParams) {
    const { data } = await instance.get<TApiPaginated<TUserItem>>(users, { params: toQueryParams(params) });

    return data;
  },

  async getUser(id: number | string) {
    const { data } = await instance.get<TApiResponse<TUserItem>>(user(id));

    return data;
  },

  async createUser(payload: TUserPayload) {
    const { data } = await instance.post<TApiResponse<TUserItem>>(users, payload);

    return data;
  },

  async updateUser(id: number | string, payload: TUserPayload) {
    const { data } = await instance.put<TApiResponse<TUserItem>>(user(id), payload);

    return data;
  },

  async deleteUser(id: number | string) {
    const { data } = await instance.delete<TApiResponse<null>>(user(id));

    return data;
  },

  /* ------------------------------- Employees ------------------------------- */

  async getEmployees(params: TEmployeeListParams) {
    const { data } = await instance.get<TApiPaginated<TEmployeeItem>>(employees, { params: toQueryParams(params) });

    return data;
  },

  async getEmployee(id: number | string) {
    const { data } = await instance.get<TApiResponse<TEmployeeItem>>(employee(id));

    return data;
  },

  async createEmployee(payload: TEmployeePayload) {
    const { data } = await instance.post<TApiResponse<TEmployeeItem>>(employees, payload);

    return data;
  },

  async updateEmployee(id: number | string, payload: TEmployeePayload) {
    const { data } = await instance.put<TApiResponse<TEmployeeItem>>(employee(id), payload);

    return data;
  },

  async deleteEmployee(id: number | string) {
    const { data } = await instance.delete<TApiResponse<null>>(employee(id));

    return data;
  },

  /* ---------------------------- Career history ---------------------------- */

  async getEmployeeCareers(employeeId: number | string) {
    const { data } = await instance.get<TApiResponse<TEmployeeCareer[]>>(employeeCareers(employeeId));

    return data;
  },

  async createEmployeeCareer(employeeId: number | string, payload: TEmployeeCareerPayload) {
    const { data } = await instance.post<TApiResponse<TEmployeeCareerResult>>(employeeCareers(employeeId), payload);

    return data;
  },

  async updateEmployeeCareer(employeeId: number | string, careerId: number | string, payload: TEmployeeCareerPayload) {
    const { data } = await instance.put<TApiResponse<TEmployeeCareerResult>>(employeeCareer(employeeId, careerId), payload);

    return data;
  },

  /** 409 when it is the employee's only career row. */
  async deleteEmployeeCareer(employeeId: number | string, careerId: number | string) {
    const { data } = await instance.delete<TApiResponse<null>>(employeeCareer(employeeId, careerId));

    return data;
  },

  /* --------------------------- Annual leave balance -------------------------- */

  async getLeaveBalances(params: TLeaveBalanceListParams) {
    const { data } = await instance.get<TApiPaginated<TLeaveBalanceItem>>(leaveBalances, { params: toQueryParams(params) });

    return data;
  },

  async getLeaveBalanceEntries(employeeId: number | string, params: { page?: number; per_page?: number }) {
    const { data } = await instance.get<TApiPaginated<TLeaveBalanceEntry>>(leaveBalanceEntries(employeeId), {
      params: toQueryParams(params),
    });

    return data;
  },

  async setLeaveBalance(employeeId: number | string, payload: TLeaveBalancePayload) {
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

  async updateHoliday(id: number | string, payload: THolidayPayload) {
    const { data } = await instance.put<TApiResponse<THolidayItem>>(holiday(id), payload);

    return data;
  },

  async deleteHoliday(id: number | string) {
    const { data } = await instance.delete<TApiResponse<null>>(holiday(id));

    return data;
  },

  /* ------------------------------ Departments ------------------------------ */

  async getDepartments(params: TDepartmentListParams) {
    const { data } = await instance.get<TApiPaginated<TDepartmentItem>>(departments, { params: toQueryParams(params) });

    return data;
  },

  async getDepartment(id: number | string) {
    const { data } = await instance.get<TApiResponse<TDepartmentItem>>(department(id));

    return data;
  },

  async createDepartment(payload: TDepartmentPayload) {
    const { data } = await instance.post<TApiResponse<TDepartmentItem>>(departments, payload);

    return data;
  },

  async updateDepartment(id: number | string, payload: TDepartmentPayload) {
    const { data } = await instance.put<TApiResponse<TDepartmentItem>>(department(id), payload);

    return data;
  },

  async deleteDepartment(id: number | string) {
    const { data } = await instance.delete<TApiResponse<null>>(department(id));

    return data;
  },

  /* --------------------------------- Roles --------------------------------- */

  async getRoles(params: TRoleListParams) {
    const { data } = await instance.get<TApiPaginated<TRoleItem>>(roles, { params: toQueryParams(params) });

    return data;
  },

  async getRole(id: number | string) {
    const { data } = await instance.get<TApiResponse<TRoleDetail>>(role(id));

    return data;
  },

  async createRole(payload: TRolePayload) {
    const { data } = await instance.post<TApiResponse<TRoleItem>>(roles, payload);

    return data;
  },

  async updateRole(id: number | string, payload: TRolePayload) {
    const { data } = await instance.put<TApiResponse<TRoleItem>>(role(id), payload);

    return data;
  },

  async deleteRole(id: number | string) {
    const { data } = await instance.delete<TApiResponse<null>>(role(id));

    return data;
  },

  /* ------------------------------ Permissions ------------------------------ */

  async getPermissions(params: TPermissionListParams) {
    const { data } = await instance.get<TApiPaginated<TPermissionItem>>(permissions, { params: toQueryParams(params) });

    return data;
  },

  async getPermissionGroups() {
    const { data } = await instance.get<TApiResponse<TPermissionGroup[]>>(permissionGroups);

    return data;
  },

  async createPermission(payload: TPermissionPayload) {
    const { data } = await instance.post<TApiResponse<TPermissionItem>>(permissions, payload);

    return data;
  },

  async updatePermission(id: number | string, payload: TPermissionPayload) {
    const { data } = await instance.put<TApiResponse<TPermissionItem>>(permission(id), payload);

    return data;
  },

  async deletePermission(id: number | string) {
    const { data } = await instance.delete<TApiResponse<null>>(permission(id));

    return data;
  },

  /* ------------------------------- Dropdowns ------------------------------- */

  async getDepartmentOptions(search?: string) {
    const { data } = await instance.get<TApiResponse<TDepartmentOption[]>>(departmentOptions, { params: toQueryParams({ search }) });

    return data;
  },

  async getRoleOptions(search?: string) {
    const { data } = await instance.get<TApiResponse<TOption[]>>(roleOptions, { params: toQueryParams({ search }) });

    return data;
  },

  async getEmployeeOptions(params: TEmployeeOptionParams = {}) {
    const { data } = await instance.get<TApiResponse<TEmployeeOption[]>>(employeeOptions, { params: toQueryParams(params) });

    return data;
  },
};
