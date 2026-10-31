# Architecture Documentation — HR Lite (leave-management)

> Observation-only snapshot of the codebase on branch `main` after the alignment with `next-prm` / `next-pdi` (October 2026). It describes what is implemented, including what is still thin or waiting on the backend. It does not prescribe changes — that is `docs/RULES.md`.

**Stack**: Next.js 16 (App Router, React 19, TypeScript, `src/` layout), Tailwind CSS v4, shadcn/ui (`radix-luma` style + Hugeicons), Zustand 5, TanStack React Query v5, TanStack Table v8, React Hook Form + Zod v4, Axios, next-intl, next-themes, sonner, date-fns.

**Backend**: `leave-service` (Laravel 12 + Sanctum, sibling repository; production `https://lvr-api.pdi-ptcs.com`), reached over HTTP via `NEXT_PUBLIC_DEV_SERVER_URL` / `NEXT_PUBLIC_PROD_SERVER_URL`. It triggers the WhatsApp bridge `leave-management-wa` for approvals. The three-repo flow is in `docs/integration.md`; what the API still needs is in `docs/backend-task.md`.

**History**: the project started as a Firebase Studio prototype ("CutiKu": Firebase Auth + Realtime Database + a Genkit flow). Those pieces are gone; the app only talks to the leave API now.

---

## 1. Folder Structure

```
src/
├── app/              # App Router: routes, layouts, the /api/me route handler
│   ├── (auth)/       # Sign-in shell + SignIn/SignOut actions
│   ├── (dashboard)/  # The app shell (module rail + module sidebar + header) and every page
│   └── api/me/       # Route handler: identity bootstrap (token cookie → API GET /api/me)
├── components/
│   ├── ui/           # shadcn primitives (CLI-generated) + hugeicons-icon wrapper + shadcn-io/avatar-group
│   └── common/       # Shared app components (inventory in §7)
├── configs/          # environment.ts — the only reader of process.env
├── constants/        # endpoints, params, auth defaults, leave constants, module registry, icon map
├── hooks/            # generic hooks (list params, table query, debounce, auth facade, locale…)
├── i18n/             # next-intl config, per-request locale, namespace registry
├── lib/              # cookies, axios instance, api-error normalisation, status config, utils
├── messages/         # en/ and id/ JSON, one file per namespace
├── provider/         # ReactQueryProvider, ThemeProvider, AuthProvider
├── services/         # auth.service.ts, leave.service.ts — the only Axios callers
├── stores/           # auth.store.ts (Zustand)
├── styles/           # typography.css (type scale), motion.css, launch-ui.css
├── types/            # ambient .d.ts per domain + api.d.ts envelope + table.d.ts
├── validations/      # Zod schemas per domain
└── proxy.ts          # edge request gate (Next 16's middleware)
```

Outside `src/`: `docs/`, `scripts/check-messages.mjs`, `.husky/pre-commit`, `.github/workflows/ci.yml`, `components.json`, `eslint.config.mjs` (type-scale and icon rules), `next.config.ts` (next-intl plugin), `apphosting.yaml` (Firebase App Hosting runtime config, kept for the existing deployment).

---

## 2. Routes

