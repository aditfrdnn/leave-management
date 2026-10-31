import type { TLeave } from "./leave";

/** `GET /api/dashboard` (docs/setup-module.md §8). A section is null when the user lacks its permission. */
export type TDashboard = {
  year: number;
  me: TDashboardMe;
  approver: TDashboardApprover | null;
  organization: TDashboardOrganization | null;
};

export type TDashboardMe = {
  annual_leave: { leave_type: string; quota: number; used: number; remaining: number } | null;
  counts: { pending: number; approved: number; rejected: number; cancelled: number };
  days_taken: number;
  upcoming: TLeave[];
};

export type TDashboardApprover = {
  waiting_count: number;
  oldest_waiting: TLeave | null;
  decided_this_month: number;
};

export type TOnLeaveToday = {
  id: string;
  user: { id: string; name: string; department?: { id: string; name: string; alias: string } | null };
  leave_type: { name: string } | null;
  start_date: string;
  end_date: string;
};

export type TDashboardOrganization = {
  employee_count: number;
  on_leave_today: TOnLeaveToday[];
  on_leave_this_week: number;
  totals: { submitted: number; pending: number; approved: number; rejected: number; cancelled: number };
  monthly: { month: number; requests: number; days: number }[];
  by_type: { leave_type: string; requests: number; days: number }[];
  by_department: { department: string; requests: number; days: number }[];
};
