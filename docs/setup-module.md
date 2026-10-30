# Setup module, roles & permissions, dashboard — API contract

Written 30 Oct 2026 before implementation; both `leave-service` and this frontend build against it.
Mirrors `next-prm`'s Setup module (`setup/users`, `setup/roles`, `setup/permissions`,
`setup/master-data/{employees,departments}`) and `pdi-api`'s single-role model, scaled down to HR Lite.

Envelope, errors and pagination are the ones already in `docs/integration.md`:
`{ success, message, data }`, `{ success:false, message, errors? }`, `sendPaginated` → `meta.pagination`.
All routes below are under `auth:sanctum`.

---

## 1. Data model (leave-service)

| Table | Columns | Notes |
| --- | --- | --- |
| `permissions` | `id`, `title` unique (`leave.request`), `label`, `group_name`, `is_system` bool, timestamps | Seeded catalog (§2). System rows cannot be deleted or renamed. |
| `roles` | `id`, `title` unique, `description` nullable, `is_system` bool, timestamps | Seeded roles (§2). |
| `permission_role` | `permission_id`, `role_id` (both FK cascade, composite PK) | |
| `users` | + `role_id` nullable FK `set null`, + `employee_id` nullable unique FK `set null` | One role per user (pdi-api, next-prm). |
| `employees` | `id`, `employee_number` unique (NIK), `name`, `email` nullable unique, `phone_number` nullable, `position` nullable, `department_id` nullable FK, `supervisor_id` nullable FK → `employees.id` `set null`, `join_date` nullable date, `employment_type` enum `permanent,contract,probation,intern` default `permanent`, `status` enum `active,inactive` default `active`, timestamps | HR master data. |
| `departments` | unchanged (`name` unique, `alias`) | Gets a CRUD (§5). |

**Employee is the source of truth for HR fields.** When an employee with a linked user is saved, the
user's `name`, `phone_number`, `department_id` and `hired_at` are copied from it (the leave flow keeps
reading them from `users`). Linking a user to an employee does the same copy.

**Backfill migration:** one employee per existing user (`employee_number` = `EMP-` + zero-padded user id,
fields copied from the user), linked through `users.employee_id`; roles assigned per §2.

## 2. Permissions and roles

| Title | Group | Label (en) | Grants |
| --- | --- | --- | --- |
| `leave.request` | leave | Submit leave requests | `/leave/requests` |
| `leave.approve` | leave | Approve leave requests | `/leave/approvals` |
| `leave.view_all` | leave | View all leave data | Organisation section of the dashboard |
| `employees.manage` | setup | Manage employees | `/setup/master-data/employees` |
| `departments.manage` | setup | Manage departments | `/setup/master-data/departments` |
| `users.manage` | setup | Manage user accounts | `/setup/users` |
| `roles.manage` | setup | Manage roles & permissions | `/setup/roles`, `/setup/permissions` |

| Seeded role | Permissions | Assigned by the migrations to |
| --- | --- | --- |
| Administrator | all | nobody — `php artisan hr-lite:assign-role {email} Administrator` |
| Lead/Project Manager | `leave.request`, `leave.approve` | users named in `approval_flows.approval_by` or `master_approval_flows.approval_by` |
| Division Manager | `leave.request`, `leave.approve`, `leave.view_all` | the user whose email is `PDI_MANAGER_DIVISION_EMAIL` |
| HR | `leave.request`, `leave.view_all`, `employees.manage`, `departments.manage` | nobody |
| Employee | `leave.request` | every other user |

`User::resolvePermissions()` = the role's titles; a user without a role gets `["leave.request"]`; a user
named as approver on any `approval_flows` row additionally gets `leave.approve` (so a picked approver can
always act). Routes are guarded by a `permission:<title>` middleware → 403 `"Anda tidak memiliki akses."`.

**Inactive accounts:** login answers 403 `"Akun Anda tidak aktif."`; deactivating a user revokes all its
tokens. A user cannot deactivate, delete or change the role of their own account (422 on that field).

## 3. Users — `users.manage`

| Method | Path | Body / query | Notes |
| --- | --- | --- | --- |
| GET | `/api/users` | `page, per_page, search` (name, email), `status` (`active,inactive`), `role_id`, `sort_by` (`name,email,created_at`), `sort_dir` | paginated `TUserItem` |
| GET | `/api/users/{id}` | | `TUserItem` |
| POST | `/api/users` | `name, email, password, role_id, employee_id?, status` | password required, min 8 |
| PUT | `/api/users/{id}` | same, `password` optional | |
| DELETE | `/api/users/{id}` | | 409 `"User sudah punya pengajuan cuti, nonaktifkan saja."` when it has leave requests or approvals |

