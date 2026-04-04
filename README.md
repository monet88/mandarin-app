# Convo - Mandarin Language Learning App

![Convo App](thumbnail.png)

**Build a mobile-first AI language learning app focused on conversational Mandarin.**

Learn Mandarin through AI-powered conversations, not memorization.

## Overview

Convo is a React Native app combining structured lessons, interactive practice, and real-time AI roleplay conversations. Users sign in with magic links, personalize learning goals, practice across 12 chapters of lessons, track speaking/listening progress, and unlock premium custom scenarios.

**Tech Stack:** Expo SDK 54 (React Native 0.81), TypeScript, Expo Router 6, Supabase (Auth + Postgres + Edge Functions), OpenRouter (Gemini-3-Flash), React 19

## Features

- 📱 Cross-platform iOS/Android with Expo + Expo Router
- 🔐 Passwordless auth (magic links + OAuth: Apple, Google)
- 🧭 Personalized onboarding (level, motivation, interests)
- 📚 12-chapter curriculum with 86 lessons (3 difficulty levels)
- 🎧 Listening + speaking practice modes
- 🎙️ Voice recording with AI transcription (pronunciation feedback)
- 💬 Real-time AI conversations (roleplay with scenario goals)
- ✨ Custom AI-generated scenarios (premium)
- 📈 Speaking/listening stats & lesson completion tracking
- 💳 Premium trial system (7-day free)
- 🌓 Light/dark mode support

## Quick Start

### Prerequisites

- Node.js (v16+)
- npm or pnpm
- Supabase account (free tier sufficient)
- OpenRouter account (for AI features)

### Setup

#### 1. Clone Repository

```bash
git clone https://github.com/Andreaswt/mandarin-language-learning-app
cd mandarin-language-learning-app
npm install
```

#### 2. Environment Variables

Create `.env.local`:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_KEY=your_anon_key
```

#### 3. Supabase Setup

```bash
npm install -g supabase
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

Deploy Edge Functions:

```bash
supabase functions deploy chat-completion
supabase functions deploy transcribe-audio
supabase functions deploy scenario-generate
supabase functions deploy start-trial
supabase functions deploy hsk-session-init
supabase functions deploy hsk-sync-events
supabase functions deploy hsk-mock-exam-start
supabase functions deploy hsk-mock-exam-submit-section
supabase functions deploy hsk-writing-evaluate
supabase functions deploy hsk-refresh-question-bank
supabase functions deploy revenuecat-webhook
```

Set secrets:

```bash
supabase secrets set OPENROUTER_API_KEY=your_key
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_key
```

Optional but required for the related backend flows:

```bash
supabase secrets set REVENUECAT_WEBHOOK_SECRET=your_key
supabase secrets set HSK_REFRESH_ADMIN_KEY=your_key
```

#### 4. Auth Redirect (Supabase Dashboard)

Add to Supabase Auth → Redirect URLs:

```
convo://auth/callback
```

#### 5. Run App

```bash
npm run start          # Dev server
npm run ios           # iOS simulator
npm run android       # Android emulator
npm run lint          # Check for errors
```

## Documentation

- **[Project Overview & PDR](./docs/project-overview-pdr.md)** — Vision, features, requirements
- **[Codebase Summary](./docs/codebase-summary.md)** — Architecture, file structure, modules
- **[Code Standards](./docs/code-standards.md)** — Conventions, patterns, best practices
- **[System Architecture](./docs/system-architecture.md)** — Data flow, deployment, scalability
- **[Project Roadmap](./docs/project-roadmap.md)** — Phases, milestones, growth plan

## Project Structure

```
app/                    # Expo Router (file-based routing)
├── (tabs)/            # Main tabs (lessons, conversations, profile)
├── _layout.tsx        # Root layout & auth gate
├── onboarding.tsx     # Onboarding flow
└── conversation.tsx   # AI conversation modal

components/           # Reusable React components
├── auth/             # Login/signup screens
├── conversation/     # AI conversation UI
├── lesson/           # Lesson practice components
└── subscription/     # Premium paywall

hooks/                # Custom React hooks
lib/                  # Business logic & persistence
utils/                # Utility functions
constants/            # Theme & configuration
ctx/                  # React Context (auth)
providers/            # Context providers

supabase/             # Backend configuration
├── functions/        # Deno Edge Functions
└── migrations/       # Database schema

assets/               # Images, fonts, videos
docs/                 # Documentation
```

## Key Technologies

| Layer | Technology |
|-------|-----------|
| **Mobile Framework** | React Native (Expo SDK 54) |
| **Routing** | Expo Router v6 |
| **Language** | TypeScript (strict) |
| **Authentication** | Supabase Auth |
| **Database** | PostgreSQL (Supabase) |
| **Serverless** | Deno Edge Functions |
| **AI Model** | Gemini-3-Flash (via OpenRouter) |
| **State Management** | React Context |
| **Local Storage** | AsyncStorage + SecureStore |
| **Animation** | React Native Reanimated |

## Development

### Scripts

```bash
npm run start      # Dev server (Expo)
npm run ios        # iOS simulator
npm run android    # Android emulator
npm run web        # Web version
npm run lint       # ESLint check
```

### Code Style

- **TypeScript:** Strict mode, explicit types
- **Components:** Functional only, PascalCase
- **Hooks:** camelCase with `use` prefix
- **Styling:** `StyleSheet.create()` + `RFValue()` for responsive sizing
- **Imports:** Absolute paths via `@/` alias
- **Logging:** Feature-prefixed (`[lesson]`, `[auth]`, etc.)

See [Code Standards](./docs/code-standards.md) for detailed conventions.

## API Reference

### Supabase Edge Functions

| Function | Purpose | Input | Output |
|----------|---------|-------|--------|
| `chat-completion` | AI conversation | {message, context} | {response} |
| `transcribe-audio` | Voice→Pinyin | {audio, expected} | {pinyin, score} |
| `scenario-generate` | Custom scenarios | {interests, level} | {scenario} |
| `start-trial` | Grant 7-day trial | {userId} | {success} |

See [System Architecture](./docs/system-architecture.md) for detailed flows.

## Features in Detail

### Lessons
- 12 chapters, 86 lessons total
- Multiple choice, single response, listening comprehension
- Flashcard mode with 3D flip animation
- Progress tracking (AsyncStorage)

### Practice Modes
- **Voice Recording:** Record pronunciation, get AI feedback
- **Flashcards:** Recognition/recall phases for vocabulary
- **AI Conversations:** Real-time roleplay with scenario goals

### Premium
- Custom AI-generated scenarios
- Unlimited conversation sessions
- Full course access (included in free tier)
- Ad-free experience (future)

## Troubleshooting

### App won't start
```bash
npm run reset-project
npm install
npm run start
```

### Deep linking not working
- Check Supabase Auth → Redirect URLs includes `convo://auth/callback`
- On Android, verify app is installed before testing

### AI responses slow
- OpenRouter might be rate-limited (free tier ~10 req/min)
- Check OPENROUTER_API_KEY is set correctly
- Network latency > 2s is normal, show loading state

### AsyncStorage errors
- Clear app data and reinstall
- Check device storage isn't full

## Contributing

1. Create feature branch (`git checkout -b feature/name`)
2. Follow [Code Standards](./docs/code-standards.md)
3. Run `npm run lint` before committing
4. Submit PR with description

## License

See [LICENSE.md](./LICENSE.md) — MIT License

## Resources

- **Supabase Docs:** https://supabase.com/docs
- **Expo Docs:** https://docs.expo.dev
- **React Native Docs:** https://reactnative.dev
- **OpenRouter API:** https://openrouter.ai/docs
