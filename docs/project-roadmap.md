# Project Roadmap - Convo App

## Current State (MVP - Complete)

**Status:** ✅ Launched on Expo
**Users:** <100 (beta)
**Revenue:** $0 (free app, no payments processing)

### Completed Features
- [x] Passwordless email authentication (magic links)
- [x] Onboarding flow (name, level, motivations, interests)
- [x] 12-chapter curriculum (86 lessons)
- [x] Multiple question types (multiple choice, single response, listening)
- [x] Flashcard practice with 3D animations
- [x] Voice recording + AI transcription
- [x] Real-time AI conversations with scenarios
- [x] Speaking/listening stats tracking
- [x] Premium trial system (7-day free)
- [x] In-app paywall UI
- [x] Lesson progress tracking (AsyncStorage)
- [x] Light/dark mode theme
- [x] Deep linking for OAuth
- [x] **HSK Certification Prep** (Phases 01-07 complete)
  - [x] HSK 1-6 vocabulary data pipeline (bundled JSON + manifest)
  - [x] Supabase backend: progress tables, event sync, question bank
  - [x] HSK Prep tab with level cards and session-backed progress
  - [x] Vocabulary browse + spaced-repetition review queue (offline-first)
  - [x] Server-timed mock exams with AI writing evaluation
  - [x] RevenueCat billing integration (store-backed entitlements)
  - [x] Premium gating for HSK 2-6 (server-enforced quotas)

### Known Limitations
- No server-sync for lesson progress (AsyncStorage only)
- Stats only track locally (no backup)
- No custom scenario generation (UI ready, backend callable)
- No analytics or user insights
- No social features (leaderboards, study groups)
- No automated testing (unit/integration/E2E)

---

## Phase 1: Polish & Monetization (2-3 Months)

**Goal:** Achieve 30% Day-7 retention, 10% trial-to-premium conversion, $1k MRR

**Priority:** 🔴 High — Unblocks growth & revenue

### 1.1 Payment Processing Integration ✅ Complete

**Objective:** Real in-app purchases for premium subscriptions

**Implemented (Phase 06):**
- [x] RevenueCat SDK integrated (`lib/billing.ts`)
- [x] In-app products configured: $9.99/month, $79.99/year
- [x] Receipt validation via `revenuecat-webhook` Edge Function
- [x] Entitlements synced to `profiles.is_premium` (service-role, no client trust)
- [x] Cancellations handled via RevenueCat expiry events
- [ ] Test on iOS TestFlight and Android beta
- [ ] Submit to App Store / Google Play

**Acceptance Criteria:**
- User can purchase subscription in-app
- Premium access persists across sessions
- Cancelled subscriptions keep access until expiry; expiration/revocation removes access
- Receipts validated server-side (prevent tampering)
- Conversion rate > 10% of trial users

### 1.2 Custom Scenario Generation

**Objective:** AI-generated conversation scenarios based on user interests

**Tasks:**
- [ ] Call `scenario-generate` Edge Function from UI
- [ ] Pass user interests (e.g., "food", "travel", "business")
- [ ] Render generated scenario in conversation tab
- [ ] Cache scenario locally (prevent re-generation)
- [ ] Track usage (limit to 5/day for free, unlimited for premium)
- [ ] Handle API failures gracefully

**Acceptance Criteria:**
- User taps "Generate Scenario" (premium)
- AI creates contextual conversation scenario (< 3 seconds)
- Scenario saved and reusable
- Analytics show > 50% engagement with custom scenarios

### 1.3 Premium Feature Gating

**Objective:** Lock premium-only features behind subscription check

**Tasks:**
- [ ] Audit all premium features (currently: custom scenarios)
- [ ] Add premium check before rendering (gated components)
- [ ] Show paywall modal when accessing premium-only feature
- [ ] Track feature attempts in analytics (premium funnel)
- [ ] Document premium features in onboarding

**Acceptance Criteria:**
- Free users see paywall when tapping premium features
- Premium users access features without friction
- Analytics show funnel from attempt → paywall → conversion

