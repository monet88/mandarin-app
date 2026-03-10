# Code Standards & Conventions - Convo App

## File Naming Conventions

### TypeScript/TSX Files

| Type | Convention | Example | Location |
|------|-----------|---------|----------|
| **React Components** | PascalCase | `LessonContent.tsx`, `Flashcard.tsx` | `components/**` |
| **Custom Hooks** | camelCase with `use` prefix | `useSpeakingListeningStats.ts` | `hooks/` |
| **Utility Functions** | camelCase or kebab-case | `lessonProgress.ts`, `supabase.ts` | `utils/`, `lib/` |
| **Constants** | PascalCase | `CourseData.ts`, `AuthContext.tsx` | `constants/`, `ctx/` |
| **Context Providers** | PascalCase | `AuthContext.tsx`, `AuthProvider.tsx` | `ctx/`, `providers/` |

**Rationale:**
- Components use PascalCase (JSX convention, React export style)
- Hooks use camelCase with `use` prefix (standard React convention)
- Utility modules use camelCase for consistency with npm ecosystem
- Single file, single export per component

### Directory Organization

```
components/
├── auth/                    # Authentication-related
├── conversation/            # AI conversation features
├── lesson/                  # Lesson practice & display
├── subscription/            # Premium/paywall UI
├── ui/                      # Generic reusable UI
└── {feature}/               # Feature-specific grouping
```

**Principle:** Group by feature/domain, not by type (avoid "buttons", "cards", "screens")

## TypeScript & Type Safety

### Strict Mode Enabled
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true
  }
}
```

**Rules:**
- All functions must have explicit return types
- No `any` type except with `// @ts-ignore` justification
- Optional properties marked with `?`
- Union types preferred over `any`

### Type Definition Patterns

```tsx
// ✅ Good: Explicit types
interface LessonQuestion {
  id: string;
  type: 'multiple_choice' | 'single_response' | 'listening_mc';
  prompt: string;
  correctAnswer: string;
}

// ❌ Bad: Implicit any
function getLessonQuestion(id) { ... }

// ✅ Good: Union types
type AuthState = 'loading' | 'authenticated' | 'unauthenticated';

// ✅ Good: Generic components
function useAsync<T>(fn: () => Promise<T>): AsyncState<T> { ... }
```

### Context Types

```tsx
// ✅ Pattern: Type-safe context with useContext hook
interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({...});
export const useAuth = () => useContext(AuthContext);

// Usage in components:
const { session, user } = useAuth();
```

## Component Composition Patterns

### Functional Components with Hooks

```tsx
import { View, StyleSheet } from 'react-native';
import { useEffect, useState } from 'react';

interface LessonContentProps {
  lessonId: string;
  chapterId: string;
  onComplete?: () => void;
}

export function LessonContent({ lessonId, chapterId, onComplete }: LessonContentProps) {
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLesson();
  }, [lessonId]);

  async function loadLesson() {
    // Implementation
  }

  return (
    <View style={styles.container}>
      {/* JSX */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
});
```

**Conventions:**
- Functional components only (no class components)
- Props interface defined above component
- Use optional props with `?` for optional parameters
- Extract styles via `StyleSheet.create()` at module bottom
- One component per file (rare exceptions allowed with `+` suffix comment)

### Custom Hooks Pattern

```tsx
// hooks/useSpeakingListeningStats.ts
import { useCallback, useEffect, useState } from 'react';

export function useSpeakingListeningStats() {
  const [stats, setStats] = useState<SpeakingListeningStats | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshStats = useCallback(async () => {
    const loaded = await speakingListeningStats.load();
    setStats(loaded);
  }, []);

  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  return { stats, loading, refreshStats };
}
```

**Conventions:**
- Hooks return object with state, loading, error, and refresh functions
- Use `useCallback` for memoized refresh functions
- Consistent naming: `use{Feature}()` hook
- Export only hook, not internal state

### Context Provider Pattern

