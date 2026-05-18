import { useMemo } from 'react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts'

function fmtDollar(n) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(1)}k`
  return `$${n.toFixed(0)}`
}

function fmtDate(date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/**
 * Replay transactions to build a time-series of portfolio value.
 * Value at each point = cash + Σ(shares × last known price for that symbol).
 */
function buildSeries(transactions, startBalance) {
  if (!transactions || transactions.length === 0) return []

  const sorted = [...transactions].sort(
    (a, b) => a.executedAt.toDate() - b.executedAt.toDate()
  )

  let cash = startBalance
  const holdings  = {}  // symbol → shares
  const lastPrice = {}  // symbol → last seen pricePerShare

  const portfolioValue = () =>
    cash + Object.entries(holdings).reduce(
      (sum, [sym, shares]) => sum + shares * (lastPrice[sym] ?? 0), 0
    )

  const points = [{ date: fmtDate(sorted[0].executedAt.toDate()), value: startBalance }]

  for (const tx of sorted) {
    const { symbol, shares, pricePerShare, total, type } = tx
    lastPrice[symbol] = pricePerShare
    holdings[symbol]  = holdings[symbol] ?? 0

    if (type === 'buy') {
      cash -= total
      holdings[symbol] += shares
    } else {
      cash += total
      holdings[symbol] -= shares
      if (Math.abs(holdings[symbol]) < 1e-9) delete holdings[symbol]
    }

    points.push({ date: fmtDate(tx.executedAt.toDate()), value: portfolioValue() })
  }

  return points
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const value = payload[0].value
  return (
    <div style={{
      background: 'var(--white)',
      border: '1px solid var(--border)',
      borderRadius: 8,
      padding: '8px 12px',
      fontSize: '0.82rem',
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    }}>
      <div style={{ color: 'var(--muted)', marginBottom: 2 }}>{label}</div>
      <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
        ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>
    </div>
  )
}

export default function PortfolioChart({ transactions, startBalance }) {
  const data = useMemo(
    () => buildSeries(transactions, startBalance),
    [transactions, startBalance]
  )

  if (data.length < 2) {
    return (
      <p className="empty">Make your first trade to see portfolio value over time.</p>
    )
  }

  const finalValue = data[data.length - 1].value
  const isUp       = finalValue >= startBalance
  const colour     = isUp ? '#16a34a' : '#dc2626'

  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 10, right: 16, bottom: 0, left: 16 }}>
        <defs>
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={colour} stopOpacity={0.15} />
            <stop offset="95%" stopColor={colour} stopOpacity={0}    />
          </linearGradient>
        </defs>

        <CartesianGrid strokeDasharray="4 3" stroke="var(--border)" vertical={false} />

        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: 'var(--muted)' }}
          axisLine={false}
          tickLine={false}
          dy={8}
        />

        <YAxis
          tickFormatter={fmtDollar}
          tick={{ fontSize: 11, fill: 'var(--muted)' }}
          axisLine={false}
          tickLine={false}
          width={60}
          domain={['auto', 'auto']}
        />

        <Tooltip content={<CustomTooltip />} />

        <ReferenceLine
          y={startBalance}
          stroke="var(--muted)"
          strokeDasharray="6 4"
          strokeOpacity={0.5}
        />

        <Area
          type="monotone"
          dataKey="value"
          stroke={colour}
          strokeWidth={2.5}
          fill="url(#chartGradient)"
          dot={{ r: 4, fill: colour, stroke: 'white', strokeWidth: 2 }}
          activeDot={{ r: 5 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
