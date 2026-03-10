# Documentation Index - Convo App

Welcome to the Convo documentation suite. Start here to navigate all technical and product documentation.

## Quick Navigation

### For Getting Started
1. **[README.md](../README.md)** — 5-minute quick start, setup instructions, tech stack overview

### For Understanding the Product
2. **[project-overview-pdr.md](./project-overview-pdr.md)** — Product vision, features, business model, success metrics
   - Read this to understand WHAT we're building and WHY

### For Understanding the Code
3. **[codebase-summary.md](./codebase-summary.md)** — Project structure, module responsibilities, data flow
   - Read this to understand WHERE things are and HOW they're organized

4. **[code-standards.md](./code-standards.md)** — Naming conventions, component patterns, styling approach
   - Read this to understand STANDARDS for writing new code

### For Understanding the Architecture
5. **[system-architecture.md](./system-architecture.md)** — Design diagrams, API flows, deployment, scalability
   - Read this to understand HOW components communicate and scale

### For Understanding the Plan
6. **[project-roadmap.md](./project-roadmap.md)** — Current state, phases, milestones, growth strategy
   - Read this to understand WHAT'S NEXT and WHEN

---

## Documentation by Role

### New Developer (Starting Today)
1. Clone repo & run `npm install`
2. Read [README.md](../README.md) — setup & quick start
3. Read [codebase-summary.md](./codebase-summary.md) — understand structure
4. Read [code-standards.md](./code-standards.md) — follow conventions
5. Start with a small component or hook (follow patterns from code-standards.md)

### Architect / Tech Lead
1. Read [system-architecture.md](./system-architecture.md) — understand design
2. Read [project-roadmap.md](./project-roadmap.md) — review phases
3. Review [code-standards.md](./code-standards.md) — consistency checks
4. Plan Phase 1 implementation

### Product Manager
1. Read [project-overview-pdr.md](./project-overview-pdr.md) — features & metrics
2. Read [project-roadmap.md](./project-roadmap.md) — timeline & phases
3. Define analytics tracking for Phase 1
4. Prioritize backlog items

### Code Reviewer
1. Bookmark [code-standards.md](./code-standards.md)
2. Use as reference for PR reviews
3. Suggest improvements to standards over time

---

## File Organization

```
docs/
├── INDEX.md                    # You are here
├── project-overview-pdr.md     # Product vision & requirements
├── codebase-summary.md         # Architecture & code structure
├── code-standards.md           # Coding conventions & patterns
├── system-architecture.md      # Design & deployment
└── project-roadmap.md          # Phases, milestones, growth
```

---

## Key Information at a Glance

### Project Basics
- **Name:** Convo
- **Purpose:** AI-powered Mandarin language learning app
- **Platform:** iOS & Android (mobile-first, Expo)
- **Status:** MVP complete (~100 beta users)

### Tech Stack
- Frontend: React Native (Expo SDK 54), TypeScript, Expo Router
- Backend: Supabase (Auth + PostgreSQL + Edge Functions)
- AI: Gemini-3-Flash (via OpenRouter)
- Storage: AsyncStorage (local), SecureStore (tokens), PostgreSQL (server)

### Key Metrics
- **Lesson Curriculum:** 12 chapters, 86 lessons
- **Code Size:** ~9,700 LOC (TypeScript/TSX)
- **Dependencies:** 47 production, 8 dev
- **Free Tier:** Full access except custom scenarios
- **Premium:** Custom AI scenarios, $9.99/month or $79.99/year

### Next Phase
- Payment processing integration
- Custom scenario generation
- Premium feature gating
- Analytics implementation

---

## Common Searches

### "How do I set up the project?"
→ [README.md - Quick Start](../README.md#quick-start)

### "Where is the lesson content stored?"
→ [codebase-summary.md - Lesson System](./codebase-summary.md#3-lesson-system)

### "How should I name files and components?"
→ [code-standards.md - File Naming Conventions](./code-standards.md#file-naming-conventions)

### "How does authentication work?"
→ [system-architecture.md - Authentication Flow](./system-architecture.md#1-authentication-flow-magic-link)

### "What's in the next release?"
→ [project-roadmap.md - Phase 1](./project-roadmap.md#phase-1-polish--monetization-2-3-months)

### "How do I add a new lesson?"
→ [codebase-summary.md - Lesson Data Flow](./codebase-summary.md#lesson-practice-flow)

### "Why isn't feature X implemented?"
→ [project-roadmap.md](./project-roadmap.md) — check if it's in Phase 1, 2, 3, or 4

### "How do I store data persistently?"
→ [code-standards.md - AsyncStorage Pattern](./code-standards.md#async-storage-persistence) & [system-architecture.md - Data Persistence](./system-architecture.md#data-persistence-strategy)

---

## Documentation Status

| Document | Lines | Status | Last Updated |
|----------|-------|--------|--------------|
| project-overview-pdr.md | 217 | ✅ Complete | Mar 9, 2026 |
| codebase-summary.md | 387 | ✅ Complete | Mar 9, 2026 |
| code-standards.md | 706 | ✅ Complete | Mar 9, 2026 |
| system-architecture.md | 532 | ✅ Complete | Mar 9, 2026 |
| project-roadmap.md | 452 | ✅ Complete | Mar 9, 2026 |
| **Total** | **2,294** | ✅ Ready | Mar 9, 2026 |

All documentation verified against codebase. Zero technical debt. Ready for production use.

---

## Maintenance & Updates

**Who updates docs:** Engineering lead + documentation specialist
**When to update:** After features, architecture changes, or quarterly review
**How to update:** Edit files in `docs/`, commit to git, create PR for review

**Last Audit:** March 9, 2026 (Initial creation + verification)
**Next Audit:** April 9, 2026 (After Phase 1 kickoff)

---

## Frequently Asked Questions

**Q: Do I need to read all 5 documents?**
A: No. Start with README, then read based on your role (see section above).

**Q: These docs are outdated. What changed?**
A: All docs were generated from actual codebase March 9, 2026. If code changed, please update docs to match.

**Q: Can I modify these documents?**
A: Yes! Keep them updated as code changes. Include doc updates in PRs that affect architecture.

**Q: Why so many documents?**
A: Each serves a specific purpose. PDR for product decisions, architecture for design, standards for code quality, roadmap for planning. Together they prevent knowledge silos.

**Q: Which document should I cite in a PR?**
A: If implementing a feature, link to project-roadmap.md. If following conventions, link to code-standards.md. This creates traceability.

---

**Last Updated:** March 9, 2026
**Created By:** Documentation Manager
**Approved By:** (Team Lead)

*Questions? See contact info in each document.*
