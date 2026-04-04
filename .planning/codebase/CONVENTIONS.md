# CONVENTIONS

## Code Style
- **TypeScript Strictness:** Strict mode is enforced. Types and interfaces are rigorously used for defining API response definitions and Supabase table rows.
- **Imports:** Consistent usage of the `@/` path alias pointing to the root of the React Native project.
- **Styling:** Adheres cleanly to standard React Native `StyleSheet.create()` methodology utilizing centralized values extracted from `constants/theme.ts`. (e.g., primary highlight `#ff4900`).

## UI / UX Patterns
- **Fonts:** Hard preference for the `EB Garamond` typeface rather than defaulting to system fonts to maintain the thematic atmosphere of the app.
- **Animations:** High priority on fluid UI. Sequential animations typically use the base React Native `Animated` API, while complex, gesture-driven transformations use `react-native-reanimated`.

## React Specifics
- **Component Size:** Components tend to be highly decoupled, except when serving as primary orchestrators like `LessonContent.tsx` which contains robust internal flow control.
- **Side Effects:** Standardized `useEffect` hooks heavily utilized for subscribing to Supabase auth state changes and deep linking events.

## Error Handling
- Async functions accessing `AsyncStorage`, SecureStore, or Supabase endpoints are strictly try-catch wrapper enclosed to gracefully handle intermittent network offline states.
