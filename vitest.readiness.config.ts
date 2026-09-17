import { defineConfig } from 'vitest/config'
import { resolve } from 'node:path'
export default defineConfig({
  test: { include: ['tests/integration/readiness.test.ts'], testTimeout: 15000, fileParallelism: false },
  resolve: { alias: { '@': resolve(__dirname, './src') } },
})
