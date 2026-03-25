import './App.css'
import { MOCK_USER, MOCK_PORTFOLIO, MOCK_TRANSACTIONS } from './mockData'

// Placeholder prices — will be replaced by live Yahoo Finance data later
const PRICES = { AAPL: 213.50, NVDA: 875.20, TSLA: 182.40, MSFT: 407.20 }

function pct(current, avgCost) {
  return ((current - avgCost) / avgCost) * 100
}

function fmt(n) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function App() {
  const { name, cash, holdings } = MOCK_PORTFOLIO
  const holdingsList = Object.values(holdings)

  const mktValue  = holdingsList.reduce((s, h) => s + h.shares * (PRICES[h.symbol] ?? h.avgCost), 0)
  const costBasis = holdingsList.reduce((s, h) => s + h.shares * h.avgCost, 0)
  const totalPL   = mktValue - costBasis
  const totalValue = mktValue + cash

  return (
    <div className="app">

      {/* TOP NAV */}
      <header className="topbar">
        <span className="topbar-logo">📈 Sudershan Stock Game</span>
        <div className="topbar-right">
          <span className="topbar-user">{MOCK_USER.displayName}</span>
          <span className="topbar-cash">💵 ${fmt(cash)}</span>
        </div>
      </header>

      <main className="main">

        {/* PORTFOLIO HEADER */}
        <div className="portfolio-header">
          <div>
            <p className="portfolio-eyebrow">Portfolio</p>
            <h1 className="portfolio-name">{name}</h1>
          </div>
          <button className="btn btn-primary">+ New Trade</button>
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
            <div className="stat-v">${fmt(cash)}</div>
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
          <div className="table-scroll"><table className="table">
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
                const price = PRICES[h.symbol] ?? h.avgCost
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
                    <td>${fmt(price)}</td>
                    <td>${fmt(h.shares * price)}</td>
                    <td className={up ? 'up' : 'down'}>{up ? '+' : ''}${fmt(pl)}</td>
                    <td className={up ? 'up' : 'down'}>{up ? '+' : ''}{fmt(ret)}%</td>
                  </tr>
                )
              })}
            </tbody>
          </table></div>
        </section>

        {/* TRANSACTIONS */}
        <section className="panel">
          <div className="panel-label">Transaction History</div>
          <div className="table-scroll"><table className="table">
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
              {MOCK_TRANSACTIONS.map(tx => (
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
          </table></div>
        </section>

      </main>
    </div>
  )
}
