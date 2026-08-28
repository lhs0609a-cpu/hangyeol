import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['packages/**/test/**/*.spec.ts'],
    environment: 'node',
  },
  resolve: {
    alias: {
      '@hangyeol/shared': new URL('./packages/shared/src/index.ts', import.meta.url).pathname,
      '@hangyeol/billing': new URL('./packages/billing/src/index.ts', import.meta.url).pathname,
    },
  },
});