### 1.4 Analytics & Insights

**Objective:** Understand user behavior for product optimization

**Tasks:**
- [ ] Choose analytics platform (Posthog, Mixpanel, or custom Supabase)
- [ ] Track key events: app open, lesson start, lesson complete, conversation start
- [ ] Track funnels: onboarding → lessons → premium trial
- [ ] Build dashboard for cohort analysis (retention, DAU, MAU)
- [ ] Do NOT track PII (no names, no lesson content)

**Acceptance Criteria:**
- Analytics dashboard shows Day 1/7/30 retention
- Conversion funnel visible
- Churn points identifiable

---

## Phase 2: Server Sync & Data Persistence (3-4 Months)

**Goal:** Ensure user progress is never lost, enable multi-device sync

**Priority:** 🟡 Medium — Nice-to-have but prevents user frustration

### 2.1 Lesson Progress Sync

**Objective:** Sync AsyncStorage progress to Supabase

**Tasks:**
- [ ] Create `lesson_progress` table in Supabase
  ```sql
  CREATE TABLE lesson_progress (
    id UUID PRIMARY KEY,
    user_id UUID FK auth.users(id),
    chapter_id INTEGER,
    lesson_id INTEGER,
    completed BOOLEAN,
    score INTEGER,
    timestamp TIMESTAMPTZ,
    synced_at TIMESTAMPTZ
  );
  ```
- [ ] Implement background sync (every 30 seconds)
- [ ] Implement multi-device sync (fetch server state on app open)
- [ ] Conflict resolution (latest timestamp wins)
- [ ] Handle offline → online transitions
- [ ] Add sync indicator in UI ("Syncing...")

**Acceptance Criteria:**
- User completes lesson on device A
- User opens app on device B → progress shows
- No data loss on app uninstall
- Offline changes sync when reconnected

### 2.2 Stats Server Sync

**Objective:** Persist speaking/listening stats to Supabase

**Tasks:**
- [ ] Create `user_stats` table
- [ ] Sync stats on lesson/conversation completion
- [ ] Implement weekly/monthly rollups (Postgres stored procedure)
- [ ] Display weekly/monthly trends in profile

**Acceptance Criteria:**
- Stats persist across devices
- Historical trends visible (past 4 weeks)
- Offline stats sync on reconnect

### 2.3 Conversation History Cloud Backup

**Objective:** Backup conversations to prevent loss

**Tasks:**
- [ ] Create `conversations` table in Supabase
- [ ] Save conversation transcript after each session
- [ ] Retrieve conversation history from server
- [ ] Show past conversations with date/scenario info

**Acceptance Criteria:**
- User can review past conversations
- Conversations not lost if app uninstalled
- Offline conversations sync on reconnect

---

## Phase 3: Social & Community (4-6 Months)

**Goal:** Increase engagement via competition and social motivation

**Priority:** 🟢 Low — Enhances retention but not critical for MVP

### 3.1 Leaderboards

**Objective:** Show top learners (weekly/monthly/all-time)

**Tasks:**
- [ ] Create `leaderboard` view (materialized view in Postgres)
  ```sql
  SELECT user_id, SUM(speaking_minutes) as total_speaking,
         ROW_NUMBER() OVER (ORDER BY total_speaking DESC) as rank
  FROM user_stats
  GROUP BY user_id;
  ```
- [ ] Display global leaderboard (top 100)
- [ ] Show friend leaderboard (future: social features)
- [ ] Weekly reset (Monday)
- [ ] Badges/achievements for milestones

**Acceptance Criteria:**
- Leaderboard loads in < 1 second
- User can see their rank
- Weekly reset works correctly

### 3.2 Study Streaks

**Objective:** Gamify consistency

**Tasks:**
- [ ] Track daily lesson/conversation completion
- [ ] Calculate current streak
- [ ] Show streak badge in profile
- [ ] Push notification on Day 3 streak (remind to continue)

**Acceptance Criteria:**
- Streak counter accurate
- Notifications sent at consistent time
- User sees streak in profile

