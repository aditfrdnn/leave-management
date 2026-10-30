# Integration map — frontend, leave-service, WhatsApp service

Three repositories make up the leave system. This page says who talks to whom, with which
headers and payloads, and where each piece runs. Read it before touching any cross-repo flow.

| Repo | What | Stack | Runs at |
| --- | --- | --- | --- |
| `leave-management` (this repo) | HR Lite employee frontend: sign in, submit a leave request, follow its status | Next.js 16 | dev `http://localhost:9002`, prod `https://lvr.pdi-ptcs.com` (Firebase App Hosting) |
| `leave-service` | API + business rules + email + WhatsApp trigger | Laravel 12, Sanctum, MySQL, database queue | dev `http://127.0.0.1:8000` (`php artisan serve`), prod `https://lvr-api.pdi-ptcs.com` |
| `leave-management-wa` | WhatsApp bridge: sends the approval message, parses the approver's reply, posts the decision back | Node (Express + whatsapp-web.js), PM2 | VPS, `HOST:PORT` from its `.env`; dev `http://127.0.0.1:3000` |

All three are sibling folders under `~/Documents/Development/GitHub/`.

## 1. Frontend → leave-service

Bearer-token API over HTTPS. The frontend never talks to the WhatsApp service.

| Call | Frontend | leave-service |
| --- | --- | --- |
| Sign in | `authService.signIn` → `POST /api/auth/login` `{ email, password }` | `AuthController@login` → `{ success, message, data: { ...user, token, department } }` |
| Sign out | `authService.signOut` → `DELETE /api/auth/logout` (Bearer) | `AuthController@logout` revokes the current token only |
| Identity on reload | `GET /api/me` **(same-origin Next route handler)** forwards the token cookie as Bearer | `AuthController@me` → `{ success, data: user }` (same shape as login minus `token`), incl. `permissions: string[]` (`leave.request`, `leave.approve`) |
| My requests | `GetLeaveRequests` → `GET /api/leave-request?page&per_page&search&status&sort_by&sort_dir` | `LeaveRequestController@index` via `sendPaginated`: the user's requests with `user.department`, `leave_type`, `leave_request_days`; `meta.pagination`. `status` is a comma list of codes, `sort_by` ∈ `created_at,start_date,duration,status` |
| Request detail | `GetLeaveRequest` → `GET /api/leave-request/{id}` (detail sheet on both pages) | `@show`: owner or one of its approvers (else 403); adds `approvals[]` with `approval_by {id,name,email}` |
| Cancel | `CancelLeaveRequest` → `PATCH /api/leave-request/{id}/cancel` | `@cancel`: owner only, status 0 → -1 (+ `cancelled_at`); 409 once decided |
| Approvals inbox | `GetApprovals` → `GET /api/leave-request/approvals?status=pending|approved|rejected|all&page&per_page&search` | `@approvals` via `sendPaginated`: leaves whose `approval_flows.approval_by` is me, each with my `approval` row; pending oldest-first |
| Decide | `DecideLeaveRequest` → `PATCH /api/leave-request/{id}/approve` or `/reject` `{ notes }` (notes required on reject) | `@approve` / `@reject`: must be an approver of that leave (403), 409 once decided; `App\Services\LeaveDecisionService` — the same path the WhatsApp callback uses — updates status, approval row and queues the approved/rejected email |
| New request | `CreateLeaveRequest` → `POST /api/leave-request` (fields in `types/leave.d.ts`, dates `dd-MM-yyyy`) | `@store`: writes `leave_requests` + `approval_flows` (level 1, `approval_by`) + `leave_request_days`, then queues `SendWhatsappApproval` and `LeaveApprovalRequestMail` |
| Dropdowns | `GET /api/dropdown/leave-types` (`{ id, text }`), `GET /api/dropdown/users` (`{ id, name, email }`) | `DropdownOptionController` |

- Every request carries `Authorization: Bearer <token>` (added by `lib/axios/instance.ts` from the httpOnly cookie) and `X-Locale` (ignored by the API today).
- Envelope: `{ success, message, data }`. Errors: `{ success: false, message, errors?: { field: string[] } }` for controller **and** framework errors (401/403/404/405/422/429/500 are rendered as the same envelope by `bootstrap/app.php`). `lib/api-error.ts` still accepts the legacy `data` field map.
- `POST /api/leave-request` is validated by `StoreLeaveRequestRequest` (`lang/id` + `lang/en` messages): dates `dd-MM-yyyy`, not in the past, no weekend, no overlap with the user's other requests, approver ≠ self, `return_to_office` after the last leave day. Per-date errors come back as `leave_date.0`, `leave_date.1`, …
- Config: `NEXT_PUBLIC_DEV_SERVER_URL` / `NEXT_PUBLIC_PROD_SERVER_URL` (no trailing `/api`). Production is `https://lvr-api.pdi-ptcs.com`; `https://lvr.pdi-ptcs.com` is the frontend itself.

## 2. leave-service → WhatsApp service

Fired from `LeaveRequestController@store` and the owner-only, rate-limited (`throttle:5,1`) `GET /api/leave-request/whatapproval-reminder/{leave}/{approver}` re-trigger, both through `App\Services\LeaveApprovalNotifier`, which stores `sha256(code)` + `approval_code_sent_at` on the `approval_flows` row and queues `App\Jobs\SendWhatsappApproval` (3 tries, backoff 10/60/180 s, `afterCommit`) plus the approval email.

