import { defineConfig } from 'vitest/config';

// Run via `npm run test:rules`, which starts the Firestore and Storage emulators.
export default defineConfig({
  test: {
    include: ['tests/rules/**/*.test.js'],
    environment: 'node',
    testTimeout: 20000,
    hookTimeout: 30000,
    fileParallelism: false,
  },
});
