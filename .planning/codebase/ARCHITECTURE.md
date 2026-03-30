# ARCHITECTURE

## Overall Pattern
- **Frontend Architecture:** The application follows a component-driven React Native architecture using typical Expo patterns.
- **File-based Routing:** Driven entirely by Expo Router (`app/` directory).
- **Backend-as-a-Service:** Deep integration with Supabase for data storage and Edge Functions for compute (particularly LLM interactions).

## Data Flow
- **Authentication:** `providers/AuthProvider.tsx` wraps the application and syncs session state with Supabase. Tokens are AES-256 encrypted using SecureStore.
- **Local vs Remote State:** 
  - *Offline/Local:* Lesson completion counts, Custom scenarios, Speaking/Listening stats, and an HSK review queue are kept in `AsyncStorage`.
  - *Remote:* User features (premium boundaries), persistent HSK progress, and exams are in Supabase Postgres.
- **Sync mechanism:** HSK events form a local event queue (`lib/hsk-event-queue.ts`) which is batch-synced server-side to avoid constant roundtrips (`hsk-sync-events`).

## Edge Function Architecture
- Standardized execution pattern:
  1. CORS preflight check
  2. Authentication validation wrapper
  3. Premium status capabilities verification (if applicable)
  4. Core Logic / External API request (e.g., OpenRouter)
  5. JSON formatted response.

## Security Boundaries
- **Profiles Table:** Row-level security (RLS) protects the profiles table; only a secure Service Role can modify critical fields such as `is_premium`.
- **API Keys:** All external API secrets (OpenRouter) are kept strictly on the Supabase Edge Functions environment.
