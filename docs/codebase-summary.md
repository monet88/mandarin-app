# Codebase Summary - Convo App

## Project Statistics

| Metric | Count |
|--------|-------|
| **Total Files** | 90+ source + config files |
| **TypeScript/TSX** | ~70 files (~14,000 LOC) |
| **JSON/Config** | 10 files |
| **Assets** | 20+ images, 1 video, HSK JSON data |
| **Supabase** | 11 Edge Functions, 5 migrations |
| **Package Dependencies** | 47 production, 8 dev |

**Total LOC (excluding assets & data):** ~14,000 lines

## Directory Structure & Responsibilities

```
.
├── app/                      # Expo Router (file-based routing)
│   ├── _layout.tsx          # Root layout, auth gate, deep linking
│   ├── index.tsx            # Entry point (redirects to /lessons)
│   ├── onboarding.tsx       # 4-step onboarding screen
│   ├── conversation.tsx      # AI conversation modal
│   ├── practise.tsx         # Lesson practice modal
│   ├── modal.tsx            # Placeholder modal
│   ├── hsk-level.tsx        # HSK level detail (progress, study/exam entry)
│   ├── hsk-vocab-study.tsx  # HSK vocabulary browse + spaced-repetition review
│   ├── hsk-exam.tsx         # Server-timed HSK mock exam (sections + audio)
│   └── (tabs)/              # Tab navigator (4 main screens)
│       ├── _layout.tsx      # Tab bar layout (4 tabs including HSK)
│       ├── lessons.tsx      # Browse & select lessons
│       ├── conversations.tsx # View previous conversations
│       ├── hsk-prep.tsx     # HSK Prep hub: level cards + session data
│       └── profile.tsx      # User profile & settings
│
├── components/              # Reusable UI components (~30 files)
│   ├── auth/                # Authentication screens
│   │   ├── IntroScreen.tsx  # Splash with video background
│   │   └── EmailAuth.tsx    # Magic link input form
│   ├── conversation/        # AI conversation features
│   │   └── ConversationMode.tsx  # Real-time chat UI
│   ├── hsk/                 # HSK-specific components (8 files)
│   │   ├── HskLevelCard.tsx       # Level card with progress ring
│   │   ├── HskPrepHeader.tsx      # HSK tab header with streak/quota
│   │   ├── HskLockedState.tsx     # Premium lock overlay + upgrade CTA
│   │   ├── HskWordCard.tsx        # Vocabulary flashcard for review queue
│   │   ├── HskVocabularyList.tsx  # Scrollable vocab browse list
│   │   ├── HskReviewQueue.tsx     # Spaced-repetition review session
│   │   ├── HskExamTimer.tsx       # Countdown timer for exam sections
│   │   ├── HskExamSection.tsx     # Renders a single exam section
│   │   ├── HskExamResults.tsx     # Score summary post-exam
│   │   └── HskWritingFeedback.tsx # AI rubric feedback for writing section
│   ├── lesson/              # Lesson-related components (~12 files)
│   │   ├── LessonContent.tsx      # Lesson layout & orchestration
│   │   ├── MultipleChoiceMode.tsx # Multiple choice questions
│   │   ├── SingleResponseMode.tsx # Text input questions
│   │   ├── ListeningMultipleChoiceMode.tsx
│   │   ├── Flashcard.tsx          # Vocabulary flashcard (flip animation)
│   │   ├── AudioPrompt.tsx        # Voice recording interface
│   │   ├── FeedbackView.tsx       # Answer feedback display
│   │   ├── ProgressHeader.tsx     # Lesson progress bar
│   │   ├── LessonCompleteScreen.tsx
│   │   ├── VocabularyIntroScreen.tsx
│   │   ├── AudioWaveform.tsx      # Visualization
│   │   └── SentenceBreakdownCard.tsx
│   ├── subscription/        # Premium/paywall UI
│   │   └── Paywall.tsx      # Premium plans display (updated for RevenueCat)
│   ├── ui/                  # Generic UI utilities
│   │   ├── ConfirmDialog.tsx
│   │   └── icon-symbol.tsx
│   ├── themed-text.tsx      # Light/dark mode aware Text
│   ├── themed-view.tsx      # Light/dark mode aware View
│   ├── parallax-scroll-view.tsx
│   ├── external-link.tsx
│   ├── haptic-tab.tsx
│   └── hello-wave.tsx
│
├── hooks/                   # Custom React hooks (~7 files)
│   ├── useDeepLinking.ts        # OAuth redirect handling
│   ├── useSpeakingListeningStats.ts # Fetch duration stats
│   ├── use-color-scheme.ts      # Light/dark mode detection
│   ├── use-theme-color.ts       # Color resolver
│   ├── useHskSession.ts         # Load + refresh HSK session data
│   └── useHskReviewQueue.ts     # Spaced-repetition queue management
│
├── lib/                     # Business logic & persistence (~9 files)
│   ├── lessonProgress.ts        # AsyncStorage for lesson completion
│   ├── speakingListeningStats.ts # Track duration (async storage)
│   ├── customScenarios.ts       # UUID-based scenario storage
│   ├── billing.ts               # RevenueCat SDK wrapper + entitlement helpers
│   ├── hsk-session.ts           # Session init, quota checks, progress helpers
│   ├── hsk-event-queue.ts       # AsyncStorage FIFO queue for word events
│   ├── hsk-review.ts            # SRS scoring, interval calculation
│   ├── hsk-progress.ts          # Merge local + server progress state
│   └── hsk-exam.ts              # Exam session management (sanitized start payload, submit, writing eval)
│
├── utils/                   # Utility functions (~1 file)
│   └── supabase.ts          # Supabase client setup + secure storage
│
├── constants/               # Configuration (~3 files)
│   ├── CourseData.ts        # TypeScript interfaces for lessons
│   ├── hsk-data.ts          # HSK_MANIFEST, TypeScript interfaces for HSK vocab
│   └── theme.ts             # Color palette & font definitions
│
├── ctx/                     # React Context (~1 file)
│   └── AuthContext.tsx      # Auth state (session, user, profile, premium)
│
├── providers/               # Context providers (~1 file)
│   └── AuthProvider.tsx     # Wraps app with AuthContext + Supabase listener
│
├── supabase/                # Backend configuration
│   ├── functions/           # Deno Edge Functions (~11 files)
│   │   ├── _shared/
│   │   │   └── hsk-events.ts        # Shared HSK event types + helpers
│   │   ├── chat-completion/         # AI roleplay via OpenRouter
│   │   ├── transcribe-audio/        # Speech-to-Pinyin transcription
│   │   ├── scenario-generate/       # AI scenario generation (premium)
│   │   ├── start-trial/             # Grant 7-day premium trial
│   │   ├── hsk-session-init/        # Initialize HSK session (quota + progress)
│   │   ├── hsk-sync-events/         # Batch sync local word events to server
│   │   ├── hsk-refresh-question-bank/ # Regenerate question bank (internal key + cooldown limit)
│   │   ├── hsk-mock-exam-start/     # Create session + return sanitized questions (no answer fields)
│   │   ├── hsk-mock-exam-submit-section/ # Enforce section order/deadline + idempotent finalize
│   │   ├── hsk-writing-evaluate/    # Session-owned writing rubric (cached in exam result)
│   │   └── revenuecat-webhook/      # RevenueCat receipt validation + entitlement sync
│   └── migrations/          # Database schema
│       ├── 20260116134234_profile_migration.sql
│       ├── 20260310_hsk_core_tables.sql      # hsk_progress, hsk_word_mastery, hsk_event_ledger, hsk_exam_results
│       ├── 20260310_hsk_content_tables.sql   # hsk_question_bank, hsk_exam_sessions, hsk_audio_manifests
│       ├── 20260310_subscriptions.sql        # subscriptions billing log synced from RevenueCat
│       └── 20260312_hsk_exam_security_integrity_fixes.sql # section flow columns, result idempotency, writing rubric persistence
│
├── assets/                  # Images, fonts, videos
│   ├── data/
│   │   ├── course_content.json         # ~44KB lesson curriculum data
│   │   └── hsk/
│   │       ├── manifest.json           # Level metadata (word_count, level_name)
│   │       ├── hsk_level_1.json        # HSK 1 vocab (hanzi, pinyin, definitions)
│   │       ├── hsk_level_2.json
│   │       ├── hsk_level_3.json
│   │       ├── hsk_level_4.json
│   │       ├── hsk_level_5.json
│   │       ├── hsk_level_6.json
│   │       └── hsk_level_7_9_summary.json  # Metadata only (Coming Soon)
│   ├── fonts/SpaceMono-Regular.ttf
│   ├── images/              # Icons, splash screen, backgrounds
│   └── videos/broll.mp4     # Intro screen video
│
├── scripts/                 # Utility scripts
│   ├── reset-project.js          # Reset to clean state
│   ├── parse-hsk-data.ts         # Parse source vocab → assets/data/hsk/*.json
│   ├── generate-hsk-listening-audio.ts  # Pre-generate listening section audio
│   └── hsk-vocab-source/         # Raw HSK vocabulary source data
│
├── app.json                 # Expo configuration
├── package.json             # Dependencies & scripts
├── tsconfig.json            # TypeScript config
├── eslint.config.js         # Linting rules
├── LICENSE.md
├── README.md
└── .gitignore
```

