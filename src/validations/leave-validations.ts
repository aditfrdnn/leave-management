import { z } from "zod";

export const leaveRequestSchema = z.object({
  subject: z.string().trim().min(1, "leave.validation.subjectRequired"),
  leave_type: z.string().min(1, "leave.validation.leaveTypeRequired"),
  leave_date: z.array(z.string()).min(1, "leave.validation.leaveDateRequired"),
  approval_user: z.string().min(1, "leave.validation.approverRequired"),
  reason: z.string().trim().min(10, "leave.validation.reasonMin").max(200, "leave.validation.reasonMax"),
  location_during_leave: z.string().trim().min(2, "leave.validation.locationMin"),
  return_to_office: z.string().min(1, "leave.validation.returnRequired"),
  ongoing_task: z.string().trim().min(10, "leave.validation.ongoingTaskMin"),
  temporary_replacement: z.string().trim().min(2, "leave.validation.replacementMin"),
  phone_number: z.string().trim().min(10, "leave.validation.phoneMin"),
});

export type LeaveRequestSchemaType = z.infer<typeof leaveRequestSchema>;
