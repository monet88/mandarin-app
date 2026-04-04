---
name: edge-function-hardening-or-update
description: Workflow command scaffold for edge-function-hardening-or-update in mandarin-learn.
allowed_tools: ["Bash", "Read", "Write", "Grep", "Glob"]
---

# /edge-function-hardening-or-update

Use this workflow when working on **edge-function-hardening-or-update** in `mandarin-learn`.

## Goal

Centralizes, hardens, or updates edge/serverless function logic, often with shared helpers and validation, while preserving contracts for mobile clients.

## Common Files

- `supabase/functions/**/*.ts`
- `supabase/functions/_shared/*.ts`
- `lib/**/*.ts`

## Suggested Sequence

1. Understand the current state and failure mode before editing.
2. Make the smallest coherent change that satisfies the workflow goal.
3. Run the most relevant verification for touched files.
4. Summarize what changed and what still needs review.

## Typical Commit Signals

- Update or refactor edge function implementation files
- Extract or update shared helpers in supabase/functions/_shared/
- Update or validate event payloads and error boundaries
- Run typechecks and (where possible) test edge functions locally

## Notes

- Treat this as a scaffold, not a hard-coded script.
- Update the command if the workflow evolves materially.
