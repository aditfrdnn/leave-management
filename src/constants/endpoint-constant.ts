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
const leaveApprove = (id: number | string) => `${leaveRequests}/${id}/approve`;
const leaveReject = (id: number | string) => `${leaveRequests}/${id}/reject`;

// Dropdowns
const approvers = "/api/dropdown/users";
const departmentOptions = "/api/dropdown/departments";
const roleOptions = "/api/dropdown/roles";
const employeeOptions = "/api/dropdown/employees";

// Dashboard
const dashboard = "/api/dashboard";

// Annual leave balance (docs/setup-module.md §10)
const leaveBalances = "/api/leave-balances";
const leaveBalance = (employeeId: number | string) => `${leaveBalances}/${employeeId}`;
const leaveBalanceEntries = (employeeId: number | string) => `${leaveBalances}/${employeeId}/entries`;
const myLeaveBalance = "/api/leave-balance/me";

// Holidays (docs/setup-module.md §12)
const holidays = "/api/holidays";
const holiday = (id: number | string) => `${holidays}/${id}`;
const holidayCalendar = `${holidays}/calendar`;

// Profile (§11)
const myProfile = "/api/me/profile";
/** GET / POST (multipart `signature`) / DELETE: the signed-in user's image signature. */
const mySignature = "/api/me/signature";

// Appraisal (docs/appraisal-module.md)
const appraisalTemplates = "/api/appraisal-templates";
const appraisalTemplate = (id: number | string) => `${appraisalTemplates}/${id}`;
const appraisalTemplateDuplicate = (id: number | string) => `${appraisalTemplates}/${id}/duplicate`;
const appraisalPeriods = "/api/appraisal-periods";
const appraisalPeriod = (id: number | string) => `${appraisalPeriods}/${id}`;
const appraisalPeriodClose = (id: number | string) => `${appraisalPeriods}/${id}/close`;
const appraisalPeriodReopen = (id: number | string) => `${appraisalPeriods}/${id}/reopen`;
const appraisals = "/api/appraisals";
const appraisal = (id: number | string) => `${appraisals}/${id}`;
const appraisalAnswers = (id: number | string) => `${appraisals}/${id}/answers`;
const appraisalAction = (id: number | string, action: "submit" | "return" | "assess") => `${appraisals}/${id}/${action}`;
/** The leave API's PDF endpoint, called by the same-origin route handler `app/api/appraisals/[id]/pdf`. */
const appraisalPdfBackend = (id: number | string) => `${appraisals}/${id}/pdf`;
/** Same-origin route handler (token cookie → Bearer); what the browser downloads. */
const appraisalPdf = (id: number | string) => `/api/appraisals/${id}/pdf`;

// Setup (docs/setup-module.md)
const users = "/api/users";
const user = (id: number | string) => `${users}/${id}`;
const employees = "/api/employees";
const employee = (id: number | string) => `${employees}/${id}`;
const employeeCareers = (id: number | string) => `${employees}/${id}/careers`;
const employeeCareer = (id: number | string, careerId: number | string) => `${employees}/${id}/careers/${careerId}`;
const departments = "/api/departments";
const department = (id: number | string) => `${departments}/${id}`;
const roles = "/api/roles";
const role = (id: number | string) => `${roles}/${id}`;
const permissions = "/api/permissions";
const permission = (id: number | string) => `${permissions}/${id}`;
const permissionGroups = `${permissions}/groups`;

export {
  signIn,
  signOut,
  me,
  meBackend,
  leaveRequests,
  leaveRequest,
  leaveRequestCancel,
  leaveApprove,
  leaveReject,
  approvers,
  departmentOptions,
  roleOptions,
  employeeOptions,
  dashboard,
  leaveBalances,
  leaveBalance,
  leaveBalanceEntries,
  myLeaveBalance,
  holidays,
  holiday,
  holidayCalendar,
  myProfile,
  mySignature,
  appraisalTemplates,
  appraisalTemplate,
  appraisalTemplateDuplicate,
  appraisalPeriods,
  appraisalPeriod,
  appraisalPeriodClose,
  appraisalPeriodReopen,
  appraisals,
  appraisal,
  appraisalAnswers,
  appraisalAction,
  appraisalPdfBackend,
  appraisalPdf,
  users,
  user,
  employees,
  employee,
  employeeCareers,
  employeeCareer,
  departments,
  department,
  roles,
  role,
  permissions,
  permission,
  permissionGroups,
};
