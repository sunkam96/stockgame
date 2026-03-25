import './App.css'

export default function App() {
  return (
    <div className="app">

      {/* TOP NAV */}
      <header className="topbar">
        <span className="topbar-logo">📈 Stock Market Game</span>
        <span className="topbar-cash">💵 $10,000.00</span>
      </header>

      {/* MAIN LAYOUT */}
      <main className="main">

        {/* Stock Lookup */}
        <section className="panel">
          <div className="panel-label">Stock Lookup</div>
          <div className="search-row">
            <input className="input" placeholder="Search ticker or company name…" />
            <button className="btn btn-primary">Look up</button>
          </div>
        </section>

        {/* Portfolio + Recent Trades side by side */}
        <div className="two-col">

          <section className="panel">
            <div className="panel-label">Portfolio</div>
            <div className="stat-row">
              <div className="stat">
                <div className="stat-k">Total Value</div>
                <div className="stat-v">$10,000.00</div>
              </div>
              <div className="stat">
                <div className="stat-k">Cash</div>
                <div className="stat-v">$10,000.00</div>
              </div>
              <div className="stat">
                <div className="stat-k">P&amp;L</div>
                <div className="stat-v muted">—</div>
              </div>
            </div>
            <p className="empty">No holdings yet. Look up a stock to get started.</p>
          </section>

          <section className="panel">
            <div className="panel-label">Recent Trades</div>
            <p className="empty">Your trades will appear here.</p>
          </section>

        </div>

      </main>

    </div>
  )
}
