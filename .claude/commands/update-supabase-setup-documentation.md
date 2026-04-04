---
name: update-supabase-setup-documentation
description: Workflow command scaffold for update-supabase-setup-documentation in mandarin-learn.
allowed_tools: ["Bash", "Read", "Write", "Grep", "Glob"]
---

# /update-supabase-setup-documentation

Use this workflow when working on **update-supabase-setup-documentation** in `mandarin-learn`.

## Goal

Updates Supabase integration/setup documentation and related configuration to keep deployment instructions and local tooling deterministic.

## Common Files

- `docs/supabase-setup-guide.md`
- `.codex/config.toml`
- `README.md`

## Suggested Sequence

1. Understand the current state and failure mode before editing.
2. Make the smallest coherent change that satisfies the workflow goal.
3. Run the most relevant verification for touched files.
4. Summarize what changed and what still needs review.

## Typical Commit Signals

- Edit docs/supabase-setup-guide.md to add or update setup instructions
- Edit .codex/config.toml to pin or update package references
- Edit README.md if deployment guidance changes

## Notes

- Treat this as a scaffold, not a hard-coded script.
- Update the command if the workflow evolves materially.