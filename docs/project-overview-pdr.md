# Convo - Mandarin Language Learning App: Project Overview & PDR

## Executive Summary

**Convo** is a mobile-first AI-powered language learning app focused on conversational Mandarin Chinese. It combines structured lessons, interactive practice, and real-time roleplay conversations to help learners develop practical speaking skills with confidence.

**Tagline:** Learn Mandarin through AI-powered conversations, not memorization.

## Product Vision

Enable global users to achieve practical conversational fluency in Mandarin Chinese through an engaging, personalized mobile experience powered by AI.

## Target Audience

| Persona | Details |
|---------|---------|
| **Primary** | Adult language learners (18-45) seeking conversational proficiency |
| **Secondary** | Business professionals needing Mandarin for work (B2B potential) |
| **Tertiary** | Heritage learners reconnecting with language |

**Motivation Drivers:** Career advancement, cultural connection, travel preparation, business deals

## Value Proposition

- **Structured yet Flexible:** 12-chapter curriculum (86 lessons) + unlimited AI conversations
- **Certification Ready:** Full HSK 1-6 prep with spaced-repetition vocab review and server-timed mock exams
- **Personalized:** Onboarding captures level, motivations, interests → tailored content
- **Practical:** Focus on real conversations, not grammar drills
- **Accessible:** Mobile-first, offline-first vocab review, low data usage
- **Premium:** Advanced scenarios, custom AI story generation, full HSK 2-6 access

## Core Features

### Free Tier
| Feature | Details |
|---------|---------|
| Onboarding | Personalization (name, level, motivations, interests) |
| Lessons | 12 chapters, 86 lessons across 3 difficulty levels |
| Question Types | Multiple choice, single response, listening comprehension |
| Flashcards | Recognition/recall phases for vocabulary |
| Voice Recording | Pronunciation practice with AI transcription |
| AI Conversations | Real-time roleplay with scenario goals |
| Stats | Speaking/listening time tracking |
| 7-day Trial | Full premium access trial |

### Premium Tier
- Custom AI-generated scenarios (unlimited)
- HSK 2-6 vocabulary study + mock exams (unlimited attempts)
- Advanced conversation modes
- Enhanced analytics
- Ad-free experience
- Store-backed subscriptions via RevenueCat ($9.99/month or $79.99/year)

## Technical Requirements

| Category | Requirement |
|----------|-------------|
| **Platforms** | iOS 13+, Android 8+ |
| **Framework** | React Native via Expo SDK 54 |
| **Language** | TypeScript (strict mode) |
| **Routing** | Expo Router v6 (file-based) |
| **Auth** | Supabase (magic links + OAuth: Apple, Google) |
| **Backend** | Postgres via Supabase, Edge Functions (Deno) |
| **AI Model** | Gemini-3-Flash via OpenRouter API |
| **Storage** | AsyncStorage (client), Supabase (server) |
| **Deployment** | Expo Cloud (frontend), Supabase (backend) |

## Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| **Performance** | Lesson load < 1s, AI response < 3s |
| **Availability** | 99.5% uptime (Supabase SLA) |
| **Security** | AES-256 JWT encryption, RLS on all tables |
| **Accessibility** | WCAG 2.1 AA on web, iOS/Android standards |
| **Scalability** | 100k concurrent users (Supabase scaling) |
| **Localization** | English UI, Mandarin/English content |

## Success Metrics

### User Acquisition & Retention
- **Day 1 Retention:** > 50%
- **Day 7 Retention:** > 30%
- **MAU:** 10k+ users within 6 months
- **Trial → Premium Conversion:** > 10%

### Engagement
- **Avg. Session Length:** 15+ minutes
- **Lessons Completed:** 20+ per user (monthly)
- **Speaking Time:** 30+ min/week (active users)

### Product Quality
- **App Rating:** 4.5+ stars
- **Crash-free Rate:** > 99.5%
- **Performance:** 98th percentile load time < 2s

## Acceptance Criteria

### MVP (Complete)
- [x] Passwordless auth with email magic links
- [x] Onboarding flow captures profile data
- [x] 12-chapter curriculum with 86 lessons
- [x] 3 question types implemented
- [x] Flashcard practice modes
- [x] Voice recording + AI transcription
- [x] Real-time AI conversations with goals
- [x] Premium trial system
- [x] In-app paywall UI
- [x] Speaking/listening stats tracking
- [x] Offline lesson access (cached)

