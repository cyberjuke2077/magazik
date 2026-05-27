import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

// Изолированная конфигурация для интеграционных тестов (тэг @integration).
// Запускается только через `pnpm test:integration`, чтобы не подмешиваться в обычный `pnpm test`.
export default defineConfig({
  test: {
    name: '@integration',
    globals: true,
    environment: 'node',
    include: ['tests/integration/**/*.test.ts'],
    // Интеграционные сценарии могут спавнить child-процессы и реальный Chromium —
    // даём щедрый таймаут, не параллелим, не ретраим.
    testTimeout: 120_000,
    hookTimeout: 120_000,
    fileParallelism: false,
    pool: 'forks',
    retry: 0,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
})
