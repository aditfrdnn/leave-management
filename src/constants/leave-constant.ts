import type { LeaveRequestSchemaType } from "@/validations/leave-validations";

export const INITIAL_LEAVE_REQUEST_FORM: LeaveRequestSchemaType = {
  subject: "",
  leave_type: "",
  leave_date: [],
  approval_user: "",
  reason: "",
  location_during_leave: "",
  return_to_office: "",
  ongoing_task: "",
  temporary_replacement: "",
  phone_number: "",
};

/** `leave_requests.status` as the API stores it. */
export const LEAVE_STATUS = {
  PENDING: 0,
  APPROVED: 1,
  REJECTED: 2,
} as const;

/** Dates travel as `dd-MM-yyyy` strings between the form and the API. */
export const LEAVE_DATE_FORMAT = "dd-MM-yyyy";
