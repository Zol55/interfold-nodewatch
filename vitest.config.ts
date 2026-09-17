import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
    coverage: {
      reporter: ['text', 'lcov'],
      include: ['src/core/**', 'src/chain/**'],
    },
  },
});
