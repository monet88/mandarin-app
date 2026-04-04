# CONCERNS

## Technical Debt & Complex Areas
- **Large Orchestrators:** `components/lesson/LessonContent.tsx` is an exceptionally dense component (approximately 810 lines of code) orchestrating varied UI states (Flashcard, AudioPrompt, FeedbackView). It may present maintainability challenges and is a prime candidate for refactoring.
- **State Synchronization:** The dual-pronged data architecture (local `AsyncStorage` operations mirrored eventually to Supabase Edge functions via batched sync `hsk-sync-events`) requires careful conflict resolution logic and risks desyncs if the user goes offline permanently or clears app data unexpectedly.

## Security Dependencies
- **Edge Function Latency:** Operations bound fundamentally by OpenRouter LLM roundtrips introduce potential UX stutter paths, requiring robust optimistic loading states in features like `chat-completion`. 
- **Legacy Billing Code:** While the app has moved to authoritative `RevenueCat` webhooks, legacy manual trial flows (`start-trial` cloud functions) are still preserved. This bifurcated premium assignment mechanism presents an exploitable edge case if both paths try to concurrently adjust an expiration date.

## Platform and Build
- Dependencies are numerous due to heavy use of `expo-*` modules. Upgrading Expo versions will require an extensive, holistic regression testing strategy, particularly evaluating sensitive media/audio player libraries (`expo-audio`, `expo-speech`) natively across both iOS and Android.
