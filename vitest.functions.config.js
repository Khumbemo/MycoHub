import { defineConfig } from 'vitest/config';

// Run via `npm run test:functions`, which starts the Firestore, Auth and Functions emulators.
export default defineConfig({
  test: {
    include: ['tests/functions/**/*.test.js'],
    environment: 'node',
    testTimeout: 60000,
    hookTimeout: 60000,
    fileParallelism: false,
  },
});
