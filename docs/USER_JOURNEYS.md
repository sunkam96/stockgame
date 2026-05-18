# User Journeys

---

## Auth

1. Visit `/` while signed out → sign-in screen appears
2. Click "Sign in with Google" → Google popup opens, completes successfully → redirected to profile page
3. On the portfolio page, click display name → dropdown shows "Profile" and "Log out"
4. Click "Log out" → redirected to sign-in screen, cannot access portfolio URL directly

---

## Profile Page

5. Visit `/` while signed in with a new account (no Firestore profile yet) → "No profile found" panel with Google button appears
6. Click "Continue with Google" → profile is created, identity panel populates with name, email, user ID, member since
7. Profile page shows empty portfolios table with a "+ New Portfolio" button

---

## Create Portfolio Modal

8. Click "+ New Portfolio" → modal opens with name pre-filled as `{displayName} 1` and balance pre-filled as `$10,000`
9. Clear name field → "Create Portfolio" button is disabled
10. Enter a balance below $100 → error message appears, button is disabled
11. With a valid name and balance → click "Create Portfolio" → redirected to `/portfolio/:portfolioId`
12. Return to profile, click "+ New Portfolio" again → name is recommended as `{displayName} 2`
13. Click backdrop or "Cancel" → modal closes, no portfolio created

---

## Portfolio Page

14. Portfolio page loads with cash balance shown in topbar and no holdings
15. Click "+ Trade" → modal opens with stock search
16. Search for "AAPL" → appears in results, can select it
17. Enter a share quantity and click "Confirm Buy to Open" → holding appears in table, cash decreases
18. Click "+ Trade" again, select AAPL → modal shows current position
19. Enter shares ≤ current position and confirm sell → position decreases or closes, cash increases
20. Attempt to sell more shares than owned → error shown, trade blocked

---

## Short Selling

21. Click "+ Trade" on a stock with no position, select "Sell" → action label shows "Sell to Open"
22. Confirm sell to open → holding shows negative shares, cash increases by proceeds
23. Open trade modal on a shorted stock, select "Buy" → action label shows "Buy to Close"
24. Attempt to short beyond $20,000 total exposure → error shown, trade blocked

---

## Admin

25. Visit `/admin` → table shows all portfolios with owner name, email, portfolio name, cash, holdings, start balance, created date
26. A portfolio created by a signed-in user shows the correct email joined from their profile

---

## Routing

27. Paste a valid `/portfolio/:portfolioId` URL while signed out → sign-in screen appears
28. Paste an invalid/nonexistent `/portfolio/abc123` URL while signed in → redirected to `/profile`
29. Visit any unknown URL (e.g. `/foo`) → profile page renders (catch-all route)
