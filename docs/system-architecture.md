# System Architecture - Convo App

## High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      MOBILE CLIENT (iOS/Android)                │
│                   Built with Expo + React Native                │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              React Navigation (Expo Router)              │   │
│  │         File-based routing (app/ directory)              │   │
│  └──────────────────────────────────────────────────────────┘   │
│                          ↓ ↑                                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │         React Context & Component Layer                  │   │
│  │  ┌─────────────────┐  ┌─────────────────┐                │   │
│  │  │   Auth Context  │  │  Lesson Content │                │   │
│  │  │  (useAuth hook) │  │  Components     │                │   │
│  │  └─────────────────┘  └─────────────────┘                │   │
│  │  ┌──────────────┐  ┌──────────────┐                       │   │
│  │  │Conversation  │  │ Practice     │                       │   │
│  │  │  Components  │  │  Mode        │                       │   │
│  │  └──────────────┘  └──────────────┘                       │   │
│  └──────────────────────────────────────────────────────────┘   │
│                          ↓ ↑                                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │     Data Layer (Local & Remote)                           │   │
│  │  ┌──────────────────┐     ┌──────────────────────────┐   │   │
│  │  │ AsyncStorage     │     │ Supabase Client          │   │   │
│  │  │ (Offline Data)   │     │ (Auth + Realtime DB)     │   │   │
│  │  │                  │     │ & SecureStore (JWT)      │   │   │
│  │  │ • Lesson prog    │     │                          │   │   │
│  │  │ • Stats          │     │ • Session management     │   │   │
│  │  │ • Scenarios      │     │ • Profile sync           │   │   │
│  │  └──────────────────┘     └──────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                          ↓ ↑                                      │
├─────────────────────────────────────────────────────────────────┤
│                    NETWORK LAYER                                 │
│  ┌──────────────────┐  ┌──────────────────┐                    │
│  │ HTTPS/REST       │  │ WebSocket        │                    │
│  │ (Supabase API)   │  │ (Realtime)       │                    │
│  └──────────────────┘  └──────────────────┘                    │
├─────────────────────────────────────────────────────────────────┤
│                    BACKEND SERVICES                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Supabase Cloud (Firebase Alternative)       │   │
│  │  ┌────────────────────┐     ┌────────────────────────┐   │   │
│  │  │ PostgreSQL DB      │     │ Auth Service           │   │   │
│  │  │                    │     │                        │   │   │
│  │  │ • Profiles table   │     │ • Magic link           │   │   │
│  │  │ • User sessions    │     │ • OAuth (Apple/Google) │   │   │
│  │  │ • RLS policies     │     │ • JWT generation       │   │   │
│  │  │                    │     │                        │   │   │
│  │  │ [DB size: small]   │     │ [High availability]    │   │   │
│  │  └────────────────────┘     └────────────────────────┘   │   │
│  │  ┌─────────────────────────────────────────────────────┐   │   │
│  │  │         Deno Edge Functions (Serverless)            │   │   │
│  │  │                                                       │   │   │
│  │  │ ┌─────────────────────────────────────────────────┐ │   │   │
│  │  │ │ chat-completion                                 │ │   │   │
│  │  │ │ Receives user message + conversation context    │ │   │   │
│  │  │ │ Calls OpenRouter → Gemini-3-Flash             │ │   │   │
│  │  │ │ Streams response back to client                │ │   │   │
│  │  │ └─────────────────────────────────────────────────┘ │   │   │
│  │  │ ┌─────────────────────────────────────────────────┐ │   │   │
│  │  │ │ transcribe-audio                                │ │   │   │
│  │  │ │ Receives audio blob + learner context           │ │   │   │
│  │  │ │ Calls Gemini Speech-to-Text                    │ │   │   │
│  │  │ │ Returns Pinyin transcription + confidence       │ │   │   │
│  │  │ └─────────────────────────────────────────────────┘ │   │   │
│  │  │ ┌─────────────────────────────────────────────────┐ │   │   │
│  │  │ │ scenario-generate                              │ │   │   │
│  │  │ │ Receives user interests + learner profile       │ │   │   │
│  │  │ │ Calls OpenRouter → Gemini (text generation)    │ │   │   │
│  │  │ │ Returns custom conversation scenario            │ │   │   │
│  │  │ └─────────────────────────────────────────────────┘ │   │   │
│  │  │ ┌─────────────────────────────────────────────────┐ │   │   │
│  │  │ │ start-trial                                     │ │   │   │
│  │  │ │ Receives user ID                                │ │   │   │
│  │  │ │ Sets premium_expires_at = now + 7 days          │ │   │   │
│  │  │ │ Validates via RLS before return                │ │   │   │
│  │  │ └─────────────────────────────────────────────────┘ │   │   │
│  │  │                                                       │   │   │
│  │  │ [Secrets: OPENROUTER_API_KEY, SUPABASE_SERVICE_ROLE] │   │   │
│  │  └─────────────────────────────────────────────────────┘   │   │
│  │                                                               │   │
│  └──────────────────────────────────────────────────────────┘   │
│                          ↓ ↑                                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              External Services (Third-party APIs)        │   │
│  │  ┌──────────────────┐  ┌──────────────────────────────┐  │   │
│  │  │ OpenRouter API   │  │ (Alternative AI Providers)   │  │   │
│  │  │                  │  │ (Fallback models)            │  │   │
│  │  │ • Gemini 3 Flash │  │                              │  │   │
│  │  │ • Chat endpoint  │  │ [Cost: ~$5/1k chat calls]   │  │   │
│  │  │ • Stream support │  │                              │  │   │
│  │  │                  │  │                              │  │   │
│  │  │ [Cost: ~$0.005]  │  │                              │  │   │
│  │  │ [per call]       │  │                              │  │   │
│  │  └──────────────────┘  └──────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Client-Server Communication Flow

