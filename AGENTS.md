# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

### Supabase

Edge functions: `chat-completion`, `transcribe-audio`, `scenario-generate`, `start-trial`, `hsk-mock-exam-start`, `hsk-mock-exam-submit-section`, `hsk-refresh-question-bank`, `hsk-session-init`, `hsk-sync-events`, `hsk-writing-evaluate`, `revenuecat-webhook`

## Architecture

**Expo Router (file-based routing)** with a Supabase backend. No state management library — uses React Context for auth and AsyncStorage for local persistence.

### Routing & Auth Gate

`app/_layout.tsx` is the entry point. It checks auth state:
- No session → renders `IntroScreen` (auth screen with magic links, Apple, Google)
- Session but `!profile.onboarding_completed` → redirects to `/onboarding`
- Authenticated → renders `(tabs)` stack (lessons, conversations, profile)

Modal screens (`/conversation`, `/practise`) are pushed on top of tabs.

### Auth Flow

`providers/AuthProvider.tsx` wraps the app, manages Supabase session via `ctx/AuthContext.tsx`. Auth tokens are AES-256 encrypted in SecureStore (`utils/supabase.ts` → `LargeSecureStore` class). Deep linking (`hooks/useDeepLinking.ts`) handles magic link callback by extracting tokens from URL params.

### Data Persistence (Split Strategy)

| Data | Storage | Location |
|------|---------|----------|
| User profile, premium status | Supabase Postgres | `profiles` table with RLS |
| HSK progress, word mastery | Supabase Postgres | `hsk_progress`, `hsk_word_mastery` tables |
| HSK exam sessions & results | Supabase Postgres | `hsk_exam_sessions`, `hsk_exam_results` tables |
| HSK event ledger | Supabase Postgres | `hsk_event_ledger` (idempotent via `event_id`) |
| Subscriptions (RevenueCat) | Supabase Postgres | `subscriptions` table (webhook-only writes) |
| Lesson completion counts | AsyncStorage | `lib/lessonProgress.ts` |
| Speaking/listening stats | AsyncStorage | `lib/speakingListeningStats.ts` |
| Custom scenarios | AsyncStorage | `lib/customScenarios.ts` |
| HSK review queue (offline) | AsyncStorage | `lib/hsk-event-queue.ts` (synced via `hsk-sync-events`) |

HSK study events are queued locally and batch-synced to the server via `hsk-sync-events`.

### Edge Functions (Deno)

All in `supabase/functions/`. Common pattern: CORS preflight → auth validation → premium check (if needed) → OpenRouter API call (Gemini-3-Flash) → JSON response.

- `chat-completion`: AI roleplay conversation. Returns `{ text, hanzi, pinyin, english, conversationComplete }`. Free scenario id `"1"` bypasses premium.
- `transcribe-audio`: Audio → Pinyin transcription only (no Hanzi output).
- `scenario-generate`: Premium-only. Generates scenario JSON with title, description, goal, tasks, phrasebook.
- `start-trial`: Grants 7-day premium via service role key upsert.
- `hsk-session-init`: Initializes HSK study session, returns progress data.
- `hsk-mock-exam-start`: Creates timed exam session with server-authoritative deadlines and daily quota enforcement.
- `hsk-mock-exam-submit-section`: Submits answers per section with optimistic concurrency guard; scores on final section.
- `hsk-writing-evaluate`: LLM-based writing rubric evaluation (rate-limited, cached, with fallback).
- `hsk-refresh-question-bank`: Regenerates exam question bank from HSK vocabulary data.
- `hsk-sync-events`: Batch-syncs client study events with idempotent ledger and atomic mastery updates.
- `revenuecat-webhook`: Processes RevenueCat subscription events; mirrors premium status to profiles.

### Premium Model

`is_premium` + `premium_expires_at` on profiles table. RLS prevents client modification — only service role can set premium fields. Client checks expiration in `AuthProvider`. RevenueCat webhook is now the authoritative path for subscription state; legacy trial flow (`start-trial`) is preserved for backward compatibility. Billing SDK wrapper: `lib/billing.ts`.

### Course Data

Static JSON at `assets/data/course_content.json`. Structure: `CourseData → Chapter[] → Lesson[] → Question[]`. Three question types: `multiple_choice`, `single_response`, `listening_mc`. TypeScript interfaces in `constants/CourseData.ts`.

### Component Organization

- `components/lesson/LessonContent.tsx` — Main lesson orchestrator (question flow, audio, recording, completion). Largest component (~810 LOC).
- `components/conversation/ConversationMode.tsx` — Real-time AI chat with speech recognition, pinyin/hanzi toggles.
- `components/subscription/Paywall.tsx` — Premium paywall with billing toggle.
- Lesson sub-components (Flashcard, AudioPrompt, FeedbackView, MultipleChoiceMode, etc.) are composed inside LessonContent.

## Key Conventions

- Path alias: `@/*` maps to project root (tsconfig paths)
- TypeScript strict mode enabled
- Styling: `StyleSheet.create()` with theme constants from `constants/theme.ts` (primary accent: `#ff4900`)
- Fonts: EB Garamond via `@expo-google-fonts`
- Animations: `react-native-reanimated` for gesture-driven, `Animated` API for sequential/spring

## Environment Variables

```
EXPO_PUBLIC_SUPABASE_URL=<supabase_project_url>
EXPO_PUBLIC_SUPABASE_KEY=<supabase_anon_key>
```

Edge function secrets (set via `npx supabase secrets set`):
```
OPENROUTER_API_KEY=<openrouter_key>
SUPABASE_SERVICE_ROLE_KEY=<service_role_key>
```

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **mandarin-app** (724 symbols, 1466 relationships, 53 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

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
