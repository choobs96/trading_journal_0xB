import { useMemo, useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend,
} from 'recharts';
import { useTrades } from '../context/TradeContext';
import {
  enrichTrades, computeStats, formatDuration,
} from '../utils/tradeStats';
import './Analytics.css';

const COLORS = {
  green: '#4ade80', red: '#f87171', blue: '#60a5fa',
  purple: '#a78bfa', orange: '#fb923c', cyan: '#22d3ee',
};

function fmt(val) {
  if (val === undefined || val === null) return '$0';
  const abs = Math.abs(val);
  if (abs >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${(val / 1_000).toFixed(1)}K`;
  return `$${val.toFixed(2)}`;
}

export default function Analytics() {
  const { trades } = useTrades();
  const enriched = useMemo(() => enrichTrades(trades), [trades]);
  const [period, setPeriod] = useState('all');

  // Filter by period
  const filtered = useMemo(() => {
    if (period === 'all') return enriched;
    const now = new Date();
    const cutoff = new Date();
    if (period === '7d') cutoff.setDate(now.getDate() - 7);
    else if (period === '30d') cutoff.setDate(now.getDate() - 30);
    else if (period === '90d') cutoff.setDate(now.getDate() - 90);
    return enriched.filter((t) => new Date(t.entry_datetime) >= cutoff);
  }, [enriched, period]);

  const stats = useMemo(() => computeStats(trades), [trades]);

  // ── Consecutive PNL (trade-by-trade) ──
  const tradeByTrade = useMemo(() => {
    const sorted = [...filtered].sort((a, b) => new Date(a.exit_datetime) - new Date(b.exit_datetime));
    let cum = 0;
    return sorted.map((t, i) => {
      cum += t.pnl;
      return { index: i + 1, pnl: Math.round(t.pnl * 100) / 100, cumPNL: Math.round(cum * 100) / 100, symbol: t.symbol };
    });
  }, [filtered]);

  // ── Win distribution (PNL histogram) ──
  const pnlHistogram = useMemo(() => {
    const buckets = {};
    const step = 500;
    for (const t of filtered) {
      const bucket = Math.floor(t.pnl / step) * step;
      const label = `${bucket >= 0 ? '+' : ''}${bucket}`;
      if (!buckets[label]) buckets[label] = { label, count: 0, bucket };
      buckets[label].count++;
    }
    return Object.values(buckets).sort((a, b) => a.bucket - b.bucket);
  }, [filtered]);

  // ── Duration vs PNL scatter ──
  const durationVsPnl = useMemo(() =>
    filtered.map((t) => ({
      duration: Math.round(t.duration),
      pnl: Math.round(t.pnl * 100) / 100,
      symbol: t.symbol,
      rr: t.rr?.toFixed(2),
    })),
  [filtered]);

  // ── Quantity vs PNL scatter ──
  const qtyVsPnl = useMemo(() =>
    filtered.map((t) => ({
      quantity: t.quantity,
      pnl: Math.round(t.pnl * 100) / 100,
      symbol: t.symbol,
    })),
  [filtered]);

  // ── Rolling metrics (10-trade rolling average) ──
  const rollingStats = useMemo(() => {
    const sorted = [...filtered].sort((a, b) => new Date(a.exit_datetime) - new Date(b.exit_datetime));
    const window = 10;
    const result = [];
    for (let i = window - 1; i < sorted.length; i++) {
      const slice = sorted.slice(i - window + 1, i + 1);
      const avgPNL = slice.reduce((s, t) => s + t.pnl, 0) / window;
      const winCount = slice.filter((t) => t.pnl > 0).length;
      result.push({
        index: i + 1,
        avgPNL: Math.round(avgPNL * 100) / 100,
        winRate: Math.round((winCount / window) * 100),
      });
    }
    return result;
  }, [filtered]);

  // ── MAE/MFE approximation (using entry/exit/stop) ──
  const maeData = useMemo(() =>
    filtered.map((t) => {
      const risk = Math.abs(t.entry_price - t.stop_loss);
      let mae, mfe;
      if (t.side === 'long') {
        mae = Math.max(0, t.entry_price - Math.min(t.exit_price, t.stop_loss));
        mfe = Math.max(0, t.exit_price - t.entry_price);
      } else {
        mae = Math.max(0, Math.max(t.exit_price, t.stop_loss) - t.entry_price);
        mfe = Math.max(0, t.entry_price - t.exit_price);
      }
      return {
        mae: risk > 0 ? Math.round((mae / risk) * 100) / 100 : 0,
        mfe: risk > 0 ? Math.round((mfe / risk) * 100) / 100 : 0,
        outcome: t.outcome,
      };
    }),
  [filtered]);

  // ── Session performance (morning/afternoon/evening) ──
  const sessionPerf = useMemo(() => {
    const sessions = {
      'Morning (6-12)': { pnl: 0, trades: 0, wins: 0 },
      'Afternoon (12-18)': { pnl: 0, trades: 0, wins: 0 },
      'Evening (18-24)': { pnl: 0, trades: 0, wins: 0 },
    };
    for (const t of filtered) {
      const h = new Date(t.entry_datetime).getHours();
      let session;
      if (h >= 6 && h < 12) session = 'Morning (6-12)';
      else if (h >= 12 && h < 18) session = 'Afternoon (12-18)';
      else session = 'Evening (18-24)';
      sessions[session].pnl += t.pnl;
      sessions[session].trades++;
      if (t.pnl > 0) sessions[session].wins++;
    }
    return Object.entries(sessions)
      .filter(([, v]) => v.trades > 0)
      .map(([session, v]) => ({
        session,
        pnl: Math.round(v.pnl * 100) / 100,
        trades: v.trades,
        winRate: Math.round((v.wins / v.trades) * 100),
      }));
  }, [filtered]);

  // ── Holding time analysis ──
  const holdingTimeAnalysis = useMemo(() => {
    const bins = [
      { label: '< 1h', min: 0, max: 60 },
      { label: '1-2h', min: 60, max: 120 },
      { label: '2-4h', min: 120, max: 240 },
      { label: '4-6h', min: 240, max: 360 },
      { label: '6h+', min: 360, max: Infinity },
    ];
    return bins.map((b) => {
      const inBin = filtered.filter((t) => t.duration >= b.min && t.duration < b.max);
      const pnl = inBin.reduce((s, t) => s + t.pnl, 0);
      const wins = inBin.filter((t) => t.pnl > 0).length;
      return {
        label: b.label,
        trades: inBin.length,
        pnl: Math.round(pnl * 100) / 100,
        winRate: inBin.length > 0 ? Math.round((wins / inBin.length) * 100) : 0,
      };
    }).filter((b) => b.trades > 0);
  }, [filtered]);

  return (
    <div className="analytics">
      {/* Period selector */}
      <div className="analytics-header">
        <h2>Advanced Analytics</h2>
        <div className="period-selector">
          {['7d', '30d', '90d', 'all'].map((p) => (
            <button
              key={p}
              className={`period-btn ${period === p ? 'active' : ''}`}
              onClick={() => setPeriod(p)}
            >
              {p === 'all' ? 'All Time' : `Last ${p}`}
            </button>
          ))}
        </div>
      </div>

      {/* Trade-by-trade equity */}
      <div className="chart-section full-width">
        <h3 className="chart-title">Trade-by-Trade P&L</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={tradeByTrade}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2d35" />
            <XAxis dataKey="index" stroke="#6a6f78" tick={{ fontSize: 10 }} />
            <YAxis stroke="#6a6f78" tick={{ fontSize: 11 }} tickFormatter={fmt} />
            <Tooltip formatter={(v) => fmt(v)} />
            <Bar dataKey="pnl" name="P&L" radius={[2, 2, 0, 0]}>
              {tradeByTrade.map((e, i) => (
                <Cell key={i} fill={e.pnl >= 0 ? COLORS.green : COLORS.red} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Rolling metrics */}
      <div className="chart-section full-width">
        <h3 className="chart-title">10-Trade Rolling Average P&L &amp; Win Rate</h3>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={rollingStats}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2d35" />
            <XAxis dataKey="index" stroke="#6a6f78" tick={{ fontSize: 10 }} />
            <YAxis yAxisId="pnl" stroke="#6a6f78" tick={{ fontSize: 11 }} tickFormatter={fmt} />
            <YAxis yAxisId="wr" orientation="right" stroke="#6a6f78" tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} domain={[0, 100]} />
            <Tooltip />
            <Legend />
            <Line yAxisId="pnl" type="monotone" dataKey="avgPNL" stroke={COLORS.blue} name="Avg P&L" dot={false} strokeWidth={2} />
            <Line yAxisId="wr" type="monotone" dataKey="winRate" stroke={COLORS.purple} name="Win Rate %" dot={false} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-row">
        {/* PNL Histogram */}
        <div className="chart-section flex-1">
          <h3 className="chart-title">P&L Distribution</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={pnlHistogram}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2d35" />
              <XAxis dataKey="label" stroke="#6a6f78" tick={{ fontSize: 10 }} />
              <YAxis stroke="#6a6f78" tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" name="Trades" radius={[4, 4, 0, 0]}>
                {pnlHistogram.map((e, i) => (
                  <Cell key={i} fill={e.bucket >= 0 ? COLORS.green : COLORS.red} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Holding Time Analysis */}
        <div className="chart-section flex-1">
          <h3 className="chart-title">Performance by Holding Time</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={holdingTimeAnalysis}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2d35" />
              <XAxis dataKey="label" stroke="#6a6f78" tick={{ fontSize: 11 }} />
              <YAxis stroke="#6a6f78" tick={{ fontSize: 11 }} tickFormatter={fmt} />
              <Tooltip formatter={(v, name) => name === 'P&L' ? fmt(v) : v} />
              <Legend />
              <Bar dataKey="pnl" name="P&L" radius={[4, 4, 0, 0]}>
                {holdingTimeAnalysis.map((e, i) => (
                  <Cell key={i} fill={e.pnl >= 0 ? COLORS.green : COLORS.red} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="chart-row">
        {/* Duration vs PNL Scatter */}
        <div className="chart-section flex-1">
          <h3 className="chart-title">Duration vs P&L</h3>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2d35" />
              <XAxis dataKey="duration" name="Duration (min)" stroke="#6a6f78" tick={{ fontSize: 10 }} />
              <YAxis dataKey="pnl" name="P&L" stroke="#6a6f78" tick={{ fontSize: 10 }} tickFormatter={fmt} />
              <Tooltip formatter={(v, name) => name === 'P&L' ? fmt(v) : `${v} min`} />
              <Scatter data={durationVsPnl} fill={COLORS.blue}>
                {durationVsPnl.map((e, i) => (
                  <Cell key={i} fill={e.pnl >= 0 ? COLORS.green : COLORS.red} opacity={0.7} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Position Size vs PNL Scatter */}
        <div className="chart-section flex-1">
          <h3 className="chart-title">Position Size vs P&L</h3>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2d35" />
              <XAxis dataKey="quantity" name="Quantity" stroke="#6a6f78" tick={{ fontSize: 10 }} />
              <YAxis dataKey="pnl" name="P&L" stroke="#6a6f78" tick={{ fontSize: 10 }} tickFormatter={fmt} />
              <Tooltip formatter={(v, name) => name === 'P&L' ? fmt(v) : v} />
              <Scatter data={qtyVsPnl} fill={COLORS.purple}>
                {qtyVsPnl.map((e, i) => (
                  <Cell key={i} fill={e.pnl >= 0 ? COLORS.green : COLORS.red} opacity={0.7} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* MAE vs MFE */}
      <div className="chart-section full-width">
        <h3 className="chart-title">MAE vs MFE (in R-multiples)</h3>
        <p className="chart-subtitle">Maximum Adverse Excursion vs Maximum Favorable Excursion helps identify trade management quality</p>
        <ResponsiveContainer width="100%" height={300}>
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2d35" />
            <XAxis dataKey="mae" name="MAE (R)" stroke="#6a6f78" tick={{ fontSize: 10 }} />
            <YAxis dataKey="mfe" name="MFE (R)" stroke="#6a6f78" tick={{ fontSize: 10 }} />
            <Tooltip formatter={(v) => `${v}R`} />
            <Scatter data={maeData} fill={COLORS.orange}>
              {maeData.map((e, i) => (
                <Cell key={i} fill={e.outcome === 'Win' ? COLORS.green : COLORS.red} opacity={0.6} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Session Performance */}
      <div className="chart-section full-width">
        <h3 className="chart-title">Trading Session Performance</h3>
        <div className="session-cards">
          {sessionPerf.map((s) => (
            <div key={s.session} className="session-card">
              <div className="session-label">{s.session}</div>
              <div className={`session-pnl ${s.pnl >= 0 ? 'positive' : 'negative'}`}>
                {fmt(s.pnl)}
              </div>
              <div className="session-meta">
                {s.trades} trades &middot; {s.winRate}% WR
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Key insights summary */}
      <div className="chart-section full-width insights-section">
        <h3 className="chart-title">Key Insights</h3>
        <div className="insights-grid">
          <div className="insight-card">
            <div className="insight-label">Avg Win / Avg Loss Ratio</div>
            <div className="insight-value">
              {stats.avgLoss > 0 ? (stats.avgWin / stats.avgLoss).toFixed(2) : 'N/A'}
            </div>
            <div className="insight-note">
              {stats.avgLoss > 0 && stats.avgWin / stats.avgLoss >= 1.5 ? 'Healthy ratio - winners outpace losers' : 'Consider letting winners run longer'}
            </div>
          </div>
          <div className="insight-card">
            <div className="insight-label">Recovery Factor</div>
            <div className="insight-value">
              {stats.maxDrawdown > 0 ? (stats.totalPNL / stats.maxDrawdown).toFixed(2) : 'N/A'}
            </div>
            <div className="insight-note">
              Total P&L relative to max drawdown
            </div>
          </div>
          <div className="insight-card">
            <div className="insight-label">Payoff Ratio</div>
            <div className="insight-value">
              {stats.avgLoss > 0 ? (stats.avgWin / stats.avgLoss).toFixed(2) : 'N/A'}
            </div>
            <div className="insight-note">
              Average win divided by average loss
            </div>
          </div>
          <div className="insight-card">
            <div className="insight-label">Avg Hold Time</div>
            <div className="insight-value">{formatDuration(stats.avgDuration)}</div>
            <div className="insight-note">
              Average trade duration across all trades
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
