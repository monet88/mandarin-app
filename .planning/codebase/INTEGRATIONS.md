# INTEGRATIONS

## Supabase (Backend & Database)
- **Purpose:** Primary backend for user profiles, HSK progress tracking, mock exams, and storing event ledgers.
- **Auth:** Magic links, Apple, and Google authentication via Supabase Auth.
- **Data Tables:** `profiles`, `hsk_progress`, `hsk_word_mastery`, `hsk_exam_sessions`, `hsk_exam_results`, `hsk_event_ledger`, `subscriptions`.

## Deno Edge Functions (Supabase)
- Located in `supabase/functions/` and used for AI interaction and background processes.
- **AI Processing:** `chat-completion`, `transcribe-audio`, `scenario-generate`, `hsk-writing-evaluate`.
- **Exams and Sync:** `hsk-mock-exam-start`, `hsk-mock-exam-submit-section`, `hsk-refresh-question-bank`, `hsk-session-init`, `hsk-sync-events`.
- **Billing Webhook:** `revenuecat-webhook`.

## OpenRouter (AI Models)
- Integrates with OpenRouter API (typically Gemini-3-Flash) for roleplay chat completion (`chat-completion`) and scenario generation (`scenario-generate`).
- Managed entirely through secure backend Edge Functions.

## RevenueCat
- **Purpose:** In-app purchases, subscriptions, and premium paywalls.
- **Client library:** `react-native-purchases` handles client-side buy flows.
- **Server integration:** Supabase Edge Function `revenuecat-webhook` processes subscription lifecycle events and updates the `profiles` table to accurately reflect premium status.