### 1. Authentication Flow (Magic Link)

```
User Mobile App                           Supabase
      │                                       │
      ├─ [Onboarding] ─ Enter email ────────>│
      │                                       │
      │<─────── Send magic link to email ────┤
      │                                       │
      │ [User clicks link in email]          │
      │ convo://auth/callback?code=JWT       │
      │                                       │
      │<───── Deep link received ────────────┤
      │                                       │
      ├─ useDeepLinking hook captures code ─>│
      │                                       │
      ├─ Exchange code for session ─────────>│
      │                                       │
      │<─ Return session + access token ─────┤
      │                                       │
      ├─ AES-256 encrypt JWT ──────┐         │
      │   Store in SecureStore      │        │
      │<────────────────────────────┘        │
      │                                       │
      ├─ Fetch profile data ────────────────>│
      │                                       │
      │<─ Return profile (name, level, etc)──┤
      │                                       │
      ├─ AuthContext updated ────────────────│
      │ → User sees /lessons screen          │
      │                                       │
```

**Details:**
- Magic link valid for 24 hours
- JWT stored encrypted with AES-256 in SecureStore (not AsyncStorage)
- Session restored on app relaunch via auth listener
- Token automatically refreshed by Supabase client

### 2. Lesson Data & Progress Flow

```
User Taps Lesson                     Mobile App                    Supabase/Local
      │                                  │                              │
      ├─ Select lesson ──────────────────>│                              │
      │                                   │                              │
      │         ┌─ Check AsyncStorage ────┼──────────────────────────────>
      │         │                         │                              │
      │         │ Load from CourseData     │<─ Lesson progress (if exists)
      │         │ (course_content.json)    │
      │         └─ Render questions        │
      │                                   │
      ├─ Answer question ────────────────>│
      │                                   │
      ├─ Validate answer ────────────────>│
      │                                   │
      │<─ Show feedback ────────────────┤
      │                                   │
      ├─ Mark complete ──────────────────>│
      │                                   │
      │     ┌─ Save to AsyncStorage ─────>│
      │     │  (key: lesson_{chapter}_{lesson})
      │     │                             │
      │     └─ Update stats ────────────>│
      │        (total lessons done)       │
      │                                   │
      │<─ Show next lesson button ──────┤
      │                                   │
```

