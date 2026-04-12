import { useState, useEffect } from 'react'
import { getAllPortfolios } from '../api/firestore'

function fmt(n) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function Admin() {
  const [portfolios, setPortfolios] = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)

  useEffect(() => {
    getAllPortfolios()
      .then(setPortfolios)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="app">
      <header className="topbar">
        <span className="topbar-logo">📈 Stock Market Game</span>
        <span className="topbar-user" style={{ color: 'var(--down)', fontWeight: 700 }}>
          ADMIN
        </span>
      </header>

      <main className="main">
        <div className="portfolio-header">
          <div>
            <p className="portfolio-eyebrow">Admin</p>
            <h1 className="portfolio-name">All Portfolios</h1>
          </div>
        </div>

        {loading && <p className="empty">Loading…</p>}
        {error   && <p className="trade-error">{error}</p>}

        {!loading && !error && (
          <section className="panel">
            <div className="panel-label">{portfolios.length} portfolio{portfolios.length !== 1 ? 's' : ''}</div>
            {portfolios.length === 0
              ? <p className="empty">No portfolios found.</p>
              : (
                <div className="table-scroll">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Portfolio</th>
                        <th>Owner</th>
                        <th>Email</th>
                        <th>Cash</th>
                        <th>Holdings</th>
                        <th>Start Balance</th>
                        <th>Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {portfolios.map(p => (
                        <tr key={p.portfolioId}>
                          <td>{p.name}</td>
                          <td>{p.displayName ?? '—'}</td>
                          <td className="muted">{p.email ?? '—'}</td>
                          <td>${fmt(p.cash)}</td>
                          <td>{Object.keys(p.holdings ?? {}).length} stock{Object.keys(p.holdings ?? {}).length !== 1 ? 's' : ''}</td>
                          <td>${fmt(p.startBalance)}</td>
                          <td className="muted">
                            {p.createdAt?.toDate?.().toLocaleDateString() ?? '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            }
          </section>
        )}
      </main>
    </div>
  )
}
