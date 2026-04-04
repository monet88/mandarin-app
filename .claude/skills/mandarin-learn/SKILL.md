---
name: mandarin-learn
description: Use when working on the mandarin-learn Expo Router and Supabase app and you need repository-specific development patterns, file conventions, or maintenance workflows.
---

# mandarin-learn Development Patterns

> Auto-generated skill from repository analysis

## Overview

This skill documents the development patterns and workflows for the `mandarin-learn` repository, an Expo Router / React Native TypeScript app backed by Supabase and Deno Edge Functions. Use it to keep generated bundle docs aligned with the app's real stack, file conventions, and maintenance workflows.

## Coding Conventions

- **File Naming:** Match the surrounding area instead of forcing one global style.
  - Examples: `components/hsk/HskWordCard.tsx`, `hooks/useHskSession.ts`, `app/hsk-vocab-study.tsx`
- **Imports:** Prefer `@/` aliases in app/runtime code and relative imports for colocated Supabase Deno helpers/tests.
  - Example:
    ```typescript
    import { Fonts } from "@/constants/theme";
    import { buildCorsHeaders } from "./cors.ts";
    ```
- **Exports:** Follow nearby module style. The repo uses both default exports for screens/providers/components and named exports for hooks, utils, and helpers.
  - Example:
    ```typescript
    export default function ConversationScreen() { /* ... */ }
    export function useHskSession() { /* ... */ }
    ```
- **Commit Messages:** Follow [Conventional Commits](https://www.conventionalcommits.org/) with prefixes like `feat` and `docs`.
  - Example: `feat: add spaced repetition scheduling to lessons`

## Workflows

### Feature Development
**Trigger:** When adding or changing app, hook, library, or edge-function behavior and you need the repo workflow scaffold that ships with this bundle.
**Command:** `/feature-development`

1. Update the implementation files closest to the behavior you are changing.
2. Keep docs or generated metadata in sync when the change affects setup or workflows.
3. Run the narrowest relevant verification for touched files before expanding to lint/typecheck checks.

**Files Involved:**
- `app/**/*.tsx`
- `components/**/*.tsx`
- `hooks/**/*.ts`
- `lib/**/*.ts`
- `supabase/functions/**/*.ts`

---

### Add or Update ECC Bundle
**Trigger:** When introducing or updating an ECC bundle for a new or existing app/skill (e.g., `mandarin-app` or `mandarin-learn`).
**Command:** `/add-or-update-ecc-bundle`

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
/add-or-update-ecc-bundle
```

---

### Update Supabase Setup Documentation
**Trigger:** When updating Supabase integration/setup documentation or pinning local tool dependencies.
**Command:** `/update-supabase-setup-documentation`

1. Edit `docs/supabase-setup-guide.md` to update setup instructions.
2. Edit `README.md` if environment variables, deploy steps, or secrets change.
3. Keep the documented function/secrets list aligned with the actual `supabase/functions/` directory and current runtime requirements.

**Example:**
```bash
/update-supabase-setup-documentation
```

---

## Testing Patterns

- **Edge Function Tests:** Shared Deno helpers use `_test.ts` files next to the implementation.
  - Example: `supabase/functions/_shared/cors_test.ts`
- **App-Side Tests:** No project-level Jest/Vitest harness is configured in this repo snapshot, so do not claim one exists unless it is added.
- **Test Example:**
  ```typescript
  import { assertEquals } from "jsr:@std/assert";
  import { buildCorsHeaders } from "./cors.ts";

  Deno.test("buildCorsHeaders allows the configured origin", () => {
    assertEquals(
      buildCorsHeaders("https://app.example.com", "https://app.example.com")?.["Access-Control-Allow-Origin"],
      "https://app.example.com",
    );
  });
  ```

## Commands

| Command                | Purpose                                                         |
|------------------------|-----------------------------------------------------------------|
| /feature-development   | Follow the generated scaffold for implementation work           |
| /add-or-update-ecc-bundle | Add or update an ECC bundle for an app or skill             |
| /update-supabase-setup-documentation | Update Supabase setup documentation and deploy guidance |