## Key Modules & Responsibilities

### 1. Authentication & Session (`ctx/`, `providers/`, `app/_layout.tsx`)
**Responsibility:** User authentication state management, session persistence
- Supabase magic link login via deep linking
- JWT token encrypted with AES-256, stored in SecureStore
- Auth context provides session, user, profile, premium status to all components
- Automatic session restore on app launch
- Premium status: server-validated expiration timestamp

**Files:**
- `ctx/AuthContext.tsx` — Type definitions & context creation
- `providers/AuthProvider.tsx` — Supabase auth listener, profile fetch
- `app/_layout.tsx` — Root navigation, auth gate, deep link handler

### 2. Routing & Navigation (`app/**/*.tsx`)
**Responsibility:** App navigation structure, screen transitions
- Root layout guards unauthenticated users
- Tab navigator (lessons, conversations, profile)
- Modal stacks for onboarding, practice, AI conversations
- Deep link handling for OAuth redirects

**Key Screens:**
- `app/index.tsx` — Entry point, redirects based on auth state
- `app/onboarding.tsx` — 4-step profile setup
- `app/(tabs)/_layout.tsx` — Bottom tab navigator
- `app/(tabs)/lessons.tsx` — Lesson browser & selection
- `app/practise.tsx` — Lesson practice interface
- `app/(tabs)/conversations.tsx` — Conversation history

