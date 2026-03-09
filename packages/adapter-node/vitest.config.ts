import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@og-engine/types': resolve(__dirname, '../types/src/index.ts')
    }
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts']
  }
});
