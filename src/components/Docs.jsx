export default function Docs() {
  const sections = [
    {
      title: 'Auth',
      tests: [
        'Visit / while signed out → sign-in screen appears',
        'Click "Sign in with Google" → Google popup opens, completes successfully → redirected to profile page',
        'On the portfolio page, click display name → dropdown shows "Profile" and "Log out"',
        'Click "Log out" → redirected to sign-in screen, cannot access portfolio URL directly',
      ],
    },
    {
      title: 'Profile Page',
      tests: [
        'Visit / while signed in with a new account (no Firestore profile yet) → "No profile found" panel with Google button appears',
        'Click "Continue with Google" → profile is created, identity panel populates with name, email, user ID, member since',
        'Profile page shows empty portfolios table with a "+ New Portfolio" button',
      ],
    },
    {
      title: 'Create Portfolio Modal',
      tests: [
        'Click "+ New Portfolio" → modal opens with name pre-filled as {displayName} 1 and balance pre-filled as $10,000',
        'Clear name field → "Create Portfolio" button is disabled',
        'Enter a balance below $100 → error message appears, button is disabled',
        'With a valid name and balance → click "Create Portfolio" → redirected to /portfolio/:portfolioId',
        'Return to profile, click "+ New Portfolio" again → name is recommended as {displayName} 2',
        'Click backdrop or "Cancel" → modal closes, no portfolio created',
      ],
    },
    {
      title: 'Portfolio Page',
      tests: [
        'Portfolio page loads with cash balance shown in topbar and no holdings',
        'Click "+ Trade" → modal opens with stock search',
        'Search for "AAPL" → appears in results, can select it',
        'Enter a share quantity and click "Confirm Buy to Open" → holding appears in table, cash decreases',
        'Click "+ Trade" again, select AAPL → modal shows current position',
        'Enter shares ≤ current position and confirm sell → position decreases or closes, cash increases',
        'Attempt to sell more shares than owned → error shown, trade blocked',
      ],
    },
    {
      title: 'Short Selling',
      tests: [
        'Click "+ Trade" on a stock with no position, select "Sell" → action label shows "Sell to Open"',
        'Confirm sell to open → holding shows negative shares, cash increases by proceeds',
        'Open trade modal on a shorted stock, select "Buy" → action label shows "Buy to Close"',
        'Attempt to short beyond $20,000 total exposure → error shown, trade blocked',
      ],
    },
    {
      title: 'Admin',
      tests: [
        'Visit /admin → table shows all portfolios with owner name, email, portfolio name, cash, holdings, start balance, created date',
        'A portfolio created by a signed-in user shows the correct email joined from their profile',
      ],
    },
    {
      title: 'Routing',
      tests: [
        'Paste a valid /portfolio/:portfolioId URL while signed out → sign-in screen appears',
        'Paste an invalid/nonexistent /portfolio/abc123 URL while signed in → redirected to /profile',
        'Visit any unknown URL (e.g. /foo) → profile page renders (catch-all route)',
      ],
    },
  ]

  let counter = 1

  return (
    <div className="app">
      <header className="topbar">
        <span className="topbar-logo">📈 Stock Market Game</span>
        <span className="topbar-user" style={{ color: 'var(--muted)', fontWeight: 700 }}>DOCS</span>
      </header>

      <main className="main">
        <div className="portfolio-header">
          <div>
            <p className="portfolio-eyebrow">Documentation</p>
            <h1 className="portfolio-name">User Journeys</h1>
          </div>
        </div>

        {sections.map(section => (
          <section className="panel" key={section.title} style={{ marginBottom: 16, maxWidth: 720 }}>
            <div className="panel-label">{section.title}</div>
            <table className="table">
              <tbody>
                {section.tests.map(test => {
                  const n = counter++
                  return (
                    <tr key={n}>
                      <td style={{ width: 32, color: 'var(--muted)', fontWeight: 600, fontSize: '0.8rem' }}>
                        {n}
                      </td>
                      <td style={{ fontSize: '0.88rem', lineHeight: 1.5 }}>{test}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </section>
        ))}
      </main>
    </div>
  )
}
