# MycoHub

Field app for recording fungal collections with Darwin Core terms. Records are
saved on the device first (IndexedDB) and synced to Firebase when signed in.
Runs as a web app/PWA and as an Android app via Capacitor.

## Quick start

```bash
npm ci
cp .env.example .env      # fill in the Web app config (see "Firebase setup")
npm run dev
```

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Typecheck and production build to `dist/` |
| `npm run build:standalone` | Single self-contained `dist-standalone/mycohub.html` |
| `npm run lint` | ESLint |
| `npm test` | Unit tests (Vitest) |
| `npm run test:rules` | Firestore and Storage security-rules tests against the emulators (needs Java 21) |
| `npm run test:e2e` | End-to-end tests (Playwright) against the production build; run `npm run build` first |
| `npm run emulators` | Local Auth, Firestore and Storage emulators. Use with `VITE_USE_EMULATORS=true npm run dev` |
| `npm run deploy:rules` | Deploy `firestore.rules` and `storage.rules` to the Firebase project |
| `npm run set-role -- <uid-or-email> <ROLE>` | Give a user a role (see below) |
| `npm run android:sync` | Build and copy into the Android project |

CI (`.github/workflows/ci.yml`) runs lint, typecheck, unit, rules and e2e tests on
every push and PR. It also builds a debug APK, which you can download from the run's
**Artifacts** section as `mycohub-debug-apk`.

## Security model

- **Roles** (`COLLECTOR` < `IDENTIFIER` < `CURATOR` < `ADMIN`) come only from Firebase
  Auth custom claims. The app reads them from the ID token, and the rules check
  `request.auth.token.role`. The `role` field on `users/{uid}` is for display only. A user
  can create their profile only as `COLLECTOR`, and can never change the role.
- **Observations**: any signed-in user can read them. Users can only create their own,
  always as `UNVERIFIED`, and fields are validated (allow-listed keys, coordinate ranges,
  server timestamps). Owners can edit the content but not the status. Identifiers can change
  only the status. Owners or curators can delete.
- **Photos**: stored at `observations/{uid}/{recordId}/…`. Only the owner can write there,
  images only, under 10 MB.
- Everything else is denied. `tests/rules/` covers each rule.

### Assigning a role

1. Firebase console → Project settings → Service accounts → **Generate new private key**.
   Save it as `service-account.json`, which git ignores. Never commit it.
2. Run:
   ```bash
   GOOGLE_APPLICATION_CREDENTIALS=service-account.json npm run set-role -- someone@example.org IDENTIFIER
   ```
3. The user signs out and back in to pick up the role.

## Firebase setup (one-time, in the console)

1. **Register a Web app** (Project settings → Your apps → Add app → Web). Put its config in
   `.env`. The built-in fallback uses the Android app ID, which is wrong for web builds.
2. **Authentication → Sign-in method**: enable Google, and Anonymous if you want guest
   sign-in. Under **Settings → Authorized domains**, add every domain the web app is
   served from.
3. **Deploy the rules**: `npx firebase login`, then `npm run deploy:rules`. Until you do
   this, the live project keeps whatever rules it has now.
4. **Android Google sign-in**: add your signing key's SHA-1 to the Android app in Project
   settings, then download the new `google-services.json` into `android/app/`.
   - Debug key: `keytool -list -v -alias androiddebugkey -keystore ~/.android/debug.keystore -storepass android`
   - The APK built by CI is signed with that runner's own throwaway debug key, so Google
     sign-in only works in it if you register that key too. For real use, set up a release
     keystore.

## Android

Google sign-in on Android uses `@capacitor-firebase/authentication`. It signs in natively,
then passes the Google ID token to the Firebase JS SDK (`skipNativeAuth: true` in
`capacitor.config.ts`), because pop-up sign-in doesn't work in the Android WebView.

```bash
npm run android:sync
cd android && ./gradlew assembleDebug   # needs JDK 17 and the Android SDK
```
