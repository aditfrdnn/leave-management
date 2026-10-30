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