### 3. Lesson System (`components/lesson/**`, `lib/lessonProgress.ts`)
**Responsibility:** Structured lesson delivery, practice modes, progress tracking
- Course data: 12 chapters, 86 lessons stored in JSON
- 3 question types: multiple choice, single response, listening
- Flashcard mode with recognition/recall phases
- Lesson completion tracking via AsyncStorage
- Progress persistence across sessions

**Question Type Handlers:**
- `MultipleChoiceMode.tsx` — Click-based selection
- `SingleResponseMode.tsx` — Text input validation
- `ListeningMultipleChoiceMode.tsx` — Audio comprehension

**Progress Tracking:**
- `lib/lessonProgress.ts` — Read/write AsyncStorage completion data
- Key: `lesson_{chapterId}_{lessonId}` → JSON {completed, timestamp}

### 4. Practice Modes
**Vocabulary (Flashcards):**
- `components/lesson/Flashcard.tsx` — 3D flip animation (Reanimated)
- Recognition phase (native language → Pinyin)
- Recall phase (Pinyin → native language)

**Voice Recording:**
- `components/lesson/AudioPrompt.tsx` — Record + playback UI
- `hooks/useSpeakingListeningStats.ts` — Track duration
- Calls `transcribe-audio` Edge Function for AI transcription
- Displays feedback comparing user pronunciation to target

### 5. AI Conversations (`components/conversation/ConversationMode.tsx`)
**Responsibility:** Real-time roleplay with AI, scenario goals
- WebSocket-like pattern with Supabase realtime
- Sends user message → `chat-completion` Edge Function → Gemini-3-Flash
- Displays AI response with typing animation
- Maintains conversation history
- Tracks speaking minutes for stats

**Flow:**
1. User selects scenario with goal (e.g., "Order food in Mandarin")
2. AI plays first message (TTS via Expo Speech)
3. User speaks → transcription
4. AI responds based on conversation context
5. Repeat until goal achieved or user exits

### 6. Statistics & Tracking (`lib/speakingListeningStats.ts`, `hooks/useSpeakingListeningStats.ts`)
**Responsibility:** Aggregate speaking/listening time across lessons & conversations
- Stored in AsyncStorage as JSON
- Updated when lesson completes or voice recording ends
- Stats screen displays weekly/monthly breakdown
- No server sync (local only in MVP)

### 7. Premium & Subscription (`components/subscription/Paywall.tsx`)
**Responsibility:** Paywall UI, premium feature gating, trial management
- Display 3 subscription tiers (7-day trial, monthly, annual)
- Toggle between billing periods
- Premium features gated behind premium checks
- `start-trial` Edge Function grants 7-day trial access
- Premium validation: check `is_premium && premium_expires_at > now()`