```tsx
// providers/AuthProvider.tsx
import { AuthContext, AuthContextType } from '@/ctx/AuthContext';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthContextType>({
    session: null,
    user: null,
    loading: true,
    // ...
  });

  useEffect(() => {
    // Set up Supabase listener
    const unsubscribe = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        const profile = await fetchProfile(session.user.id);
        setAuthState({ session, user: session.user, profile, loading: false });
      }
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={authState}>
      {children}
    </AuthContext.Provider>
  );
}
```

**Conventions:**
- Provider wraps child components and manages state
- Context created separately in `ctx/` with types
- Provider in `providers/` with implementation
- Fetch data in `useEffect` on mount
- Return cleanup functions for subscriptions

## Styling Approach

### StyleSheet.create() Pattern

```tsx
import { StyleSheet, View, Text } from 'react-native';
import { Colors } from '@/constants/theme';
import { RFValue } from 'react-native-size-matters';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
    paddingHorizontal: RFValue(16),
    paddingVertical: RFValue(20),
  },
  title: {
    fontSize: RFValue(24),
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: RFValue(8),
  },
  button: {
    paddingVertical: RFValue(12),
    paddingHorizontal: RFValue(16),
    borderRadius: RFValue(8),
    backgroundColor: Colors.primaryAccentColor,
    alignItems: 'center',
  },
});

export function MyComponent() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hello</Text>
    </View>
  );
}
```

**Conventions:**
- Styles defined at module level via `StyleSheet.create()`
- Use `RFValue()` from `react-native-size-matters` for responsive sizing
- Import colors from `constants/theme.ts`
- Avoid inline styles except for dynamic values
- Use semantic style names (not `s1`, `s2`)

### Responsive Sizing

```tsx
import { RFValue } from 'react-native-size-matters';

const styles = StyleSheet.create({
  // Font sizes
  title: { fontSize: RFValue(24) },      // Scales to screen size
  subtitle: { fontSize: RFValue(18) },
  body: { fontSize: RFValue(14) },

  // Spacing
  containerPadding: { padding: RFValue(16) },
  spacing: { marginVertical: RFValue(8) },

  // Dimensions
  icon: { width: RFValue(24), height: RFValue(24) },
});
```

**Principle:** Use `RFValue()` for all dimensions to support multiple screen sizes

### Light/Dark Mode Theme

```tsx
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

export function ThemedText({ children, style }: TextProps) {
  const colorScheme = useColorScheme();
  const color = colorScheme === 'dark' ? Colors.dark.text : Colors.light.text;

  return <Text style={[style, { color }]}>{children}</Text>;
}
```

**Pattern:** Create themed wrapper components using color scheme hook

## Error Handling Patterns

### Try-Catch with User Feedback

```tsx
import { showToast } from 'sonner-native';

async function handleLessonSubmit(answer: string) {
  try {
    const result = await validateAnswer(answer);
    if (result.correct) {
      showToast.success('Correct! 🎉');
      onComplete?.();
    } else {
      showToast.error('Not quite right. Try again.');
    }
  } catch (error) {
    console.error('[lesson] Answer validation failed:', error);
    showToast.error('Something went wrong. Please try again.');
  }
}
```

**Conventions:**
- Always wrap async operations in try-catch
- Log errors with `[feature]` prefix for debugging
- Show user-friendly toast for errors
- Never silently fail
- Include error type checks when catching different errors

### Supabase Error Handling

```tsx
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', userId)
  .single();

if (error) {
  if (error.code === 'PGRST116') {
    // Not found
    console.error('[profile] Profile not found:', userId);
  } else {
    console.error('[profile] Query failed:', error);
  }
  throw new Error('Failed to load profile');
}

const profile = data;
```

**Pattern:** Check error.code for specific handling, log with context prefix

### Loading & Error States

```tsx
interface DataViewProps {
  data: T | null;
  loading: boolean;
  error: Error | null;
  children: (data: T) => React.ReactNode;
}

export function DataView<T>({ data, loading, error, children }: DataViewProps) {
  if (loading) return <ActivityIndicator />;
  if (error) return <ErrorMessage error={error} />;
  if (!data) return <EmptyState />;

  return <>{children(data)}</>;
}
```

**Pattern:** Separate loading, error, empty, and success states explicitly

## Async Storage Persistence

