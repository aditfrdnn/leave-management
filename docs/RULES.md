# RULES.md — HR Lite (leave-management)

> Binding engineering rules for this repository. They are the same rules as `next-prm`'s and `next-pdi`'s `docs/RULES.md`, with this project's domain and backend filled in, so code and components move between the two projects without translation. `docs/ARCHITECTURE.md` describes what exists; this file says what is allowed.

---

# 1. Project Goal

**HR Lite** is a Next.js frontend (thin client + BFF) in front of the leave API (a Laravel service reached over HTTP). An employee signs in, submits a leave request — dates, leave type, approver, reason, location, hand-over, replacement, phone — and follows the status of every request they sent.

Three modules, one shell (`src/app/(dashboard)`): **Home** (`/dashboard`), **Leave** (`/leave-requests`, `/approvals`) and **Setup** (`/setup/**`, contract in `docs/setup-module.md`). Notifications join the same shell when the API grows (see `docs/backend-task.md`). The rules below keep that growth consistent.

---

# 2. Tech Stack

This is the full, current stack. **Do not add a new library** (state management, data fetching, forms, HTTP client, UI kit, animation, charting, icons…) without an explicit decision — this app already has one sanctioned tool per concern.

| Concern              | Library                                                           | Notes                                   |
| -------------------- | ----------------------------------------------------------------- | --------------------------------------- |
| Framework            | Next.js 16 (App Router), React 19, TypeScript                     | `src/` layout, `@/*` → `src/*`          |
| Styling              | Tailwind CSS v4                                                   | see §11                                 |
| UI kit               | shadcn/ui (`radix-luma` style) + Radix primitives                 | configured in `components.json`         |
| Icons                | Hugeicons, through `components/ui/hugeicons-icon.tsx`             | ESLint rejects the raw import; no lucide |
| Global state         | Zustand 5                                                         | `stores/auth.store.ts` only, see §8     |
| Server-cache / reads | TanStack React Query v5                                           | see §8                                  |
| Tables               | TanStack Table v8                                                 | via `common/DataTable`                  |
| Forms                | React Hook Form + `@hookform/resolvers/zod`                       | see §9                                  |
| Validation           | Zod v4                                                            | see §9                                  |
| HTTP client          | Axios (one shared instance)                                       | see §6                                  |
| Theming              | next-themes                                                       | `provider/theme-provider.tsx`           |
| Toasts/feedback      | sonner                                                            | see §13                                 |
| Dates                | date-fns + `Intl`                                                 | `lib/utils/utils.ts`, `hooks/use-date-locale.ts` |
| i18n (EN / ID)       | next-intl (cookie locale, no i18n routing)                        | see `docs/i18n.md`                      |
| Motion               | `motion` (only inside `components/ui/shadcn-io/avatar-group`)     | page/row/card motion is CSS (`styles/motion.css`) |

**Installed for a vendored widget only — do not build new features on it:** `motion` (used by `components/ui/shadcn-io/avatar-group`). Page, row and card motion is CSS (`styles/motion.css`).

---

# 3. Architecture Rules

### Layering

```
Page / Layout   (src/app/**/page.tsx, layout.tsx)
      ↓ renders
Feature Component   (**/_components/*.tsx)
      ↓ reads via useQuery(Action) · writes via a Server Action
Server Action (action.ts)  ──────────→  Service (services/<domain>.service.ts)
                                              ↓ calls
                                   API Client (lib/axios/instance.ts)
                                              ↓ HTTP
                                        Leave API (Laravel)
```

- **Page/Layout** — composes Feature Components. Owns route params, not business logic. Pages are Server Components unless they need a hook.
- **Feature Component** — owns presentation, local UI state and the `useQuery` / mutation wiring for one feature.
- **Server Action** (`action.ts`) — validates a mutation's input (Zod `safeParse`), calls a **Service**, normalizes errors into `ActionState`. Reads (`GetXs`) are also actions so the token never leaves the server. It does not talk to Axios directly.
- **Service** (`services/<domain>.service.ts`) — the only place allowed to call the API Client. One function per backend endpoint, returning the API envelope already unwrapped from Axios (`response.data`).
- **API Client** (`lib/axios/instance.ts`) — the only Axios instance. Owns base URL, headers, timeout, the Bearer-token and `X-Locale` interceptors.

### Dependency direction

Dependencies flow one way, top to bottom:

- `services/`, `lib/`, `types/`, `constants/`, `validations/`, `i18n/` never import from `app/`, `components/`, `provider/` or `stores/` (no exceptions today).
- `components/ui/` never imports from `components/common/`, any `_components/`, `app/`, `services/` or `stores/`. It is the CLI-generated shadcn layer.
- `components/common/` may depend on `components/ui/`, `lib/`, `types/`, `hooks/`, `constants/` — never on a feature's `_components/`.
- A feature's `_components/` may depend on everything below it and on its own `action.ts` — never on another feature's `_components/`. Two features needing the same piece promote it to `common/` (that is how `page-header.tsx` and `error-state.tsx` got there).

### Forbidden dependencies

- No component may import `next/headers` or call `cookies()`. Only `lib/cookies.ts`, Server Actions and Route Handlers touch cookies.
- No component or action may build a URL by concatenating a path — endpoint paths come from `constants/endpoint-constant.ts`.
- No component or action may call `instance` or `axios` directly. The two sanctioned exceptions are `authService.me()` and `app/api/me/route.ts` (same-origin identity bootstrap).
- `components/ui/` primitives are not edited to embed app copy, endpoints or business logic — wrap them in `common/` or a feature component.

---

# 4. Folder Structure Rules

| Adding…                                 | Goes in…                                                                                                  |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| A new route                             | `src/app/(dashboard)/<module>/<feature>/page.tsx` + `loading.tsx` + `error.tsx`                           |
| A component used by exactly one feature | `<route>/_components/<name>.tsx`                                                                          |
| A component used by 2+ features         | `src/components/common/<name>.tsx`                                                                        |
| A new UI primitive                      | `src/components/ui/` via the shadcn CLI / registries in `components.json`, never hand-authored            |
| A feature's actions (reads + mutations) | `<route>/action.ts` (singular). Actions shared by a module's routes: `<module>/action.ts`                 |
| A backend call                          | A method on `services/<domain>.service.ts` (`auth`, `leave`), exported through `services/index.ts`     |
| Cross-tree client state                 | `src/stores/<domain>.store.ts`, registered in `stores/index.ts`                                           |
| A Zod schema                            | `src/validations/<domain>-validations.ts`                                                                 |
| A domain type                           | `src/types/<domain>.d.ts`, exported through `types/index.ts`                                              |
| An API path                             | `src/constants/endpoint-constant.ts`                                                                      |
| A hook                                  | `src/hooks/use-<name>.ts` (flat), registered in `hooks/index.ts`                                          |
| A menu or module                        | `src/constants/app-module-constant.ts` + `nav.json` keys                                                  |
| User-visible text                       | `src/messages/{en,id}/<namespace>.json` (`docs/i18n.md`)                                                  |

- A new **route group** is warranted only for a distinct root layout, as `(auth)` and `(dashboard)` are.
- A new **top-level `src/` folder** is exceptional: `app`, `components`, `configs`, `constants`, `hooks`, `i18n`, `lib`, `messages`, `provider`, `services`, `stores`, `styles`, `types`, `validations` plus `proxy.ts` cover every concern this app has.
- Do not create `src/features/`; feature code lives in the route that owns it. Do not split `components/common/` into subfolders. Do not add loose files directly under `components/`.

---

# 5. Component Rules

**Shared UI (`components/ui/`)** — shadcn/Radix primitives only. No business logic, no data fetching, no app copy.

**Feature UI (`_components/`)** — one feature's presentation and wiring. A CRUD feature is three files: `<x>-table.tsx` (Card + search + create button + `DataTable` + dialogs), `<x>-columns.tsx` (a `ColumnDef` factory that takes the translator and callbacks) and `<x>-form-dialog.tsx` (one dialog for create and update). `src/app/(dashboard)/leave-requests` is the reference implementation here; for a full CRUD (dialog + delete) copy `next-pdi`'s `src/app/(dashboard)/setup/roles`.

**Layout** — one per route segment that needs a distinct shell: root, `(auth)`, `(dashboard)`. `(dashboard)/template.tsx` wraps every page in `PageGate` (one loader, then one reveal).

**Composition** — build feature UI from `common/` + `ui/` (`FormInput`, `FormSelect`, `FormCombobox`, `FormCalendar`, `FormSwitch`, `DataTable`, `DeleteDialog`, `PageHeader`, `SectionLoader`, `ErrorState`), not from Radix primitives directly.

**Reuse strategy** — before writing a component: (1) check `docs/ARCHITECTURE.md` §7's inventory, (2) check `components/ui/`, (3) only then write it, and in `common/` if two features will use it.