### 8. HSK Certification Prep (`components/hsk/`, `lib/hsk-*`, `app/hsk-*.tsx`)
**Responsibility:** Full HSK preparation surface with vocabulary review, spaced repetition, and server-timed mock exams

- HSK 1-6 fully supported; HSK 7-9 shows "Coming Soon" metadata
- Offline-first word events queue (`lib/hsk-event-queue.ts`) flushes through `hsk-sync-events`
- SRS scoring in `lib/hsk-review.ts`; `hsk-sync-events` applies mastery writes before recomputing `hsk_progress` in the same response
- Mock exam start enforces premium/quota server-side, expires stale active sessions, and returns sanitized questions + section deadlines
- Section submit enforces server-side section order/deadlines and finalizes with idempotent result upsert (`session_id` unique)
- Writing evaluation requires owned submitted `session_id`, reuses cached rubric, and persists fallback state
- Premium gate: HSK 2-6 study/exam requires active RevenueCat subscription
- Free tier: HSK 1 browse + limited daily exam quota (enforced server-side)

**Key Files:**
- `app/(tabs)/hsk-prep.tsx` — HSK hub screen, level cards
- `app/hsk-level.tsx` — Level detail: progress, study/exam entry
- `app/hsk-vocab-study.tsx` — Vocabulary browse + review queue
- `app/hsk-exam.tsx` — Server-timed mock exam screen
- `lib/hsk-session.ts` — Session init via `hsk-session-init` Edge Function
- `lib/hsk-exam.ts` — Exam lifecycle (start, submit, evaluate writing)
- `constants/hsk-data.ts` — `HSK_MANIFEST` and TypeScript types

### 9. Billing (`lib/billing.ts`, `supabase/functions/revenuecat-webhook/`)
**Responsibility:** Store-backed subscription management via RevenueCat

- `lib/billing.ts` — RevenueCat SDK init, `purchasePackage`, `restorePurchases`
- `revenuecat-webhook` Edge Function — records webhook events in `subscriptions`, then mirrors `is_premium` + `premium_expires_at`
- `CANCELLATION` / `BILLING_ISSUE` events do not revoke access early; premium stays active until expiration or a revoke event
- `AuthProvider.tsx` — refetches profile on entitlement change
- `start-trial` Edge Function — still active for 7-day free trials (unchanged)

### 10. Theme & Styling (`constants/theme.ts`, `components/themed-*.tsx`)
**Responsibility:** Consistent light/dark mode, brand colors
- Primary accent: `#ff4900` (orange)
- Color palettes for light/dark modes
- Theme-aware Text & View components
- Font definitions (iOS `system-ui`, Android default, Web fallback)

## Data Flow Architecture

### Authentication Flow
```
1. IntroScreen → EmailAuth form (input email)
2. Supabase sends magic link to email
3. User clicks link → Deep link: convo://auth/callback?code=...
4. useDeepLinking hook captures code
5. AuthProvider exchanges code for session + JWT
6. JWT stored encrypted in SecureStore
7. Profile fetched from Supabase & cached in Context
8. AuthContext updated, app navigates to /lessons
```

### Lesson Practice Flow
```
1. Lessons tab → Select chapter → Select lesson
2. LessonContent component loads lesson from CourseData
3. Render question set (multiple choice, single response, etc.)
4. User answers → Check against correct answer
5. FeedbackView shows result
6. On lesson complete → Save to AsyncStorage, increment stats
7. Navigate to next lesson or back to browser
```

### AI Conversation Flow
```
1. Conversations tab → Select scenario
2. ConversationMode component mounts
3. AI system prompt: scenario goal + learner context
4. User types/speaks message
5. Client calls supabase.functions.invoke('chat-completion', {message, context})
6. Edge Function: Call OpenRouter API with Gemini-3-Flash
7. Stream response back to client (with typing animation)
8. TTS (Expo Speech) reads response aloud
9. Client can continue conversation or exit
10. Conversation logged in local storage
```

### Premium Flow
```
1. User taps "Upgrade" button
2. Paywall component shows plans
3. On selection: Call supabase.functions.invoke('start-trial')
4. Edge Function: Create trial expiration record in profiles table
5. AuthProvider refetches profile
6. isPremium = true, UI updates
7. Premium features unlocked
```

## State Management Pattern

**Auth State:** React Context (global)
- Managed by `AuthProvider`
- Available via `useAuth()` hook
- Automatically synced with Supabase session changes