```ts
TUserItem = {
  id, name, email, status: "active" | "inactive", created_at,
  role: { id, title } | null,
  employee: { id, employee_number, name, position, department: { id, name, alias } | null } | null,
}
```

## 4. Employees — `employees.manage`

| Method | Path | Body / query | Notes |
| --- | --- | --- | --- |
| GET | `/api/employees` | `page, per_page, search` (name, employee_number, email, position), `department_id`, `status`, `employment_type`, `sort_by` (`name,employee_number,join_date,created_at`), `sort_dir` | paginated `TEmployeeItem` |
| GET | `/api/employees/{id}` | | `TEmployeeItem` |
| POST / PUT | `/api/employees[/{id}]` | `employee_number, name, email?, phone_number?, position?, department_id?, supervisor_id?, join_date? (Y-m-d), employment_type, status` | `supervisor_id` ≠ self; phone digits, normalised to `62…` |
| DELETE | `/api/employees/{id}` | | 409 `"Karyawan masih tertaut ke akun user."` when linked; subordinates' `supervisor_id` → null |

```ts
TEmployeeItem = {
  id, employee_number, name, email, phone_number, position, join_date, employment_type, status, created_at,
  department: { id, name, alias } | null,
  supervisor: { id, name, employee_number } | null,
  user: { id, email, role: { id, title } | null } | null,
}
```

## 5. Departments — `departments.manage`

`GET /api/departments` (`page, per_page, search, sort_by=name|alias|created_at, sort_dir`), `GET/POST/PUT/DELETE
/api/departments[/{id}]` with `{ name, alias }`. Item: `{ id, name, alias, employees_count, created_at }`.
DELETE → 409 `"Departemen masih dipakai karyawan."` when employees or users reference it.

## 6. Roles and permissions — `roles.manage`

| Method | Path | Body / query | Notes |
| --- | --- | --- | --- |
| GET | `/api/roles` | `page, per_page, search` (title) | paginated `TRoleItem` |
| GET | `/api/roles/{id}` | | `TRoleItem` + `users: { id, name, email }[]` |
| POST / PUT | `/api/roles[/{id}]` | `title, description?, permission_ids: number[]` (min 1) | system role titles cannot change (422 `title`) |
| DELETE | `/api/roles/{id}` | | 409 when `users_count > 0` or `is_system` |
| GET | `/api/permissions` | `page, per_page, search` (title, label), `group_name` | paginated `TPermissionItem` |
| GET | `/api/permissions/groups` | | `{ group_name, permissions: TPermissionItem[] }[]` — for the role form |
| POST / PUT | `/api/permissions[/{id}]` | `title` (`^[a-z_]+\.[a-z_]+$`), `label`, `group_name` | system rows: only `label`/`group_name` change |
| DELETE | `/api/permissions/{id}` | | 409 when `is_system` or attached to a role |

```ts
TRoleItem = { id, title, description, is_system, users_count, permission_ids: number[],
              permissions: { id, title, label }[], created_at }
TPermissionItem = { id, title, label, group_name, is_system, roles_count, created_at }
```

## 7. Options (dropdowns)

All return `{ id, text }[]` (plus the extras listed), active rows only, `search` + max 50 rows.

| Path | Who | Extras |
| --- | --- | --- |
| `GET /api/dropdown/departments` | any signed-in user | `alias` |
| `GET /api/dropdown/roles` | `users.manage` | |
| `GET /api/dropdown/employees?unlinked=1&include_id=&exclude_id=` | `users.manage` or `employees.manage` | `employee_number`, `email`; `unlinked=1` hides employees that already have a user; `include_id` (an employee id) is always listed; `exclude_id` is the user being edited, whose own employee stays listed |

## 8. Dashboard — every signed-in user

`GET /api/dashboard?year=2026` (default current year). Sections are `null` when the user lacks the permission.

