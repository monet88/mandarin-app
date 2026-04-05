# AGENTS.md

Mandarin learning mobile app -- Expo Router (file-based routing) + Supabase backend. React Context for auth, AsyncStorage for local persistence.

## Project map

- `app/` - Expo Router screens (`_layout.tsx` entry point, `(tabs)/`, modals)
- `components/` - UI components (lesson, conversation, subscription, HSK)
- `constants/` - Theme (`theme.ts`), course data types (`CourseData.ts`)
- `ctx/` - React Context definitions (`AuthContext.tsx`)
- `providers/` - Context providers (`AuthProvider.tsx`)
- `hooks/` - Custom hooks (deep linking, etc.)
- `lib/` - Business logic, AsyncStorage helpers, billing
- `utils/` - Supabase client, utilities
- `assets/data/` - Static course content JSON
- `supabase/functions/` - Deno edge functions

## Rules

- Return code first. Explanation after, only if non-obvious.
- Simplest working solution. No over-engineering, no speculative features.
- No abstractions for single-use operations.
- Read the file before modifying it.
- No em dashes, smart quotes, or decorative Unicode. Plain hyphens and straight quotes. CJK fine.
- Code output must be copy-paste safe.

<important if="you are reviewing code or a pull request">

- State the bug. Show the fix. Stop.
- No suggestions beyond the scope of the review.
- No compliments on the code.
</important>

<important if="you are debugging an issue or investigating an error">

- Read the relevant code before forming a hypothesis.
- State what you found, where, and the fix. One pass.
- If cause is unclear: say so and suggest next diagnostic steps.
</important>

<important if="you are working on routing, navigation, or the auth gate">

`app/_layout.tsx` is the entry point:
- No session -> `IntroScreen` (magic links, Apple, Google)
- Session but `!profile.onboarding_completed` -> `/onboarding`
- Authenticated -> `(tabs)` stack (lessons, conversations, profile)

Modal screens (`/conversation`, `/practise`) push on top of tabs.

Auth: `providers/AuthProvider.tsx` wraps app, manages Supabase session via `ctx/AuthContext.tsx`. Tokens AES-256 encrypted in SecureStore (`utils/supabase.ts` -> `LargeSecureStore`). Deep linking in `hooks/useDeepLinking.ts`.
</important>

<important if="you are working with data storage, persistence, or deciding where to store data">

| Data | Storage | Location |
|------|---------|----------|
| User profile, premium status | Supabase Postgres | `profiles` table (RLS) |
| HSK progress, word mastery | Supabase Postgres | `hsk_progress`, `hsk_word_mastery` |
| HSK exam sessions & results | Supabase Postgres | `hsk_exam_sessions`, `hsk_exam_results` |
| HSK event ledger | Supabase Postgres | `hsk_event_ledger` (idempotent via `event_id`) |
| Subscriptions | Supabase Postgres | `subscriptions` (webhook-only writes) |
| Lesson completion | AsyncStorage | `lib/lessonProgress.ts` |
| Speaking/listening stats | AsyncStorage | `lib/speakingListeningStats.ts` |
| Custom scenarios | AsyncStorage | `lib/customScenarios.ts` |
| HSK review queue (offline) | AsyncStorage | `lib/hsk-event-queue.ts` (synced via `hsk-sync-events`) |
</important>

<important if="you are working on edge functions, Supabase functions, or the Deno backend">

All in `supabase/functions/`. Pattern: CORS preflight -> auth -> premium check (if needed) -> OpenRouter API (Gemini-3-Flash) -> JSON response.

| Function | Purpose |
|----------|---------|
| `chat-completion` | AI roleplay conversation. Free scenario id `"1"` bypasses premium |
| `transcribe-audio` | Audio -> Pinyin transcription (no Hanzi) |
| `scenario-generate` | Premium-only. Generates scenario JSON |
| `start-trial` | Grants 7-day premium (legacy, backward compat) |
| `hsk-session-init` | Initialize HSK study session |
| `hsk-mock-exam-start` | Timed exam, server-authoritative deadlines, daily quota |
| `hsk-mock-exam-submit-section` | Submit per-section answers, scores on final section |
| `hsk-writing-evaluate` | LLM writing rubric (rate-limited, cached, fallback) |
| `hsk-refresh-question-bank` | Regenerate exam questions from HSK vocab |
| `hsk-sync-events` | Batch-sync client study events, idempotent ledger |
| `revenuecat-webhook` | Mirror RevenueCat subscription state to profiles |
</important>

<important if="you are working on premium, billing, subscriptions, or trial logic">

`is_premium` + `premium_expires_at` on profiles table. RLS prevents client modification -- only service role sets premium fields. Client checks expiration in `AuthProvider`. RevenueCat webhook is authoritative for subscription state. Billing SDK: `lib/billing.ts`.
</important>