**Details:**
- Lesson data embedded in app (CourseData.ts + course_content.json)
- Progress saved locally (no server sync in MVP)
- Stats aggregated from AsyncStorage on stats tab open

### 3. Voice Recording & Transcription Flow

```
User Records Voice              Mobile App                    Supabase Edge Func
      │                              │                              │
      ├─ Tap microphone ────────────>│                              │
      │                              │ Use expo-av ────────────────>│
      ├─ Speak phrase ────────────────>│ Record audio stream         │
      │                              │<─ Stream stops ──────────────│
      ├─ Stop recording ────────────>│                              │
      │                              │ Convert to .wav/blob         │
      │                              │                              │
      │                              ├─ Call transcribe-audio ─────>│
      │                              │                              │
      │                              │     ┌─ Send audio blob       │
      │                              │     ├─ Learner context       │
      │                              │     └─ Expected Pinyin       │
      │                              │                              │
      │                              │<─ Return transcription ──────│
      │                              │   + confidence score         │
      │<─ Show result ──────────────>│                              │
      │   (correct/incorrect)         │ Update speaking time stat    │
      │                              │                              │
```

**Details:**
- Audio recorded via expo-av as WAV blob
- Sent to Deno Edge Function (transcribe-audio)
- Edge Function calls Gemini Speech API (via OpenRouter)
- Returns Pinyin + confidence score
- Client compares to expected pronunciation

### 4. AI Conversation Flow (Real-time)

```
User Selects Scenario       Mobile App               Supabase Edge Func
      │                          │                          │
      ├─ Choose scenario ────────>│                          │
      │                          │ Load scenario data        │
      │                          │ Prepare system prompt     │
      │                          │ (goal: "Order food")      │
      │                          │                          │
      │<─ AI intro message ──────┤                          │
      │  (TTS via expo-speech)   │                          │
      │                          │                          │
      ├─ Type/speak message ────>│                          │
      │                          │                          │
      │                          ├─ call chat-completion ──>│
      │                          │  {                        │
      │                          │   message: user_input,    │
      │                          │   conversationHistory,    │
      │                          │   scenarioGoal            │
      │                          │  }                        │
      │                          │                          │
      │                          │   ┌─ Call OpenRouter API  │
      │                          │   │ Gemini-3-Flash        │
      │                          │   │ Stream response        │
      │                          │<──┤ (300-500 tokens)      │
      │                          │                          │
      │<─ Show AI response ──────┤                          │
      │  (typing animation)      │ Update speaking time      │
      │                          │ Cache in local storage    │
      │<─ Play TTS audio ────────┤                          │
      │                          │                          │
      ├─ Continue or exit ──────>│                          │
      │                          │                          │
```

**Details:**
- Scenario system prompt includes learner level + motivations
- Conversation streamed for real-time feedback
- TTS reads AI response aloud (Expo Speech)
- Max 10-15 turns per conversation (cost control)
- Conversation cached locally with timestamp

### 5. Premium Trial Grant Flow