```
POST {WA_SERVICE_BASE_URL}/send-approval
X-API-WHATSAPP: <X_API_WHATSAPP_KEY>        # verified by the WA service (`requireApiToken`, timing-safe compare with API_TOKEN)
Idempotency-Key: leave-<id>

{ "leaveId", "leave_request_id", "uniqueCode", "unique_code",
  "approverNumber", "approver_phone_number",   # digits only, 62… (normalised in the job)
  "approverEmail", "approver_email", "message" }
```

The WA service (`POST /send-approval`) requires the client to be `READY` + `CONNECTED` (else 503), resolves the number to a chat id, sends `message`, then the bare `uniqueCode` as a second message, and keeps `{ leaveId, uniqueCode, approverNumber, approverEmail }` in an in-memory map keyed by chat id (lost on restart, expires after `APPROVAL_TIMEOUT`).

`uniqueCode` is `LeaveApprovalNotifier::shortCode8(leave id)`: 8 chars from base36(time) interleaved with base36(id). Only its SHA-256 hash is stored (`approval_flows.approval_code_hash`); every re-send replaces it, so the bridge keeps the latest code per leave. Approver numbers in `WA_BYPASS_NUMBERS` skip the real send (local testing).

## 3. WhatsApp service → leave-service

The approver replies `<CODE> YES` or `<CODE> NO <reason>` (also APPROVE/APPROVED/Y, REJECT/REJECTED/N). `parseApproval` matches it, then:

```
POST {API_BASE_URL}/api/whatsapp/leave-request/approval
X-API-WHATSAPP: <API_TOKEN>                   # verified by VerifyWhatsappApiKey (hash_equals with X_API_WHATSAPP_KEY)

{ "leave_request_id", "unique_code", "approver_email", "approver_phone_number", "approved": true|false, "reason" }
```

`WhatsappServiceController@leaveRequestApproval` validates the body (422), finds the `approval_flows` row whose approver has `approver_email` (404 if none), checks `hash_equals(approval_code_hash, sha256(unique_code))` (403 `Kode unik tidak cocok.`), refuses a leave that is already 1/2 (409 `Pengajuan sudah diproses.`), then hands over to `App\Services\LeaveDecisionService` — the same code path as the web approve/reject endpoints — which sets `leave_requests.status` 1/2 (+ `approved_at`/`rejected_at`), `approval_action`/`notes`, and queues the approved/rejected email. The WA service relays the API's `message` back to the approver; on 403 it keeps the session (the approver can retry), on 409 or success it forgets it. `LEAVE_REQUIRE_UNIQUE_CODE=false` accepts the legacy body without `unique_code`.

Final approval is also done in HRIS; WhatsApp and the web approver page are the notification/decision channels.

## 4. Shared secrets and env

| Secret / setting | leave-service | leave-management-wa |
| --- | --- | --- |
| WhatsApp shared key | `X_API_WHATSAPP_KEY` (`config/services.php` → `services.whatsapp.api_key`) | `API_TOKEN` (sent as `X-API-WHATSAPP`) |
| WA service URL | `WA_SERVICE_BASE_URL` (default `http://localhost:3000`) | `HOST`, `PORT` |
| API URL | `APP_URL` | `API_BASE_URL` (no `/api` suffix) |
| Manager email for approved leaves | `PDI_MANAGER_DIVISION_EMAIL` | — |

The frontend holds none of these; it only knows the API base URL.

## 5. Running everything locally

```bash
# 1. API (leave-service): MySQL on 127.0.0.1:3306, database db_leave_service
composer install && cp .env.example .env && php artisan key:generate
php artisan migrate --seed          # departments, leave types and the PDI users
# a throwaway account for local testing (password of your choice):
php artisan tinker --execute='App\Models\User::updateOrCreate(["email" => "smoke.tester@example.test"], ["name" => "Smoke Tester", "password" => "<choose>", "department_id" => 1, "phone_number" => "6280000000000"]);'
php artisan serve --port=8000       # + php artisan queue:work for the email/WA jobs

# 2. WhatsApp service (leave-management-wa), optional — only for the approval flow
cp .env.example .env                # API_BASE_URL=http://127.0.0.1:8000, API_TOKEN = X_API_WHATSAPP_KEY of the API
npm install && npm start            # scan the QR code once

# 3. Frontend (this repo)
NEXT_PUBLIC_DEV_SERVER_URL=http://127.0.0.1:8000 npm run dev   # http://localhost:9002
```

With `QUEUE_CONNECTION=database` and no worker, submitting a request still succeeds; the WA/email jobs just wait in the `jobs` table (verified 30 Oct 2026: login, dropdowns, submit, history and logout all work against the local API). With `MAIL_MAILER=log` the emails land in `storage/logs/laravel.log`.

## 6. Permissions, roles, Setup and dashboard

Roles, the permission catalog, users, employees, departments and the dashboard are specified in
`docs/setup-module.md`. In short: each user has one role (`users.role_id`); `GET /api/me` and login return
`permissions[]` (the role's titles, plus `leave.approve` for anyone named on an `approval_flows` row) and
`role` / `employee`; routes are guarded by `permission:<title>` (403 `Anda tidak memiliki akses.`). Inactive
accounts cannot log in (403). Seeded roles: Administrator, HR, Approver, Employee; grant the first admin with
`php artisan hr-lite:assign-role {email} Administrator`.

## 7. Where the frontend grows next (needs the API first)

- Notifications in the header (no endpoint).
- Leave balance per type (no endpoint, `docs/backend-task.md` §9).
- Column facets from the API (`facets` in list responses) instead of the static status list.
