# Architecture Documentation — LVR System (leave-management)

> Observation-only snapshot of the codebase on branch `main` after the alignment with `next-prm` / `next-pdi` (October 2026). It describes what is implemented, including what is still thin or waiting on the backend. It does not prescribe changes — that is `docs/RULES.md`.

**Stack**: Next.js 16 (App Router, React 19, TypeScript, `src/` layout), Tailwind CSS v4, shadcn/ui (`radix-luma` style + Hugeicons), Zustand 5, TanStack React Query v5, TanStack Table v8, React Hook Form + Zod v4, Axios, next-intl, next-themes, sonner, date-fns.

**Backend**: the leave API (a Laravel service; its repository is not in this workspace), reached over HTTP via `NEXT_PUBLIC_DEV_SERVER_URL` / `NEXT_PUBLIC_PROD_SERVER_URL`. What it supports today, and what the frontend still needs, is recorded in `docs/backend-task.md`.

**History**: the project started as a Firebase Studio prototype ("CutiKu": Firebase Auth + Realtime Database + a Genkit flow). Those pieces are gone; the app only talks to the leave API now.

---

## 1. Folder Structure

```
src/
├── app/              # App Router: routes, layouts, the /api/me route handler
│   ├── (auth)/       # Sign-in shell + SignIn/SignOut actions
│   ├── (dashboard)/  # The app shell (module rail + module sidebar + header) and every page
│   └── api/me/       # Route handler: identity bootstrap from the httpOnly cookies
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
| `/` | — | `redirect("/leave-requests")` | — |
| `/sign-in` | `(auth)` | `SignInForm` | `SignIn` action → `authService.signIn` |
| `/leave-requests` | `(dashboard)` | `PageHeader` → `LeaveRequestForm` (2/5) + `LeaveRequestTable` (3/5) | `GetLeaveTypes`, `GetApprovers`, `CreateLeaveRequest`, `GetLeaveRequests` |

The route has `loading.tsx` (`RouteLoading`) and `error.tsx` (`ErrorState`). `(dashboard)/template.tsx` wraps each page in `PageGate`: one loader until the page's first queries settle, then a single reveal.

**Modules and navigation.** `constants/app-module-constant.ts` registers one module — Leave (`/leave-requests`, menu "My Leave Requests"). `AppSidebar` draws the module rail plus the active module's menu (no permission filter yet). `useModuleLastPaths` remembers the last page per module. `GeneralBreadcrumb` derives crumbs from the pathname and `nav.segments`.

The old `/signup` page (Firebase Auth) and the duplicate `/` dashboard are gone; accounts are created on the API side.

---

## 3. Authentication

```
Browser ── POST (server action) ──▶ SignIn ── authService.signIn ──▶ POST /api/auth/login
                                     │  data = { ...user, token }
                                     │  sets httpOnly cookies: TOKEN_KEY = token, USER_KEY = user (JSON)
                                     ◀── { status, redirect, user }
Browser ── setAuth(user) · router.push(redirect) · router.refresh()

Every page load:  proxy.ts redirects to /sign-in when the token cookie is missing (except "/" and "/sign-in")
Client bootstrap: AuthProvider → authService.me() → GET /api/me (route handler) → returns the USER_KEY cookie
                  while the token cookie exists → useAuthStore.setAuth(data) | on failure SignOut() + clear()
Every API call:   lib/axios/instance.ts adds Authorization: Bearer <token cookie> and X-Locale
Logout:           NavUser → SignOut(currentUrl) → both cookies removed → clear()  (no API logout endpoint yet)
```

- The token never reaches the browser's JavaScript: services run inside Server Actions; the only client-side call (`authService.me()`) hits the same-origin route handler.
- The user cookie is a stop-gap for the missing `GET /api/me`; when the API has it, `app/api/me/route.ts` forwards the token the way `next-pdi` does and `setUserCookie` goes away.
- `useAuth()` exposes `user`, `isAuthenticated`, `isInitialized`, `loading`. There is no permission map yet.

---

## 4. Data Flow

```
LeaveRequestTable ── useQuery(["leave","requests"], GetLeaveRequests) ──▶ action.ts ──▶ leaveService.getLeaveRequests ──▶ GET /api/leave-request
LeaveRequestForm  ── useQuery(["leave","leave-types"|"approvers"]) ──▶ action.ts ──▶ leaveService.getLeaveTypes / getApprovers
                  ── useMutation(values => CreateLeaveRequest(state, formData)) ──▶ action.ts ──▶ leaveService.createLeaveRequest ──▶ POST /api/leave-request
