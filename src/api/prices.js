// ---------------------------------------------------------------------------
// Price fetcher
//
// Two modes controlled by VITE_USE_MOCK_PRICES in .env.local:
//
//   VITE_USE_MOCK_PRICES=true   → returns base price + Gaussian noise (no API calls)
//   VITE_USE_MOCK_PRICES=false  → hits Finnhub via the Vite proxy
//
// Both modes share the same module-level cache (5 min TTL) so prices
// don't change on every re-render.
// ---------------------------------------------------------------------------

const USE_MOCK       = import.meta.env.VITE_USE_MOCK_PRICES === 'true'
const FINNHUB_TOKEN  = import.meta.env.VITE_FINNHUB_TOKEN ?? ''
const CACHE_TTL_MS   = 300_000   // 300 seconds (5 minutes)

/** @type {Map<string, { price: number, ts: number }>} */
const cache = new Map()

// ── Mock price base values (approximate April 2026 prices) ──────────────────
const MOCK_BASE = {
  AAPL: 202,  AMGN: 268,  AMZN: 188,  AXP:  271,  BA:   174,
  CAT:  348,  CRM:  282,  CSCO:  54,  CVX:  153,  DIS:   93,
  GS:   524,  HD:   371,  HON:  204,  IBM:  231,  JNJ:  154,
  JPM:  241,  KO:    70,  MCD:  299,  MMM:  131,  MRK:   84,
  MSFT: 388,  NKE:   74,  NVDA: 855,  PG:   164,  SHW:  328,
  TRV:  244,  UNH:  491,  V:    331,  VZ:    43,  WMT:   96,
}

function gaussian(mean, std) {
  const u1 = Math.random()
  const u2 = Math.random()
  const z  = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
  return z * std + mean
}

function mockPrice(symbol) {
  const base = MOCK_BASE[symbol]
  if (!base) throw new Error(`No mock base price for ${symbol}`)
  return Math.max(0.01, base + gaussian(0, base * 0.008))
}

export async function fetchPrice(symbol) {
  const key = symbol.toUpperCase()
  const now  = Date.now()
  const hit  = cache.get(key)

  if (hit && now - hit.ts < CACHE_TTL_MS) return hit.price

  const price = USE_MOCK ? mockPrice(key) : await fetchFromFinnhub(key)
  cache.set(key, { price, ts: now })
  return price
}

export async function fetchPrices(symbols) {
  const results = await Promise.allSettled(
    symbols.map(async s => ({ symbol: s.toUpperCase(), price: await fetchPrice(s) }))
  )
  const map = {}
  for (const r of results) {
    if (r.status === 'fulfilled') map[r.value.symbol] = r.value.price
  }
  return map
}

async function fetchFromFinnhub(symbol) {
  const url = `/api/finnhub/api/v1/quote?symbol=${symbol}&token=${FINNHUB_TOKEN}`
  const res  = await fetch(url)
  if (!res.ok) throw new Error(`Finnhub ${res.status} for ${symbol}`)
  const data  = await res.json()
  const price = data.c > 0 ? data.c : data.pc
  if (!price || price <= 0) throw new Error(`No price data returned for ${symbol}`)
  return price
}