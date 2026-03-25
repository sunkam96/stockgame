// ---------------------------------------------------------------------------
// Price stub — chunk 1
// Returns hardcoded prices so trade logic can be built and tested without
// a live API. Replace getPrice() with a real fetch in chunk 2.
// ---------------------------------------------------------------------------

const MOCK_PRICES = {
  AAPL:  213.50,
  AMGN:  266.20,
  AMZN:  198.40,
  AXP:   238.90,
  BA:    172.30,
  CAT:   347.80,
  CRM:   282.60,
  CSCO:   56.40,
  CVX:   152.70,
  DIS:    96.10,
  GS:    498.30,
  HD:    362.40,
  HON:   208.50,
  IBM:   226.80,
  JNJ:   155.60,
  JPM:   231.40,
  KO:     67.90,
  MCD:   281.20,
  MMM:   130.50,
  MRK:    96.80,
  MSFT:  407.20,
  NKE:    74.30,
  NVDA:  875.20,
  PG:    166.40,
  SHW:   324.60,
  TRV:   238.10,
  UNH:   511.30,
  V:     285.30,
  VZ:     40.20,
  WMT:    96.40,
}

/**
 * Returns the current price for a DJIA symbol.
 * Chunk 2 will replace this with a live Yahoo Finance fetch.
 *
 * @param {string} symbol
 * @returns {number}
 */
export function getPrice(symbol) {
  const price = MOCK_PRICES[symbol.toUpperCase()]
  if (price === undefined) throw new Error(`${symbol} is not a supported DJIA stock`)
  return price
}
