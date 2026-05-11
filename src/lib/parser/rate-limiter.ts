/**
 * Rate Limiter Module
 * 
 * Implements rate limiting for HTTP requests to prevent overloading external servers.
 * Uses pure functions and dependency injection pattern.
 * 
 * Max rate: 1 request per second
 */

export interface RateLimiterConfig {
  requestsPerSecond: number
}

export interface RateLimiter {
  throttle: () => Promise<void>
  execute: <T>(fn: () => Promise<T>) => Promise<T>
}

/**
 * Creates a rate limiter instance
 * 
 * @param config - Configuration with requestsPerSecond limit
 * @returns RateLimiter instance with throttle and execute methods
 */
export function createRateLimiter(config: RateLimiterConfig): RateLimiter {
  const delay = 1000 / config.requestsPerSecond
  let lastRequest = 0

  /**
   * Throttles execution to respect rate limit
   * Waits if necessary before allowing next request
   */
  async function throttle(): Promise<void> {
    const now = Date.now()
    const timeSinceLastRequest = now - lastRequest

    if (timeSinceLastRequest < delay) {
      const waitTime = delay - timeSinceLastRequest
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }

    lastRequest = Date.now()
  }

  /**
   * Executes a function with rate limiting
   * 
   * @param fn - Async function to execute
   * @returns Result of the function execution
   */
  async function execute<T>(fn: () => Promise<T>): Promise<T> {
    await throttle()
    return fn()
  }

  return {
    throttle,
    execute,
  }
}