```

- **Reads are Server Actions too** (`GetLeaveRequests`, `GetLeaveTypes`, `GetApprovers`): they return `response.data` and throw a readable `Error` on failure, so the token stays on the server.
- **Envelope** (`types/api.d.ts`): `{ success?, message?, data }`; lists are plain arrays.
- **Errors** (`lib/api-error.ts`): `toApiErrorState` turns Laravel's 422 `{ message, errors }` or `{ success:false, message }` into `ActionState` (`errors.<field>` for the form, `errors._form` for a toast).
- **Form → API**: dates travel as `dd-MM-yyyy` strings (`LEAVE_DATE_FORMAT`); `return_to_office` is computed client-side as the next working day after the last selected date; `leave_date[]` is appended per item to `FormData`.
- **After a successful submit** the form resets and `["leave","requests"]` is invalidated, so the history refetches.
- **Table** runs `DataTable` in client mode (the API returns the whole list): `meta.sortKey` on LVR no / dates / submitted, `meta.filterKey` on leave type and status, facets counted from the rows.

---

## 5. Services

| File | Methods | Backend |
| --- | --- | --- |
| `auth.service.ts` | `me` (bare axios → `/api/me`), `signIn` | `POST /api/auth/login` |
| `leave.service.ts` | `getLeaveRequests`, `createLeaveRequest`, `getLeaveTypes`, `getApprovers` | `/api/leave-request`, `/api/dropdown/leave-types`, `/api/dropdown/users` |

---

## 6. State

| Store / mechanism | Holds | Written by |
| --- | --- | --- |
| `stores/auth.store.ts` (Zustand) | `user`, `isAuthenticated`, `isInitialized` | `SignInForm`, `NavUser`, `AuthProvider` |
| React Query cache | leave requests, leave types, approvers | the feature components' `useQuery` |
| `useState` in `LeaveRequestForm` | the selected `Date[]` mirrored into the RHF `leave_date` field | the calendar |
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

Feature-only components live in `app/(dashboard)/leave-requests/_components/`: `leave-request-form.tsx`, `leave-request-table.tsx`, `leave-request-columns.tsx`, `leave-status-badge.tsx`.

---

## 8. Styling and UI

- `app/globals.css` imports Tailwind v4, `shadcn/tailwind.css`, `tw-animate-css` and `styles/*.css`. Tokens: shadcn variables plus `--green/--green-strong`, `--yellow/--yellow-strong`, `--base-blue`, `--base-red`, `--base-neutral`; primary `#1447e6`, radius `0.625rem`, body `14px` Inter. The `tailwind.config.ts` from the v3 era is gone.
- `styles/typography.css` defines the `type-*` roles (`docs/typography.md`); ESLint rejects `font-bold` and arbitrary font sizes.
- `styles/motion.css`: cards and table rows animate in on mount; all off under `prefers-reduced-motion`.
- Icons: `components/ui/hugeicons-icon.tsx` (2px stroke). `lucide-react` is no longer a dependency.
- Logo: `public/lvr.png`.

---

## 9. i18n

English (`en`, default) and Indonesian (`id`) through next-intl with a cookie locale (`docs/i18n.md`). Namespaces: `common`, `nav`, `auth`, `leave`. Zod messages and server-action fallbacks are message keys. `npm run check:messages` keeps `en` and `id` in parity. The Axios instance sends `X-Locale`; the API ignores it until `docs/backend-task.md` §5 is done.

---

## 10. Tooling

- `npm run lint` — ESLint 9 flat config: `eslint-config-next` + TypeScript, plus the type-scale rule and the Hugeicons import rule. `next.config.ts` no longer ignores type or lint errors.
- `npm run build` — Next build; also the TypeScript check.
- `.husky/pre-commit` runs lint and build; `.github/workflows/ci.yml` runs them on pull requests into `main`.
- `.claude/launch.json` lets the Claude desktop app start the dev server on port 9002.

---

## 11. Observations (known gaps, not rules)

- **Identity** relies on a user cookie written at login because the API has no `GET /api/me`; a profile change on the server is not seen until the next login.
- **No logout endpoint**: the token stays valid on the server after sign-out until it expires (6 h cookie lifetime on the client).
- **Notifications** from the old header were dummy data and were removed; there is no notification endpoint.
- **Calendar export** (`.ics` download) from the prototype was already disabled and was not carried over.
- **History list** is unpaginated; sorting and filtering happen in the browser.
- **API host**: at the time of writing the configured host answers 404 for every endpoint the app calls, so the smoke test could only verify the sign-in page, the shell and the error state (`docs/backend-task.md`).
- **Approvals**: the approver side (list of requests to approve, approve/reject) has no endpoint yet, so there is no approver page.
