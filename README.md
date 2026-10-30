# LVR System (leave-management)

Frontend for employee leave requests: an employee signs in, submits a leave request (dates,
approver, reason, hand-over) and follows the status of what they sent. A Next.js 16 app
(App Router, React 19, TypeScript) that talks to the leave API over HTTP.

The codebase follows the same structure, rules and look as `next-prm` (Project Readiness
System) and `next-pdi`, so patterns and components move between the projects without translation.

## Getting started

```bash
cp .env.example .env      # point NEXT_PUBLIC_DEV_SERVER_URL at the leave API
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
| [docs/backend-task.md](docs/backend-task.md) | You work on the leave API: what the frontend needs, in priority order |
| [docs/user-guide.md](docs/user-guide.md) | You want the end-user walkthrough (Indonesian) |

## Routes

| Path | Page |
| --- | --- |
| `/sign-in` | Login (public) |
| `/leave-requests` | New leave request form + the signed-in user's history |

`/` redirects to `/leave-requests`. Everything except `/sign-in` requires the auth cookie (`src/proxy.ts`).
