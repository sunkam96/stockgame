import { signInWithPopup } from 'firebase/auth'
import { auth, googleProvider } from '../firebase'
import GoogleIcon from './GoogleIcon'

export default function SignIn() {
  async function handleGoogleSignIn() {
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (e) {
      console.error('Sign-in failed:', e.message)
    }
  }

  return (
    <div className="signin-screen">
      <div className="signin-card">
        <div className="signin-logo">📈</div>
        <h1 className="signin-title">Stock Market Game</h1>
        <p className="signin-subtitle">
          Start with $10,000 and trade DJIA stocks at real market prices.
        </p>
        <button className="btn-google" onClick={handleGoogleSignIn}>
          <GoogleIcon />
          Sign in with Google
        </button>
      </div>
    </div>
  )
}
