import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // Интеграционные тесты живут в `tests/integration/` и запускаются отдельной конфигурацией
    // `vitest.integration.config.ts` (см. скрипт `test:integration`). Здесь явно исключаем
    // их из обычного `npm test`, чтобы не подмешивать долгие сценарии с реальным Chromium.
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      'tests/e2e/**',
      'tests/integration/**',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/**/__fixtures__/**'],
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
})