---

# 6. API Rules

**Services** are the only layer allowed to call the API Client:

```ts
export const xService = {
  async getXs(params: TXListParams) {
    const { data } = await instance.get<TApiPaginated<TX>>(xs, { params: toQueryParams(params) });
    return data; // the envelope: { success, message, data }
  },
};
```

**The envelope** (`types/api.d.ts`): the leave API answers `{ success?, message?, data }`; lists are plain arrays in `data` (no paginator yet). Actions return `response.data` so components never see the envelope.

**Actions** (`action.ts`, file-level `"use server"`) come in two shapes:

- Reads: `GetXs(params)` calls the service and returns `response.data`; on failure it throws `new Error(toApiErrorMessage(error, fallback))` so `useQuery` surfaces it.
- Mutations: `CreateX / UpdateX / DeleteX(prevState, formData)` parse `FormData` with the domain's Zod schema, call the service and return `ActionState` (`types/action-state.d.ts`). Every failure goes through `toApiErrorState` / `toFormErrorState` (`lib/api-error.ts`), which understands both Laravel's 422 `{ message, errors }` and the controller's `{ success: false, message }`.

Fallback messages are translated on the server with `getTranslations("<namespace>")`.

**Never bypass the API layer.** No hardcoded backend URLs, no `fetch()` to Laravel, no cookie reads outside `lib/cookies.ts`.

---

# 7. Authentication Rules

Do not change this flow; extend features on top of it.

