import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'jsdom',
    environmentOptions: {
      jsdom: { url: 'https://www.warcraftlogs.com/reports/AbC123?fight=1' },
    },
  },
});
