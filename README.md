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

## Code

The app is plain JavaScript (ES modules + JSX) with React 18 and Vite. There is no TypeScript.
The data model is documented as JSDoc typedefs in `src/types/index.js`, so editors such as
VS Code still show field hints. Code style is set by `.prettierrc.json`
(`npx prettier --write .`).

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Production build to `dist/` |
| `npm run build:standalone` | Single self-contained `dist-standalone/mycohub.html` |
| `npm run lint` | ESLint |
| `npm test` | Unit tests (Vitest) |
| `npm run test:rules` | Firestore and Storage security-rules tests against the emulators (needs Java 21) |
| `npm run test:sync` | The real sync engine against the Auth, Firestore and Storage emulators |
| `npm run test:functions` | The consensus Cloud Function in the Functions emulator |
| `npm run test:e2e` | End-to-end tests (Playwright) against the production build; run `npm run build` first |
| `npm run emulators` | Local Auth, Firestore and Storage emulators. Use with `VITE_USE_EMULATORS=true npm run dev` |
| `npm run deploy:rules` | Deploy `firestore.rules` and `storage.rules` to the Firebase project |
| `npm run deploy:functions` | Deploy the Cloud Functions (needs the Blaze plan) |
| `npm run set-role -- <uid-or-email> <ROLE>` | Give a user a role (see below) |
| `npm run android:sync` | Build and copy into the Android project |

CI (`.github/workflows/ci.yml`) runs lint, unit, rules, sync, Cloud Function and e2e tests on
every push and PR. It also builds a debug APK, which you can download from the run's
**Artifacts** section as `mycohub-debug-apk`.

## How sync works

Records are saved to IndexedDB first, so the app works with no signal. When you're signed in
and online, the sync engine (`src/utils/sync.js`) runs at start-up, when the device comes back
online, when the app is reopened, and every 5 minutes. Each pass:

1. Deletes server copies of records you deleted on the device.
2. Pushes new records, edits, identifications and flags. Failures retry with backoff
   (15 s, 30 s, 1 min … up to 30 min). If the server refuses a change (security rules),
   it isn't retried, and the record shows why.
3. Pulls the latest 300 records and their identifications. Local edits that haven't been
   pushed yet always win over the server copy.

Records made in an offline session move to your account the first time you sign in.
Photos are resized to at most 2048 px before they're stored.

## Identification and verification

Each person has one vote: their latest identification. The observer's original name counts
as their vote. This is modelled on iNaturalist's community taxon:

- **Community grade:** at least 2 votes, with more than ⅔ agreeing on one name.
- **Research grade:** community grade, plus an agreeing Identifier (or Curator/Admin), plus a
  date and coordinates.
- **Flagged:** set by an Identifier and never computed. It stays until someone removes it.

Names are compared exactly, ignoring case and spacing. Unlike iNaturalist, a genus-level
identification doesn't count as agreeing with a species in that genus.

The rule lives in `functions/consensus.js`, which both the app and the Cloud Function use:

- `onIdentificationWrite` recomputes the server status whenever an identification changes.
- Clients can't write `status` or `consensusTaxon` themselves.
- Until the function is deployed, the app works out the same status locally.

## Science features

- **Coordinate uncertainty** (`coordinateUncertaintyInMeters`) is filled from GPS accuracy.
  Android reports a 68% radius, so the app scales it to 95% (× 1.62) to match browsers.
- **GBIF name check** matches the name against the GBIF Backbone Taxonomy (kingdom Fungi).
  It resolves synonyms to the accepted name, suggests corrections for misspellings, and
  stores the classification and `taxonKey`.
- **Microscopy:** enter spore length × width pairs. The app reports the range, mean,
  Q = length/width per spore, Qm (the mean of the per-spore Q values) and n.
- **Research Lab** shows per-site richness S, Shannon H′, Pielou J′, Chao1 (bias-corrected),
  sampling completeness (S/Chao1), a rarefaction curve (Hurlbert 1971) and monthly phenology.
- The **Darwin Core CSV** includes taxonID, higher classification, coordinate uncertainty and
  a spore summary in `occurrenceRemarks`.

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
`capacitor.config.json`), because pop-up sign-in doesn't work in the Android WebView.

```bash
npm run android:sync
cd android && ./gradlew assembleDebug   # needs JDK 17 and the Android SDK
```