### 3.3 Social Sharing

**Objective:** Encourage viral growth

**Tasks:**
- [ ] Add "Share Completion" button after lesson
- [ ] Share to social media (generate shareable link/image)
- [ ] Track referrals (user_id_referrer)
- [ ] Bonus: Give trial extension for successful referral

**Acceptance Criteria:**
- Share button functional
- Referral tracking works
- Can measure viral coefficient

---

## Phase 4: Teacher Dashboard & B2B (6-9 Months)

**Goal:** Enable educators to use Convo in classrooms

**Priority:** 🔵 Low — High potential value but requires different product

### 4.1 Teacher Account Type

**Objective:** Manage groups of student accounts

**Tasks:**
- [ ] Create `teachers` table with class management
- [ ] Create `classroom_memberships` table
- [ ] Add teacher-specific Auth role
- [ ] Build teacher dashboard (web or mobile)

### 4.2 Classroom Analytics

**Objective:** Show teacher progress of students

**Tasks:**
- [ ] Student progress per chapter/lesson
- [ ] Speaking time per student (aggregate)
- [ ] Class-wide insights (average, distribution)
- [ ] Export data (CSV for record-keeping)

### 4.3 Custom Curriculum (Future)

**Objective:** Allow teachers to create class-specific lessons

**Tasks:**
- [ ] CRUD for teacher-created lessons
- [ ] Assign to class/student
- [ ] Use same question types as built-in curriculum

**Acceptance Criteria:**
- 10 teachers signed up
- Average 3 classrooms per teacher
- $50-100/month per teacher (pricing model)

---

## Technical Debt & Improvements

### High Priority (Next Sprint)
- [ ] Add unit tests for hooks (useSpeakingListeningStats, useDeepLinking)
- [ ] Add integration tests for lesson content rendering
- [ ] Implement error boundary for UI crashes
- [ ] Add Sentry for crash reporting
- [ ] Performance audit (Lighthouse for web, profiler for native)
- [ ] Accessibility audit (WCAG 2.1 AA)

### Medium Priority (This Quarter)
- [ ] Refactor LessonContent.tsx (650 LOC → split into 3-4 smaller components)
- [ ] Extract question validation logic into shared hooks
- [ ] Implement caching layer for CourseData (memoization)
- [ ] Add E2E tests with Detox (iOS) or Maestro (cross-platform)
- [ ] Optimize bundle size (tree-shake unused dependencies)

### Low Priority (This Year)
- [ ] Migrate to TypeScript strict null checks (already enabled, just cleanup)
- [ ] Implement design system (Storybook for components)
- [ ] Add i18n for Chinese UI (currently English-only)
- [ ] Performance: Move to SQLite for local storage (vs AsyncStorage)

---

## Growth & Scaling Plan

### Milestones

| Milestone | Timeline | Target | Metric |
|-----------|----------|--------|--------|
| **Public Launch** | Done | 100 downloads | App Store presence |
| **Phase 1 Complete** | +3 months | 1,000 users, 10% premium | Product-market fit |
| **Phase 2 Complete** | +6 months | 10,000 users, 5,000 premium | Data persistence verified |
| **Phase 3 Complete** | +9 months | 50,000 users, 10% premium | Social engagement > 40% |
| **Scale** | +12+ months | 100,000 users, $50k MRR | Sustainable business |

### Acquisition Channels (Prioritized)

1. **Organic (App Store/Play):** 40% of growth
   - Optimize ASO (app title, keywords, screenshot text)
   - Get 4.5+ star rating (invest in user support)

2. **Content Marketing:** 30%
   - Blog: "Learn Mandarin in 15 min/day"
   - YouTube: Demo videos, learner testimonials
   - TikTok: Short pronunciation tips

3. **Paid Acquisition:** 20%
   - Facebook/Instagram ads (target language learners)
   - Google App Campaigns
   - Budget: $0.50-1.00 per install, aim for ROAS > 3x

4. **Partnerships:** 10%
   - Language learning subreddits
   - Discord servers (study communities)
   - Affiliate programs with language blogs

