---
name: add-or-update-ecc-bundle
description: Workflow command scaffold for add-or-update-ecc-bundle in mandarin-learn.
allowed_tools: ["Bash", "Read", "Write", "Grep", "Glob"]
---

# /add-or-update-ecc-bundle

Use this workflow when working on **add-or-update-ecc-bundle** in `mandarin-learn`.

## Goal

Adds or updates an ECC bundle for an app or skill, including metadata, skill definitions, agent configs, instincts, and related command docs.

## Common Files

- `.claude/ecc-tools.json`
- `.claude/identity.json`
- `.claude/skills/*/SKILL.md`
- `.agents/skills/*/SKILL.md`
- `.agents/skills/*/agents/openai.yaml`
- `.claude/homunculus/instincts/inherited/*.yaml`

## Suggested Sequence

1. Understand the current state and failure mode before editing.
2. Make the smallest coherent change that satisfies the workflow goal.
3. Run the most relevant verification for touched files.
4. Summarize what changed and what still needs review.

## Typical Commit Signals

- Add or update .claude/ecc-tools.json
- Add or update .claude/identity.json
- Add or update .claude/skills/<app-or-skill>/SKILL.md
- Add or update .agents/skills/<app-or-skill>/SKILL.md
- Add or update .agents/skills/<app-or-skill>/agents/openai.yaml

## Notes

- Treat this as a scaffold, not a hard-coded script.
- Update the command if the workflow evolves materially.