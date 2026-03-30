import { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { useTrades } from '../context/TradeContext';
import { enrichTrades, computeStats, formatDuration } from '../utils/tradeStats';
import './Playbook.css';

function fmt(val) {
  if (val === undefined || val === null) return '$0';
  const abs = Math.abs(val);
  if (abs >= 1000) return `$${(val / 1000).toFixed(1)}K`;
  return `$${val.toFixed(2)}`;
}

export default function Playbook() {
  const { trades } = useTrades();
  const enriched = useMemo(() => enrichTrades(trades), [trades]);
  const [tags, setTags] = useState({}); // { tradeId: [tag1, tag2] }
  const [newTagInput, setNewTagInput] = useState({});
  const [filterTag, setFilterTag] = useState('All');

  // Derived: all unique tags
  const allTags = useMemo(() => {
    const set = new Set();
    Object.values(tags).forEach((arr) => arr.forEach((t) => set.add(t)));
    return ['All', ...Array.from(set).sort()];
  }, [tags]);

  // Auto-generate setup tags based on trade characteristics
  const autoTags = useMemo(() => {
    const result = {};
    for (const t of enriched) {
      const auto = [];
      // Classify by instrument type
      if (t.symbol.includes('USD') && !t.symbol.includes('USDT')) auto.push('Forex');
      if (t.symbol.includes('BTC')) auto.push('Bitcoin');
      if (t.symbol.includes('ETH')) auto.push('Ethereum');
      if (t.symbol.includes('USDT')) auto.push('Crypto');

      // Classify by duration
      if (t.duration < 60) auto.push('Scalp');
      else if (t.duration < 240) auto.push('Intraday');
      else auto.push('Swing');

      // Side
      auto.push(t.side === 'long' ? 'Long' : 'Short');

      // Size category
      if (t.quantity <= 10) auto.push('Small Size');
      else if (t.quantity <= 100) auto.push('Medium Size');
      else auto.push('Large Size');

      result[t.id] = [...auto, ...(tags[t.id] || [])];
    }
    return result;
  }, [enriched, tags]);

  // All strategy tags including auto
  const allStrategyTags = useMemo(() => {
    const set = new Set();
    Object.values(autoTags).forEach((arr) => arr.forEach((t) => set.add(t)));
    return ['All', ...Array.from(set).sort()];
  }, [autoTags]);

  // Performance by tag
  const perfByTag = useMemo(() => {
    const map = {};
    for (const t of enriched) {
      const tradeTags = autoTags[t.id] || [];
      for (const tag of tradeTags) {
        if (!map[tag]) map[tag] = { tag, pnl: 0, trades: 0, wins: 0, totalDuration: 0, totalRR: 0 };
        map[tag].pnl += t.pnl;
        map[tag].trades++;
        if (t.pnl > 0) map[tag].wins++;
        map[tag].totalDuration += t.duration;
        map[tag].totalRR += t.rr;
      }
    }
    return Object.values(map)
      .map((m) => ({
        ...m,
        pnl: Math.round(m.pnl * 100) / 100,
        winRate: Math.round((m.wins / m.trades) * 100),
        avgRR: (m.totalRR / m.trades).toFixed(2),
        avgDuration: formatDuration(m.totalDuration / m.trades),
      }))
      .sort((a, b) => b.pnl - a.pnl);
  }, [enriched, autoTags]);

  // Filtered trades by selected tag
  const filteredTrades = useMemo(() => {
    if (filterTag === 'All') return enriched;
    return enriched.filter((t) => (autoTags[t.id] || []).includes(filterTag));
  }, [enriched, autoTags, filterTag]);

  const filteredStats = useMemo(() => {
    if (filteredTrades.length === 0) return null;
    const wins = filteredTrades.filter((t) => t.pnl > 0);
    const totalPNL = filteredTrades.reduce((s, t) => s + t.pnl, 0);
    return {
      totalPNL: Math.round(totalPNL * 100) / 100,
      trades: filteredTrades.length,
      winRate: Math.round((wins.length / filteredTrades.length) * 100),
      avgRR: (filteredTrades.reduce((s, t) => s + t.rr, 0) / filteredTrades.length).toFixed(2),
    };
  }, [filteredTrades]);

  const addTag = (tradeId) => {
    const val = newTagInput[tradeId]?.trim();
    if (!val) return;
    setTags((prev) => ({
      ...prev,
      [tradeId]: [...(prev[tradeId] || []), val],
    }));
    setNewTagInput((prev) => ({ ...prev, [tradeId]: '' }));
  };

  return (
    <div className="playbook">
      <div className="playbook-header">
        <div>
          <h2>Strategy Playbook</h2>
          <p className="playbook-desc">
            Track performance across different setups, strategies, and market conditions.
            Trades are auto-tagged by instrument, duration, side, and size.
          </p>
        </div>
      </div>

      {/* Strategy Performance Table */}
      <div className="chart-section full-width">
        <h3 className="chart-title">Performance by Strategy / Tag</h3>
        <div className="playbook-table-wrapper">
          <table className="playbook-table">
            <thead>
              <tr>
                <th>Strategy / Tag</th>
                <th>P&L</th>
                <th>Trades</th>
                <th>Win Rate</th>
                <th>Avg R:R</th>
                <th>Avg Duration</th>
              </tr>
            </thead>
            <tbody>
              {perfByTag.map((row) => (
                <tr
                  key={row.tag}
                  className={`playbook-row ${filterTag === row.tag ? 'active' : ''}`}
                  onClick={() => setFilterTag(filterTag === row.tag ? 'All' : row.tag)}
                >
                  <td>
                    <span className="strategy-tag">{row.tag}</span>
                  </td>
                  <td className={row.pnl >= 0 ? 'pnl-positive' : 'pnl-negative'}>
                    {fmt(row.pnl)}
                  </td>
                  <td>{row.trades}</td>
                  <td>
                    <span className={row.winRate >= 50 ? 'wr-good' : 'wr-bad'}>
                      {row.winRate}%
                    </span>
                  </td>
                  <td>{row.avgRR}</td>
                  <td>{row.avgDuration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Chart: PNL by Strategy */}
      <div className="chart-section full-width">
        <h3 className="chart-title">P&L by Strategy</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={perfByTag} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2d35" />
            <XAxis type="number" stroke="#6a6f78" tick={{ fontSize: 11 }} tickFormatter={fmt} />
            <YAxis type="category" dataKey="tag" stroke="#6a6f78" tick={{ fontSize: 11 }} width={120} />
            <Tooltip formatter={(v) => fmt(v)} />
            <Bar dataKey="pnl" name="P&L" radius={[0, 4, 4, 0]}>
              {perfByTag.map((e, i) => (
                <Cell key={i} fill={e.pnl >= 0 ? '#4ade80' : '#f87171'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Filtered summary */}
      {filterTag !== 'All' && filteredStats && (
        <div className="chart-section full-width">
          <h3 className="chart-title">
            Filtered: <span className="filter-tag-highlight">{filterTag}</span>
          </h3>
          <div className="filtered-stats">
            <div className="filtered-stat">
              <span className="filtered-stat-label">P&L</span>
              <span className={`filtered-stat-value ${filteredStats.totalPNL >= 0 ? 'pnl-positive' : 'pnl-negative'}`}>
                {fmt(filteredStats.totalPNL)}
              </span>
            </div>
            <div className="filtered-stat">
              <span className="filtered-stat-label">Trades</span>
              <span className="filtered-stat-value">{filteredStats.trades}</span>
            </div>
            <div className="filtered-stat">
              <span className="filtered-stat-label">Win Rate</span>
              <span className="filtered-stat-value">{filteredStats.winRate}%</span>
            </div>
            <div className="filtered-stat">
              <span className="filtered-stat-label">Avg R:R</span>
              <span className="filtered-stat-value">{filteredStats.avgRR}</span>
            </div>
          </div>
          <button className="clear-filter-btn" onClick={() => setFilterTag('All')}>Clear Filter</button>
        </div>
      )}
    </div>
  );
}
