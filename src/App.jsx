import { useState, useEffect } from 'react'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { Timestamp } from 'firebase/firestore'
import './App.css'
import { auth } from './firebase'
import { getOrCreateProfile, getPortfolio, savePortfolio, getTransactions, addTransaction } from './api/firestore'
import { fetchPrices, fetchPrice } from './api/prices'
import { Routes, Route, Link, useNavigate, useParams } from 'react-router-dom'
import TradeModal from './components/TradeModal'
import SignIn from './components/SignIn'
import Admin from './components/Admin'
import ProfilePage from './components/ProfilePage'

function fmt(n) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function pct(current, avgCost) {
  return ((current - avgCost) / avgCost) * 100
}

function Portfolio() {

  const { portfolioId }                 = useParams()
  const [user, setUser]                 = useState(undefined) // undefined = checking, null = signed out
  const [menuOpen, setMenuOpen]         = useState(false)
  const [portfolio, setPortfolio]       = useState(null)
  const [transactions, setTransactions] = useState([])
  const [showModal, setShowModal]       = useState(false)
  const [closingSymbol, setClosingSymbol] = useState(null) // symbol pending sell-to-close confirm
  const [livePrices, setLivePrices]     = useState({})
  const [loading, setLoading]           = useState(false)
  const [loadError, setLoadError]       = useState(null)
  const navigate                        = useNavigate()

  // ── Auth state observer ────────────────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, firebaseUser => {
      setUser(firebaseUser ?? null)
    })
    return unsub
  }, [])

  // ── Load portfolio when user + portfolioId are known ──────────────────────
  useEffect(() => {
    if (!user || !portfolioId) return

    setLoading(true)
    setLoadError(null)

    async function load() {
      // Ensure a profile document exists for this user
      await getOrCreateProfile(user.uid, {
        email:       user.email,
        displayName: user.displayName,
      })

      const p = await getPortfolio(portfolioId)
      if (!p) {
        navigate('/profile')
        return
      }

      const txs = await getTransactions(p.portfolioId)
      setPortfolio(p)
      setTransactions(txs)
    }

    load()
      .catch(e => setLoadError(e.message))
      .finally(() => setLoading(false))
  }, [user, portfolioId])

  // ── Fetch live prices whenever holdings change ─────────────────────────────
  useEffect(() => {
    if (!portfolio) return
    const symbols = Object.keys(portfolio.holdings)
    if (symbols.length === 0) return
    fetchPrices(symbols).then(prices => {
      setLivePrices(prev => ({ ...prev, ...prices }))
    })
  }, [portfolio?.holdings])

  // ── Derived totals ─────────────────────────────────────────────────────────
  const holdingsList = portfolio ? Object.values(portfolio.holdings) : []
  const mktValue     = holdingsList.reduce((s, h) => s + h.shares * (livePrices[h.symbol] ?? h.avgCost), 0)
  const costBasis    = holdingsList.reduce((s, h) => s + h.shares * h.avgCost, 0)
  const totalPL      = mktValue - costBasis
  const totalValue   = mktValue + (portfolio?.cash ?? 0)

  // ── Trade execution ────────────────────────────────────────────────────────
  async function executeTrade({ symbol, companyName, type, shares, pricePerShare }) {
    const total = shares * pricePerShare
    let updatedPortfolio

    if (type === 'buy') {
      if (total > portfolio.cash) {
        return `Not enough cash. Need $${fmt(total)}, have $${fmt(portfolio.cash)}.`
      }
      const existing   = portfolio.holdings[symbol]
      const newShares  = (existing?.shares ?? 0) + shares
      const newAvgCost = existing
        ? (existing.shares * existing.avgCost + total) / newShares
        : pricePerShare

      updatedPortfolio = {
        ...portfolio,
        cash: portfolio.cash - total,
        holdings: {
          ...portfolio.holdings,
          [symbol]: { symbol, companyName, shares: newShares, avgCost: newAvgCost },
        },
      }
    } else {
      const holding = portfolio.holdings[symbol]
      if (!holding || holding.shares < shares) {
        return `You only own ${holding?.shares ?? 0} share${holding?.shares === 1 ? '' : 's'} of ${symbol}.`
      }
      const remaining   = holding.shares - shares
      const newHoldings = { ...portfolio.holdings }
      if (remaining === 0) delete newHoldings[symbol]
      else newHoldings[symbol] = { ...holding, shares: remaining }

      updatedPortfolio = {
        ...portfolio,
        cash: portfolio.cash + total,
        holdings: newHoldings,
      }
    }

    const tx = {
      portfolioId: portfolio.portfolioId,
      type,
      symbol,
      companyName,
      shares,
      pricePerShare,
      total,
      executedAt: Timestamp.now(),
    }

    try {
      const [, savedTx] = await Promise.all([
        savePortfolio(portfolio.portfolioId, {
          cash:     updatedPortfolio.cash,
          holdings: updatedPortfolio.holdings,
        }),
        addTransaction(portfolio.portfolioId, tx),
      ])
      setPortfolio(updatedPortfolio)
      setTransactions(prev => [savedTx, ...prev])
      setLivePrices(prev => ({ ...prev, [symbol]: pricePerShare }))
    } catch (e) {
      return `Trade failed: ${e.message}`
    }

    return null
  }

  // ── Loading states ─────────────────────────────────────────────────────────

  // Still checking Firebase auth
  if (user === undefined) {
    return (
      <div className="app">
        <header className="topbar"><span className="topbar-logo">📈 Stock Market Game</span></header>
        <main className="main"><p className="empty">Loading…</p></main>
      </div>
    )
  }

  // Not signed in — show sign-in screen
  if (user === null) return <SignIn />

  // Signed in but portfolio still loading (or hasn't loaded yet)
  if (loading || !portfolio) {
    return (
      <div className="app">
        <header className="topbar"><span className="topbar-logo">📈 Stock Market Game</span></header>
        <main className="main"><p className="empty">Loading portfolio…</p></main>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="app">
        <header className="topbar"><span className="topbar-logo">📈 Stock Market Game</span></header>
        <main className="main"><p className="trade-error">Failed to load: {loadError}</p></main>
      </div>
    )
  }

  // ── Main app ───────────────────────────────────────────────────────────────
  return (
    <div className="app">

      <header className="topbar">
        <span className="topbar-logo">📈 Stock Market Game</span>
        <div className="topbar-right">
          <span className="topbar-cash">💵 ${fmt(portfolio.cash)}</span>
          <div className="user-menu-wrap">
            <button
              className="topbar-user"
              onClick={() => setMenuOpen(o => !o)}
            >
              {user.displayName} ▾
            </button>
            {menuOpen && (
              <>
                <div className="user-menu-backdrop" onClick={() => setMenuOpen(false)} />
                <div className="user-menu">
                  <Link to="/profile" className="user-menu-item" onClick={() => setMenuOpen(false)}>
                    Profile
                  </Link>
                  <button
                    className="user-menu-item user-menu-item--danger"
                    onClick={() => { setMenuOpen(false); signOut(auth) }}
                  >
                    Log out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>


      <main className="main">

        <div className="portfolio-header">
          <div>
            <p className="portfolio-eyebrow">Portfolio</p>
            <h1 className="portfolio-name">{portfolio.name}</h1>
          </div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            + New Trade
          </button>
        </div>

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

        <section className="panel">
          <div className="panel-label">Holdings</div>
          {holdingsList.length === 0
            ? <p className="empty">No holdings yet. Make your first trade!</p>
            : (
              <div className="table-scroll">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Symbol</th><th>Shares</th><th>Avg Cost</th>
                      <th>Price</th><th>Mkt Value</th><th>Return</th><th>Return %</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {holdingsList.map(h => {
                      const livePrice   = livePrices[h.symbol]
                      const hasPrice    = livePrice !== undefined
                      const pl          = hasPrice ? (livePrice - h.avgCost) * h.shares : 0
                      const ret         = hasPrice ? pct(livePrice, h.avgCost) : 0
                      const up          = pl >= 0
                      const isConfirming = closingSymbol === h.symbol

                      async function handleSellToClose() {
                        if (!isConfirming) { setClosingSymbol(h.symbol); return }
                        setClosingSymbol(null)
                        const price = livePrices[h.symbol] ?? await fetchPrice(h.symbol)
                        await executeTrade({
                          symbol:       h.symbol,
                          companyName:  h.companyName,
                          type:         'sell',
                          shares:       h.shares,
                          pricePerShare: price,
                        })
                      }

                      return (
                        <tr key={h.symbol}>
                          <td>
                            <span className="sym">{h.symbol}</span>
                            <span className="sym-name">{h.companyName}</span>
                          </td>
                          <td>{h.shares}</td>
                          <td>${fmt(h.avgCost)}</td>
                          <td>{hasPrice ? `$${fmt(livePrice)}` : <span className="muted">…</span>}</td>
                          <td>{hasPrice ? `$${fmt(livePrice * h.shares)}` : <span className="muted">…</span>}</td>
                          <td className={hasPrice ? (up ? 'up' : 'down') : 'muted'}>
                            {hasPrice ? `${up ? '+' : ''}$${fmt(pl)}` : '—'}
                          </td>
                          <td className={hasPrice ? (up ? 'up' : 'down') : 'muted'}>
                            {hasPrice ? `${up ? '+' : ''}${fmt(ret)}%` : '—'}
                          </td>
                          <td>
                            {isConfirming
                              ? (
                                <span style={{ display: 'inline-flex', gap: 6 }}>
                                  <button className="btn btn-danger" style={{ padding: '4px 10px', fontSize: '0.78rem' }} onClick={handleSellToClose}>Confirm</button>
                                  <button className="btn btn-ghost"  style={{ padding: '4px 10px', fontSize: '0.78rem' }} onClick={() => setClosingSymbol(null)}>Cancel</button>
                                </span>
                              )
                              : (
                                <button className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: '0.78rem' }} onClick={handleSellToClose}>
                                  Sell to Close
                                </button>
                              )
                            }
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )
          }
        </section>

        <section className="panel">
          <div className="panel-label">Transaction History</div>
          {transactions.length === 0
            ? <p className="empty">No transactions yet.</p>
            : (
              <div className="table-scroll">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Date</th><th>Type</th><th>Symbol</th>
                      <th>Shares</th><th>Price</th><th>Total</th>
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

export default function App() {
  return (
    <Routes>
      <Route path="/admin"                    element={<Admin />} />
      <Route path="/portfolio/:portfolioId"   element={<Portfolio />} />
      <Route path="/*"                        element={<ProfilePage />} />
    </Routes>
  )
}
