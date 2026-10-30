# AI_WORKFLOW.md — Standardized Implementation Lifecycle

> This is the one process every implementation in this repository goes through, whether the work is done by an AI assistant, a human, or both together. It exists so that "how we built the last feature" is never a mystery — every task produces the same trail of artifacts, checked against the same two references: `docs/ARCHITECTURE.md` (what exists) and `docs/RULES.md` (what's allowed).

This document does not restate `ARCHITECTURE.md` or `RULES.md`. It says **when** to consult them, **what artifact** to produce at each step, and **who** signs off before work moves to the next step.

---

# 1. Roles

| Role | Owns |
|---|---|
| **Implementer** (AI assistant, or a human following this same process) | Phases 1–3, 5–7: understanding, defining, planning, implementing, self-verifying, self-reviewing. |
| **Lead Engineer / Reviewer** (human) | The two gates: approving the plan (end of Phase 3) and the final sign-off (end of Phase 7). Also the sole authority to approve any Hard-Stop item (§4). |

The Implementer never merges its own work past the final gate. The Lead Engineer never has to reverse-engineer what was done or why — that's what the artifacts from Phases 2, 3, and 7 are for.

---

# 2. The Lifecycle

```
Request
   │
   ▼
1. Understand        read ARCHITECTURE.md + relevant RULES.md sections, read the affected
   │                 code, identify which domain/layer this touches. Ask if unclear.
   ▼
2. Define             fill out TASK_TEMPLATE.md
   │
   ▼
3. Plan                fill out IMPLEMENTATION_PLAN_TEMPLATE.md
   │
   ▼
4. Approval Gate ─────────────────────────────────────────┐  changes requested →
   │ approved                                              │  back to step 3
   ▼                                                        │
5. Implement           follow RULES.md exactly, scoped to the approved plan
   │
   ▼
6. Self-Verify          npm run lint · npm run build · manual browser pass
   │
   ▼
7. Self-Review ───────────────────────────────────────────┤  findings →
   │                 apply REVIEW_CHECKLIST.md in full      │  back to step 5
   ▼ clean                                                  │
8. Done                 RULES.md §16 satisfied, handed to the Lead Engineer for final sign-off
```

### Phase 1 — Understand

- Read the request as given. Do not infer acceptance criteria that weren't stated.
- Identify which domain it belongs to (Leave, Auth, or shared/`common`) and re-read the matching parts of `docs/ARCHITECTURE.md` (folder responsibilities, the domain's existing routes/actions/services) and `docs/RULES.md` (especially §3 layering and §4 folder placement).
- Locate the existing code the task touches or resembles. A new feature almost always has a sibling feature already doing something structurally similar (§5, §7 of `RULES.md`) — find it before writing anything.
- **Exit criteria**: you can state, in one sentence, what layer(s) this touches (Page / Feature Component / Action / Service / Store) and which existing pattern it should follow.

### Phase 2 — Define

- Fill out `docs/TASK_TEMPLATE.md` completely. If a field can't be filled from the request as given (most commonly Acceptance Criteria or Scope), that is a stop condition — ask, don't assume (see §4).
- **Output**: a filled task definition, kept with the request (PR description, issue, or the top of the working branch's notes).

### Phase 3 — Plan

- Fill out `docs/IMPLEMENTATION_PLAN_TEMPLATE.md`: current-state analysis, affected files, ordered steps, risks, manual testing plan, expected result.
- The plan must show its work against `RULES.md` §3–4 explicitly: which layer each new/changed file belongs to, and why it lives where it does.
- **Output**: a filled implementation plan.

### Phase 4 — Approval Gate

- The Lead Engineer reviews the plan **before any code is written**, not after.
- This gate is mandatory — not optional — whenever the plan includes any of the Hard-Stop conditions in §4 below. For everything else it's still expected, but see the Fast Path (§3) for how to compress it for trivial changes.
- A plan is approved, sent back with specific changes requested, or rejected. Only "approved" proceeds to Phase 5.

### Phase 5 — Implement

- Follow the approved plan and `RULES.md` without deviation. If reality diverges from the plan mid-implementation (an assumption turns out wrong, a file needs to move), update the plan doc to reflect it rather than silently drifting from what was approved — significant divergence returns to Phase 4.
- Keep the change scoped to what the plan describes. Don't fold in unrelated refactors, renames, or "while I'm here" cleanups — that's a separate task with its own Phase 1–4.

### Phase 6 — Self-Verify

There is no automated test suite in this repository (no `test` script; the `.husky/pre-commit` hook and `.github/workflows/ci.yml` run lint and build). "Verified" therefore means, concretely:

1. `npm run lint` passes.
2. `npm run build` passes (this is also the TypeScript check — there is no separate `tsc` step).
3. For any UI-visible change: the dev server is started and the feature is exercised by hand in the browser — golden path and the realistic edge cases (empty state, loading state, error state, at least one narrow-viewport check). If the UI genuinely cannot be exercised in this environment, that limitation is stated explicitly rather than the task being marked verified anyway.

### Phase 7 — Self-Review

- Work through `docs/REVIEW_CHECKLIST.md` top to bottom against the actual diff. Every unchecked item is either fixed (return to Phase 5) or explicitly marked not-applicable with a one-line reason — never silently skipped.
- **Output**: a completed review checklist attached to the change (PR description or commit notes).

### Phase 8 — Done

- All of `RULES.md` §16 (Definition of Done) and `docs/REVIEW_CHECKLIST.md` are satisfied.
- Handed to the Lead Engineer for the final sign-off (normal PR review). This workflow's job ends here — merge/deploy conventions are outside its scope.

---

# 3. Fast Path for Trivial Changes

A change qualifies for the fast path only if **all** of these hold: it touches exactly one file or a copy/label/constant-value change, it changes no data flow (no new endpoint, query, action, store, or route), and it cannot trigger any Hard-Stop condition in §4.

For a fast-path change: Phases 2 and 3 may be a single short paragraph instead of the full templates (state the objective and the one file touched), but they still must exist somewhere in the change's description — never skipped outright. Phases 6 and 7 are never shortened: lint/build still run, and the checklist is still worked through (most sections will simply be marked not-applicable).

---

# 4. Hard-Stop Conditions — Ask, Don't Proceed

Stop at Phase 1 or 2 and get explicit direction from the Lead Engineer before planning or implementing if the task involves any of the following. These are exactly the seams `RULES.md` and `ARCHITECTURE.md` flag as sensitive or already inconsistent:

- Touches anything under **authentication** — login/logout flow, cookie handling, `AuthProvider`, `proxy.ts`'s route matcher, or the token/session mechanism (`RULES.md` §7 says "do not change it"; a task that requires changing it needs an explicit decision, not an inferred one).
- Requires a **new dependency**, or new usage of an already-installed-but-unused one (`jotai`, `@dnd-kit`, `motion` outside the vendored widgets — `RULES.md` §2).
- Requires a **new top-level `src/` folder**, or breaks the one-way dependency direction in `RULES.md` §3.
- Would fill in one of the a service function for an endpoint whose contract is not confirmed (see `docs/backend-task.md`) — confirm the endpoint and response shape before writing the service function, rather than guessing at a contract.
- The request's **Acceptance Criteria are ambiguous or absent** — do not invent them to keep moving; write the ambiguity into `TASK_TEMPLATE.md`'s Notes/Open Questions and ask.
- The task would require **deviating from a documented `RULES.md` rule** to be implemented as described — surface the conflict explicitly rather than quietly picking a side.

---

# 5. Artifact Reference

| Phase | Template used | Lives in |
|---|---|---|
| 2. Define | `docs/TASK_TEMPLATE.md` | Copied into the request/issue/PR description |
| 3. Plan | `docs/IMPLEMENTATION_PLAN_TEMPLATE.md` | Copied into the PR description or a working note on the branch |
| 7. Self-Review | `docs/REVIEW_CHECKLIST.md` | Copied into the PR description, filled in |

`docs/ARCHITECTURE.md` and `docs/RULES.md` are read-only references consulted throughout — they are never copied or restated, only cited by section number (e.g. "per RULES §6").