| Route | Group | Page composition | Data |
| --- | --- | --- | --- |
| `/` | — | `redirect("/dashboard")` | — |
| `/dashboard` | `(dashboard)` | `ProfileView`: identity card, employment, contact, account, direct reports | `GetMyProfile` → `GET /api/me/profile` |
| `/leave/dashboard` | `(dashboard)/leave` | `DashboardView`: `MySummary`, `UpcomingLeaves`, `ApproverCard` (when `approver` ≠ null), `OrganizationSummary` (when `organization` ≠ null) | `GetDashboard(year)` |
| `/sign-in` | `(auth)` | `SignInForm` | `SignIn` action → `authService.signIn` |
| `/leave/requests` | `(dashboard)/leave` | `PageHeader` → `LeaveRequestTable` (scope tabs `all · mine · approvals` for approvers with the awaiting-my-decision badge, server-paged `DataTable`, "new request" button → `LeaveRequestFormDialog`, `LeaveDetailSheet`, `CancelLeaveDialog`, `ApprovalDecisionDialog`; `?new=1` opens the form, `?scope=approvals` opens the approver tab) | `GetLeaveTypes`, `GetApprovers`, `CreateLeaveRequest`, `GetLeaveRequests`; shared `GetLeaveRequest`, `CancelLeaveRequest` |
| `/setup/leave-balances` | `(dashboard)` | `PermissionGate(leave.manage_balance)` → `LeaveBalanceTable` (search, department filter, sort by balance) + `SetBalanceDialog` ("save & next" walks the unset rows) + `BalanceHistorySheet` | `GetLeaveBalances`, `SetLeaveBalance`, `GetLeaveBalanceEntries`; the leave form reads `GetMyLeaveBalance` |
| `/setup/master-data/employees`, `/setup/master-data/departments`, `/setup/users`, `/setup/roles`, `/setup/permissions` | `(dashboard)` | `PageHeader` → `PermissionGate(<menu permission>)` → `<x>-table` (search, filters, server-paged `DataTable`) + `<x>-form-dialog` (create/update) + `DeleteDialog`; roles add a detail sheet | `src/app/(dashboard)/setup/**/action.ts` → `setupService`; contract in `docs/setup-module.md` |

Each route has `loading.tsx` (`RouteLoading`) and `error.tsx` (`ErrorState`). `(dashboard)/template.tsx` wraps each page in `PageGate`: one loader until the page's first queries settle, then a single reveal.

**Modules and navigation.** `constants/app-module-constant.ts` registers four modules: Home (`/dashboard`), Appraisal (My Appraisal, Team Appraisals, Reports, Periods — `appraisal.*` permissions), Leave (Dashboard, My Leave — approvers decide there too) and Setup (Employees, Departments, Users, Roles, Permissions, each with its `*.manage` permission). `AppSidebar` draws the module rail plus the active module's menus filtered by `usePermissionTitles`; a module with no visible menu leaves the rail, and a rail icon opens the first menu the user may see. `useModuleLastPaths` remembers the last page per module. `GeneralBreadcrumb` derives crumbs from the pathname and `nav.segments`.

The old `/signup` page (Firebase Auth) and the duplicate `/` dashboard are gone; accounts are created on the API side.

---

## 3. Authentication

```
Browser ── POST (server action) ──▶ SignIn ── authService.signIn ──▶ POST /api/auth/login
                                     │  data = { ...user, token }
                                     │  sets the httpOnly cookie TOKEN_KEY = token
                                     ◀── { status, redirect, user }
Browser ── setAuth(user) · router.push(redirect) · router.refresh()

Every page load:  proxy.ts redirects to /sign-in when the token cookie is missing (except "/" and "/sign-in")
Client bootstrap: AuthProvider → authService.me() → GET /api/me (Next route handler) → Bearer call to the
                  API's GET /api/me → useAuthStore.setAuth(data) | on failure SignOut() + clear()
Every API call:   lib/axios/instance.ts adds Authorization: Bearer <token cookie> and X-Locale
Logout:           NavUser → SignOut(currentUrl) → DELETE /api/auth/logout (401 tolerated) → token cookie removed → clear()
```

- The token never reaches the browser's JavaScript: services run inside Server Actions; the only client-side call (`authService.me()`) hits the same-origin route handler.
- `useAuth()` exposes `user`, `permissions`, `isAuthenticated`, `isInitialized`, `loading`. `permissions` is a map built from the API's `permissions[]` (`leave.request`, `leave.approve`); `lib/permission.ts` (`usePermission`, `usePermissionTitles`) and `common/permission-gate.tsx` read it. Without a list from the API the store assumes `leave.request` only.

---

## 4. Data Flow

