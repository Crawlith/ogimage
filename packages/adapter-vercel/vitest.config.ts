import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@og-engine/adapter-node': resolve(__dirname, '../adapter-node/src/index.ts'),
      '@og-engine/types': resolve(__dirname, '../types/src/index.ts')
    }
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts']
  }
});
