# STRUCTURE

## Key Directories
- `app/`: Expo Router pages and layouts.
  - `_layout.tsx`: Root layout, manages Auth gate.
  - `(tabs)/`: Primary bottom tab navigation (Lessons, Conversations, Profile).
  - `conversation.tsx`, `hsk-exam.tsx`, `onboarding.tsx`: Modal or top-level stacks.
- `assets/`: Static assets. Includes `assets/data/course_content.json` which drives static course data structures.
- `components/`: Reusable React Native UI components.
  - `lesson/`: Highly specialized, complex orchestrators like `LessonContent.tsx` (over 800 lines).
  - `conversation/`: UI components for real-time AI logic.
  - `subscription/`: RevenueCat paywall interfaces.
- `constants/`: Theme styling configs (`theme.ts`), typography definitions, and domain types (`CourseData.ts`).
- `hooks/`: Custom React hooks (e.g., `useDeepLinking.ts`).
- `lib/`: Business logic, local storage interfaces, external service wrappers (e.g., `billing.ts`).
- `providers/`: React Context providers (e.g., AuthProvider).
- `supabase/`: Backend configurations, schema definitions, and Edge Function code.

## Naming Conventions
- React components use `PascalCase.tsx`.
- Hooks use `useCamelCase.ts` or `useCamelCase.tsx`.
- Utility, library functionality, and router files use `kebab-case.ts`/`kebab-case.tsx` or `camelCase.ts`.
- Path aliasing is extensively used (`@/components`, `@/lib`).
