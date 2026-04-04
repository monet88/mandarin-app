```markdown
# mandarin-learn Development Patterns

> Auto-generated skill from repository analysis

## Overview

This skill provides a comprehensive guide to the development patterns used in the `mandarin-learn` TypeScript codebase. It covers coding conventions, file organization, import/export styles, and key workflows such as updating CORS policies for Supabase Edge Functions. This guide is intended for contributors looking to maintain consistency and follow best practices within the repository.

## Coding Conventions

### File Naming

- Use **camelCase** for file names.
  - Example: `chatCompletion.ts`, `hskEvents.ts`

### Imports

- Use **absolute import paths**.
  - Example:
    ```typescript
    import { handleCors } from 'supabase/functions/_shared/cors';
    ```

### Exports

- Use **named exports** rather than default exports.
  - Example:
    ```typescript
    // In supabase/functions/_shared/cors.ts
    export function handleCors(request: Request): Response { ... }
    ```

### Commit Messages

- Mixed types, but often use the `fix` prefix.
- Keep commit messages concise (average ~62 characters).

## Workflows

### Update CORS Policy Across Edge Functions

**Trigger:** When you need to update or tighten CORS policies for multiple Supabase Edge Functions, especially to move away from wildcard origins.

**Command:** `/update-cors-policy`

1. **Update or create a shared CORS helper**
   - Edit or create `supabase/functions/_shared/cors.ts` to centralize CORS logic.
   - Example:
     ```typescript
     export function handleCors(request: Request, allowedOrigin: string): Response {
       const origin = request.headers.get('Origin');
       if (origin && origin === allowedOrigin) {
         // Set CORS headers
         return new Response(null, {
           headers: {
             'Access-Control-Allow-Origin': allowedOrigin,
             'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
             'Access-Control-Allow-Headers': 'Content-Type',
           }
         });
       }
       return new Response('Forbidden', { status: 403 });
     }
     ```

2. **Update all relevant Edge Function entrypoints**
   - Import and use the shared CORS helper in each function's `index.ts`.
   - Use the `ALLOWED_ORIGIN` environment variable.
   - Example:
     ```typescript
     import { handleCors } from 'supabase/functions/_shared/cors';

     export async function handler(request: Request) {
       return handleCors(request, Deno.env.get('ALLOWED_ORIGIN')!);
     }
     ```

3. **Add or update tests for the CORS helper**
   - Place tests in `supabase/functions/_shared/cors_test.ts`.
   - Example:
     ```typescript
     import { handleCors } from './cors';

     Deno.test('allows requests from allowed origin', () => {
       // ...test logic
     });
     ```

4. **Update documentation**
   - Reflect new configuration requirements in `README.md`.

5. **Update lockfiles**
   - If new dependencies or test suites are added, update `deno.lock`.

**Files Involved:**
- `supabase/functions/_shared/cors.ts`
- `supabase/functions/_shared/cors_test.ts`
- `supabase/functions/_shared/hsk-events.ts`
- `supabase/functions/chat-completion/index.ts`
- `supabase/functions/scenario-generate/index.ts`
- `supabase/functions/start-trial/index.ts`
- `supabase/functions/transcribe-audio/index.ts`
- `README.md`
- `deno.lock`

**Frequency:** ~1/month

---

## Testing Patterns

- **Test Framework:** Unknown (likely Deno's built-in test runner).
- **Test File Pattern:** Files end with `.test.` before the extension (e.g., `cors_test.ts`).
- **Test Example:**
  ```typescript
  import { someFunction } from './someFile';

  Deno.test('description of test', () => {
    // test logic here
  });
  ```

## Commands

| Command               | Purpose                                                        |
|-----------------------|----------------------------------------------------------------|
| /update-cors-policy   | Standardizes and secures CORS handling across Edge Functions   |
```
