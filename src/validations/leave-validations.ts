import { z } from "zod";

export const leaveRequestSchema = z.object({
  subject: z.string().min(1, { message: "Please enter a LVR Number." }),
  leave_type: z.string({ required_error: "Please select a leave type." }),
  leave_date: z
    .array(z.string())
    .min(1, { message: "Please select at least one date." }),
  approval_user: z.string({ required_error: "Please select an approver." }),
  reason: z
    .string()
    .min(10, { message: "Reason must be at least 10 characters." })
    .max(200, { message: "Reason must not exceed 200 characters." }),
  location_during_leave: z
    .string()
    .min(2, { message: "Location must be at least 2 characters." }),
  return_to_office: z.string({
    required_error: "Please select a return date.",
  }),
  ongoing_task: z
    .string()
    .min(10, { message: "Please list your ongoing tasks." }),
  temporary_replacement: z
    .string()
    .min(2, { message: "Please enter a personel name for replacement." }),
  phone_number: z
    .string()
    .min(10, { message: "Please provide a valid phone number." }),
});

export type LeaveRequestSchemaType = z.infer<typeof leaveRequestSchema>;