**Lesson Progress:** AsyncStorage (local)
- Key format: `lesson_{chapterId}_{lessonId}`
- Persists across sessions
- No automatic backup to server (future feature)

**Stats:** AsyncStorage (local)
- Key: `speaking_listening_stats`
- Updated on lesson/conversation completion
- Aggregated in stats screen

**UI State:** React component state
- Tab index, lesson selection, conversation scroll position
- Not persisted (reset on app relaunch)

## Styling Approach

**Method:** React Native `StyleSheet.create()` + inline styles
- No external CSS framework (Nativewind, Tamagui not used)
- Colors imported from `constants/theme.ts`
- Responsive sizing via `react-native-size-matters` (RFValue)
- Animations via `react-native-reanimated` (3D flip, transitions)

**Example Component Structure:**
```tsx
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  button: { paddingVertical: RFValue(12), borderRadius: 8 },
});

export default function MyComponent() {
  const { colors } = useThemeColor();
  return <View style={[styles.container, { backgroundColor: colors.background }]} />;
}
```

## File Naming Conventions

| Category | Convention | Example |
|----------|-----------|---------|
| **React Components** | PascalCase | `LessonContent.tsx`, `Flashcard.tsx` |
| **Hooks** | kebab-case with `use` prefix | `use-color-scheme.ts`, `useSpeakingListeningStats.ts` |
| **Utils/Lib** | kebab-case or camelCase | `lessonProgress.ts`, `customScenarios.ts` |
| **Constants** | PascalCase (modules) | `CourseData.ts`, `AuthContext.tsx` |
| **Contexts** | PascalCase | `AuthContext.tsx` |

## Dependencies Overview

### Core
- **expo** ~54.0.31 — Build tooling & native APIs
- **react** 19.1.0, **react-native** 0.81.5 — UI framework
- **expo-router** ~6.0.21 — File-based routing
- **typescript** ~5.9.2 — Type safety

### Networking & Auth
- **@supabase/supabase-js** ^2.90.1 — Backend as a service
- **expo-auth-session** ~7.0.10 — OAuth flows
- **expo-secure-store** ~15.0.8 — Encrypted token storage
- **aes-js** ^3.1.2 — AES-256 encryption

### Media & Input
- **expo-av** ~16.0.8 — Audio recording & playback
- **expo-speech** ~14.0.8 — Text-to-speech
- **expo-video** ~3.0.15 — Video playback
- **expo-file-system** ~19.0.21 — Local file operations

### Animation & Gesture
- **react-native-reanimated** ~4.1.1 — Worklet animations
- **react-native-gesture-handler** ~2.28.0 — Touch gestures
- **react-native-confetti-cannon** ^1.5.2 — Visual effects

### Storage & Utilities
- **@react-native-async-storage/async-storage** 2.2.0 — Local data
- **react-native-uuid** ^2.0.3 — UUID generation
- **string-similarity** ^4.0.4 — Text comparison
- **sonner-native** ^0.23.1 — Toast notifications

## Performance Characteristics

| Operation | Typical Duration | Bottleneck |
|-----------|------------------|------------|
| App launch → home | 1-2s | JS bundle parse, Supabase auth check |
| Load lesson | 0.5-1s | JSON parse, component render |
| AI response | 2-5s | OpenRouter API latency |
| Voice transcription | 3-10s | Audio file upload + Gemini inference |
| Flashcard flip | 300ms | Reanimated animation |

**Optimizations:**
- Lesson data cached in memory after first fetch
- AsyncStorage reads minimized (batched at app start)
- Expo Image component optimizes image loading
- Component memoization prevents unnecessary re-renders

## Testing & Linting

**Linter:** ESLint with Expo config
- Command: `npm run lint`
- Rules: Expo recommended + TypeScript strict

**Testing:** Not yet implemented (MVP)
- Planned: Jest + React Testing Library for components
- Planned: Supabase local emulator for backend tests

## Build & Deployment

**Frontend:**
- `npm run start` — Expo dev server
- `npm run ios` — iOS simulator
- `npm run android` — Android emulator
- Published via Expo Cloud Build → App Store / Play Store

**Backend:**
- Supabase dashboard for database management
- Deno Edge Functions deployed via Supabase CLI
- Environment secrets: OPENROUTER_API_KEY, SUPABASE_SERVICE_ROLE_KEY

---

**Document Status:** Current as of repomix generation (March 2026)
**Last Updated:** March 2026
**Owner:** Engineering Team

