import { defineConfig } from 'vitest/config';

// Run via `npm run test:sync`: the real sync engine against the Auth, Firestore
// and Storage emulators, with IndexedDB provided by fake-indexeddb.
export default defineConfig({
  test: {
    include: ['tests/sync/**/*.test.js'],
    environment: 'node',
    setupFiles: ['fake-indexeddb/auto'],
    env: {
      VITE_USE_EMULATORS: 'true',
      VITE_FIREBASE_PROJECT_ID: 'demo-mycohub',
      VITE_FIREBASE_STORAGE_BUCKET: 'demo-mycohub.appspot.com',
    },
    testTimeout: 60000,
    hookTimeout: 60000,
    fileParallelism: false,
  },
});
