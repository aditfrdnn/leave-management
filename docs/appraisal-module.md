# Appraisal module — contract

Written 30 Oct 2026 before implementation; `leave-service` and this frontend build against it.
Source form: **F-HR-10 Rev.2 "Formulir Penilaian Perkembangan Karyawan"** (Bagian I–V).

Envelope, errors, pagination and permission middleware are the ones in `docs/integration.md` and
`docs/setup-module.md` (`{ success, message, data }`, `sendPaginated` → `meta.pagination`,
`permission:<title>` → 403 `"Anda tidak memiliki akses."`). All routes are under `auth:sanctum`.

---

## 1. Who does what

| Step | Who | Status after |
| --- | --- | --- |
| Open a period (e.g. "Agustus 2025 – Juli 2026") | HR, Lead/Project Manager, Division Manager, Administrator (`appraisal.manage_periods`) | period `open` |
| Start my appraisal in an open period, fill self ratings, KPI review rows, proposed targets | the employee (`appraisal.fill`) | `draft` |
| Submit to my assessor | the employee | `submitted` |
| Return it for changes (with a note) | the assessor | `draft` (note shown) |
| Give final ratings, adjust targets, write the individual review, then confirm | the assessor | `assessed` |
| Acknowledge the result (replaces the employee signature) | the employee | `acknowledged` |
| List every appraisal of a period, download the PDF | HR, Administrator (`appraisal.view_all`) | — |
| Close / reopen a period | `appraisal.manage_periods` | period `closed` / `open` |

- **Assessor** = the user linked to the employee's `employees.supervisor_id`. Leads are assessed by their
  Division Manager the same way. No supervisor account → `POST /api/appraisals` answers 422
  `"Atasan Anda belum diatur. Hubungi HR."`. The assessor is stored on the appraisal when it is created and
  refreshed on submit.
- **Leaders** = users whose role title is in `config('appraisal.leader_roles')`
  (default `["Lead/Project Manager", "Division Manager"]`). Template items with `audience: "leaders"` apply
  only to them.
- **Ratings are side by side:** the employee gives `self`, the assessor gives `final`, for every rating item
  (Bagian I–III) and every KPI review row (Bagian IV.A). No overall total; a KPI row shows `weight × final`.
- **Prefill:** a new appraisal copies the KPI *target* rows of the employee's previous acknowledged appraisal
  into its KPI *review* rows (that is how IV.B of last year becomes IV.A of this year).
- Closing a period stops new appraisals and editing; acknowledged ones are untouched.

## 2. Template (editable without code)

`appraisal_templates`: `id`, `code` (e.g. `F-HR-10`), `name`, `revision` (e.g. `Rev.2`), `schema` JSON,
`is_active` bool, `created_by`, timestamps. A template used by any period is **locked** (PUT/DELETE → 409
`"Template sudah dipakai periode. Buat revisi baru."`); changes go into a duplicate with the next revision.
Only active templates can be picked for a new period.

```ts
TAppraisalTemplateSchema = {
  title: string,                       // "FORMULIR PENILAIAN PERKEMBANGAN KARYAWAN"
  sections: TTemplateSection[],        // in order
}

TScaleLevel = { value: number, label: string }      // value 1..5, label "Poor Performance" …

TTemplateSection =
  | { key: string, kind: "rating", title: string, instructions: string,
      scale: TScaleLevel[],                          // 5 levels
      items: TRatingItem[] }
  | { key: string, kind: "kpi_review", title: string, instructions: string,
      scale: TScaleLevel[], min_rows: number, max_rows: number }
  | { key: string, kind: "kpi_target", title: string, instructions: string,
      min_rows: number, max_rows: number }
  | { key: string, kind: "text", title: string, instructions: string,
      fields: { key: string, label: string, filled_by: "employee" | "assessor" | "both" }[] }

TRatingItem = {
  key: string,                 // stable id inside the section, e.g. "passion"
  code: string,                // "PASS"
  title: string,               // "Passion"
  points: string[],            // the bullet lines under the title
  levels: string[],            // one description per scale level, same order as `scale`
  audience: "all" | "leaders",
}
```

Section `title` / `instructions` may contain `{review_period}` and `{target_period}`; the frontend and PDF
replace them with the period's ranges ("Agustus 2025 s/d Juli 2026").

**Seeded template** `F-HR-10 Rev.2` (active), transcribed from the source PDF:

| Section key | Kind | Content |
| --- | --- | --- |
| `key_behaviors` | rating | Bagian I: Passion (PASS), Accountability (ACC), Integrity (INT), Respect (RES), Teamwork (TW), Innovation (INNOV), Excellence (EXC); scale Poor Performance · Below Expectation · Meet Expectation · Exceed Expectation · Excellence |
| `competencies` | rating | Bagian II: Job Knowledge and Skills (KS), Initiative and Responsiveness (IR), Logical Thinking (LT), Planning and Preparation (PP), Reporting (REP), Productivity (PRO), Problem Solving (PS), Communication (COM), Management & Leadership (ML, `audience: leaders`), Mendukung Sistem Manajemen Anti Penyuapan (ABMS); scale … Outstanding |
| `hse` | rating | Bagian III: Kesehatan Kerja (Health), Keselamatan Kerja (Safety), Lingkungan Kerja (Enviro) |
| `kpi_review` | kpi_review | Bagian IV.A "Penilaian atas pencapaian periode {review_period}", 1–10 rows |
| `kpi_target` | kpi_target | Bagian IV.B "Penetapan Target untuk Periode {target_period}", 1–10 rows |
| `individual_review` | text | Bagian V: Kekuatan Karyawan, Kelemahan Karyawan, Kompetensi yang Perlu Diperbaiki, Pelatihan yang Perlu Diberikan — all `filled_by: assessor` |

## 3. Periods

`appraisal_periods`: `id`, `name`, `review_start`, `review_end`, `target_start`, `target_end` (dates),
`due_date` nullable, `template_id`, `status` (`open`,`closed`), `created_by`, `closed_at`, timestamps.
Defaults when creating: review = 1 Aug (Y-1) … 31 Jul (Y), target = 1 Aug (Y) … 31 Jul (Y+1).

## 4. Appraisals

`appraisals`: `id`, `period_id`, `employee_id`, `assessor_user_id`, `status`
(`draft`,`submitted`,`assessed`,`acknowledged`), `answers` JSON, `return_note` nullable,
`snapshot` JSON (employee name / number / position / department; assessor name / position — refreshed on
submit and on assess, so the PDF shows who it was at the time), `submitted_at`, `assessed_at`,
`acknowledged_at`, timestamps. Unique (`period_id`, `employee_id`).

```ts
TAppraisalAnswers = Record<sectionKey,
  | Record<itemKey, { self: number | null, final: number | null }>                    // rating
  | { objective: string, kpi: string, target: string, weight: number,
      self: number | null, final: number | null }[]                                      // kpi_review
  | { objective: string, kpi: string, target: string, weight: number }[]                // kpi_target
  | Record<fieldKey, string>                                                              // text
>
```

**Who may write what** (the server merges only these keys and ignores the rest):

| | employee while `draft` | assessor while `submitted` |
| --- | --- | --- |
| rating `self` | ✓ | — |
| rating `final` | — | ✓ |
| kpi_review rows (objective, kpi, target, weight) | ✓ | ✓ |
| kpi_review `self` / `final` | `self` | `final` |
| kpi_target rows | ✓ | ✓ |
| text fields | `employee`/`both` | `assessor`/`both` |

**Completeness** — submit (employee): every applicable rating item has `self`; kpi_review has
`min_rows`..`max_rows` rows, all text filled, weights sum to 100, every row has `self`; kpi_target, when it
has rows, sums to 100. Assess (assessor): every applicable item and kpi_review row has `final`; kpi_target has
`min_rows`..`max_rows` rows summing to 100; every `assessor`/`both` text field is filled. Errors come back as 422
with `errors["answers.<sectionKey>.<itemKey|index>.<field>"]` and a summary `message`.

## 5. Endpoints

