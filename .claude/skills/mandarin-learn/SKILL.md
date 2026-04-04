```markdown
# mandarin-learn Development Patterns

> Auto-generated skill from repository analysis

## Overview

This skill documents the development patterns and workflows for the `mandarin-learn` repository, a TypeScript codebase focused on Mandarin language learning. The repository is framework-agnostic and emphasizes clear, maintainable code with strong documentation practices. It features conventional commit messages, modular code organization, and a set of well-defined workflows for managing ECC bundles, Supabase setup, and project metadata.

## Coding Conventions

- **File Naming:** Use `camelCase` for files and folders.
  - Example: `userProfile.ts`, `lessonManager.ts`
- **Imports:** Use relative import paths.
  - Example:
    ```typescript
    import { getLesson } from './lessonManager';
    ```
- **Exports:** Prefer named exports.
  - Example:
    ```typescript
    // lessonManager.ts
    export function getLesson(id: string) { /* ... */ }
    export const LESSON_LIMIT = 10;
    ```
- **Commit Messages:** Follow [Conventional Commits](https://www.conventionalcommits.org/) with prefixes like `feat` and `docs`.
  - Example: `feat: add spaced repetition scheduling to lessons`

## Workflows

### Add or Update ECC Bundle
**Trigger:** When introducing or updating an ECC bundle for a new or existing app/skill (e.g., `mandarin-app` or `mandarin-learn`).
**Command:** `/add-ecc-bundle`

1. Add or update `.claude/ecc-tools.json` with ECC tool definitions.
2. Add or update `.claude/identity.json` to reflect the app/skill identity.
3. Add or update `.claude/skills/<app-or-skill>/SKILL.md` with skill documentation.
4. Add or update `.agents/skills/<app-or-skill>/SKILL.md` for agent-specific skill docs.
5. Add or update `.agents/skills/<app-or-skill>/agents/openai.yaml` for agent configuration.
6. Add or update `.claude/homunculus/instincts/inherited/<app-or-skill>-instincts.yaml` for instinct definitions.
7. Add or update `.codex/config.toml` for configuration.
8. Add or update `.codex/AGENTS.md` and `.codex/agents/*.toml` for agent metadata.
9. Add or update `.claude/commands/*.md` for command documentation.

**Example:**
```bash
/add-ecc-bundle
# Then follow the checklist above to update all relevant files.
```

---

### Update Supabase Setup Documentation
**Trigger:** When updating Supabase integration/setup documentation or pinning local tool dependencies.
**Command:** `/update-supabase-docs`

1. Edit `docs/supabase-setup-guide.md` to update setup instructions.
2. Edit `.codex/config.toml` to pin or update package references.
3. Edit `README.md` if deployment guidance changes.

**Example:**
```bash
/update-supabase-docs
# Then update the relevant documentation and configuration files.
```

---

### Update Metadata or Docs File
**Trigger:** When updating or replacing documentation or metadata files (e.g., `AGENTS.md`, `CLAUDE.md`) to reflect project changes, statistics, or rebranding.
**Command:** `/update-metadata-docs`

1. Edit or replace `AGENTS.md` or `CLAUDE.md` as needed.
2. Update `.gitignore` if new files/folders should be ignored.
3. Edit related metadata files as necessary.

**Example:**
```bash
/update-metadata-docs
# Then update documentation and metadata files as required.
```

## Testing Patterns

- **Test File Naming:** Test files use the pattern `*.test.*`.
  - Example: `lessonManager.test.ts`
- **Testing Framework:** Not explicitly detected; follow standard TypeScript testing practices.
- **Test Example:**
  ```typescript
  // lessonManager.test.ts
  import { getLesson } from './lessonManager';

  test('returns lesson by id', () => {
    expect(getLesson('abc123')).toBeDefined();
  });
  ```

## Commands

| Command                | Purpose                                                         |
|------------------------|-----------------------------------------------------------------|
| /add-ecc-bundle        | Add or update an ECC bundle for an app or skill                 |
| /update-supabase-docs  | Update Supabase setup documentation and configuration           |
| /update-metadata-docs  | Update or replace project documentation or metadata files       |
```
