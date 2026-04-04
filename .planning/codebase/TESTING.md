# TESTING

## Current Testing Environment
- At present, explicit testing library configurations (like Jest or React Native Testing Library) do not have a prominent footprint in the core `package.json` scripts (`"test": "..."` is absent).
- Much of the testing appears to be functional and reliant on the `scripts/` directory for discrete execution verifications.
- Script tests include: `scripts/parse-hsk-data.ts` to validate the ingestion format of HSK vocabulary.
- The project primarily favors Expo's native development client (`expo-dev-client`) and local running (`expo start`) for end-to-end manual validation during development.

## Quality Assurance Gateways
- **Linting:** Standard ES linting is executed via `"lint": "expo lint"`, following `eslint-config-expo` rules.
- **Type Checking:** Standard `tsc` is heavily relied upon to catch data consistency issues between expected API outputs and the static JSON schema structure defined for course chapters.
- **State Testing:** Relying largely on strict TypeScript schemas defined for AsyncStorage (lib/lessonProgress.ts, etc) to ensure schema safety throughout the app evolution.
