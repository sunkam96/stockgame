import { useState, useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { Link, useNavigate } from 'react-router-dom'
import { auth } from '../firebase'
import { getProfile, getOrCreateProfile, getUserPortfolios, createPortfolio } from '../api/firestore'
import GoogleIcon from './GoogleIcon'

function fmt(n) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function ProfilePage() {
  const [user, setUser]               = useState(undefined)
  const [profile, setProfile]         = useState(undefined)  // undefined=loading, null=not found
  const [portfolios, setPortfolios]   = useState([])
  const [creating, setCreating]       = useState(false)
  const [creatingPortfolio, setCreatingPortfolio] = useState(false)
  const [portfolioName, setPortfolioName]         = useState('')
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

  async function handleCreatePortfolio(e) {
    e.preventDefault()
    if (!user || !portfolioName.trim()) return
    setCreatingPortfolio(true)
    setError(null)
    try {
      const p = await createPortfolio(user.uid, portfolioName.trim())
      setPortfolios(prev => [...prev, p])
      setPortfolioName('')
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

          {/* Create portfolio form */}
          <form onSubmit={handleCreatePortfolio} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              className="input"
              style={{ flex: 1 }}
              placeholder="Portfolio name, e.g. Growth, Dividends…"
              value={portfolioName}
              onChange={e => setPortfolioName(e.target.value)}
            />
            <button
              className="btn btn-primary"
              type="submit"
              disabled={creatingPortfolio || !portfolioName.trim()}
            >
              {creatingPortfolio ? 'Creating…' : '+ New Portfolio'}
            </button>
          </form>
        </div>

      </div>
    )
  }

  return (
    <div className="app">
      <header className="topbar">
        <span className="topbar-logo">📈 Stock Market Game</span>
        <div className="topbar-right">
          {portfolios.length > 0 && (
            <Link to={`/portfolio/${portfolios[0].portfolioId}`} className="btn-signout">← Portfolio</Link>
          )}
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
    </div>
  )
}
