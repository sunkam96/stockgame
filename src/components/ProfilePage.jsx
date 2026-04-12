import { useState, useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { Link, useNavigate } from 'react-router-dom'
import { auth } from '../firebase'
import { getProfile, getOrCreateProfile, getUserPortfolios, createPortfolio, START_BALANCE } from '../api/firestore'
import GoogleIcon from './GoogleIcon'

function fmt(n) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/** Derive the recommended next portfolio name given an existing list. */
function nextPortfolioName(portfolios) {
  if (portfolios.length === 0) return 'Portfolio 1'

  // Find highest trailing number among names like "Portfolio N"
  let max = 0
  portfolios.forEach(p => {
    const m = p.name?.match(/^Portfolio\s+(\d+)$/i)
    if (m) max = Math.max(max, parseInt(m[1], 10))
  })

  return max > 0
    ? `Portfolio ${max + 1}`
    : `Portfolio ${portfolios.length + 1}`
}

// ── Create Portfolio Modal ────────────────────────────────────────────────────

function CreatePortfolioModal({ onClose, onConfirm, defaultName, creating }) {
  const [name, setName]           = useState(defaultName)
  const [balance, setBalance]     = useState(String(START_BALANCE))
  const [balanceErr, setBalanceErr] = useState(null)

  function handleBalanceChange(e) {
    const val = e.target.value
    setBalance(val)
    const n = parseFloat(val)
    if (isNaN(n) || n < 100) setBalanceErr('Minimum starting balance is $100')
    else setBalanceErr(null)
  }

  function handleSubmit(e) {
    e.preventDefault()
    const n = parseFloat(balance)
    if (!name.trim() || isNaN(n) || n < 100) return
    onConfirm(name.trim(), n)
  }

  return (
    <div
      className="modal-backdrop"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">New Portfolio</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label className="modal-field-label">Portfolio name</label>
            <input
              className="input"
              style={{ width: '100%' }}
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Portfolio 1"
              autoFocus
            />
          </div>

          <div>
            <label className="modal-field-label">Starting balance</label>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
                color: 'var(--muted)', fontWeight: 600, pointerEvents: 'none'
              }}>$</span>
              <input
                className="input"
                style={{ width: '100%', paddingLeft: 22 }}
                type="number"
                min="100"
                step="100"
                value={balance}
                onChange={handleBalanceChange}
              />
            </div>
            {balanceErr
              ? <p style={{ color: 'var(--down)', fontSize: '0.78rem', marginTop: 4 }}>{balanceErr}</p>
              : <p className="muted" style={{ fontSize: '0.78rem', marginTop: 4 }}>
                  Recommended: ${fmt(START_BALANCE)}
                </p>
            }
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
            <button type="button" className="btn" onClick={onClose} disabled={creating}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={creating || !name.trim() || !!balanceErr || parseFloat(balance) < 100}
            >
              {creating ? 'Creating…' : 'Create Portfolio'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── ProfilePage ───────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const [user, setUser]               = useState(undefined)
  const [profile, setProfile]         = useState(undefined)  // undefined=loading, null=not found
  const [portfolios, setPortfolios]   = useState([])
  const [creating, setCreating]       = useState(false)
  const [showModal, setShowModal]     = useState(false)
  const [creatingPortfolio, setCreatingPortfolio] = useState(false)
  const [error, setError]             = useState(null)
  const navigate                      = useNavigate()

  useEffect(() => {
    return onAuthStateChanged(auth, u => setUser(u ?? null))
  }, [])

  useEffect(() => {
    if (!user) return
    getProfile(user.uid)
      .then(setProfile)
      .catch(e => setError(e.message))
  }, [user])

  useEffect(() => {
    if (!user || !profile) return
    getUserPortfolios(user.uid)
      .then(setPortfolios)
      .catch(() => {})
  }, [user, profile])

  async function handleCreateProfile() {
    if (!user) return
    setCreating(true)
    setError(null)
    try {
      const p = await getOrCreateProfile(user.uid, {
        email:       user.email,
        displayName: user.displayName,
      })
      setProfile(p)
    } catch (e) {
      setError(e.message)
    } finally {
      setCreating(false)
    }
  }

  async function handleCreatePortfolio(name, startBalance) {
    if (!user) return
    setCreatingPortfolio(true)
    setError(null)
    try {
      const p = await createPortfolio(user.uid, name, startBalance)
      setPortfolios(prev => [...prev, p])
      setShowModal(false)
      navigate(`/portfolio/${p.portfolioId}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setCreatingPortfolio(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  function body() {
    if (user === undefined || profile === undefined) {
      return <p className="empty">Loading…</p>
    }

    if (user === null) {
      return <p className="empty">You need to be signed in to view your profile.</p>
    }

    if (error) {
      return <p className="trade-error">{error}</p>
    }

    if (profile === null) {
      return (
        <div className="panel" style={{ maxWidth: 480 }}>
          <div className="panel-label">No profile found</div>
          <p className="empty" style={{ marginBottom: 16 }}>
            You don't have a profile yet. Click below to create one using your Google account details.
          </p>
          <button className="btn-google" onClick={handleCreateProfile} disabled={creating}>
            <GoogleIcon />
            {creating ? 'Creating…' : 'Continue with Google'}
          </button>
        </div>
      )
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 560 }}>

        {/* Identity */}
        <div className="panel">
          <div className="panel-label">Identity</div>
          <table className="table">
            <tbody>
              <tr>
                <td className="muted" style={{ width: 140 }}>Display name</td>
                <td>{profile.displayName || <span className="muted">—</span>}</td>
              </tr>
              <tr>
                <td className="muted">Email</td>
                <td>{profile.email || <span className="muted">—</span>}</td>
              </tr>
              <tr>
                <td className="muted">User ID</td>
                <td><code style={{ fontSize: '0.75rem' }}>{profile.userId}</code></td>
              </tr>
              <tr>
                <td className="muted">Member since</td>
                <td>{profile.createdAt?.toDate?.().toLocaleDateString() ?? '—'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Portfolios */}
        <div className="panel">
          <div className="panel-label">Portfolios</div>

          {portfolios.length > 0 && (
            <div className="table-scroll" style={{ marginBottom: 20 }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Cash</th>
                    <th>Holdings</th>
                    <th>Created</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {portfolios.map(p => (
                    <tr key={p.portfolioId}>
                      <td>{p.name}</td>
                      <td>${fmt(p.cash)}</td>
                      <td>{Object.keys(p.holdings ?? {}).length}</td>
                      <td className="muted">{p.createdAt?.toDate?.().toLocaleDateString() ?? '—'}</td>
                      <td>
                        <Link to={`/portfolio/${p.portfolioId}`} className="btn btn-primary" style={{ padding: '4px 12px', fontSize: '0.78rem' }}>
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <button
            className="btn btn-primary"
            onClick={() => setShowModal(true)}
          >
            + New Portfolio
          </button>
        </div>

      </div>
    )
  }

  return (
    <div className="app">
      <header className="topbar">
        <span className="topbar-logo">📈 Stock Market Game</span>
        <div className="topbar-right">
        </div>
      </header>
      <main className="main">
        <div className="portfolio-header">
          <div>
            <p className="portfolio-eyebrow">Account</p>
            <h1 className="portfolio-name">My Profile</h1>
          </div>
        </div>
        {body()}
      </main>

      {showModal && (
        <CreatePortfolioModal
          defaultName={nextPortfolioName(portfolios)}
          onClose={() => setShowModal(false)}
          onConfirm={handleCreatePortfolio}
          creating={creatingPortfolio}
        />
      )}
    </div>
  )
}