<important if="you are working on lessons, course content, or question types">

Static JSON at `assets/data/course_content.json`. Structure: `CourseData -> Chapter[] -> Lesson[] -> Question[]`. Three types: `multiple_choice`, `single_response`, `listening_mc`. Interfaces in `constants/CourseData.ts`.
</important>

<important if="you are adding or modifying imports">

Path alias: `@/*` maps to project root (tsconfig paths).
</important>

<important if="you are creating or styling components">

- `StyleSheet.create()` with theme constants from `constants/theme.ts` (accent: `#ff4900`)
- Fonts: EB Garamond via `@expo-google-fonts`
- Animations: `react-native-reanimated` for gesture-driven, `Animated` API for sequential/spring
</important>

<important if="you are setting up environment variables or configuring secrets">

```
EXPO_PUBLIC_SUPABASE_URL=<supabase_project_url>
EXPO_PUBLIC_SUPABASE_KEY=<supabase_anon_key>
```

Edge function secrets (`npx supabase secrets set`): `OPENROUTER_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
</important>

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **mandarin-app** (747 symbols, 1492 relationships, 55 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> If any GitNexus tool warns the index is stale, run `npx gitnexus analyze` in terminal first.

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `gitnexus_impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `gitnexus_detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `gitnexus_query({query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `gitnexus_context({name: "symbolName"})`.

## When Debugging

1. `gitnexus_query({query: "<error or symptom>"})` — find execution flows related to the issue
2. `gitnexus_context({name: "<suspect function>"})` — see all callers, callees, and process participation
3. `READ gitnexus://repo/mandarin-app/process/{processName}` — trace the full execution flow step by step
4. For regressions: `gitnexus_detect_changes({scope: "compare", base_ref: "main"})` — see what your branch changed

## When Refactoring

- **Renaming**: MUST use `gitnexus_rename({symbol_name: "old", new_name: "new", dry_run: true})` first. Review the preview — graph edits are safe, text_search edits need manual review. Then run with `dry_run: false`.
- **Extracting/Splitting**: MUST run `gitnexus_context({name: "target"})` to see all incoming/outgoing refs, then `gitnexus_impact({target: "target", direction: "upstream"})` to find all external callers before moving code.
- After any refactor: run `gitnexus_detect_changes({scope: "all"})` to verify only expected files changed.

## Never Do

- NEVER edit a function, class, or method without first running `gitnexus_impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `gitnexus_rename` which understands the call graph.
- NEVER commit changes without running `gitnexus_detect_changes()` to check affected scope.

## Tools Quick Reference

| Tool | When to use | Command |
|------|-------------|---------|
| `query` | Find code by concept | `gitnexus_query({query: "auth validation"})` |
| `context` | 360-degree view of one symbol | `gitnexus_context({name: "validateUser"})` |
| `impact` | Blast radius before editing | `gitnexus_impact({target: "X", direction: "upstream"})` |
| `detect_changes` | Pre-commit scope check | `gitnexus_detect_changes({scope: "staged"})` |
| `rename` | Safe multi-file rename | `gitnexus_rename({symbol_name: "old", new_name: "new", dry_run: true})` |
| `cypher` | Custom graph queries | `gitnexus_cypher({query: "MATCH ..."})` |

## Impact Risk Levels

| Depth | Meaning | Action |
|-------|---------|--------|
| d=1 | WILL BREAK — direct callers/importers | MUST update these |
| d=2 | LIKELY AFFECTED — indirect deps | Should test |
| d=3 | MAY NEED TESTING — transitive | Test if critical path |

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/mandarin-app/context` | Codebase overview, check index freshness |
| `gitnexus://repo/mandarin-app/clusters` | All functional areas |
| `gitnexus://repo/mandarin-app/processes` | All execution flows |
| `gitnexus://repo/mandarin-app/process/{name}` | Step-by-step execution trace |

## Self-Check Before Finishing

Before completing any code modification task, verify:
1. `gitnexus_impact` was run for all modified symbols
2. No HIGH/CRITICAL risk warnings were ignored
3. `gitnexus_detect_changes()` confirms changes match expected scope
4. All d=1 (WILL BREAK) dependents were updated

## Keeping the Index Fresh

After committing code changes, the GitNexus index becomes stale. Re-run analyze to update it:

```bash
npx gitnexus analyze
```

If the index previously included embeddings, preserve them by adding `--embeddings`:

```bash
npx gitnexus analyze --embeddings
```

To check whether embeddings exist, inspect `.gitnexus/meta.json` — the `stats.embeddings` field shows the count (0 means no embeddings). **Running analyze without `--embeddings` will delete any previously generated embeddings.**

> Claude Code users: A PostToolUse hook handles this automatically after `git commit` and `git merge`.

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->