### HSK Certification Prep (Complete — March 2026)
- [x] HSK 1-6 vocabulary data pipeline (bundled JSON + manifest)
- [x] Supabase backend: progress tables, event sync, question bank
- [x] HSK Prep tab with level cards and session-backed progress
- [x] Offline-first vocabulary review with spaced repetition
- [x] Server-timed mock exams with AI writing evaluation
- [x] RevenueCat billing integration (store-backed entitlements)

### Phase 1 (Planned)
- [ ] Apple/Google OAuth integration
- [ ] Custom scenario generation (premium)
- [ ] Enhanced analytics dashboard
- [ ] Spaced repetition for core lesson flashcards

### Phase 2 (Future)
- [ ] Server-sync for lesson progress (no offline-only)
- [ ] Social features (leaderboards, study groups)
- [ ] Teacher dashboard (B2B)

## Curriculum Structure

**12 Chapters** organized by proficiency:

| Chapter | Topics | Lessons | Level |
|---------|--------|---------|-------|
| 1-4 | Greetings, numbers, basic phrases | 24 | Beginner |
| 5-8 | Conversations, daily tasks, directions | 32 | Intermediate |
| 9-12 | Business, culture, advanced discussions | 30 | Advanced |

**Per Lesson:** 1-3 question sets + 1 flashcard deck + 1-2 AI conversation scenarios

## Technical Dependencies

### Critical Path
1. **Supabase** → Auth, database, Edge Functions
2. **OpenRouter** → AI model access (Gemini-3-Flash)
3. **Expo** → Build tooling, native bridges
4. **React Native** → Core mobile framework

### Risk Mitigations
- OpenRouter fallback: Cache AI responses, graceful degradation
- Supabase downtime: Local AsyncStorage sync
- Expo build failures: Pre-built APK/IPA distribution

## Timeline & Phases

| Phase | Duration | Milestone |
|-------|----------|-----------|
| **MVP** | Complete | App published, 100+ users |
| **HSK Cert Prep** | Complete (Mar 2026) | HSK 1-6 prep + RevenueCat billing |
| **Phase 1** | 2-3 months | OAuth, custom scenarios, analytics |
| **Phase 2** | 3-4 months | Server-sync, social features |
| **Scale** | Ongoing | 100k+ MAU, B2B partnerships |

## Business Model

**Revenue Streams:**
1. **Premium Subscription** (active — RevenueCat + App Store / Play Store)
   - $9.99/month or $79.99/year
   - Target: 10% of active users by month 6
2. **B2B Licensing** (future)
   - Corporate training packages
3. **Enterprise API** (exploratory)
   - Custom AI models for educational institutions

**Cost Structure:**
- OpenRouter API: ~$0.005 per conversation (~$500/month at scale)
- Supabase: Pay-as-you-go (~$100-500/month)
- Expo: Free tier + occasional builds ($)
- Payment processor: 2.9% + $0.30 per transaction

**Break-Even:** 2k premium subscribers @ $9.99/month

## User Journey

```
Visitor → [Intro Screen] → Email → [Onboarding] → [Lessons Tab]
                ↓ OAuth   (Apple/Google)
         → [Profile Setup]

Lessons Tab: Browse & complete lessons → [Practice Mode] → Feedback
                                       → [Flashcards] → Recognition/Recall

Conversations Tab: Roleplay scenarios → Real-time AI chat → Transcript review

Profile Tab: View stats, manage subscription, adjust preferences
```

## Success Definition

App is "successful" when:
1. Published on iOS App Store and Google Play Store
2. 1,000+ downloads in first month
3. > 30% Day-7 retention
4. > 10% trial-to-premium conversion
5. Net sentiment > 4.5 stars (reviews)
6. Operational costs < revenue within 6 months

## Assumptions & Constraints

**Assumptions:**
- Users have reliable internet for AI features
- Mandarin learners prefer mobile-first experience
- Premium willingness-to-pay: $10-12/month
- AI quality sufficient for language learning

**Constraints:**
- No offline AI conversations (API required)
- Limited to Gemini-3-Flash model (cost + performance)
- Mobile-only MVP (no web initially)
- Single language (English UI, Mandarin content)

---

**Document Status:** Final for MVP
**Last Updated:** March 2026
**Owner:** Product Team
