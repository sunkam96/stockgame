// ---------------------------------------------------------------------------
// Finnhub price fetcher — chunk 2
//
// Uses the Vite dev-server proxy at /api/finnhub so no CORS issues.
// All calls hit: GET /api/finnhub/api/v1/quote?symbol=AAPL&token=<key>
//
// Module-level cache (5 min TTL) keeps requests well under the 60 req/min free tier.
// ---------------------------------------------------------------------------

const FINNHUB_TOKEN = import.meta.env.VITE_FINNHUB_TOKEN ?? ''
const CACHE_TTL_MS  = 300_000   // 300 seconds (5 minutes)

/** @type {Map<string, { price: number, ts: number }>} */
const cache = new Map()

/**
 * Fetch the current price for a single symbol from Finnhub.
 * Returns the cached value if it is still fresh.
 *
 * @param {string} symbol  e.g. 'AAPL'
 * @returns {Promise<number>}
 */
export async function fetchPrice(symbol) {
  const key = symbol.toUpperCase()
  const now  = Date.now()
  const hit  = cache.get(key)

  if (hit && now - hit.ts < CACHE_TTL_MS) {
    return hit.price
  }

  const url = `/api/finnhub/api/v1/quote?symbol=${key}&token=${FINNHUB_TOKEN}`
  const res = await fetch(url)

  if (!res.ok) {
    throw new Error(`Finnhub ${res.status} for ${key}`)
  }

  const data = await res.json()

  // Finnhub returns { c: current, h, l, o, pc: previous close, ... }
  // Use current price (c); fall back to previous close (pc) if market is closed
  const price = data.c > 0 ? data.c : data.pc

  if (!price || price <= 0) {
    throw new Error(`No price data returned for ${key}`)
  }

  cache.set(key, { price, ts: now })
  return price
}

/**
 * Fetch prices for multiple symbols in parallel.
 * Returns a map of symbol → price; symbols that fail are omitted.
 *
 * @param {string[]} symbols
 * @returns {Promise<Record<string, number>>}
 */
export async function fetchPrices(symbols) {
  const results = await Promise.allSettled(
    symbols.map(async s => ({ symbol: s.toUpperCase(), price: await fetchPrice(s) }))
  )

  /** @type {Record<string, number>} */
  const map = {}
  for (const r of results) {
    if (r.status === 'fulfilled') {
      map[r.value.symbol] = r.value.price
    }
  }
  return map
}