### Key-Value Pattern

```tsx
// lib/lessonProgress.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const LESSON_KEY = (chapterId: string, lessonId: string) =>
  `lesson_${chapterId}_${lessonId}`;

interface LessonCompletion {
  completed: boolean;
  timestamp: number;
  score?: number;
}

export const lessonProgress = {
  async save(chapterId: string, lessonId: string, data: LessonCompletion) {
    try {
      await AsyncStorage.setItem(LESSON_KEY(chapterId, lessonId), JSON.stringify(data));
    } catch (error) {
      console.error('[lessonProgress] Save failed:', error);
    }
  },

  async load(chapterId: string, lessonId: string): Promise<LessonCompletion | null> {
    try {
      const json = await AsyncStorage.getItem(LESSON_KEY(chapterId, lessonId));
      return json ? JSON.parse(json) : null;
    } catch (error) {
      console.error('[lessonProgress] Load failed:', error);
      return null;
    }
  },

  async loadAll(): Promise<Record<string, LessonCompletion>> {
    // Implementation
  },
};
```

**Conventions:**
- Namespace keys with descriptors
- Provide typed load/save methods
- Return null for missing data (not undefined)
- Always handle JSON parse errors
- Batch operations for performance

## API Integration (Supabase)

### Edge Function Invocation

```tsx
async function startAIConversation(scenario: Scenario) {
  try {
    const { data, error } = await supabase.functions.invoke('chat-completion', {
      body: {
        message: userMessage,
        scenarioId: scenario.id,
        conversationContext: history,
      },
    });

    if (error) throw error;
    return data.response;
  } catch (error) {
    console.error('[conversation] Edge function failed:', error);
    throw new Error('Failed to generate AI response');
  }
}
```

**Conventions:**
- Pass data via `body` object
- Always check for errors
- Don't assume response structure
- Log errors with feature prefix
- Type response explicitly

### Database Queries

```tsx
async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('[auth] Profile fetch failed:', error);
    return null;
  }

  return data;
}
```

**Conventions:**
- Use `.single()` for single-row queries
- Explicit column selection where possible
- Handle null returns gracefully
- Cache results when appropriate

## Logging & Debugging

### Log Format

```tsx
// ✅ Good: Feature prefix + context
console.log('[auth] User logged in:', userId);
console.warn('[lesson] Unexpected question type:', type);
console.error('[conversation] API timeout after 5s');

// ❌ Bad: No context
console.log('User logged in');
console.error('Error');

// ❌ Bad: Too verbose
console.log('In function handleButtonPress, checking if user is authenticated...');
```

**Convention:** `[feature] message` format for all logs
- Use `console.log()` for info
- Use `console.warn()` for warnings
- Use `console.error()` for errors
- Prefix with feature area in brackets

### Debugging Utilities

```tsx
// Enable during dev, disable in production
const DEBUG = __DEV__;

function debugLog(feature: string, message: string, data?: any) {
  if (DEBUG) {
    console.log(`[${feature}] ${message}`, data);
  }
}

// Usage
debugLog('lesson', 'Rendering question', question);
```

## Import Organization

```tsx
// 1. React & React Native
import { View, StyleSheet } from 'react-native';
import { useEffect, useState } from 'react';

// 2. Expo & third-party
import { showToast } from 'sonner-native';
import { RFValue } from 'react-native-size-matters';

// 3. Local imports (absolute paths)
import { AuthContext } from '@/ctx/AuthContext';
import { LessonContent } from '@/components/lesson/LessonContent';
import { Colors } from '@/constants/theme';
import { lessonProgress } from '@/lib/lessonProgress';

// 4. Styles
const styles = StyleSheet.create({ ... });

// 5. Component/Hook definition
export function MyComponent() { ... }
```

**Convention:** Group imports by source, use absolute paths with `@/`

## Commenting & Documentation

### Component Comments

```tsx
/**
 * Displays a single lesson question and handles user responses.
 * Supports multiple question types: multiple choice, single response, listening.
 *
 * @param lessonId - Unique lesson identifier
 * @param onComplete - Callback when question is answered correctly
 */
export function QuestionView({ lessonId, onComplete }: QuestionViewProps) {
  // Implementation
}
```

