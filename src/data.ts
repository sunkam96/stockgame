// Timestamp will be firebase/firestore.Timestamp once Firebase is wired up.
// For now we alias it to Date so mock data works without a live Firebase connection.
import { Timestamp } from 'firebase/firestore'
export type { Timestamp }

// ---------------------------------------------------------------------------
// Firestore collection layout
//
//   /users/{userId}                         ← user profile
//   /portfolios/{portfolioId}               ← one portfolio per document
//   /portfolios/{portfolioId}/transactions  ← subcollection of trades
//
// Holdings are stored as a map on the portfolio document rather than a
// subcollection. This keeps the portfolio readable in a single Firestore
// fetch and avoids extra reads just to display the holdings table.
// ---------------------------------------------------------------------------


// ---------------------------------------------------------------------------
// User
// Stored at: /users/{userId}
// ---------------------------------------------------------------------------

export interface User {
  userId: string        // matches Firebase Auth uid
  displayName: string
  email: string
  createdAt: Timestamp
}


// ---------------------------------------------------------------------------
// Holding
// Not a top-level collection — stored as a map inside Portfolio:
//   portfolio.holdings[symbol] = Holding
//
// Recomputed on every buy/sell and written back to the portfolio document.
// ---------------------------------------------------------------------------

export interface Holding {
  symbol: string        // e.g. "AAPL"
  companyName: string   // e.g. "Apple Inc."
  shares: number        // total shares currently held (always > 0)
  avgCost: number       // average cost per share across all buys
}


// ---------------------------------------------------------------------------
// Transaction
// Stored at: /portfolios/{portfolioId}/transactions/{transactionId}
// ---------------------------------------------------------------------------

export type TransactionType = 'buy' | 'sell'

export interface Transaction {
  transactionId: string       // Firestore document ID
  portfolioId: string         // parent portfolio
  type: TransactionType
  symbol: string              // e.g. "AAPL"
  companyName: string         // e.g. "Apple Inc."
  shares: number              // number of shares traded
  pricePerShare: number       // market price at time of execution
  total: number               // shares * pricePerShare
  executedAt: Timestamp
}


// ---------------------------------------------------------------------------
// Portfolio
// Stored at: /portfolios/{portfolioId}
// ---------------------------------------------------------------------------

export interface Portfolio {
  portfolioId: string         // Firestore document ID
  ownerId: string             // matches User.userId
  name: string                // display name, e.g. "My Portfolio"
  startBalance: number        // initial cash granted, e.g. 10000
  cash: number                // current available cash (updated on each trade)
  holdings: Record<string, Holding>  // keyed by symbol, e.g. { AAPL: Holding }
  createdAt: Timestamp
}


// ---------------------------------------------------------------------------
// Derived / computed values
// These are never stored in Firestore — calculated on the client from
// the portfolio + current market prices.
// ---------------------------------------------------------------------------

export interface HoldingWithMetrics extends Holding {
  currentPrice: number        // latest price fetched from Yahoo Finance
  marketValue: number         // shares * currentPrice
  costBasis: number           // shares * avgCost
  unrealizedPL: number        // marketValue - costBasis
  unrealizedPLPct: number     // (unrealizedPL / costBasis) * 100
}

export interface PortfolioMetrics {
  totalValue: number          // marketValue of all holdings + cash
  totalInvested: number       // sum of all holdings' marketValue
  totalCostBasis: number      // sum of all holdings' costBasis
  totalUnrealizedPL: number   // totalInvested - totalCostBasis
  totalUnrealizedPLPct: number
}


// ---------------------------------------------------------------------------
// Factory helpers
// Convenience functions for creating new objects with sensible defaults.
// Replace crypto.randomUUID() with a Firestore doc().id in practice.
// ---------------------------------------------------------------------------

export function createPortfolio(
  ownerId: string,
  name: string,
  startBalance: number = 10_000,
): Omit<Portfolio, 'portfolioId' | 'createdAt'> {
  return {
    ownerId,
    name,
    startBalance,
    cash: startBalance,
    holdings: {},
  }
}

export function createTransaction(
  portfolioId: string,
  type: TransactionType,
  symbol: string,
  companyName: string,
  shares: number,
  pricePerShare: number,
): Omit<Transaction, 'transactionId' | 'executedAt'> {
  return {
    portfolioId,
    type,
    symbol,
    companyName,
    shares,
    pricePerShare,
    total: shares * pricePerShare,
  }
}
