import './App.css'

const HOLDINGS = [
  { symbol: 'AAPL', name: 'Apple Inc.',      shares: 10, avgCost: 198.20, price: 213.50 },
  { symbol: 'NVDA', name: 'NVIDIA Corp.',     shares:  2, avgCost: 820.00, price: 875.20 },
  { symbol: 'TSLA', name: 'Tesla Inc.',       shares:  8, avgCost: 195.00, price: 182.40 },
  { symbol: 'MSFT', name: 'Microsoft Corp.', shares:  4, avgCost: 400.00, price: 407.20 },
]

const TRANSACTIONS = [
  { id: 1, date: '3/25/2026, 10:14 AM', type: 'buy',  symbol: 'MSFT', shares: 4, price: 400.00 },
  { id: 2, date: '3/24/2026,  2:02 PM', type: 'sell', symbol: 'TSLA', shares: 2, price: 201.30 },
  { id: 3, date: '3/24/2026,  9:47 AM', type: 'buy',  symbol: 'TSLA', shares: 10, price: 195.00 },
  { id: 4, date: '3/22/2026, 11:30 AM', type: 'buy',  symbol: 'NVDA', shares:  2, price: 820.00 },
  { id: 5, date: '3/20/2026,  3:55 PM', type: 'buy',  symbol: 'AAPL', shares: 10, price: 198.20 },
]

function pct(price, avgCost) {
  return ((price - avgCost) / avgCost) * 100
}

function fmt(n, opts = {}) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2, ...opts })
}

export default function App() {
  const invested   = HOLDINGS.reduce((s, h) => s + h.shares * h.avgCost, 0)
  const mktValue   = HOLDINGS.reduce((s, h) => s + h.shares * h.price,   0)
  const cash       = 10000 - invested
  const totalPL    = mktValue - invested
  const totalValue = mktValue + cash

  return (
    <div className="app">

      {/* TOP NAV */}
      <header className="topbar">
        <span className="topbar-logo">📈 Stock Market Game</span>
        <div className="topbar-right">
          <span className="topbar-user">Sai</span>
          <span className="topbar-cash">💵 ${fmt(cash)}</span>
        </div>
      </header>

      <main className="main">

        {/* PORTFOLIO HEADER */}
        <div className="portfolio-header">
          <div>
            <p className="portfolio-eyebrow">Portfolio</p>
            <h1 className="portfolio-name">My Portfolio</h1>
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
            <div className="stat-k">Total P&amp;L</div>
            <div className={`stat-v ${totalPL >= 0 ? 'up' : 'down'}`}>
              {totalPL >= 0 ? '+' : ''}${fmt(totalPL)}
            </div>
          </div>
        </div>

        {/* HOLDINGS */}
        <section className="panel">
          <div className="panel-label">Holdings</div>
          <table className="table">
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Shares</th>
                <th>Avg Cost</th>
                <th>Price</th>
                <th>Mkt Value</th>
                <th>P&amp;L</th>
                <th>Return</th>
              </tr>
            </thead>
            <tbody>
              {HOLDINGS.map(h => {
                const pl  = (h.price - h.avgCost) * h.shares
                const ret = pct(h.price, h.avgCost)
                const up  = pl >= 0
                return (
                  <tr key={h.symbol}>
                    <td>
                      <span className="sym">{h.symbol}</span>
                      <span className="sym-name">{h.name}</span>
                    </td>
                    <td>{h.shares}</td>
                    <td>${fmt(h.avgCost)}</td>
                    <td>${fmt(h.price)}</td>
                    <td>${fmt(h.shares * h.price)}</td>
                    <td className={up ? 'up' : 'down'}>
                      {up ? '+' : ''}${fmt(pl)}
                    </td>
                    <td className={up ? 'up' : 'down'}>
                      {up ? '+' : ''}{fmt(ret)}%
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </section>

        {/* TRANSACTIONS */}
        <section className="panel">
          <div className="panel-label">Transaction History</div>
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
              {TRANSACTIONS.map(tx => (
                <tr key={tx.id}>
                  <td className="muted">{tx.date}</td>
                  <td><span className={`tag tag-${tx.type}`}>{tx.type.toUpperCase()}</span></td>
                  <td><span className="sym">{tx.symbol}</span></td>
                  <td>{tx.shares}</td>
                  <td>${fmt(tx.price)}</td>
                  <td>${fmt(tx.shares * tx.price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

      </main>
    </div>
  )
}
