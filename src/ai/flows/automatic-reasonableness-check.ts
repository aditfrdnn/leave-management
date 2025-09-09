'use server';

/**
 * @fileOverview This file defines a Genkit flow for automatically checking the reasonableness of a leave request
 * against company policies.
 *
 * The flow takes a leave request as input, checks it against company policies using an LLM,
 * and returns a report indicating whether the request is reasonable and any issues found.
 *
 * @param {CheckLeaveRequestInput} input - The input data for the leave request.
 * @returns {Promise<CheckLeaveRequestOutput>} - A promise that resolves to the report on the leave request's reasonableness.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CheckLeaveRequestInputSchema = z.object({
  employeeId: z.string().describe('The ID of the employee making the leave request.'),
  startDate: z.string().describe('The start date of the leave request (YYYY-MM-DD).'),
  endDate: z.string().describe('The end date of the leave request (YYYY-MM-DD).'),
  reason: z.string().describe('The reason for the leave request.'),
  location: z.string().describe('Location during the leave.'),
  returnDate: z.string().describe('The date of return to the office (YYYY-MM-DD).'),
  ongoingTasks: z.string().describe('List of ongoing tasks during the leave.'),
  replacementPerson: z.string().describe('The person designated as a temporary replacement.'),
  phoneNumber: z.string().describe('Contact phone number during the leave.'),
  approver: z.string().describe('The person who will approve the leave request.'),
});

export type CheckLeaveRequestInput = z.infer<typeof CheckLeaveRequestInputSchema>;

const ReasonablenessIssueSeveritySchema = z.enum(['critical', 'urgent', 'normal']);

const CheckLeaveRequestOutputSchema = z.object({
  isReasonable: z.boolean().describe('Whether the leave request is reasonable according to company policy.'),
  issues: z.array(
    z.object({
      message: z.string().describe('A message describing the issue with the leave request.'),
      severity: ReasonablenessIssueSeveritySchema.describe(
        'The severity of the issue. If the issue is critical, the request cannot be approved. If the issue is urgent, the request should be reviewed by a manager. If the issue is normal, the employee should be informed of the issue.'
      ),
    })
  ).describe('A list of issues found with the leave request, if any.'),
});

export type CheckLeaveRequestOutput = z.infer<typeof CheckLeaveRequestOutputSchema>;

export async function checkLeaveRequest(input: CheckLeaveRequestInput): Promise<CheckLeaveRequestOutput> {
  // This function is no longer calling the AI flow.
  // It now returns a default "reasonable" response to maintain the type signature.
  // The actual status will be set to 'Pending Review' in the server action.
  return Promise.resolve({
    isReasonable: true,
    issues: [],
  });
}
