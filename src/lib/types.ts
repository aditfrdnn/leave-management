import type { CheckLeaveRequestOutput } from "@/ai/flows/automatic-reasonableness-check";

export type LeaveRequestStatus =
  | "Approved"
  | "Issues Found"
  | "Pending Review"
  | "Rejected";

export type LeaveRequest = {
  id: string;
  subject: string;
  start_date: Date;
  end_date: Date;
  reason: string;
  status: LeaveRequestStatus;
  aiResponse: CheckLeaveRequestOutput | null;
  approver: string;
  location_during_leave: string;
  ongoing_task: string;
  temporary_replacement: string;
  phone_number: string;
  return_to_office: Date;
  userId: string;
  createdAt?: string; // Stored as ISO string
};

export type LeaveRequestDocument = Omit<
  LeaveRequest,
  "id" | "start_date" | "end_date" | "return_to_office"
> & {
  start_date: string; // ISO Date
  end_date: string; // ISO Date
  return_to_office: string; // ISO Date
  createdAt: object; // ServerValue.TIMESTAMP
};

export type Approver = {
  id: string;
  name: string;
  email: string;
  userId: string;
};
