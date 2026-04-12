import { useState, useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { Link } from 'react-router-dom'
import { auth } from '../firebase'
import { getProfile, getOrCreateProfile, getUserPortfolios } from '../api/firestore'
import GoogleIcon from './GoogleIcon'

export default function ProfilePage() {
  const [user, setUser]         = useState(undefined)
  const [profile, setProfile]   = useState(undefined)   // undefined = loading, null = not found
  const [portfolios, setPortfolios] = useState([])
  const [creating, setCreating] = useState(false)
  const [error, setError]       = useState(null)

  // Watch auth state
  useEffect(() => {
    return onAuthStateChanged(auth, u => setUser(u ?? null))
  }, [])

  // Load profile once we have a user
  useEffect(() => {
    if (!user) return
    getProfile(user.uid)
      .then(setProfile)
      .catch(e => setError(e.message))
  }, [user])

  // Load portfolios once profile is confirmed to exist
  useEffect(() => {
    if (!user || profile === undefined || profile === null) return
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
          <div className="panel-label">No account found</div>
          <p className="empty" style={{ marginBottom: 16 }}>
            Create a profile to create portfolios.
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

        <div className="panel">
          <div className="panel-label">Portfolios</div>
          {portfolios.length === 0
            ? <p className="empty">No portfolios yet.</p>
            : (
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
                      <td>${p.cash.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td>{Object.keys(p.holdings ?? {}).length}</td>
                      <td className="muted">{p.createdAt?.toDate?.().toLocaleDateString() ?? '—'}</td>
                      <td>
                        <Link to="/" className="btn btn-primary" style={{ padding: '4px 12px', fontSize: '0.78rem' }}>
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          }
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="topbar">
        <span className="topbar-logo">📈 Stock Market Game</span>
        <div className="topbar-right">
          <Link to="/" className="btn-signout">← Portfolio</Link>
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