```
LeaveRequestTable ── useQuery(["leave","requests"], GetLeaveRequests) ──▶ action.ts ──▶ leaveService.getLeaveRequests ──▶ GET /api/leave-request
LeaveRequestFormDialog ── useQuery(["leave","leave-types"|"approvers"]) ──▶ action.ts ──▶ leaveService.getLeaveTypes / getApprovers
                  ── useMutation(values => CreateLeaveRequest(state, formData)) ──▶ action.ts ──▶ leaveService.createLeaveRequest ──▶ POST /api/leave-request
```

- **Reads are Server Actions too** (`GetLeaveRequests`, `GetLeaveTypes`, `GetApprovers`): they return `response.data` and throw a readable `Error` on failure, so the token stays on the server.
- **Envelope** (`types/api.d.ts`): `{ success?, message?, data }`; lists are plain arrays.
- **Errors** (`lib/api-error.ts`): `toApiErrorState` turns leave-service's 422 `{ success:false, message, data:{field:[…]} }` (or Laravel's `{ message, errors }`) and `{ success:false, message }` into `ActionState` (`errors.<field>` for the form, `errors._form` for a toast).
- **Form → API**: dates travel as `dd-MM-yyyy` strings (`LEAVE_DATE_FORMAT`); `return_to_office` is computed client-side as the next working day after the last selected date; `leave_date[]` is appended per item to `FormData`.
- **After a successful submit** the form resets. The global mutation refresh marks every query stale, so the history, balance and dashboard refetch (RULES "Data freshness").
- **Table** runs `DataTable` in client mode (the API returns the whole list): `meta.sortKey` on LVR no / dates / submitted, `meta.filterKey` on leave type and status, facets counted from the rows.

---

## 5. Services

| File | Methods | Backend |
| --- | --- | --- |
| `auth.service.ts` | `me` (bare axios → `/api/me`), `signIn`, `signOut` | `POST /api/auth/login`, `DELETE /api/auth/logout` |
| `leave.service.ts` | `getLeaveRequests`, `createLeaveRequest`, `getLeaveTypes`, `getApprovers` | `/api/leave-request`, `/api/dropdown/leave-types`, `/api/dropdown/users` |

---

## 6. State

