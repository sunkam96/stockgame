import { useState } from 'react'
import { Timestamp } from 'firebase/firestore'
import './App.css'
import { MOCK_USER, MOCK_PORTFOLIO, MOCK_TRANSACTIONS } from './mockData'
import TradeModal from './components/TradeModal'

function fmt(n) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function pct(current, avgCost) {
  return ((current - avgCost) / avgCost) * 100
}

let nextTxId = MOCK_TRANSACTIONS.length + 1

export default function App() {
  const [portfolio, setPortfolio]       = useState(MOCK_PORTFOLIO)
  const [transactions, setTransactions] = useState(MOCK_TRANSACTIONS)
  const [showModal, setShowModal]       = useState(false)

  // ── Derived totals ────────────────────────────────────────
  const holdingsList = Object.values(portfolio.holdings)
  const mktValue  = holdingsList.reduce((s, h) => s + h.shares * h.avgCost, 0) // avgCost until live prices in chunk 2
  const costBasis = holdingsList.reduce((s, h) => s + h.shares * h.avgCost, 0)
  const totalPL   = mktValue - costBasis
  const totalValue = mktValue + portfolio.cash

  // ── Trade execution ───────────────────────────────────────
  /**
   * Validates and applies a trade. Returns an error string on failure,
   * null on success.
   *
   * @param {{ symbol: string, companyName: string, type: 'buy'|'sell', shares: number, pricePerShare: number }} trade
   * @returns {string|null}
   */
  function executeTrade({ symbol, companyName, type, shares, pricePerShare }) {
    const total = shares * pricePerShare

    if (type === 'buy') {
      if (total > portfolio.cash) {
        return `Not enough cash. Need $${fmt(total)}, have $${fmt(portfolio.cash)}.`
      }

      setPortfolio(prev => {
        const existing = prev.holdings[symbol]
        const newShares  = (existing?.shares ?? 0) + shares
        const newAvgCost = existing
          ? (existing.shares * existing.avgCost + total) / newShares
          : pricePerShare

        return {
          ...prev,
          cash: prev.cash - total,
          holdings: {
            ...prev.holdings,
            [symbol]: { symbol, companyName, shares: newShares, avgCost: newAvgCost },
          },
        }
      })
    } else {
      const holding = portfolio.holdings[symbol]
      if (!holding || holding.shares < shares) {
        return `You only own ${holding?.shares ?? 0} share${holding?.shares === 1 ? '' : 's'} of ${symbol}.`
      }

      setPortfolio(prev => {
        const remaining = prev.holdings[symbol].shares - shares
        const newHoldings = { ...prev.holdings }
        if (remaining === 0) {
          delete newHoldings[symbol]
        } else {
          newHoldings[symbol] = { ...prev.holdings[symbol], shares: remaining }
        }
        return { ...prev, cash: prev.cash + total, holdings: newHoldings }
      })
    }

    setTransactions(prev => [
      {
        transactionId: `tx_${String(nextTxId++).padStart(3, '0')}`,
        portfolioId: portfolio.portfolioId,
        type,
        symbol,
        companyName,
        shares,
        pricePerShare,
        total,
        executedAt: Timestamp.now(),
      },
      ...prev,
    ])

    return null
  }

  return (
    <div className="app">

      {/* TOP NAV */}
      <header className="topbar">
        <span className="topbar-logo">📈 Stock Market Game</span>
        <div className="topbar-right">
          <span className="topbar-user">{MOCK_USER.displayName}</span>
          <span className="topbar-cash">💵 ${fmt(portfolio.cash)}</span>
        </div>
      </header>

      <main className="main">

        {/* PORTFOLIO HEADER */}
        <div className="portfolio-header">
          <div>
            <p className="portfolio-eyebrow">Portfolio</p>
            <h1 className="portfolio-name">{portfolio.name}</h1>
          </div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            + New Trade
          </button>
        </div>

        {/* STATS */}
        <div className="stat-row">
          <div className="stat">
            <div className="stat-k">Total Value</div>
            <div className="stat-v">${fmt(totalValue)}</div>
          </div>
          <div className="stat">
            <div className="stat-k">Invested</div>
            <div className="stat-v">${fmt(mktValue)}</div>
          </div>
          <div className="stat">
            <div className="stat-k">Cash</div>
            <div className="stat-v">${fmt(portfolio.cash)}</div>
          </div>
          <div className="stat">
            <div className="stat-k">Return</div>
            <div className={`stat-v ${totalPL >= 0 ? 'up' : 'down'}`}>
              {totalPL >= 0 ? '+' : ''}${fmt(totalPL)}
            </div>
          </div>
        </div>

        {/* HOLDINGS */}
        <section className="panel">
          <div className="panel-label">Holdings</div>
          {holdingsList.length === 0
            ? <p className="empty">No holdings yet. Make your first trade!</p>
            : (
              <div className="table-scroll">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Symbol</th>
                      <th>Shares</th>
                      <th>Avg Cost</th>
                      <th>Price</th>
                      <th>Mkt Value</th>
                      <th>Return</th>
                      <th>Return %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {holdingsList.map(h => {
                      const price = h.avgCost  // chunk 2: replace with live price
                      const pl    = (price - h.avgCost) * h.shares
                      const ret   = pct(price, h.avgCost)
                      const up    = pl >= 0
                      return (
                        <tr key={h.symbol}>
                          <td>
                            <span className="sym">{h.symbol}</span>
                            <span className="sym-name">{h.companyName}</span>
                          </td>
                          <td>{h.shares}</td>
                          <td>${fmt(h.avgCost)}</td>
                          <td className="muted">—</td>
                          <td className="muted">—</td>
                          <td className={up ? 'up' : 'down'}>{up ? '+' : ''}${fmt(pl)}</td>
                          <td className={up ? 'up' : 'down'}>{up ? '+' : ''}{fmt(ret)}%</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )
          }
        </section>

        {/* TRANSACTIONS */}
        <section className="panel">
          <div className="panel-label">Transaction History</div>
          {transactions.length === 0
            ? <p className="empty">No transactions yet.</p>
            : (
              <div className="table-scroll">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Symbol</th>
                      <th>Shares</th>
                      <th>Price</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map(tx => (
                      <tr key={tx.transactionId}>
                        <td className="muted">{tx.executedAt.toDate().toLocaleString()}</td>
                        <td><span className={`tag tag-${tx.type}`}>{tx.type.toUpperCase()}</span></td>
                        <td>
                          <span className="sym">{tx.symbol}</span>
                          <span className="sym-name">{tx.companyName}</span>
                        </td>
                        <td>{tx.shares}</td>
                        <td>${fmt(tx.pricePerShare)}</td>
                        <td>${fmt(tx.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          }
        </section>

      </main>

      {/* TRADE MODAL */}
      {showModal && (
        <TradeModal
          cash={portfolio.cash}
          holdings={portfolio.holdings}
          onClose={() => setShowModal(false)}
          onConfirm={executeTrade}
        />
      )}

    </div>
  )
}
