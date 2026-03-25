// ---------------------------------------------------------------------------
// Dow Jones Industrial Average — 30 components
// This is the only set of stocks available to trade in the game.
// Last updated: March 2026
// ---------------------------------------------------------------------------

export interface StockInfo {
  symbol: string
  companyName: string
  sector: string
}

export const DJIA_30: StockInfo[] = [
  { symbol: 'AAPL', companyName: 'Apple Inc.',                      sector: 'Technology' },
  { symbol: 'AMGN', companyName: 'Amgen Inc.',                      sector: 'Healthcare' },
  { symbol: 'AMZN', companyName: 'Amazon.com Inc.',                  sector: 'Consumer Discretionary' },
  { symbol: 'AXP',  companyName: 'American Express Co.',             sector: 'Financials' },
  { symbol: 'BA',   companyName: 'Boeing Co.',                       sector: 'Industrials' },
  { symbol: 'CAT',  companyName: 'Caterpillar Inc.',                 sector: 'Industrials' },
  { symbol: 'CRM',  companyName: 'Salesforce Inc.',                  sector: 'Technology' },
  { symbol: 'CSCO', companyName: 'Cisco Systems Inc.',               sector: 'Technology' },
  { symbol: 'CVX',  companyName: 'Chevron Corp.',                    sector: 'Energy' },
  { symbol: 'DIS',  companyName: 'The Walt Disney Co.',              sector: 'Communication Services' },
  { symbol: 'GS',   companyName: 'Goldman Sachs Group Inc.',         sector: 'Financials' },
  { symbol: 'HD',   companyName: 'Home Depot Inc.',                  sector: 'Consumer Discretionary' },
  { symbol: 'HON',  companyName: 'Honeywell International Inc.',     sector: 'Industrials' },
  { symbol: 'IBM',  companyName: 'IBM Corp.',                        sector: 'Technology' },
  { symbol: 'JNJ',  companyName: 'Johnson & Johnson',                sector: 'Healthcare' },
  { symbol: 'JPM',  companyName: 'JPMorgan Chase & Co.',             sector: 'Financials' },
  { symbol: 'KO',   companyName: 'Coca-Cola Co.',                    sector: 'Consumer Staples' },
  { symbol: 'MCD',  companyName: "McDonald's Corp.",                 sector: 'Consumer Discretionary' },
  { symbol: 'MMM',  companyName: '3M Co.',                           sector: 'Industrials' },
  { symbol: 'MRK',  companyName: 'Merck & Co. Inc.',                 sector: 'Healthcare' },
  { symbol: 'MSFT', companyName: 'Microsoft Corp.',                  sector: 'Technology' },
  { symbol: 'NKE',  companyName: 'Nike Inc.',                        sector: 'Consumer Discretionary' },
  { symbol: 'NVDA', companyName: 'NVIDIA Corp.',                     sector: 'Technology' },
  { symbol: 'PG',   companyName: 'Procter & Gamble Co.',             sector: 'Consumer Staples' },
  { symbol: 'SHW',  companyName: 'Sherwin-Williams Co.',             sector: 'Materials' },
  { symbol: 'TRV',  companyName: 'Travelers Companies Inc.',         sector: 'Financials' },
  { symbol: 'UNH',  companyName: 'UnitedHealth Group Inc.',          sector: 'Healthcare' },
  { symbol: 'V',    companyName: 'Visa Inc.',                        sector: 'Financials' },
  { symbol: 'VZ',   companyName: 'Verizon Communications Inc.',      sector: 'Communication Services' },
  { symbol: 'WMT',  companyName: 'Walmart Inc.',                     sector: 'Consumer Staples' },
]

// Keyed by symbol for O(1) lookups
export const DJIA_BY_SYMBOL: Record<string, StockInfo> = Object.fromEntries(
  DJIA_30.map(s => [s.symbol, s])
)

// Just the symbols, useful for validation
export const DJIA_SYMBOLS = new Set(DJIA_30.map(s => s.symbol))

// Check whether a given symbol is a valid DJIA stock
export function isDJIAStock(symbol: string): boolean {
  return DJIA_SYMBOLS.has(symbol.toUpperCase())
}
