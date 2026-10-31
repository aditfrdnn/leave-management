# REVIEW_CHECKLIST.md

> Usage: copy this file's content into the PR description and work through it against the actual diff at `AI_WORKFLOW.md` Phase 7 (Self-Review). Check `[x]` what passes, check `[x] N/A — <reason>` for what genuinely doesn't apply, and leave unchecked anything that still needs fixing — never delete an item to make the list shorter.

**Task:** <link to `TASK_TEMPLATE.md` / PR>
**Reviewer:**
**Date:**

---

## 1. Architecture Compliance (`RULES.md` §3)

- [ ] Data flows Page → Feature Component → Action → Service → API Client, matching the layering diagram — no layer skipped.
- [ ] No component or `action.ts` calls `instance`/`axios` directly — all backend calls go through a `services/<domain>.service.ts` function.
- [ ] No new file breaks the one-way dependency direction (`components/ui/` importing from `common/` or a feature; `lib/`/`types/`/`constants/`/`validations/` importing from `app/`/`components/`/`stores/`).
- [ ] No feature's `_components/` imports directly from another feature's `_components/` (shared pieces were promoted to `components/common/` instead).
- [ ] No component reads/writes cookies directly — only `lib/cookies.ts`, Server Actions, and Route Handlers do.
- [ ] No hardcoded endpoint URL — new paths were added to `constants/endpoint-constant.ts`.

## 2. RULES.md Compliance (general sweep)

- [ ] New files landed where `RULES.md` §4 says they should (route vs. `_components/` vs. `common/` vs. `services/` vs. `stores/` vs. `validations/` vs. `types/` vs. `constants/`).
- [ ] No new top-level `src/` folder, and no `src/features/`-style folder was introduced.
- [ ] No new dependency was added, and no new usage of `jotai`/`@dnd-kit`/`motion` outside the vendored `kibo-ui`/`shadcn-io` widgets was introduced (`RULES.md` §2).
- [ ] If this touches auth (login/logout/token/cookie/`proxy.ts`/`AuthProvider`), it was explicitly called out and approved at the Phase 4 gate — not changed incidentally (`RULES.md` §7).
- [ ] A new service file is exported from `services/index.ts`.

## 3. Type Safety

