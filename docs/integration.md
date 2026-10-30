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
| Sign out | `authService.signOut` → `DELETE /api/auth/logout` (Bearer) | `AuthController@logout` revokes every token |
| Identity on reload | `GET /api/me` **(same-origin Next route handler)** returns the user cookie | — no `/api/me` on the API yet (`docs/backend-task.md` §1) |
| My requests | `GetLeaveRequests` → `GET /api/leave-request` | `LeaveRequestController@index`: the user's requests, newest first, with `user.department`, `leave_type`, `leave_request_days`, `status_name` |
| New request | `CreateLeaveRequest` → `POST /api/leave-request` (fields in `types/leave.d.ts`, dates `dd-MM-yyyy`) | `@store`: writes `leave_requests` + `approval_flows` (level 1, `approval_by`) + `leave_request_days`, then queues `SendWhatsappApproval` and `LeaveApprovalRequestMail` |
| Dropdowns | `GET /api/dropdown/leave-types` (`{ id, text }`), `GET /api/dropdown/users` (`{ id, name, email }`) | `DropdownOptionController` |

- Every request carries `Authorization: Bearer <token>` (added by `lib/axios/instance.ts` from the httpOnly cookie) and `X-Locale` (ignored by the API today).
- Envelope: `{ success, message, data }`. Errors: `{ success: false, message }`; validation 422 puts the field map under **`data`** (`lib/api-error.ts` handles both `data` and `errors`).
- `POST /api/leave-request` has no FormRequest: the frontend's Zod schema is the only field validation. The API rejects choosing yourself as approver (400) and empty/invalid dates (422 `dates`).
- Config: `NEXT_PUBLIC_DEV_SERVER_URL` / `NEXT_PUBLIC_PROD_SERVER_URL` (no trailing `/api`). Production is `https://lvr-api.pdi-ptcs.com`; `https://lvr.pdi-ptcs.com` is the frontend itself.

## 2. leave-service → WhatsApp service

Fired from `LeaveRequestController@store` (and the unauthenticated `GET /api/leave-request/whatapproval-reminder/{leave}/{approver}` re-trigger) through the queued job `App\Jobs\SendWhatsappApproval` (3 tries, backoff 10/60/180 s, `afterCommit`).

```
POST {WA_SERVICE_BASE_URL}/send-approval
X-API-WHATSAPP: <X_API_WHATSAPP_KEY>        # the WA service does not verify this header today
Idempotency-Key: leave-<id>

{ "leaveId", "leave_request_id", "uniqueCode", "unique_code",
  "approverNumber", "approver_phone_number",   # digits only, 62… (normalised in the job)
  "approverEmail", "approver_email", "message" }
```

The WA service (`POST /send-approval`) requires the client to be `READY` + `CONNECTED` (else 503), resolves the number to a chat id, sends `message`, then the bare `uniqueCode` as a second message, and keeps `{ leaveId, uniqueCode, approverNumber, approverEmail }` in an in-memory map keyed by chat id (lost on restart, expires after `APPROVAL_TIMEOUT`).

`uniqueCode` is `shortCode8(leave id)` in the controller: 8 chars from base36(time) interleaved with base36(id). It is not stored anywhere on the API side.

## 3. WhatsApp service → leave-service

The approver replies `<CODE> YES` or `<CODE> NO <reason>` (also APPROVE/APPROVED/Y, REJECT/REJECTED/N). `parseApproval` matches it, then:

```
POST {API_BASE_URL}/api/whatsapp/leave-request/approval
X-API-WHATSAPP: <API_TOKEN>                   # verified by VerifyWhatsappApiKey (hash_equals with X_API_WHATSAPP_KEY)

{ "leave_request_id", "approver_phone_number", "approver_email", "approved": true|false, "reason" }
```

`WhatsappServiceController@leaveRequestApproval` sets `leave_requests.status` to 1/2 (+ `approved_at`/`rejected_at`), finds the `approval_flows` row whose approver has `approver_email` (404 if none), stores `approval_action`/`notes`, then queues the approved/rejected email. The WA service relays the API's `message` back to the approver and only forgets the session on success, so a failed callback stays retryable.

Note the API does **not** check that the code in the reply belongs to that leave: the pairing lives only in the WA service's memory. Final approval is done in HRIS; WhatsApp is the notification/reminder channel (leave-service README).

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

## 6. Where the frontend grows next (needs the API first)

- Approver page: list what waits on me, approve/reject from the browser (today only WhatsApp/HRIS) — `docs/backend-task.md` §5.
- Request detail (`GET /api/leave-request/{id}` is an empty stub) and cancel while pending.
- Notifications in the header (no endpoint).
- `GET /api/me` so the user cookie can go away.
