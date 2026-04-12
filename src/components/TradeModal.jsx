import { useState, useMemo, useEffect } from 'react'
import { DJIA_30 } from '../constants'
import { fetchPrice } from '../api/prices'

function fmt(n) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/**
 * @param {{
 *   onClose: () => void
 *   onConfirm: (trade: { symbol: string, companyName: string, type: 'buy'|'sell', shares: number, pricePerShare: number }) => string|null
 *   cash: number
 *   holdings: Record<string, import('../data').Holding>
 * }} props
 */
export default function TradeModal({ onClose, onConfirm, cash, holdings }) {
  const [type, setType]         = useState('buy')
  const [symbol, setSymbol]     = useState('')
  const [search, setSearch]     = useState('')
  const [shares, setShares]     = useState('')
  const [error, setError]       = useState(null)
  const [price, setPrice]       = useState(null)
  const [priceLoading, setPriceLoading] = useState(false)
  const [priceError, setPriceError]     = useState(null)

  const filtered = useMemo(() =>
    DJIA_30.filter(s =>
      s.symbol.includes(search.toUpperCase()) ||
      s.companyName.toLowerCase().includes(search.toLowerCase())
    ), [search])

  const selected = DJIA_30.find(s => s.symbol === symbol) ?? null

  // Fetch price whenever a stock is selected
  useEffect(() => {
    if (!selected) { setPrice(null); return }

    let cancelled = false
    setPriceLoading(true)
    setPriceError(null)
    setPrice(null)

    fetchPrice(selected.symbol)
      .then(p => { if (!cancelled) { setPrice(p); setPriceLoading(false) } })
      .catch(e => { if (!cancelled) { setPriceError(e.message); setPriceLoading(false) } })

    return () => { cancelled = true }
  }, [selected?.symbol])

  const sharesNum   = parseInt(shares, 10)
  const validShares = !isNaN(sharesNum) && sharesNum > 0
  const total       = validShares && price ? sharesNum * price : 0

  const maxSellShares = symbol && holdings[symbol] ? holdings[symbol].shares : 0
  const cashAfter     = type === 'buy' ? cash - total : cash + total

  const canSubmit =
    selected &&
    validShares &&
    price !== null &&
    !priceLoading &&
    (type === 'buy' ? total <= cash : sharesNum <= maxSellShares)

  async function handleConfirm() {
    if (!canSubmit || !selected || !price) return
    const err = await onConfirm({
      symbol: selected.symbol,
      companyName: selected.companyName,
      type,
      shares: sharesNum,
      pricePerShare: price,
    })
    if (err) { setError(err); return }
    onClose()
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>

        <div className="modal-header">
          <h2>New Trade</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {/* BUY / SELL TOGGLE */}
        <div className="trade-toggle">
          <button
            className={`trade-toggle-btn ${type === 'buy' ? 'active-buy' : ''}`}
            onClick={() => { setType('buy'); setError(null) }}
          >Buy</button>
          <button
            className={`trade-toggle-btn ${type === 'sell' ? 'active-sell' : ''}`}
            onClick={() => { setType('sell'); setError(null) }}
          >Sell</button>
        </div>

        {/* STOCK PICKER */}
        <div className="field">
          <label className="field-label">Stock</label>
          <input
            className="input"
            placeholder="Search by name or ticker…"
            value={search}
            onChange={e => { setSearch(e.target.value); setSymbol(''); setError(null) }}
          />
          {search && !symbol && (
            <ul className="stock-list">
              {filtered.length === 0
                ? <li className="stock-list-empty">No results</li>
                : filtered.map(s => (
                  <li
                    key={s.symbol}
                    className="stock-list-item"
                    onClick={() => { setSymbol(s.symbol); setSearch(`${s.symbol} — ${s.companyName}`) }}
                  >
                    <span className="stock-list-sym">{s.symbol}</span>
                    <span className="stock-list-name">{s.companyName}</span>
                    <span className="stock-list-sector">{s.sector}</span>
                  </li>
                ))
              }
            </ul>
          )}
        </div>

        {/* SHARES */}
        <div className="field">
          <label className="field-label">
            Shares
            {type === 'sell' && maxSellShares > 0 &&
              <span className="field-hint">You own {maxSellShares}</span>
            }
          </label>
          <input
            className="input"
            type="number"
            min="1"
            max={type === 'sell' ? maxSellShares : undefined}
            placeholder="0"
            value={shares}
            onChange={e => { setShares(e.target.value); setError(null) }}
          />
        </div>

        {/* SUMMARY */}
        {selected && (
          <div className="trade-summary">
            <div className="summary-row">
              <span>Price per share</span>
              <span>
                {priceLoading && <span className="muted">Loading…</span>}
                {priceError  && <span className="down">Error</span>}
                {price !== null && `$${fmt(price)}`}
              </span>
            </div>
            <div className="summary-row">
              <span>Estimated {type === 'buy' ? 'cost' : 'proceeds'}</span>
              <span className="summary-total">{total > 0 ? `$${fmt(total)}` : '—'}</span>
            </div>
            <div className="summary-row summary-divider">
              <span>Cash {type === 'buy' ? 'remaining' : 'after sale'}</span>
              <span className={cashAfter < 0 ? 'down' : ''}>{total > 0 ? `$${fmt(cashAfter)}` : `$${fmt(cash)}`}</span>
            </div>
          </div>
        )}

        {priceError && (
          <p className="trade-error">Could not fetch price: {priceError}</p>
        )}
        {error && <p className="trade-error">{error}</p>}

        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button
            className={`btn ${type === 'buy' ? 'btn-primary' : 'btn-danger'}`}
            onClick={handleConfirm}
            disabled={!canSubmit}
          >
            Confirm {type === 'buy' ? 'Buy' : 'Sell'}
          </button>
        </div>

      </div>
    </div>
  )
}
