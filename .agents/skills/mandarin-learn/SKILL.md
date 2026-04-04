# mandarin-learn Development Patterns

> Auto-generated skill from repository analysis

## Overview

This skill teaches the core development patterns, coding conventions, and collaborative workflows used in the `mandarin-learn` repository—a TypeScript React application. The guide covers file organization, code style, testing practices, and step-by-step instructions for common contribution scenarios, including feature development, edge function hardening, regression test addition, and codebase hygiene.

## Coding Conventions

### File Naming

- **Files:** Use `camelCase` for file names.
  - Example: `userProfile.tsx`, `useAuth.ts`
- **Test Files:** Suffix with `.test.ts` or `.test.tsx`.
  - Example: `useAuth.test.ts`

### Imports

- **Style:** Use import aliases for modules.
  - Example:
    ```typescript
    import { fetchUser } from 'lib/api'
    import { useAuth } from 'hooks/useAuth'
    ```

### Exports

- **Style:** Default exports are preferred.
  - Example:
    ```typescript
    // In hooks/useAuth.ts
    const useAuth = () => { /* ... */ }
    export default useAuth
    ```

### Component & Hook Structure

- **Components:** Placed in `components/`, named with PascalCase.
- **Hooks:** Placed in `hooks/`, named with `use` prefix.

## Workflows

### Refactor or Feature Phase with Tests and Docs

**Trigger:** When delivering a new feature, refactor, or hardening phase with traceable planning and locked-in regression tests.  
**Command:** `/phase-commit`

1. Update or add implementation files (e.g., hooks, components, edge functions, context providers).
2. Add or update corresponding regression/unit test files in `__tests__/`.
3. Update or add planning/phase documentation in `plans/`.
4. Run and verify tests, typechecks, and lints.

**Files Involved:**
- `hooks/*.ts`
- `components/**/*.tsx`
- `supabase/functions/**/*.ts`
- `ctx/*.ts`
- `__tests__/**/*.test.ts*`
- `plans/202*/**/*.md`

**Example:**
```typescript
// hooks/useFeatureFlag.ts
const useFeatureFlag = () => { /* ... */ }
export default useFeatureFlag
```
```typescript
// __tests__/useFeatureFlag.test.ts
import useFeatureFlag from 'hooks/useFeatureFlag'
test('returns correct flag', () => { /* ... */ })
```

---

### Edge Function Hardening or Update

**Trigger:** When improving edge function security, error handling, or shared logic without breaking existing API contracts.  
**Command:** `/edge-harden`

1. Update or refactor edge function implementation files.
2. Extract or update shared helpers in `supabase/functions/_shared/`.
3. Update or validate event payloads and error boundaries.
4. Run typechecks and (where possible) test edge functions locally.

**Files Involved:**
- `supabase/functions/**/*.ts`
- `supabase/functions/_shared/*.ts`
- `lib/**/*.ts`

**Example:**
```typescript
// supabase/functions/_shared/validatePayload.ts
export default function validatePayload(payload: any) { /* ... */ }
```

---

### Test Harness or Regression Test Addition

**Trigger:** When ensuring stable behavior for a provider, hook, or component before making risky or broad changes.  
**Command:** `/add-regression-test`

1. Create or update test files in `__tests__/`.
2. Update jest configuration or setup if needed.
3. Run tests and typechecks to verify baseline behavior.

**Files Involved:**
- `__tests__/**/*.test.ts*`
- `jest.config.ts`
- `jest.setup.ts`
- `package.json`

**Example:**
```typescript
// __tests__/userProfile.test.tsx
import UserProfile from 'components/UserProfile'
test('renders user profile', () => { /* ... */ })
```

---

### .gitignore or VCS Artifact Update

**Trigger:** When preventing local or generated files (logs, coverage, runtime state) from polluting the repository.  
**Command:** `/ignore-artifact`

1. Edit `.gitignore` to add new ignore patterns.
2. Verify `git status` to confirm artifacts are ignored.
3. Commit `.gitignore` changes.

**Files Involved:**
- `.gitignore`

**Example:**
```
# .gitignore
coverage/
*.log
```

---

### Lint, Typecheck, and Test Cleanup

**Trigger:** When eliminating lint/typecheck noise or preventing regressions from obscuring real issues.  
**Command:** `/cleanup-lint`

1. Fix lint warnings and type errors in implementation files.
2. Run and verify linter, typechecker, and tests.
3. Commit only code and config changes (no user-facing behavior changes).

**Files Involved:**
- `app/**/*.tsx`
- `components/**/*.tsx`
- `hooks/**/*.ts`
- `lib/**/*.ts`
- `supabase/functions/**/*.ts`

**Example:**
```typescript
// Before
const foo = (bar) => { return bar }
// After
const foo = (bar: string): string => { return bar }
```

## Testing Patterns

- **Framework:** Jest
- **Test Files:** Named with `.test.ts` or `.test.tsx` suffix, located in `__tests__/`.
- **Test Example:**
    ```typescript
    // __tests__/useAuth.test.ts
    import useAuth from 'hooks/useAuth'
    test('should return user', () => {
      const user = useAuth()
      expect(user).toBeDefined()
    })
    ```
- **Configuration:** Managed via `jest.config.ts` and `jest.setup.ts`.

## Commands

| Command              | Purpose                                                         |
|----------------------|-----------------------------------------------------------------|
| /phase-commit        | Start a feature/refactor phase with tests and documentation     |
| /edge-harden         | Harden or update edge/serverless functions                      |
| /add-regression-test | Add or extend regression test harness for a provider/hook/component |
| /ignore-artifact     | Update .gitignore to exclude new artifacts                      |
| /cleanup-lint        | Clean up lint, typecheck, or test issues                        |