```
User Taps "Try Premium"      Mobile App               Supabase
      │                           │                       │
      ├─ Show paywall ───────────>│                       │
      │                           │                       │
      ├─ Tap "7-Day Free Trial" ─>│                       │
      │                           │                       │
      │                           ├─ call start-trial ───>│
      │                           │ {userId}              │
      │                           │                       │
      │                           │ ┌─ Check RLS ────────>│
      │                           │ │ (only own row)      │
      │                           │ │                     │
      │                           │ ├─ Set ────────────┐  │
      │                           │ │ premium_expires_at  │
      │                           │ │ = now + 7 days  │  │
      │                           │ │                   │  │
      │                           │<─ Return success ─┘  │
      │                           │                       │
      ├─ AuthProvider refetch ───>│                       │
      │  profile                  │                       │
      │                           ├─ Query profiles ─────>│
      │                           │                       │
      │                           │<─ isPremium = true ───│
      │<─ Unlock premium ────────>│ premiumExpiresAt = T+7
      │                           │                       │
      ├─ Custom scenarios ───────>│ (now available)       │
      │  now visible              │                       │
      │                           │                       │
```

**Details:**
- Edge Function enforces RLS (users can only grant own trial)
- Premium field is server-only (client can't modify)
- Expiration checked on every app launch
- Trial can be granted once per user (future: enforce via flag)

## Data Persistence Strategy

### Local Storage (AsyncStorage)
**Purpose:** Offline lesson progress, stats, user preferences
**Scope:** Single device only, not synced to server

```
AsyncStorage Keys:
├── lesson_{chapterId}_{lessonId}
│   └── { completed: bool, timestamp: number, score?: number }
│
├── speaking_listening_stats
│   └── { speakingMinutes: number, listeningMinutes: number, updated: timestamp }
│
├── custom_scenario_{uuid}
│   └── { scenario: ScenarioData, created: timestamp }
│
└── conversation_history_{date}
    └── { messages: Message[], scenarioId: string }
```

**Characteristics:**
- No encryption (non-sensitive data)
- Synced to device iCloud/Google Drive (automatic, optional)
- Lost if app uninstalled
- ~50MB capacity per app

### Supabase PostgreSQL (Server)
**Purpose:** Authoritative user data, premium status, authentication

```sql
-- Profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY,  -- FK: auth.users.id
  full_name TEXT,
  chinese_level TEXT,   -- 'beginner', 'intermediate', 'advanced'
  motivations TEXT[],   -- JSON: ['career', 'travel', ...]
  interests TEXT[],     -- JSON: ['culture', 'food', ...]
  onboarding_completed BOOLEAN,
  is_premium BOOLEAN,
  premium_expires_at TIMESTAMPTZ,  -- NULL if not premium
  updated_at TIMESTAMPTZ,

  FOREIGN KEY (id) REFERENCES auth.users(id)
);

-- RLS Policy: Users can only read/write own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR ALL
  USING (auth.uid() = id);
```

**Characteristics:**
- Single source of truth for premium status
- RLS prevents client-side tampering
- Automatic backups via Supabase
- ~1KB per profile, scales to millions

### SecureStore (JWT Tokens)
**Purpose:** Encrypted authentication tokens

```
SecureStore Keys:
└── supabase_jwt
    └── {access_token: "...", expires_at: number}
```

**Characteristics:**
- AES-256 encrypted at rest
- Inaccessible to other apps
- Cleared on logout
- Auto-refreshed by Supabase client

## Network Resilience

### Offline Handling

| Feature | Offline | Strategy |
|---------|---------|----------|
| Lessons (free) | ✅ Works | Cache course_content.json in app |
| Lesson progress | ✅ Saves locally | Sync on reconnect (future) |
| AI conversation | ❌ Fails gracefully | Show "Need internet" message |
| Voice transcription | ❌ Fails gracefully | Suggest retry or skip |
| Premium status | ✅ Uses cached | Last known state + expiry check |

### Error Recovery

```
Network Error
      │
      ├─ Retry logic (exponential backoff)
      │  1s → 2s → 4s → 8s (max 3 retries)
      │
      ├─ Show toast: "Retrying..."
      │
      ├─ If still fails:
      │  ├─ Offline: Show "Offline" UI
      │  ├─ API error: Show "Server error, try again"
      │  └─ Timeout: Show "Slow connection, try again"
      │
      └─ User can retry manually
```

## Performance Optimization

### Caching Strategies

| Data | Location | TTL | Strategy |
|------|----------|-----|----------|
| Course structure | App bundle | ∞ | Embedded JSON |
| User profile | Memory + AsyncStorage | Session | Fetch once, cache in Context |
| Lesson data | Memory | Session | Load on demand |
| Conversation history | AsyncStorage | 7 days | Clean up old conversations |
| AI responses | AsyncStorage | Session | Cache to avoid re-calling |

### Bundle Size

- Course data: ~44KB (JSON)
- React/React Native: ~400KB (hermes bytecode)
- Supabase SDK: ~80KB
- Total: ~3-5MB (iOS) / ~4-6MB (Android)

## Security Architecture

### Authentication Layer
- **Magic links:** No password stored, email-based
- **Session tokens:** JWT issued by Supabase, 1-hour expiry
- **Token storage:** AES-256 encrypted in SecureStore
- **Refresh:** Automatic via Supabase client

### API Security
- **Supabase Auth:** All requests include JWT in `Authorization` header
- **Edge Functions:** Validated via auth context before execution
- **HTTPS:** All network traffic encrypted

### Data Security
- **RLS (Row-Level Security):** Enforce at database level
  - Users can only read/write own profiles
  - Profiles table blocks direct updates to premium fields
- **Secret management:** OPENROUTER_API_KEY in Supabase Vault (not in code)

### Privacy
- **No tracking:** No analytics (future feature)
- **No third-party SDKs:** No Firebase, Mixpanel, etc.
- **GDPR compliant:** User data deletable on request

## Scalability Architecture

### Horizontal Scaling
- **Frontend:** Expo Cloud handles unlimited builds
- **Backend:** Supabase auto-scales database connections
- **Edge Functions:** Deno runtime auto-scales to handle concurrent requests

### Cost Model at Scale

| Component | Cost | Notes |
|-----------|------|-------|
| OpenRouter API | $0.005 per chat call | ~$500/month @ 100k calls/month |
| Supabase DB | $100-500/month | Pay-as-you-go, ~1GB data |
| Expo Cloud | $0 (or $99+/month) | Free tier sufficient for MVP |
| Apple/Google | 30% commission | On in-app purchases (future) |

**Break-even:** 2,000 subscribers @ $9.99/month covers OpenRouter costs

### Load Estimation
- **Concurrent users:** 1,000
- **Average session:** 15 minutes
- **API calls per session:** 5-10 (lessons, stats, profile)
- **Peak requests:** ~100/sec (Supabase scales to 10k+/sec)

## Deployment Architecture

### Frontend Deployment
```
Development (Local)
    ↓
GitHub Push
    ↓
Expo Cloud Build
    ↓
iOS (App Store) & Android (Play Store)
```

### Backend Deployment
```
Development (Local)
    ↓
Supabase CLI: supabase functions deploy
    ↓
Supabase Cloud (Edge Functions in 6+ regions)
    ↓
Auto-scaled, replicated globally
```

### Database Deployment
```
Local Postgres (dev)
    ↓
supabase db push (migrations)
    ↓
Supabase Cloud PostgreSQL
    ↓
Daily backups, PITR available
```

## Integration Points

### External Services
1. **OpenRouter API** — Gemini model access
   - Endpoint: `https://openrouter.ai/api/v1/chat/completions`
   - Auth: Bearer token (API key)
   - Fallback: None (feature degrades)

2. **Supabase API** — Backend
   - REST & Realtime WebSocket
   - Auth: JWT in header

3. **Deep Linking** — OAuth redirect
   - Scheme: `convo://auth/callback`
   - Handler: `useDeepLinking` hook

4. **Device APIs** — Native features
   - Microphone: expo-av, Permissions API
   - TTS: expo-speech
   - SecureStore: Keychain (iOS) / Keystore (Android)

## HSK Certification Prep Architecture

### HSK Data Pipeline

```
scripts/hsk-vocab-source/*.ts   (raw source data)
        ↓
scripts/parse-hsk-data.ts       (parse + normalize, assign stable word_id)
        ↓
assets/data/hsk/
  ├── manifest.json             (levels metadata: word_count, level_name)
  ├── hsk_level_1.json … hsk_level_6.json   (full vocab, pinyin, definitions)
  └── hsk_level_7_9_summary.json            (metadata only — Coming Soon)
        ↓
constants/hsk-data.ts           (TypeScript interfaces + HSK_MANIFEST export)
```

HSK 7-9 ships as metadata only (v1). Full content deferred.

### HSK Backend Tables

```sql
-- Core progress tables (hsk_core_tables.sql)
hsk_session_quota   -- free quota tracking per user per day
hsk_progress        -- per-user, per-level aggregates (words_learned, mastered)
hsk_word_events     -- raw event log (seen, learned, mastered) for sync

-- Content tables (hsk_content_tables.sql)
hsk_question_bank   -- pre-generated questions (section, question_data, audio_url)
hsk_exam_sessions   -- server-timed exam sessions (expires_at, section_deadlines)
hsk_exam_results    -- final scores per session
hsk_audio_manifests -- listening section audio asset registry

-- Billing tables (*_subscriptions.sql)
revenuecat_purchases -- receipt validation events from RevenueCat webhook
```

All tables use RLS. Quota and premium checks are enforced server-side.

### HSK Edge Functions

| Function | Purpose |
|----------|---------|
| `hsk-session-init` | Initialize user HSK session (quota check, progress hydration) |
| `hsk-sync-events` | Batch-sync local word events to server aggregates |
| `hsk-refresh-question-bank` | Regenerate questions for a level (admin/pipeline) |
| `hsk-mock-exam-start` | Create server-timed exam session with section deadlines |
| `hsk-mock-exam-submit-section` | Score a section, advance or finalize exam |
| `hsk-writing-evaluate` | AI writing rubric via Gemini (content, structure, vocab) |
| `revenuecat-webhook` | Validate RevenueCat receipt events, sync entitlements to profiles |

Shared utilities: `supabase/functions/_shared/hsk-events.ts`

### Client Navigation Flow

```
(tabs)/hsk-prep.tsx           ← HSK tab (4th tab)
    ↓ tap level card
app/hsk-level.tsx             ← level detail (progress, study/exam entry)
    ↓ study button
app/hsk-vocab-study.tsx       ← vocabulary browse + flashcard review queue
    ↓ exam button
app/hsk-exam.tsx              ← server-timed mock exam (section by section)
```

Premium gate enforced at `hsk-level.tsx`: HSK 2-6 study/exam triggers paywall.

### Event Sync: Local Queue → Server

```
User reviews word
    ↓
lib/hsk-event-queue.ts        (AsyncStorage FIFO queue, idempotent event IDs)
    ↓
lib/hsk-review.ts             (SRS scoring, interval calculation)
    ↓ on reconnect or app background
hsk-sync-events Edge Function (batch upsert, returns server aggregates)
    ↓
lib/hsk-progress.ts           (merge local + server state)
```

Events are idempotent (UUID per event). Offline reviews sync transparently on reconnect.

### Billing: RevenueCat Integration

```
User taps Subscribe (Paywall.tsx)
    ↓
lib/billing.ts                (RevenueCat SDK: Purchases.purchasePackage)
    ↓ purchase confirmed
RevenueCat servers → revenuecat-webhook Edge Function
    ↓ service-role upsert
profiles.is_premium = true, premium_expires_at updated
    ↓
AuthProvider.tsx              (refetchProfile on entitlement_updated event)
```

Client-side trust removed: entitlement now comes from RevenueCat event, not
client assertion. `start-trial` Edge Function still active for free 7-day trials.

---

**Document Status:** Current
**Last Updated:** March 2026
**Owner:** Engineering Team
