import type { LEAVE_STATUS } from "@/constants/leave-constant";

export type TLeaveStatus = (typeof LEAVE_STATUS)[keyof typeof LEAVE_STATUS];

/** `GET /api/leave-request` row. */
export type TLeave = {
  id: number;
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
    id: number;
    name: string;
    department_id: number;
    department: { id: number; name: string; alias: string };
  };
  leave_type: { id: number; code: string; name: string };
  leave_request_days: {
    id: number;
    leave_request_id: number;
    date: string;
    portion: string;
    is_counted: number;
  }[];
};

/** `/api/dropdown/users` row (approvers). */
export type TApprover = {
  id: number;
  name: string;
  email?: string;
};

/** Body of `POST /api/leave-request`. Dates are `dd-MM-yyyy`. */
export type TLeaveRequestPayload = {
  subject: string;
  leave_type: string;
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
  id: number;
  approval_level: number;
  approval_action: TApprovalAction | number;
  notes: string | null;
  approved_at: string | null;
  approval_by?: { id: number; name: string; email: string } | null;
};

/** `GET /api/leave-request/approvals` row: the request plus this approver's own flow row. */
export type TApprovalItem = TLeave & { approval: TLeaveApproval };

/** `GET /api/leave-request/{id}`: the request with every approval step. */
export type TLeaveDetail = TLeave & { approvals: TLeaveApproval[] };

export type TApprovalStatusFilter = "pending" | "approved" | "rejected" | "all";

export type TLeaveSortKey = "created_at" | "start_date" | "duration" | "status" | "submitted_at";

/** Query string for `GET /api/leave-request`; `status` is a comma-joined list of status codes. */
export type TLeaveListParams = {
  page?: number;
  per_page?: number;
  search?: string;
  status?: string;
  sort_by?: TLeaveSortKey;
  sort_dir?: "asc" | "desc";
};

export type TApprovalListParams = {
  status?: TApprovalStatusFilter;
  page?: number;
  per_page?: number;
  search?: string;
};

export type TApprovalDecisionPayload = {
  notes?: string | null;
};