- [ ] `npm run build` passes (this is the project's TypeScript check — there is no separate `tsc` script).
- [ ] No new `any` introduced where a real type was available (note: `@typescript-eslint/no-explicit-any` is off in this repo's ESLint config, so this is a manual check, not a lint failure).
- [ ] New domain types are `T`-prefixed `type` aliases in `types/<domain>.d.ts`, exported through `types/index.ts` (`RULES.md` §12).
- [ ] New Server Actions return `ActionState`/`ActionFn` from `types/action-state.d.ts`, not a new bespoke `XFormState` type (`RULES.md` §6, §12).
- [ ] Generic form components (if any) are typed `<T extends FieldValues>` over the RHF form, consistent with existing `common/Form*` components.

## 4. Reusability

- [ ] `components/common/` and `components/ui/` were checked before writing new UI (`RULES.md` §5, §10) — no component was rebuilt that already exists.
- [ ] Forms use the existing `common/Form*` wrappers, not hand-wired `FormField` + raw `ui/` primitives.
- [ ] Tabular data uses `DataTable`, not a hand-rolled TanStack Table integration.
- [ ] Destructive actions use `DeleteDialog`, not a bespoke confirm dialog.
- [ ] Breadcrumbs use `GeneralBreadcrumb`; page titles use `PageHeader`.
- [ ] A component now used by 2+ features was moved to `components/common/` rather than duplicated or cross-imported.

## 5. UI Consistency

- [ ] All new UI primitives came from shadcn/ui (installed via the CLI/registries in `components.json`), not hand-built equivalents (`RULES.md` §10).
- [ ] Spacing/typography matches sibling components (`gap-1.5` on form items, `text-sm`/`text-xs text-muted-foreground` for helper text, existing `rounded-lg`/`rounded-xl` radii) rather than introducing new ad hoc values.
- [ ] Status/tone styling reuses the existing lookup tables (`lib/status-config.ts`, `lib/utils/ui-variant.ts`) rather than inlining new colors.

## 6. Responsive Design

- [ ] Verified manually at a narrow (mobile) viewport, not just desktop (per `IMPLEMENTATION_PLAN_TEMPLATE.md` §7 — there is no automated visual/responsive test).
- [ ] Uses the project's existing responsive conventions (`sm:`/`lg:` Tailwind prefixes, `useIsMobile` where sibling components use it) rather than a new breakpoint scheme.
- [ ] Tables/wide content scroll or reflow sensibly on small screens (matches `DataTable`'s existing behavior).

## 7. Loading State

- [ ] Every `useQuery` consumer has an explicit `isLoading` branch (skeleton, `SpinnerLoading`, or equivalent) — no flash of empty/undefined content.
- [ ] Every action-backed submit control disables itself and shows `LoadingButton` (or equivalent) while `useActionState`'s pending flag / a `useTransition` is true, matching `SignInForm`/`DeleteDialog` (`RULES.md` §9).

## 8. Error State

- [ ] Every `useQuery` consumer has a real answer for the error/failed-fetch case (not just the empty-data case).
- [ ] Every Server Action's `try/catch` normalizes failures into `{ status: "error", errors: { _form: [...] } }` — no unhandled exception can escape it (`RULES.md` §6, §13).
- [ ] Field-level errors render via each `Form*` wrapper's `<FormMessage/>`; form-level errors surface as a `sonner` toast — no ad hoc alert/banner introduced (`RULES.md` §13).

## 9. Accessibility

- [ ] Interactive elements are semantic/Radix primitives (`Button`, `DialogTrigger`, etc.), not a `<div>`/`<span>` with an `onClick`.
- [ ] Every form field has an associated label (via `FormLabel` in the `common/Form*` wrapper) — no placeholder-as-label.
- [ ] Icon-only buttons have an `aria-label` or equivalent accessible name.
- [ ] Status/tone is never color-only — it pairs color with text or an icon (matches `getStatusConfig`/`getStatusBadgeVariant` pairing a label with a color).
- [ ] Dialogs/menus keep their default Radix focus-trap and keyboard behavior (Escape to close, focus return on close) — not overridden or suppressed.
- [ ] Images have meaningful `alt` text (or `alt=""` when purely decorative).

## 10. Performance

- [ ] No duplicate `useQuery` for the same resource across sibling components on the same page (`RULES.md` §14).
- [ ] `queryKey` includes every input that changes the result (page, limit, filters, id) — otherwise two inputs share one cache entry.
- [ ] Zustand selectors are narrow (`useAuthStore((s) => s.user)`), not whole-store destructuring, where the component only needs one field.
- [ ] Derived table columns are memoized with `useMemo` keyed on the data driving them, matching every existing `*-columns.tsx` consumer.
- [ ] New non-interactive sections default to Server Components rather than reflexive `"use client"`, where the existing pattern in that area allows it.

## 11. Code Quality

- [ ] Naming follows `RULES.md` §12 (kebab-case files, PascalCase components, `use<Domain>Store` stores, `<domain>Service` services, `SCREAMING_SNAKE_CASE` constants).
- [ ] No unrelated refactor, rename, or cleanup bundled into this change (scope matches `TASK_TEMPLATE.md`'s In Scope / Out of Scope).
- [ ] No dead code left behind (unused import, unused prop, a stub left half-filled).
- [ ] No new comment explains *what* the code does (self-evident from naming) — comments, if any, explain a non-obvious *why*.

## 12. Lint & Type Checking

- [ ] `npm run lint` passes clean.
- [ ] `npm run build` passes clean.
- [ ] Both were run after the last code change in this review pass (not just before fixes were applied).

---

## Findings Log

_Anything checked "unresolved" above, logged with enough detail to act on. Clear this table before Phase 8 (Done)._

| # | Category | Finding | Status |
|---|---|---|---|
| | | | Open / Fixed / Won't Fix (reason) |

## Sign-off

- [ ] All sections above are checked (`[x]` pass or `[x] N/A — reason`) — none left blank.
- [ ] Findings Log is empty or every row is `Fixed`/`Won't Fix` with a reason.
- [ ] `docs/RULES.md` §16 Definition of Done is satisfied.

**Verdict:** ☐ Approved ☐ Changes Requested
