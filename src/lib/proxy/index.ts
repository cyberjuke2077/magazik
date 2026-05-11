/**
 * Proxy Module
 * 
 * Exports proxy management functionality.
 */

export {
  createProxyManager,
  formatProxyUrl,
  parseWebshareProxy,
  loadWebshareProxies,
} from './proxy-manager'

export type {
  ProxyConfig,
  ProxyStats,
  ProxyWithStats,
  ProxyManagerConfig,
  ProxyManager,
  ParseResult,
} from './types'
