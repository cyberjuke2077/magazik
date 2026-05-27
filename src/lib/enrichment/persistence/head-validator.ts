/**
 * Head Validator Module
 *
 * Validates URLs by performing HTTP HEAD requests to check availability
 * and content type. Used to filter out broken image and datasheet URLs
 * before persisting them to the database.
 */

/** Timeout for each HEAD request (ms) */
const HEAD_TIMEOUT_MS = 10_000

/** Maximum concurrent HEAD requests */
const MAX_CONCURRENCY = 10

/**
 * Performs an HTTP HEAD request with timeout.
 * Returns the response status and content-type, or null on failure.
 */
async function headRequest(url: string): Promise<{ status: number; contentType: string } | null> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), HEAD_TIMEOUT_MS)

    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      redirect: 'follow',
    })

    clearTimeout(timeout)

    return {
      status: response.status,
      contentType: response.headers.get('content-type') || '',
    }
  } catch {
    return null
  }
}

/**
 * Processes URLs in batches with limited concurrency.
 * Uses Promise.allSettled to handle individual failures gracefully.
 */
async function filterUrls(
  urls: string[],
  isValid: (result: { status: number; contentType: string }) => boolean,
): Promise<string[]> {
  const valid: string[] = []

  // Process in chunks of MAX_CONCURRENCY
  for (let i = 0; i < urls.length; i += MAX_CONCURRENCY) {
    const chunk = urls.slice(i, i + MAX_CONCURRENCY)

    const results = await Promise.allSettled(
      chunk.map(async (url) => {
        const result = await headRequest(url)
        return { url, result }
      }),
    )

    for (const settled of results) {
      if (settled.status === 'fulfilled') {
        const { url, result } = settled.value
        if (result && isValid(result)) {
          valid.push(url)
        }
      }
    }
  }

  return valid
}

/**
 * Filters image URLs by performing HTTP HEAD requests.
 * Keeps only URLs that return status 200 with Content-Type starting with `image/`.
 *
 * @param urls - Array of image URLs to validate
 * @returns Array of valid image URLs (status 200 + image/* content type)
 */
export async function filterImageUrls(urls: string[]): Promise<string[]> {
  return filterUrls(urls, (result) =>
    result.status === 200 && result.contentType.toLowerCase().startsWith('image/'),
  )
}

/**
 * Filters datasheet URLs by performing HTTP HEAD requests.
 * Keeps only URLs that return status 200 with Content-Type `application/pdf`.
 *
 * @param urls - Array of datasheet URLs to validate
 * @returns Array of valid datasheet URLs (status 200 + application/pdf content type)
 */
export async function filterDatasheetUrls(urls: string[]): Promise<string[]> {
  return filterUrls(urls, (result) =>
    result.status === 200 && result.contentType.toLowerCase().startsWith('application/pdf'),
  )
}