```ts
TDashboard = {
  year: number,
  me: {
    annual_leave: { leave_type: string, quota: number, used: number, remaining: number } | null,
    counts: { pending: number, approved: number, rejected: number, cancelled: number },
    days_taken: number,                      // approved, counted days in `year`, any type
    upcoming: TLeave[],                      // status 0/1, start_date >= today, max 5, soonest first
  },
  approver: null | {                         // leave.approve
    waiting_count: number,
    oldest_waiting: TLeave | null,           // with user + department
    decided_this_month: number,
  },
  organization: null | {                     // leave.view_all
    employee_count: number,                  // active employees
    on_leave_today: { id, user: { id, name, department }, leave_type: { name }, start_date, end_date }[],
    on_leave_this_week: number,
    totals: { submitted, pending, approved, rejected, cancelled },   // in `year`
    monthly: { month: 1..12, requests: number, days: number }[],     // by start_date, 12 rows
    by_type: { leave_type: string, requests: number, days: number }[],
    by_department: { department: string, requests: number, days: number }[],
  },
}
```

`annual_leave` uses the leave type `config('leave.annual_leave_type_code', 'ANNUAL')`: `quota` = its
`default_quota` (or the `leave_balances` row for that year when one exists: `opening + accrued + adjusted`),
`used` = sum of `leave_request_days.portion` where `is_counted`, the leave is approved and the date is in `year`.
`days` everywhere = the same sum of approved, counted portions.

## 9. Frontend routes

Each module owns a path prefix, so the next module can sit beside Leave without clashes.

| Route | Module | Permission |
| --- | --- | --- |
| `/dashboard` (`/` redirects here) | Home — the signed-in employee's profile (§11) | any |
| `/leave/dashboard` | Leave — the leave dashboard (§8) | any |
| `/leave/requests` | Leave — my history + "new request" dialog | `leave.request` |
| `/leave/approvals` | Leave — approver inbox | `leave.approve` |
| `/setup/master-data/employees`, `/setup/master-data/departments`, `/setup/master-data/holidays` | Setup | `employees.manage`, `departments.manage`, `holidays.manage` |
| `/setup/leave-balances` | Setup | `leave.manage_balance` |
| `/setup/users` | Setup | `users.manage` |
| `/setup/roles`, `/setup/permissions` | Setup | `roles.manage` |

Old paths redirect (`next.config.ts`): `/leave-requests` → `/leave/requests`, `/approvals` → `/leave/approvals`,
`/login` → `/sign-in`. The approval email links to `FRONTEND_URL/leave/approvals`.

--- | --- | --- |
| `/dashboard` (`/` redirects here) | Home | any |
| `/setup/master-data/employees`, `/setup/master-data/departments` | Setup | `employees.manage`, `departments.manage` |
| `/setup/users` | Setup | `users.manage` |
| `/setup/roles`, `/setup/permissions` | Setup | `roles.manage` |

---

## 10. Annual leave balance — `leave.manage_balance`

Added 30 Oct 2026. HR sets each employee's real remaining annual leave once; from then on the
balance moves by itself: **+1 day on the 1st of every month**, minus the counted days of every
approved annual leave.

### Data model

`leave_balance_entries` (ledger, append-only):

| Column | Notes |
| --- | --- |
| `id`, timestamps | |
| `employee_id` | FK `employees`, cascade |
| `leave_type_id` | FK `leave_types` — always the annual type (`config('leave.annual_leave_type_code')`) for now |
| `type` | enum `set` (HR set the balance), `accrual` (monthly +1), `leave` (approved leave, negative) |
| `amount` | decimal(6,2), signed; for `set` it is `new − previous` |
| `balance_after` | decimal(6,2), the balance right after this entry |
| `period` | `YYYY-MM` for `accrual` rows, else null; unique (`employee_id`, `leave_type_id`, `type`, `period`) so a month is never accrued twice |
| `leave_request_id` | FK nullable, for `leave` rows; unique so a leave is never deducted twice |
| `note` | nullable text (required for `set`) |
| `created_by` | FK users nullable (null = system) |

Current balance = `balance_after` of the latest entry (0 when there is none). Writes go through
`App\Services\LeaveBalanceService` under a row lock on the employee so concurrent writes stay ordered.

The old per-period `leave_balances` table is left untouched and no longer read. `leave_request_id` is
`set null` on delete, so deleting a leave keeps its ledger row. `used_this_year` counts `leave` entries
created in the current calendar year. A `set` with the same value is still written (amount 0) so HR's
note is kept and `is_set` turns true.

### Rules

- **Monthly accrual:** `php artisan hr-lite:accrue-leave {--month=YYYY-MM}` (default: current month) adds
  `config('leave.monthly_accrual', 1)` to every **active** employee. It is scheduled
  `monthlyOn(1, '00:05')`, timezone Asia/Jakarta, with `withoutOverlapping()`. Running it twice for the
  same month adds nothing the second time.
