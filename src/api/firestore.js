// ---------------------------------------------------------------------------
// Firestore data layer
//
// Schema:
//   portfolios/{portfolioId}                          ← Portfolio doc
//   portfolios/{portfolioId}/transactions/{txId}      ← Transaction subcollection
//
// Portfolios are scoped to a user via the `ownerId` field.
// ---------------------------------------------------------------------------

import {
  doc,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  collection,
  query,
  where,
  orderBy,
  getDocs,
  Timestamp,
} from 'firebase/firestore'
import { db } from '../firebase'

export const START_BALANCE      = 10_000
export const MAX_SHORT_EXPOSURE = START_BALANCE * 2   // $20,000

// ── Profile ───────────────────────────────────────────────────────────────────

/**
 * Load the profile for a user. If none exists, create one from their
 * Firebase Auth data. Stored at users/{userId}.
 *
 * @param {string} userId
 * @param {{ email: string, displayName: string }} authData
 * @returns {Promise<import('../data').Profile>}
 */
export async function getOrCreateProfile(userId, { email, displayName }) {
  const ref  = doc(db, 'users', userId)
  const snap = await getDoc(ref)

  if (snap.exists()) return { userId: snap.id, ...snap.data() }

  const fresh = {
    userId,
    displayName: displayName ?? '',
    email:       email ?? '',
    createdAt:   Timestamp.now(),
  }
  await setDoc(ref, fresh)
  return fresh
}

// ── Portfolio ────────────────────────────────────────────────────────────────

/**
 * Load the first portfolio owned by this user.
 * If none exists, create one with a $10,000 starting balance.
 *
 * @param {string} userId
 * @returns {Promise<import('../data').Portfolio>}
 */
export async function getOrCreatePortfolio(userId, email, displayName) {
  const ref  = collection(db, 'portfolios')
  const q    = query(ref, where('ownerId', '==', userId))
  const snap = await getDocs(q)

  if (!snap.empty) {
    const d = snap.docs[0]
    return { portfolioId: d.id, ...d.data() }
  }

  // No portfolio yet — create a fresh one
  const fresh = {
    ownerId:      userId,
    name:         displayName ?? 'My Portfolio',
    email:        email ?? null,
    startBalance: START_BALANCE,
    cash:         START_BALANCE,
    holdings:     {},
    createdAt:    Timestamp.now(),
  }

  const newRef = doc(collection(db, 'portfolios'))
  await setDoc(newRef, fresh)
  return { portfolioId: newRef.id, ...fresh }
}

/**
 * Fetch all portfolios owned by a user, ordered by creation date.
 *
 * @param {string} userId
 * @returns {Promise<import('../data').Portfolio[]>}
 */
export async function getUserPortfolios(userId) {
  const ref  = collection(db, 'portfolios')
  const q    = query(ref, where('ownerId', '==', userId), orderBy('createdAt', 'asc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ portfolioId: d.id, ...d.data() }))
}

/**
 * Create a new portfolio for a user.
 *
 * @param {string} userId
 * @param {string} name         e.g. "Growth Portfolio"
 * @param {number} startBalance defaults to START_BALANCE
 * @returns {Promise<import('../data').Portfolio>}
 */
export async function createPortfolio(userId, name, startBalance = START_BALANCE) {
  const fresh = {
    ownerId:      userId,
    name,
    startBalance,
    cash:         startBalance,
    holdings:     {},
    createdAt:    Timestamp.now(),
  }
  const newRef = doc(collection(db, 'portfolios'))
  await setDoc(newRef, fresh)
  return { portfolioId: newRef.id, ...fresh }
}

/**
 * Persist the mutable parts of a portfolio (cash + holdings).
 *
 * @param {string} portfolioId
 * @param {{ cash: number, holdings: Record<string, import('../data').Holding> }} update
 */
export async function savePortfolio(portfolioId, { cash, holdings }) {
  await updateDoc(doc(db, 'portfolios', portfolioId), { cash, holdings })
}

/**
 * Fetch every portfolio document — used by the admin page.
 *
 * @returns {Promise<import('../data').Portfolio[]>}
 */
export async function getAllPortfolios() {
  const snap = await getDocs(collection(db, 'portfolios'))
  return snap.docs.map(d => ({ portfolioId: d.id, ...d.data() }))
}

// ── Transactions ─────────────────────────────────────────────────────────────

/**
 * Fetch all transactions for a portfolio, newest first.
 *
 * @param {string} portfolioId
 * @returns {Promise<import('../data').Transaction[]>}
 */
export async function getTransactions(portfolioId) {
  const ref  = collection(db, 'portfolios', portfolioId, 'transactions')
  const q    = query(ref, orderBy('executedAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ transactionId: d.id, ...d.data() }))
}

/**
 * Persist a new transaction and return it with its Firestore-generated ID.
 *
 * @param {string} portfolioId
 * @param {Omit<import('../data').Transaction, 'transactionId'>} tx
 * @returns {Promise<import('../data').Transaction>}
 */
export async function addTransaction(portfolioId, tx) {
  const ref    = collection(db, 'portfolios', portfolioId, 'transactions')
  const docRef = await addDoc(ref, tx)
  return { transactionId: docRef.id, ...tx }
}
