import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['packages/**/test/**/*.spec.ts', 'tools/**/test/**/*.spec.ts', 'apps/**/test/**/*.spec.ts'],
    environment: 'node',
  },
  resolve: {
    alias: {
      '@hangyeol/shared': new URL('./packages/shared/src/index.ts', import.meta.url).pathname,
      '@hangyeol/billing': new URL('./packages/billing/src/index.ts', import.meta.url).pathname,
      '@hangyeol/core': new URL('./packages/core/src/index.ts', import.meta.url).pathname,
      '@hangyeol/content': new URL('./packages/content/src/index.ts', import.meta.url).pathname,
      '@hangyeol/langgate': new URL('./tools/langgate/src/index.ts', import.meta.url).pathname,
    },
  },
});