**Convention:** JSDoc for public components, brief description + params

### Complex Logic Comments

```tsx
// Convert start time to duration in seconds, accounting for pauses
const duration = (Date.now() - startTime - pausedTime) / 1000;

// Validation: Check if answer matches, accounting for tone marks normalization
const isCorrect = normalizeAnswer(userAnswer) === normalizeAnswer(correctAnswer);
```

**Convention:** Explain "why", not "what" (code shows what it does)

## Performance Considerations

### Memoization

```tsx
import { memo, useCallback, useMemo } from 'react';

// Memoize expensive component
const LessonListItem = memo(function LessonListItem({ lesson }: Props) {
  return <LessonCard lesson={lesson} />;
});

// Memoize callback (prevent child re-renders)
const handleSelect = useCallback((id: string) => {
  selectLesson(id);
}, []);

// Memoize expensive computation
const sortedLessons = useMemo(() => {
  return lessons.sort((a, b) => a.order - b.order);
}, [lessons]);
```

**Conventions:**
- Memoize components that render frequently
- Use `useCallback` for callbacks passed to memoized children
- Use `useMemo` only for expensive computations (parsing, sorting, filtering)

### List Rendering

```tsx
// ✅ Good: Unique, stable keys
<FlatList
  data={lessons}
  keyExtractor={(lesson) => lesson.id}
  renderItem={({ item }) => <LessonItem lesson={item} />}
  removeClippedSubviews
/>

// ❌ Bad: Index keys (cause bugs when list changes)
<FlatList
  data={lessons}
  keyExtractor={(_, index) => String(index)}
/>
```

**Convention:** Use stable, unique IDs as keys (not indices)

## Testing Conventions (When Applicable)

### Component Tests

```tsx
import { render, screen, fireEvent } from '@testing-library/react-native';
import { MultipleChoiceMode } from './MultipleChoiceMode';

describe('MultipleChoiceMode', () => {
  it('should display all answer options', () => {
    const question = { options: ['A', 'B', 'C'] };
    render(<MultipleChoiceMode question={question} />);

    expect(screen.getByText('A')).toBeVisible();
    expect(screen.getByText('B')).toBeVisible();
    expect(screen.getByText('C')).toBeVisible();
  });

  it('should call onAnswer when option selected', () => {
    const onAnswer = jest.fn();
    render(<MultipleChoiceMode question={question} onAnswer={onAnswer} />);

    fireEvent.press(screen.getByText('B'));
    expect(onAnswer).toHaveBeenCalledWith('B');
  });
});
```

**Convention:** Arrange-Act-Assert (AAA) pattern, test behavior not implementation

## Build & Lint

### Linting

```bash
npm run lint
```

Enforces:
- Expo ESLint recommended rules
- TypeScript strict mode
- No unused variables
- Consistent naming

### Pre-commit Checks

Before committing:
```bash
npm run lint  # Must pass
npx tsc --noEmit  # TypeScript compile check
```

## Accessibility Standards

### Component Accessibility

```tsx
<Pressable
  accessible={true}
  accessibilityLabel="Play audio pronunciation"
  accessibilityHint="Double tap to hear correct pronunciation"
  onPress={playAudio}
>
  <Text>Play</Text>
</Pressable>
```

**Convention:**
- `accessible={true}` for interactive components
- `accessibilityLabel` describes action
- `accessibilityHint` provides additional context

## Summary of Key Principles

1. **Type Safety:** Strict TypeScript, explicit types, no `any`
2. **Component Isolation:** One component per file, clear props interface
3. **State Management:** React Context for global, AsyncStorage for persistence, component state for UI
4. **Error Handling:** Try-catch + user feedback for all async operations
5. **Styling:** StyleSheet + RFValue for responsive, theme constants for colors
6. **Logging:** Feature-prefixed logs for debuggability
7. **Performance:** Memoization, stable list keys, efficient storage access
8. **Readability:** Clear naming, JSDoc for public APIs, "why" comments

---

**Document Status:** Current
**Last Updated:** March 2026
**Owner:** Engineering Team
