import { Timestamp } from 'firebase/firestore'
import type { User, Portfolio, Transaction, Holding } from './data'

// ---------------------------------------------------------------------------
// Placeholder data — matches the types in data.ts exactly.
// Swap these out for real Firestore reads once Firebase is wired up.
// ---------------------------------------------------------------------------

export const MOCK_USER: User = {
  userId: 'user_001',
  displayName: 'Sai',
  email: 'sunkam.sai@gmail.com',
  createdAt: Timestamp.fromDate(new Date('2026-03-01')),
}

const HOLDINGS: Record<string, Holding> = {
  AAPL: { symbol: 'AAPL', companyName: 'Apple Inc.',      shares: 10, avgCost: 198.20 },
  NVDA: { symbol: 'NVDA', companyName: 'NVIDIA Corp.',     shares:  2, avgCost: 820.00 },
  TSLA: { symbol: 'TSLA', companyName: 'Tesla Inc.',       shares:  8, avgCost: 195.00 },
  MSFT: { symbol: 'MSFT', companyName: 'Microsoft Corp.', shares:  4, avgCost: 400.00 },
}

export const MOCK_PORTFOLIO: Portfolio = {
  portfolioId: 'portfolio_001',
  ownerId: 'user_001',
  name: 'My Portfolio',
  startBalance: 10_000,
  cash: 1_026.00,   // 10000 - sum of all buys
  holdings: HOLDINGS,
  createdAt: Timestamp.fromDate(new Date('2026-03-20')),
}

export const MOCK_TRANSACTIONS: Transaction[] = [
  {
    transactionId: 'tx_005',
    portfolioId: 'portfolio_001',
    type: 'buy',
    symbol: 'MSFT',
    companyName: 'Microsoft Corp.',
    shares: 4,
    pricePerShare: 400.00,
    total: 1_600.00,
    executedAt: Timestamp.fromDate(new Date('2026-03-25T10:14:00')),
  },
  {
    transactionId: 'tx_004',
    portfolioId: 'portfolio_001',
    type: 'sell',
    symbol: 'TSLA',
    companyName: 'Tesla Inc.',
    shares: 2,
    pricePerShare: 201.30,
    total: 402.60,
    executedAt: Timestamp.fromDate(new Date('2026-03-24T14:02:00')),
  },
  {
    transactionId: 'tx_003',
    portfolioId: 'portfolio_001',
    type: 'buy',
    symbol: 'TSLA',
    companyName: 'Tesla Inc.',
    shares: 10,
    pricePerShare: 195.00,
    total: 1_950.00,
    executedAt: Timestamp.fromDate(new Date('2026-03-24T09:47:00')),
  },
  {
    transactionId: 'tx_002',
    portfolioId: 'portfolio_001',
    type: 'buy',
    symbol: 'NVDA',
    companyName: 'NVIDIA Corp.',
    shares: 2,
    pricePerShare: 820.00,
    total: 1_640.00,
    executedAt: Timestamp.fromDate(new Date('2026-03-22T11:30:00')),
  },
  {
    transactionId: 'tx_001',
    portfolioId: 'portfolio_001',
    type: 'buy',
    symbol: 'AAPL',
    companyName: 'Apple Inc.',
    shares: 10,
    pricePerShare: 198.20,
    total: 1_982.00,
    executedAt: Timestamp.fromDate(new Date('2026-03-20T15:55:00')),
  },
]
