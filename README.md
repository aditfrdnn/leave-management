# HR Lite (leave-management)

Frontend for employee leave requests: an employee signs in, submits a leave request (dates,
approver, reason, hand-over), follows the status of what they sent and can cancel it while it is
pending; an approver decides from the browser or from WhatsApp. A Next.js 16 app (App Router,
React 19, TypeScript) that talks to `leave-service` (Laravel) over HTTP; WhatsApp goes through the
`leave-management-wa` bridge (see `docs/integration.md`).

The codebase follows the same structure, rules and look as `next-prm` (Project Readiness
System) and `next-pdi`, so patterns and components move between the projects without translation.

## Getting started

```bash
cp .env.example .env      # NEXT_PUBLIC_DEV_SERVER_URL: local leave-service (127.0.0.1:8000) or https://lvr-api.pdi-ptcs.com
npm install
npm run dev               # http://localhost:9002
```

| Script | What it does |
| --- | --- |
| `npm run dev` | Dev server on port 9002 |
| `npm run lint` | ESLint (also enforces the type scale and the icon wrapper) |
| `npm run build` | Production build; this is also the TypeScript check |
| `npm run check:messages` | Every `en` message key exists in `id` and vice versa |

The pre-commit hook (`.husky/pre-commit`) runs lint and build; CI (`.github/workflows/ci.yml`)
runs the same on every pull request into `main`. Firebase App Hosting (`apphosting.yaml`) builds
from the repository as before.

## Where to read next

| Doc | Read it when |
| --- | --- |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | You want to know what exists: folders, routes, auth flow, data flow, component inventory |
| [docs/RULES.md](docs/RULES.md) | You are about to write code: layering, where files go, naming, forms, tables, errors |
| [docs/AI_WORKFLOW.md](docs/AI_WORKFLOW.md) | You (or an AI assistant) are starting a task: the define → plan → implement → review loop |
| [docs/REVIEW_CHECKLIST.md](docs/REVIEW_CHECKLIST.md) | You are reviewing a change |
| [docs/data-table.md](docs/data-table.md) | You are adding a list page: sort/filter columns and the request contract |
| [docs/typography.md](docs/typography.md) | You are choosing a text size or weight |
| [docs/i18n.md](docs/i18n.md) | You are adding user-visible text (English and Indonesian) |
| [docs/integration.md](docs/integration.md) | You touch anything that crosses the three repos: frontend ↔ leave-service ↔ WhatsApp service |
| [docs/backend-task.md](docs/backend-task.md) | You work on `leave-service`: what the frontend needs, in priority order |
| [docs/user-guide.md](docs/user-guide.md) | You want the end-user walkthrough (Indonesian) |

## Routes

| Path | Page |
| --- | --- |
| `/sign-in` | Login (public) |
| `/dashboard` | Personal leave summary, approver queue, organisation statistics and charts (`leave.view_all`) |
| `/leave-requests` | New leave request form + the signed-in user's history (paged, sortable, detail sheet, cancel) |
| `/approvals` | Approver inbox: pending / decided requests, approve or reject with a note (`leave.approve`) |
| `/setup/master-data/employees`, `/setup/master-data/departments` | Employee and department master data (`employees.manage`, `departments.manage`) |
| `/setup/users` | Login accounts: role, linked employee, active/inactive (`users.manage`) |
| `/setup/roles`, `/setup/permissions` | Roles and the permission catalog (`roles.manage`) |

`/` redirects to `/dashboard`. The Setup contract is `docs/setup-module.md`. Everything except `/sign-in` requires the auth cookie (`src/proxy.ts`).