- **Session storage**: one httpOnly cookie named by `environment.TOKEN_KEY` holds the bearer token, read/set/removed only through `lib/cookies.ts`. Never in `localStorage`, a readable cookie or Zustand.
- **Login**: `SignInForm` → `useActionState(SignIn)` → `(auth)/actions.ts` validates with `signInSchema`, calls `authService.signIn` (`POST /api/auth/login`, `data` = user + `token`), stores the token and the user, returns `{ status, redirect, user }`. The client calls `useAuthStore.setAuth(user)`, `setInitialized(true)`, `router.push(redirect)`, `router.refresh()`.
- **Logout**: `NavUser` → `SignOut(currentUrl)` clears both cookies (the API has no logout endpoint yet) → `useAuthStore.clear()`. `AuthProvider` also signs out when its identity check fails.
- **Route protection**: `src/proxy.ts` redirects on the cookie's presence for every route except `PUBLIC_ROUTES` (`/`, `/sign-in`). Do not weaken this.
- **Identity bootstrap**: `AuthProvider` calls `authService.me()` → `app/api/me/route.ts` (server-side cookie → Bearer call to the API's `GET /api/me`) → `useAuthStore.setAuth(data)`.
- **Reading auth state**: `useAuth()` (`user`, `permissions`, `isAuthenticated`, `isInitialized`, `loading`). Call store actions directly only from the login/logout flows.
- **Permissions**: `constants/permission-constant.ts` lists the keys the API sends (`leave.request`, `leave.approve`); `lib/permission.ts` exposes `usePermission` / `usePermissionTitles`; a menu declares `permission` and a page wraps its content in `common/permission-gate.tsx`. Hiding UI is not authorisation — the API enforces every rule again.

---

# 8. State Management Rules

| Use…                         | When…                                                                                                                                                                  | Not for…                                              |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| **React Query** (`useQuery`) | Any read of server data in a client component. Put every input in `queryKey` (`["leave", "requests"]`, `["leave", "leave-types"]`): `staleTime` is `Infinity` and nothing refetches on its own. | Raw `fetch`/`instance` in a component.                |
| **`useMutation`**            | Only as the wrapper around a Server Action in a form dialog (see §9), so pending/error/success wiring is uniform.                                                       | Calling the API directly in `mutationFn`.             |
| **Zustand**                  | State visible outside a subtree and across routes: the auth session. Select narrow slices (`useAuthStore((s) => s.user)`).                                             | Feature-local UI state.                               |
| **`useState` / RHF**         | Dialog open/close, filters, page/limit (`useListParams`), all form fields.                                                                                             | Anything another route needs.                         |
| **Server Actions**           | The only mechanism that writes.                                                                                                                                        | —                                                     |

**After a mutation succeeds** call `queryClient.invalidateQueries` for the exact key (`LEAVE_REQUESTS_QUERY_KEY`) or the owning query's `refetch`. `router.refresh()` is for auth state only.

---

# 9. Form Rules

- `useForm<SchemaType>({ resolver: zodResolver(schema), defaultValues, values })` — `values` makes one dialog serve create and update.
- Fields are the `common/Form*` wrappers (`FormInput`, `FormSelect`, `FormCombobox`, `FormCalendar`, `FormSwitch`, `FormMultiSelect`); each wires label, required marker and `<FormMessage/>`. Never wire a raw `ui/` primitive to `FormField` by hand when a wrapper exists.
- Submit: `useMutation({ mutationFn: (values) => action({ status: "idle" }, buildFormData(values)) })`; throw the returned state when `status === "error"`, map `errors.<field>` to `form.setError`, toast `errors._form[0]`. Reference: `leave-requests/_components/leave-request-form.tsx`. Login and `DeleteDialog` use `useActionState` directly.
- Server Actions receive `FormData`, not JSON. Arrays are appended per item (`formData.append("leave_date", date)` and `formData.getAll("leave_date")`).
- **Validate twice, by design**: the same Zod schema drives `zodResolver` and the action's `safeParse`. Zod messages are message keys (`"leave.validation.subjectRequired"`), translated by `FormMessage` / `useTranslateMessage`.
- Loading: disable the whole `<fieldset>` and swap the submit label for `LoadingButton` while pending. Close the dialog only on success.

---

# 10. UI Rules

- shadcn/ui for primitives, added through the CLI. Check `components/common/` before building a new field, table, confirm dialog, header, badge or loader.
- Spacing and typography follow the existing `common/` components: `gap-1.5` on form items, `text-sm` body, `text-xs text-muted-foreground` for meta, `rounded-lg`/`rounded-xl`, `-mt-1 text-xs italic` on `FormMessage`.
- Every list page is `PageHeader` + a `Card` with the search row and the `DataTable`; every detail page starts with a back `Button variant="outline" size="sm"`.
- Status is never color-only: `LeaveStatusBadge` pairs an icon and a label with its tone (`lib/status-config.ts`).

---

# 11. Styling Rules

- **Tailwind only.** No CSS Modules, no CSS-in-JS. Global CSS is `app/globals.css` plus `styles/{typography,motion,launch-ui}.css`.
- **Tokens only**: `bg-primary`, `text-muted-foreground`, `bg-destructive/10`, `text-green-strong`, `bg-yellow/12`, `bg-blue`… Never a hex color or a Tailwind palette color (`text-slate-800`, `bg-green-700`) in a `className`. Status tones live in `lib/status-config.ts`; tone tables in `lib/utils/ui-variant.ts`.
- **Typography follows `docs/typography.md`**: `type-*` roles for titles and numbers, weights 400/500/600 only. ESLint rejects `font-bold` and `text-[13px]`-style sizes.
- **Icons** through `HugeiconsIcon` from `components/ui/hugeicons-icon.tsx` (2px stroke). ESLint rejects importing it from `@hugeicons/react`.
- **`cn()`** (`lib/utils/utils.ts`) for every conditional class.
- **Motion** is CSS (`styles/motion.css`): cards and rows animate in on mount; wrap content that replaces a loader in `Reveal`.

---

# 12. Naming Convention

| Category              | Convention                                                                              | Example                                            |
| --------------------- | --------------------------------------------------------------------------------------- | -------------------------------------------------- |
| Files & folders       | kebab-case, always                                                                      | `leave-request-form.tsx`, `use-list-params.ts`     |
| Components            | PascalCase identifier; file is the kebab-case of the name                               | `LeaveRequestTable` in `leave-request-table.tsx`   |
| Hooks                 | `use-<name>.ts`, `useCamelCase` export                                                  | `use-list-params.ts` → `useListParams`             |
| Types (domain)        | `type`, `T`-prefixed, one file per domain                                               | `TLeave`, `TApprover`, `TApiResponse`              |
| Enums                 | No TS `enum`; string-literal unions or `as const` maps                                  | `LEAVE_STATUS`                                     |
| Actions               | `action.ts`; exported actions PascalCase verbs                                          | `GetLeaveRequests`, `CreateLeaveRequest`           |
| Services              | `<domain>.service.ts`; one object `<domain>Service`; camelCase methods                  | `leaveService.getLeaveRequests()`                  |
| Stores                | `<domain>.store.ts`; `use<Domain>Store`                                                 | `useAuthStore`                                     |
| Constants             | `<domain>-constant.ts`; `SCREAMING_SNAKE_CASE`                                          | `LIMIT_DEFAULT`, `LEAVE_DATE_FORMAT`               |
| Validation schemas    | `<domain>-validations.ts`; `camelCaseSchema` / `PascalCaseSchemaType`                   | `leaveRequestSchema` / `LeaveRequestSchemaType`    |
| Messages              | `<namespace>.json`; camelCase keys grouped by page/feature                              | `leave.form.fields.subject`                        |
| Query keys            | `[namespace, resource, ...params]`                                                      | `["leave", "requests"]`, `["leave", "leave-types"]` |

---

# 13. Error Handling

- **API errors** are normalized at the action boundary (`lib/api-error.ts`). Components never branch on an Axios error.
- **Validation errors**: Zod `flatten().fieldErrors` → `errors`; rendered by each `Form*` wrapper. Form-wide errors go in `errors._form` and surface as a toast.
- **Unexpected errors**: every action wraps its service call in `try/catch`; a raw exception never escapes a mutation. Reads throw an `Error` with a readable message for `useQuery`.
- **Route errors**: every route has `error.tsx` rendering `ErrorState` (toast + retry) and `loading.tsx` rendering `RouteLoading`.
- **User feedback**: sonner toasts only (`toast.success` / `toast.error`), with the API's `message` when it has one.

---

# 14. Performance Rules

- Reuse `common/` components; they carry the right memoization, loaders and motion.
- Memoize column factories with `useMemo` keyed on the data and callbacks they close over.
- One `useQuery` per resource per page; lift it rather than fetching twice.
- Prefer Server Components for pages and static sections; `"use client"` belongs on the feature component that needs hooks.
- Narrow Zustand selectors.

---

# 15. Do & Don't

| #   | DO                                                                            | DON'T                                                                    |
| --- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| 1   | Call the backend through `services/<domain>.service.ts`                       | Call `instance`/`axios` from a component or action                        |
| 2   | Add endpoint paths to `constants/endpoint-constant.ts`                        | Inline a URL string                                                       |
| 3   | Validate with the same Zod schema on client and server                        | Hand-write a second validation in the action                              |
| 4   | Submit through a Server Action (`useMutation` wrapper or `useActionState`)    | Wire a submit handler to a raw `fetch`/`instance` call                    |
| 5   | Read auth via `useAuth()` / `usePermission()`                                 | Read the cookie or the store's internals from a component                 |
| 6   | Reuse `common/Form*`, `DataTable`, `DeleteDialog`, `PageHeader`, the status badge | Rebuild a field, table, confirm dialog, header or status pill           |
| 7   | Use `useListParams` for page/limit/search                                     | Keep pagination in a global context                                        |
| 8   | Put every param in the `queryKey`                                             | Reuse a static key for a parameterised query                               |
| 9   | Refetch/invalidate the affected query after a mutation                        | Rely on a page reload                                                      |
| 10  | Icons via `HugeiconsIcon`                                                     | `lucide-react`, raw `@hugeicons/react`, emoji                              |
| 11  | Tokens (`bg-primary/10`, `text-green-strong`)                                 | Hex or palette colors in `className`                                       |
| 12  | `type-*` roles and 400/500/600 weights                                        | `font-bold`, arbitrary sizes                                               |
| 13  | Every string through next-intl, both `en` and `id`                            | Hardcoded English in JSX                                                   |
| 14  | `action.ts` singular, PascalCase actions                                      | `actions.ts`, camelCase action names                                       |
| 15  | `ActionState` for every mutation                                              | A bespoke `XFormState` per feature                                         |
| 16  | Keep `components/ui/` CLI-pure                                                | Edit a primitive to add feature behavior                                   |
| 17  | Ask before adding a dependency                                                | Add a second library for a covered concern                                 |

---

# 16. Definition of Done

Mirrors the pre-commit hook and CI (`npm run lint && npm run build`):

- [ ] `npm run lint` passes with no new warnings or errors.
- [ ] `npm run build` passes (this is the TypeScript check).
- [ ] `npm run check:messages` passes; every new string exists in `en` and `id`.
- [ ] Layering in §3 holds: Page → Feature → Action → Service → API Client.
- [ ] Names follow §12; files are where §4 says.
- [ ] Reusable pieces were reused (§5, §10); nothing was duplicated.
- [ ] Responsive at the breakpoints already used in the area (`sm:`/`lg:`, `useIsMobile`).
- [ ] Every read has loading and error states; every mutation has a pending state and a toast.
- [ ] A mutation refetches or invalidates the reads it affects.
- [ ] If the change needs something the API does not do yet, `docs/backend-task.md` has the item.
