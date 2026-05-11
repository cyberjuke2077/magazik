/**
 * Proxy Types
 * 
 * Type definitions for proxy management system.
 */

export interface ProxyConfig {
  host: string
  port: number
  username: string
  password: string
}

export interface ProxyStats {
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  lastUsed: number | null
  lastError: string | null
  isHealthy: boolean
}

export interface ProxyWithStats {
  config: ProxyConfig
  stats: ProxyStats
}

export interface ProxyManagerConfig {
  healthCheckUrl?: string
  healthCheckTimeoutMs?: number
  maxFailuresBeforeRemoval?: number
  rotationStrategy?: 'round-robin' | 'random' | 'least-used'
}

export interface ProxyManager {
  getNext: () => ProxyConfig | null
  markSuccess: (proxy: ProxyConfig) => void
  markFailure: (proxy: ProxyConfig, error: string) => void
  getStats: () => ProxyWithStats[]
  getHealthyCount: () => number
  getTotalCount: () => number
}

export interface ParseResult<T> {
  success: boolean
  data?: T
  error?: string
}
