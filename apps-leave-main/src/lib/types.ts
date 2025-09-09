import type { CheckLeaveRequestOutput } from '@/ai/flows/automatic-reasonableness-check';

export type LeaveRequestStatus = 'Approved' | 'Issues Found' | 'Pending Review' | 'Rejected';

export type LeaveRequest = {
  id: string;
  startDate: Date;
  endDate: Date;
  reason: string;
  status: LeaveRequestStatus;
  aiResponse: CheckLeaveRequestOutput | null;
  approver: string;
  location: string;
  ongoingTasks: string;
  replacementPerson: string;
  phoneNumber: string;
  returnDate: Date;
  userId: string;
  createdAt?: string; // Stored as ISO string
};

export type LeaveRequestDocument = Omit<LeaveRequest, 'id' | 'startDate' | 'endDate' | 'returnDate'> & {
  startDate: string; // ISO Date
  endDate: string; // ISO Date
  returnDate: string; // ISO Date
  createdAt: object; // ServerValue.TIMESTAMP
};

export type Approver = {
  id: string;
  name: string;
  email: string;
  userId: string;
};
