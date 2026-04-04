# Mandarin Learn

## What This Is

Mandarin Learn is a mobile application built with React Native and Expo that helps users learn Mandarin Chinese. It provides interactive lessons, real-time AI-driven conversations, and HSK exam preparation, powered by a Supabase backend and Edge Functions.

## Core Value

Provide an immersive and highly responsive Mandarin learning experience that leverages AI for practical conversation practice and structured HSK progress tracking.

## Requirements

### Validated

- ✓ Interactive lesson content and tracking (Lessons orchestrator)
- ✓ Real-time AI conversation capabilities (OpenRouter integration via Supabase Edge Functions)
- ✓ HSK Exam preparation and review queues
- ✓ User authentication and secure session management (Supabase Auth)
- ✓ Premium subscription features and paywalls (RevenueCat)
- ✓ Offline progression support with background remote syncing

### Active

(None currently — project initialized to track current state)

### Out of Scope

- [None explicitly defined yet] — Initialized from existing codebase.

## Context

- **Technical Environment**: React Native (Expo) frontend, Supabase Backend-as-a-Service (PostgreSQL, Edge Functions, Auth).
- **Core Integrations**: RevenueCat for subscriptions, OpenRouter for LLM text/audio APIs.
- **State**: Mix of local AsyncStorage for offline progress/queues, and Supabase Postgres for remote user state and premium feature flags.

## Constraints

- **Tech Stack**: Must remain within the React Native/Expo and Supabase ecosystem.
- **Performance**: High conversational latency must be avoided; offline capabilities should be preserved where possible.
- **Security**: Strict Row-Level Security (RLS) and Service Role isolation for premium boundaries; Edge-only LLM API key access.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Use Supabase Edge Functions for LLM calls | Protects OpenRouter API keys and enforces premium status logic | ✓ Good |
| File-based routing with Expo Router | Simplifies deep linking and navigation structure | ✓ Good |

---
*Last updated: 2026-03-30 after initialization*

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state