- **Deduction:** when `LeaveDecisionService` approves a leave whose type is the annual type and whose
  requester's user has an `employee_id`, it writes one `leave` entry of `−sum(counted portions)`. Web and
  WhatsApp approvals share that path. The balance may go negative; nothing is blocked.
- **Set:** HR sets the absolute value (−365 … 365, step 0.5) with a required note.

### Endpoints

| Method | Path | Body / query | Notes |
| --- | --- | --- | --- |
| GET | `/api/leave-balances` | `page, per_page, search` (name, employee_number), `department_id`, `status` (employee status, default `active`), `sort_by` (`name,employee_number,balance`), `sort_dir` | paginated `TLeaveBalanceItem` |
| GET | `/api/leave-balances/{employee}/entries` | `page, per_page` | paginated `TLeaveBalanceEntry`, newest first |
| PUT | `/api/leave-balances/{employee}` | `balance` (number), `note` (string, 3–255) | returns `TLeaveBalanceItem`; message `"Saldo cuti berhasil diperbarui."` |
| GET | `/api/leave-balance/me` | | any signed-in user: `{ leave_type, balance, pending_days, monthly_accrual, last_accrual_period } \| null` (null when the user has no employee) |

```ts
TLeaveBalanceItem = {
  employee: { id, employee_number, name, position, department: { id, name, alias } | null },
  balance: number,
  is_set: boolean,              // at least one `set` entry exists
  last_set_at: string | null,
  last_accrual_period: string | null,   // "2026-11"
  used_this_year: number,       // sum of `leave` entries in the current year, positive
}
TLeaveBalanceEntry = {
  id, type: "set" | "accrual" | "leave", amount, balance_after, period, note, created_at,
  leave_request: { id, subject, start_date, end_date } | null,
  created_by: { id, name } | null,
}
```

### Dashboard change (§8)

`me.annual_leave` becomes `{ leave_type, quota, used, remaining }` with `remaining` = current ledger
balance, `used` = this year's `leave` entries (positive), `quota` = `remaining + used`. It is `null` when
the user has no employee.

### Permission

New system permission `leave.manage_balance` (group `leave`, label "Manage leave balances"), granted to
**Administrator** and **HR** by a migration. Frontend route `/setup/leave-balances` (Setup module).

---

## 11. My profile — every signed-in user

`GET /api/me/profile` → the Home dashboard.

```ts
TMyProfile = {
  user: { id, name, email, status, created_at, role: { id, title } | null },
  employee: null | {
    id, employee_number, name, email, phone_number, position, join_date /* Y-m-d */, employment_type, status,
    department: { id, name, alias } | null,
    supervisor: { id, name, employee_number, position } | null,
    subordinates: { id, name, position }[],      // employees whose supervisor is this employee, max 20, by name
  },
}
```

## 12. Holidays — `holidays.manage`

Existing table `holidays` (`date`, `name`, `description`, `is_mass_leave`, `is_weekend`, unique `date+name`).
A **holiday** is a public holiday (`is_mass_leave = false`) or a company *cuti bersama* (`is_mass_leave = true`).
Both are days off: they cannot be picked as leave dates and are skipped when computing "return to office".
(Whether cuti bersama reduces the annual balance is not decided yet; nothing is deducted.)

| Method | Path | Body / query | Notes |
| --- | --- | --- | --- |
| GET | `/api/holidays` | `page, per_page, year` (default current), `search` (name), `type` (`public`, `mass_leave`), `sort_by` (`date,name`), `sort_dir` (default `date asc`) | paginated `THolidayItem` |
| POST / PUT | `/api/holidays[/{id}]` | `date` (Y-m-d, unique among holidays), `name` (1–100), `description?` (≤500), `is_mass_leave` (bool) | 422 `date` "Tanggal ini sudah terdaftar sebagai hari libur." |
| DELETE | `/api/holidays/{id}` | | |
| GET | `/api/holidays/calendar?from=Y-m-d&to=Y-m-d` | any signed-in user; range ≤ 400 days | `{ date, name, is_mass_leave }[]` sorted by date — for the leave calendar |

```ts
THolidayItem = { id, date, name, description, is_mass_leave, created_at }
```

New system permission `holidays.manage` (group `setup`, label "Manage holidays"), granted to Administrator and HR.

**Leave request validation:** `StoreLeaveRequestRequest` rejects any `leave_date.*` on a holiday:
`"Tanggal cuti 17 Agt 2026 adalah hari libur (Hari Kemerdekaan)."` (key `leave_date.N`).