| Store / mechanism | Holds | Written by |
| --- | --- | --- |
| `stores/auth.store.ts` (Zustand) | `user` (refreshed from the API's `/api/me` on every full load), `isAuthenticated`, `isInitialized` | `SignInForm`, `NavUser`, `AuthProvider` |
| React Query cache | leave requests, leave types, approvers | the feature components' `useQuery` |
| `useState` in `LeaveRequestFormDialog` | the selected `Date[]` mirrored into the RHF `leave_date` field | the calendar |
| `useModuleLastPaths` (`localStorage`) | last visited path per module | `AppSidebar` |
| `NEXT_LOCALE` cookie | UI language | `LanguageSwitcher` |

---

## 7. Component Inventory (`components/common/`)

| Component | Purpose |
| --- | --- |
| `data-table.tsx`, `column-filter.tsx` | TanStack table with paging, column visibility, per-column sort/filter (server or client mode) |
| `delete-dialog.tsx` | Confirm + run a delete Server Action; unused today, kept for the next CRUD |
| `form-input.tsx`, `form-select.tsx`, `form-combobox.tsx`, `form-calendar.tsx`, `form-switch.tsx`, `form-multi-select.tsx` | RHF field wrappers with label, required marker, translated `FormMessage` |
| `page-header.tsx` | `type-page-title` + description + optional action slot |
| `error-state.tsx` | Body of every `error.tsx`: title, toast, retry |
| `page-gate.tsx` | `PageGate` (template-level loader/reveal), `RouteLoading` (every `loading.tsx`) |
| `loader.tsx`, `loading-button.tsx`, `spinner-loading.tsx` | Loading states |
| `general-breadcrumb.tsx` | Breadcrumb from the pathname + `nav.segments` |
| `nav-user.tsx`, `avatar-user.tsx` | Header user menu with logout |
| `mode-toggle.tsx`, `language-switcher.tsx`, `flag-icon.tsx` | Theme and language controls in the header |

Each module owns a folder under `app/(dashboard)/`: `dashboard/` (Home), `leave/`, `appraisal/` and `setup/`. The appraisal form (`appraisal/[id]`) is rendered entirely from the template schema the API returns, so a template change in Setup changes the form without code; the PDF comes from the API through the same-origin route handler `app/api/appraisals/[id]/pdf`. Inside `leave/`, every page keeps its own `_components/` (`requests/_components/leave-request-{table,columns,form-dialog}.tsx`, `dashboard/_components/*`), and what several leave pages share sits in `leave/_components/` (`leave-status-badge.tsx`, `leave-detail-sheet.tsx`, `cancel-leave-dialog.tsx`, `approval-decision-dialog.tsx`) with its actions in `leave/action.ts`. A new module gets its own folder and path prefix the same way. The leave calendar blocks weekends and public holidays from `GET /api/holidays/calendar` and marks cuti bersama, which stays selectable (it counts as annual leave); "return to office" skips weekends and public holidays only.

---

## 8. Styling and UI

- `app/globals.css` imports Tailwind v4, `shadcn/tailwind.css`, `tw-animate-css` and `styles/*.css`. Tokens: shadcn variables plus `--green/--green-strong`, `--yellow/--yellow-strong`, `--base-blue`, `--base-red`, `--base-neutral`; primary `#1447e6`, radius `0.625rem`, body `14px` Inter. The `tailwind.config.ts` from the v3 era is gone.
- `styles/typography.css` defines the `type-*` roles (`docs/typography.md`); ESLint rejects `font-bold` and arbitrary font sizes.
- `styles/motion.css`: cards and table rows animate in on mount; all off under `prefers-reduced-motion`.
- Icons: `components/ui/hugeicons-icon.tsx` (2px stroke). `lucide-react` is no longer a dependency.
- Brand: HR Lite. The H-person lettermark lives in `public/hrlite-mark*.svg` and `public/hrlite-app-icon.svg` (favicon); `components/common/brand-logo.tsx` renders it inline (mark and mark + wordmark). Primary `#2563eb` light / `#3b82f6` dark.

---

## 9. i18n

English (`en`, default) and Indonesian (`id`) through next-intl with a cookie locale (`docs/i18n.md`). Namespaces: `common`, `nav`, `auth`, `leave`, `dashboard`, `setup`. Zod messages and server-action fallbacks are message keys. `npm run check:messages` keeps `en` and `id` in parity. The Axios instance sends `X-Locale`; the API ignores it until `docs/backend-task.md` §5 is done.

---

## 10. Tooling

- `npm run lint` — ESLint 9 flat config: `eslint-config-next` + TypeScript, plus the type-scale rule and the Hugeicons import rule. `next.config.ts` no longer ignores type or lint errors.
- `npm run build` — Next build; also the TypeScript check.
- `.husky/pre-commit` runs lint and build; `.github/workflows/ci.yml` runs them on pull requests into `main`.
- `.claude/launch.json` lets the Claude desktop app start the dev server on port 9002.

---

## 11. Observations (known gaps, not rules)

- **Notifications** from the old header were dummy data and were removed; there is no notification endpoint.
- **Calendar export** (`.ics` download) from the prototype was already disabled and was not carried over.
- **History list** is unpaginated; sorting and filtering happen in the browser.
- **Dev-only console warning** on a full page load: "Can't perform a React state update on a component that hasn't mounted yet". It does not fire on client-side navigation and has no visible effect; it most likely comes from the `PageGate` / `RouteLoading` handshake at hydration (same code as `next-prm`). Worth a look when touching `page-gate.tsx`.
- **API host**: the old `.env` pointed at the frontend's own domain (`lvr.pdi-ptcs.com/api`), which is why every call 404'd; the API lives at `lvr-api.pdi-ptcs.com`.
