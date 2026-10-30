// Every backend path lives here (see docs/RULES.md §6). Paths are relative to the leave API base URL.

// Auth
const signIn = "/api/auth/login";
const signOut = "/api/auth/logout";
/** Same-origin Route Handler (`src/app/api/me/route.ts`), not the leave API. */
const me = "/api/me";
/** The leave API endpoint behind that handler (`GET /api/me`, auth:sanctum). */
const meBackend = "/api/me";

// Leave requests
const leaveRequests = "/api/leave-request";
const leaveRequest = (id: number | string) => `${leaveRequests}/${id}`;
const leaveRequestCancel = (id: number | string) => `${leaveRequests}/${id}/cancel`;

// Approvals (the signed-in user as approver)
const leaveApprovals = `${leaveRequests}/approvals`;
const leaveApprove = (id: number | string) => `${leaveRequests}/${id}/approve`;
const leaveReject = (id: number | string) => `${leaveRequests}/${id}/reject`;

// Dropdowns
const leaveTypes = "/api/dropdown/leave-types";
const approvers = "/api/dropdown/users";

export {
  signIn,
  signOut,
  me,
  meBackend,
  leaveRequests,
  leaveRequest,
  leaveRequestCancel,
  leaveApprovals,
  leaveApprove,
  leaveReject,
  leaveTypes,
  approvers,
};