| Method | Path | Who | Notes |
| --- | --- | --- | --- |
| GET | `/api/appraisal-templates` | `appraisal.manage_templates` or `appraisal.manage_periods` (to pick a template) | paginated `{ id, code, name, revision, is_active, periods_count, updated_at }`; `search` |
| GET | `/api/appraisal-templates/{id}` | `appraisal.manage_templates`, or any user for the template of a period they can see | + `schema` |
| POST | `/api/appraisal-templates` | `appraisal.manage_templates` | `{ code, name, revision, schema, is_active }`; schema validated (keys unique, 5 levels, levels match scale length, rows min ≤ max) |
| PUT | `/api/appraisal-templates/{id}` | same | 409 when used by a period |
| POST | `/api/appraisal-templates/{id}/duplicate` | same | new inactive copy, revision suggested `Rev.N+1` |
| DELETE | `/api/appraisal-templates/{id}` | same | 409 when used |
| GET | `/api/appraisal-periods` | any signed-in user | paginated `TAppraisalPeriod`; `status`, `search`; `counts` only for `appraisal.view_all` / `appraisal.manage_periods` |
| POST / PUT | `/api/appraisal-periods[/{id}]` | `appraisal.manage_periods` | `{ name, review_start, review_end, target_start, target_end, due_date?, template_id }`; template change only while the period has no appraisals |
| PATCH | `/api/appraisal-periods/{id}/close` / `reopen` | same | |
| DELETE | `/api/appraisal-periods/{id}` | same | 409 when it has appraisals |
| GET | `/api/appraisals` | `scope=mine` (default, `appraisal.fill`), `team` (`appraisal.assess`: I am the assessor), `all` (`appraisal.view_all`) | paginated `TAppraisalItem`; `period_id`, `status`, `search` (employee name / number); `meta.awaiting_my_assessment` |
| POST | `/api/appraisals` | `appraisal.fill` | `{ period_id }` → my appraisal (prefilled); 409 when it exists, 422 when the period is closed or I have no assessor |
| GET | `/api/appraisals/{id}` | owner, assessor, `appraisal.view_all` | `TAppraisalDetail` |
| PUT | `/api/appraisals/{id}/answers` | owner (draft) / assessor (submitted) | `{ answers }` partial; merged per §4; returns `TAppraisalDetail` |
| POST | `/api/appraisals/{id}/submit` | owner, from `draft` | completeness check |
| POST | `/api/appraisals/{id}/return` | assessor, from `submitted` | `{ note }` required |
| POST | `/api/appraisals/{id}/assess` | assessor, from `submitted` | completeness check |
| POST | `/api/appraisals/{id}/acknowledge` | owner, from `assessed` | |
| GET | `/api/appraisals/{id}/pdf` | owner, assessor, `appraisal.view_all` | `application/pdf`, landscape A4, F-HR-10 layout: final rating ✓ in the level column, self rating noted; header with snapshot names; footer "Confidential" |

```ts
TAppraisalPeriod = { id, name, review_start, review_end, target_start, target_end, due_date, status,
  template: { id, code, name, revision }, closed_at, created_at,
  counts?: { total, draft, submitted, assessed, acknowledged } }
TAppraisalItem = { id, status, period: { id, name, status }, employee: { id, name, employee_number, position,
  department: { id, name, alias } | null }, assessor: { id, name } | null,
  submitted_at, assessed_at, acknowledged_at, updated_at }
TAppraisalDetail = TAppraisalItem & {
  answers: TAppraisalAnswers, return_note: string | null, snapshot,
  template: { id, code, name, revision, schema: TAppraisalTemplateSchema },
  period: TAppraisalPeriod,
  is_leader: boolean,                     // leader-only items apply
  my_role: "employee" | "assessor" | "viewer",
  can_edit: boolean, can_submit: boolean, can_return: boolean, can_assess: boolean, can_acknowledge: boolean,
}
```

## 6. Permissions

| Title | Group | Label | Granted to |
| --- | --- | --- | --- |
| `appraisal.fill` | appraisal | Fill my appraisal | every role |
| `appraisal.assess` | appraisal | Assess my team | Lead/Project Manager, Division Manager, Administrator |
| `appraisal.manage_periods` | appraisal | Open and close appraisal periods | HR, Lead/Project Manager, Division Manager, Administrator |
| `appraisal.view_all` | appraisal | View all appraisals and PDFs | HR, Administrator |
| `appraisal.manage_templates` | appraisal | Manage appraisal templates | HR, Administrator |

## 7. Frontend routes

| Route | Module | Permission |
| --- | --- | --- |
| `/appraisal/my` | Appraisal — my appraisals per period, "start" for an open period | `appraisal.fill` |
| `/appraisal/team` | Appraisal — appraisals I assess (badge = awaiting) | `appraisal.assess` |
| `/appraisal/reports` | Appraisal — every appraisal of a period + PDF | `appraisal.view_all` |
| `/appraisal/periods` | Appraisal — open / close periods | `appraisal.manage_periods` |
| `/appraisal/[id]` | Appraisal — the form (employee, assessor or read-only view) | access per §5 |
| `/setup/appraisal-templates`, `/setup/appraisal-templates/[id]` | Setup — template list and editor | `appraisal.manage_templates` |

The PDF is fetched through the same-origin route handler `src/app/api/appraisals/[id]/pdf/route.ts`
(httpOnly token cookie → Bearer), so the browser never sees the token.
