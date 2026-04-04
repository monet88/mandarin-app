---
name: refactor-or-feature-phase-with-tests-and-docs
description: Workflow command scaffold for refactor-or-feature-phase-with-tests-and-docs in madarin-app.
allowed_tools: ["Bash", "Read", "Write", "Grep", "Glob"]
---

# /refactor-or-feature-phase-with-tests-and-docs

Use this workflow when working on **refactor-or-feature-phase-with-tests-and-docs** in `madarin-app`.

## Goal

Implements a significant refactor or feature phase by updating implementation files, adding or updating regression/unit tests, and updating associated planning documentation.

## Common Files

- `hooks/*.ts`
- `components/**/*.tsx`
- `supabase/functions/**/*.ts`
- `ctx/*.ts`
- `__tests__/**/*.test.ts*`
- `plans/202*/**/*.md`

## Suggested Sequence

1. Understand the current state and failure mode before editing.
2. Make the smallest coherent change that satisfies the workflow goal.
3. Run the most relevant verification for touched files.
4. Summarize what changed and what still needs review.

## Typical Commit Signals

- Update or add implementation files (e.g., hooks, components, edge functions, context providers)
- Add or update corresponding regression/unit test files in __tests__/
- Update or add planning/phase documentation in plans/
- Run and verify tests, typechecks, and lints

## Notes

- Treat this as a scaffold, not a hard-coded script.
- Update the command if the workflow evolves materially.