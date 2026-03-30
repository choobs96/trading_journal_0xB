import { useState, useMemo } from 'react';
import { useTrades } from '../context/TradeContext';
import { formatDuration } from '../utils/tradeStats';
import TradeDetailModal from '../components/TradeDetailModal';
import './TradeLog.css';

const PAGE_SIZES = [10, 25, 50];

export default function TradeLog() {
  const { enriched } = useTrades();
  const [sortKey, setSortKey] = useState('entry_datetime');
  const [sortDir, setSortDir] = useState('desc');
  const [filterSymbol, setFilterSymbol] = useState('All');
  const [filterSide, setFilterSide] = useState('All');
  const [filterOutcome, setFilterOutcome] = useState('All');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [selectedTrade, setSelectedTrade] = useState(null);

  const symbols = useMemo(
    () => ['All', ...new Set(enriched.map((t) => t.symbol))],
    [enriched],
  );

  const filtered = useMemo(() => {
    let result = [...enriched];
    if (filterSymbol !== 'All') result = result.filter((t) => t.symbol === filterSymbol);
    if (filterSide !== 'All') result = result.filter((t) => t.side === filterSide);
    if (filterOutcome !== 'All') result = result.filter((t) => t.outcome === filterOutcome);
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.symbol.toLowerCase().includes(s) ||
          String(t.id).includes(s),
      );
    }
    result.sort((a, b) => {
      let aVal = a[sortKey];
      let bVal = b[sortKey];
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return result;
  }, [enriched, filterSymbol, filterSide, filterOutcome, search, sortKey, sortDir]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sortIndicator = (key) => {
    if (sortKey !== key) return '';
    return sortDir === 'asc' ? ' ▲' : ' ▼';
  };

  const formatPNL = (val) => {
    const formatted = `$${Math.abs(val).toFixed(2)}`;
    return val >= 0 ? `+${formatted}` : `-${formatted}`;
  };

  return (
    <div className="trade-log">
      {/* Filters */}
      <div className="trade-log-filters">
        <input
          type="text"
          placeholder="Search by symbol or ID..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="filter-input"
        />
        <select value={filterSymbol} onChange={(e) => { setFilterSymbol(e.target.value); setPage(1); }} className="filter-select">
          {symbols.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select value={filterSide} onChange={(e) => { setFilterSide(e.target.value); setPage(1); }} className="filter-select">
          <option value="All">All Sides</option>
          <option value="long">Long</option>
          <option value="short">Short</option>
        </select>
        <select value={filterOutcome} onChange={(e) => { setFilterOutcome(e.target.value); setPage(1); }} className="filter-select">
          <option value="All">All Outcomes</option>
          <option value="Win">Win</option>
          <option value="Loss">Loss</option>
        </select>
        <div className="filter-count">{filtered.length} trades</div>
      </div>

      {/* Table */}
      <div className="trade-table-wrapper">
        <table className="trade-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('id')}>ID{sortIndicator('id')}</th>
              <th onClick={() => handleSort('symbol')}>Symbol{sortIndicator('symbol')}</th>
              <th onClick={() => handleSort('side')}>Side{sortIndicator('side')}</th>
              <th onClick={() => handleSort('quantity')}>Qty{sortIndicator('quantity')}</th>
              <th onClick={() => handleSort('entry_price')}>Entry{sortIndicator('entry_price')}</th>
              <th onClick={() => handleSort('exit_price')}>Exit{sortIndicator('exit_price')}</th>
              <th onClick={() => handleSort('stop_loss')}>Stop{sortIndicator('stop_loss')}</th>
              <th onClick={() => handleSort('pnl')}>P&L{sortIndicator('pnl')}</th>
              <th onClick={() => handleSort('rr')}>R:R{sortIndicator('rr')}</th>
              <th onClick={() => handleSort('duration')}>Duration{sortIndicator('duration')}</th>
              <th onClick={() => handleSort('entry_datetime')}>Entry Time{sortIndicator('entry_datetime')}</th>
              <th onClick={() => handleSort('outcome')}>Result{sortIndicator('outcome')}</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((t) => (
              <tr key={t.id} onClick={() => setSelectedTrade(t)} className="trade-row">
                <td className="cell-mono">{t.id}</td>
                <td><span className="symbol-badge">{t.symbol}</span></td>
                <td>
                  <span className={`side-badge side-${t.side}`}>
                    {t.side.toUpperCase()}
                  </span>
                </td>
                <td className="cell-mono">{t.quantity}</td>
                <td className="cell-mono">{t.entry_price}</td>
                <td className="cell-mono">{t.exit_price}</td>
                <td className="cell-mono">{t.stop_loss}</td>
                <td className={`cell-mono ${t.pnl >= 0 ? 'pnl-positive' : 'pnl-negative'}`}>
                  {formatPNL(t.pnl)}
                </td>
                <td className="cell-mono">{t.rr.toFixed(2)}</td>
                <td>{formatDuration(t.duration)}</td>
                <td className="cell-dim">{t.entry_datetime}</td>
                <td>
                  <span className={`outcome-badge outcome-${t.outcome.toLowerCase()}`}>
                    {t.outcome}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="trade-log-pagination">
        <div className="page-size-selector">
          <span>Show</span>
          {PAGE_SIZES.map((s) => (
            <button
              key={s}
              className={`page-size-btn ${pageSize === s ? 'active' : ''}`}
              onClick={() => { setPageSize(s); setPage(1); }}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="page-controls">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="page-btn">
            Prev
          </button>
          <span className="page-info">
            {page} / {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="page-btn"
          >
            Next
          </button>
        </div>
      </div>

      {selectedTrade && (
        <TradeDetailModal trade={selectedTrade} onClose={() => setSelectedTrade(null)} />
      )}
    </div>
  );
}
