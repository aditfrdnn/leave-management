import type { LEAVE_STATUS } from "@/constants/leave-constant";

export type TLeaveStatus = (typeof LEAVE_STATUS)[keyof typeof LEAVE_STATUS];

/** `GET /api/leave-request` row. */
export type TLeave = {
  id: string;
  subject: string;
  start_date: string;
  end_date: string;
  reason: string;
  location_during_leave: string;
  duration: string;
  return_to_office: string;
  ongoing_task: string;
  temporary_replacement: string;
  phone_number: string;
  status: TLeaveStatus | number;
  status_name: string;
  submitted_at: string;
  approved_at?: string | null;
  rejected_at?: string | null;
  created_at: string;
  updated_at?: string;
  user: {
    id: string;
    name: string;
    department_id: string;
    department: { id: string; name: string; alias: string };
  };
  leave_type: { id: string; code: string; name: string };
  leave_request_days: {
    id: string;
    leave_request_id: string;
    date: string;
    portion: string;
    is_counted: number;
  }[];
  /** History rows (`GET /api/leave-request`, docs/setup-module.md §13): the signed-in user submitted it. */
  is_mine?: boolean;
  /** History rows: the signed-in user's approval step on this request, if they are an approver. */
  my_approval?: TLeaveApproval | null;
};

/** `/api/dropdown/users` row (approvers). */
export type TApprover = {
  id: string;
  name: string;
  email?: string;
};

/** Body of `POST /api/leave-request`. Dates are `dd-MM-yyyy`. */
export type TLeaveRequestPayload = {
  subject: string;
  /** Omitted by the form: the API uses the annual leave type. */
  leave_type?: string;
  leave_date: string[];
  approval_user: string;
  reason: string;
  location_during_leave: string;
  return_to_office: string;
  ongoing_task: string;
  temporary_replacement: string;
  phone_number: string;
};

/** `approval_flows.approval_action`: 0 pending, 1 approved, 2 rejected. */
export type TApprovalAction = 0 | 1 | 2;

export type TLeaveApproval = {
  id: string;
  approval_level: number;
  approval_action: TApprovalAction | number;
  notes: string | null;
  approved_at: string | null;
  approval_by?: { id: string; name: string; email: string } | null;
};


/** `GET /api/leave-request/{id}`: the request with every approval step. */
export type TLeaveDetail = TLeave & { approvals: TLeaveApproval[] };


export type TLeaveSortKey = "created_at" | "start_date" | "duration" | "status" | "submitted_at";

/** Query string for `GET /api/leave-request`; `status` is a comma-joined list of status codes. */
/** Whose requests the history shows; `approvals` and `all` need `leave.approve`. */
export type TLeaveScope = "mine" | "approvals" | "all";

export type TLeaveListParams = {
  scope?: TLeaveScope;
  page?: number;
  per_page?: number;
  search?: string;
  sort_by?: TLeaveSortKey;
  sort_dir?: "asc" | "desc";
  /** Header filters: `columns[key][]=value` (docs/data-table.md). */
  columns?: import("./table").TTableColumnFilters;
};


export type TApprovalDecisionPayload = {
  notes?: string | null;
};

/** `GET /api/holidays/calendar` row: a day off that cannot be taken as leave. */
export type THolidayDay = {
  /** `YYYY-MM-DD` */
  date: string;
  name: string;
  /** Company "cuti bersama" rather than a public holiday. */
  is_mass_leave: boolean;
};

/** `GET /api/leave-request`: the paginated history plus how many requests wait for my decision. */
export type TLeaveListResponse = {
  success: boolean;
  message: string;
  data: TLeave[];
  meta: { pagination: import("./api").TApiPagination; awaiting_my_decision?: number; facets?: import("./table").TTableFacets };
};
