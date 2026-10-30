// Every backend path lives here (see docs/RULES.md §6). Paths are relative to the leave API base URL.

// Auth
const signIn = "/api/auth/login";
const signOut = "/api/auth/logout";
/** Same-origin Route Handler (`src/app/api/me/route.ts`), not the leave API. */
const me = "/api/me";

// Leave requests
const leaveRequests = "/api/leave-request";

// Dropdowns
const leaveTypes = "/api/dropdown/leave-types";
const approvers = "/api/dropdown/users";

export { signIn, signOut, me, leaveRequests, leaveTypes, approvers };