### Retention Strategy

| Cohort | D1 Retention | D7 | D30 | Current | Target |
|--------|--------------|----|----|---------|--------|
| **All Users** | 50% | 30% | 15% | TBD | 60% / 35% / 20% |
| **Paid** | 80% | 60% | 40% | TBD | 85% / 70% / 50% |

**Levers:**
- Improved onboarding (A/B test motivations prompt)
- Push notifications (lesson streak, friend activity)
- Spaced repetition for flashcards (SM2 algorithm)
- Difficulty scaling (adaptive lessons based on user level)

### Monetization Strategy

| Strategy | Timeline | Expected Revenue | Notes |
|----------|----------|------------------|-------|
| **Premium Subscription** | Phase 1 | $0 → $10k MRR (month 6) | Primary revenue |
| **In-app Ads** (optional) | Phase 2 | $1-2k MRR (if free tier only) | Low-friction, could reduce churn |
| **B2B Licensing** | Phase 4 | $2-5k MRR | Teacher/school packages |
| **API/White-label** | Future | $5k+ MRR | Other language schools license |

**Current:** Freemium model (free with trial, premium optional)

---

## Dependency Management

### Critical External Dependencies
- **OpenRouter API:** Gemini access
  - Risk: API changes, rate limits, pricing increase
  - Mitigation: Maintain fallback model list, cache responses

- **Supabase:** Auth, database, edge functions
  - Risk: Service outage, pricing changes
  - Mitigation: Offline-first design, AsyncStorage backup

- **Expo:** Build tooling
  - Risk: Major version breaking changes
  - Mitigation: Pin versions, test upgrading quarterly

### Version Pinning (Current)
- Expo: ~54.0.31 (LTS support until Dec 2025)
- React: 19.1.0 (stable)
- React Native: 0.81.5 (latest stable)
- Supabase SDK: ^2.90.1 (track updates)

---

## Success Metrics & KPIs

### User Acquisition
- **CAC (Customer Acquisition Cost):** $0.50-1.00
- **Viral Coefficient:** 1.2+ (each user brings 1.2 new users)
- **ASO Ranking:** Top 100 in "Learning" category

### Engagement
- **DAU (Daily Active Users):** 20% of total users
- **Session Length:** 15+ minutes average
- **Lesson Completion:** 20+ lessons per active user (monthly)
- **Conversation Usage:** 50% of users attempt AI conversations

### Retention
- **Day 1:** 50%+
- **Day 7:** 30%+
- **Day 30:** 15%+
- **Monthly Churn:** < 5%

### Revenue
- **Premium Conversion:** 10%+ of free users
- **ARPU (Average Revenue Per User):** $0.50-1.00/month
- **LTV (Lifetime Value):** $5-10 per user (3-5 month avg subscription)
- **LTV:CAC Ratio:** > 3:1 (profitable)

### Product Quality
- **Crash-free Rate:** > 99.5%
- **App Store Rating:** 4.5+ stars
- **Support Response Time:** < 24 hours
- **Bug Fix SLA:** Critical < 4 hours, Normal < 48 hours

---

## Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|-----------|
| Low adoption | High | Medium | A/B test onboarding, improve ASO |
| Poor retention | High | Medium | Add streaks, leaderboards, social |
| AI cost spike | High | Low | Cap requests, use cheaper models, cache |
| Supabase outage | High | Very Low | Offline-first design, AsyncStorage |
| App Store rejection | Medium | Low | Follow guidelines, test on real device |
| Copycats | Low | High | Focus on community, B2B partnerships |

---

## Document Control

| Date | Status | Notes |
|------|--------|-------|
| Mar 2026 | Draft | MVP complete, Phase 1 planning |
| TBD | In Progress | Phase 1 implementation |
| TBD | Final | Phase 1 retrospective + Phase 2 kickoff |

---

**Document Status:** Current for MVP
**Last Updated:** March 2026
**Owner:** Product & Engineering Team
**Next Review:** After Phase 1 kickoff
