/**
 * Proxy Manager Module
 * 
 * Manages proxy rotation, health tracking, and statistics.
 * Uses pure functions and dependency injection pattern.
 * 
 * Features:
 * - Multiple rotation strategies (round-robin, random, least-used)
 * - Health tracking per proxy
 * - Automatic removal of unhealthy proxies
 * - Statistics tracking (requests, failures, last used)
 * - Thread-safe proxy selection
 */

import {
  type ProxyConfig,
  type ProxyWithStats,
  type ProxyManagerConfig,
  type ProxyManager,
} from './types'

const DEFAULT_CONFIG: Required<ProxyManagerConfig> = {
  healthCheckUrl: 'https://www.chipdip.ru',
  healthCheckTimeoutMs: 10000,
  maxFailuresBeforeRemoval: 3,
  rotationStrategy: 'round-robin',
}

/**
 * Creates proxy manager with rotation and health tracking
 * 
 * @param proxies - Array of proxy configurations
 * @param config - Manager configuration
 * @returns ProxyManager instance
 */
export function createProxyManager(
  proxies: ProxyConfig[],
  config: ProxyManagerConfig = {}
): ProxyManager {
  const fullConfig = { ...DEFAULT_CONFIG, ...config }
  
  // Initialize proxy stats
  const proxyMap = new Map<string, ProxyWithStats>()
  
  proxies.forEach(proxy => {
    const key = getProxyKey(proxy)
    proxyMap.set(key, {
      config: proxy,
      stats: {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        lastUsed: null,
        lastError: null,
        isHealthy: true,
      },
    })
  })
  
  let currentIndex = 0
  
  /**
   * Generates unique key for proxy
   */
  function getProxyKey(proxy: ProxyConfig): string {
    return `${proxy.host}:${proxy.port}:${proxy.username}`
  }
  
  /**
   * Gets healthy proxies only
   */
  function getHealthyProxies(): ProxyWithStats[] {
    return Array.from(proxyMap.values()).filter(p => p.stats.isHealthy)
  }
  
  /**
   * Round-robin strategy
   */
  function getNextRoundRobin(): ProxyConfig | null {
    const healthy = getHealthyProxies()
    if (healthy.length === 0) return null
    
    const proxy = healthy[currentIndex % healthy.length]
    currentIndex = (currentIndex + 1) % healthy.length
    
    return proxy.config
  }
  
  /**
   * Random strategy
   */
  function getNextRandom(): ProxyConfig | null {
    const healthy = getHealthyProxies()
    if (healthy.length === 0) return null
    
    const randomIndex = Math.floor(Math.random() * healthy.length)
    return healthy[randomIndex].config
  }
  
  /**
   * Least-used strategy (proxy with fewest total requests)
   */
  function getNextLeastUsed(): ProxyConfig | null {
    const healthy = getHealthyProxies()
    if (healthy.length === 0) return null
    
    const sorted = healthy.sort((a, b) => 
      a.stats.totalRequests - b.stats.totalRequests
    )
    
    return sorted[0].config
  }
  
  /**
   * Gets next proxy based on rotation strategy
   */
  function getNext(): ProxyConfig | null {
    switch (fullConfig.rotationStrategy) {
      case 'round-robin':
        return getNextRoundRobin()
      case 'random':
        return getNextRandom()
      case 'least-used':
        return getNextLeastUsed()
      default:
        return getNextRoundRobin()
    }
  }
  
  /**
   * Marks proxy as successful
   */
  function markSuccess(proxy: ProxyConfig): void {
    const key = getProxyKey(proxy)
    const proxyWithStats = proxyMap.get(key)
    
    if (!proxyWithStats) return
    
    proxyWithStats.stats.totalRequests++
    proxyWithStats.stats.successfulRequests++
    proxyWithStats.stats.lastUsed = Date.now()
    proxyWithStats.stats.lastError = null
  }
  
  /**
   * Marks proxy as failed
   */
  function markFailure(proxy: ProxyConfig, error: string): void {
    const key = getProxyKey(proxy)
    const proxyWithStats = proxyMap.get(key)
    
    if (!proxyWithStats) return
    
    proxyWithStats.stats.totalRequests++
    proxyWithStats.stats.failedRequests++
    proxyWithStats.stats.lastUsed = Date.now()
    proxyWithStats.stats.lastError = error
    
    // Mark as unhealthy if too many failures
    if (proxyWithStats.stats.failedRequests >= fullConfig.maxFailuresBeforeRemoval) {
      proxyWithStats.stats.isHealthy = false
      console.warn(
        `Proxy ${proxy.host}:${proxy.port} marked as unhealthy after ${proxyWithStats.stats.failedRequests} failures`
      )
    }
  }
  
  /**
   * Gets all proxy statistics
   */
  function getStats(): ProxyWithStats[] {
    return Array.from(proxyMap.values())
  }
  
  /**
   * Gets count of healthy proxies
   */
  function getHealthyCount(): number {
    return getHealthyProxies().length
  }
  
  /**
   * Gets total proxy count
   */
  function getTotalCount(): number {
    return proxyMap.size
  }
  
  return {
    getNext,
    markSuccess,
    markFailure,
    getStats,
    getHealthyCount,
    getTotalCount,
  }
}

/**
 * Formats proxy config to URL string
 * 
 * @param proxy - Proxy configuration
 * @returns Proxy URL string (http://user:pass@host:port)
 */
export function formatProxyUrl(proxy: ProxyConfig): string {
  return `http://${proxy.username}:${proxy.password}@${proxy.host}:${proxy.port}`
}

/**
 * Parses proxy from Webshare format (host:port:username:password)
 * 
 * @param line - Proxy line in Webshare format
 * @returns ProxyConfig or null if invalid
 */
export function parseWebshareProxy(line: string): ProxyConfig | null {
  const parts = line.trim().split(':')
  
  if (parts.length !== 4) return null
  
  const [host, portStr, username, password] = parts
  const port = parseInt(portStr, 10)
  
  if (!host || isNaN(port) || !username || !password) return null
  
  return {
    host,
    port,
    username,
    password,
  }
}

/**
 * Loads proxies from Webshare format file content
 * 
 * @param content - File content with one proxy per line
 * @returns Array of proxy configurations
 */
export function loadWebshareProxies(content: string): ProxyConfig[] {
  return content
    .split('\n')
    .map(line => parseWebshareProxy(line))
    .filter((proxy): proxy is ProxyConfig => proxy !== null)
}
