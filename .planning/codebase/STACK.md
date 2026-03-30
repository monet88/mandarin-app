# STACK

## Core Technologies
- **Framework:** React Native 0.81.5 with Expo 54.0.31
- **Router:** Expo Router 6.0.21 (file-based routing)
- **Language:** TypeScript 5.9.2
- **Backend:** Supabase via `@supabase/supabase-js` 2.90.1

## Key UI/UX Dependencies
- **Fonts:** `@expo-google-fonts/eb-garamond` (EB Garamond as key primary font)
- **Icons:** `@expo/vector-icons`
- **Animations:** `react-native-reanimated` 4.1.1, `react-native-confetti-cannon`
- **Gestures:** `react-native-gesture-handler` 2.28.0
- **Size Scaling:** `react-native-size-matters` 0.4.2
- **Toast/Alerts:** `sonner-native` 0.23.1

## Infrastructure & State
- **State Management:** React Context (specifically for Auth), no heavy external state manager like Redux/Zustand is heavily used for the overall app.
- **Local Persistence:** `@react-native-async-storage/async-storage` 2.2.0, `expo-secure-store` 15.0.8

## Media & Device APIs
- **Audio/Video:** `expo-av` 16.0.8, `expo-video` 3.0.15
- **Speech/Audio:** `expo-speech` 14.0.8
- **Haptics:** `expo-haptics` 15.0.8

## Developer Tools
- **Code Formatting/Linting:** ESLint 9.25.0 with `eslint-config-expo`
- **Monetization:** `react-native-purchases` 8.2.5 (RevenueCat)
