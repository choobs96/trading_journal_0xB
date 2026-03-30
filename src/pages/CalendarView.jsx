import { useMemo, useState } from 'react';
import { useTrades } from '../context/TradeContext';
import { enrichTrades } from '../utils/tradeStats';
import TradeDetailModal from '../components/TradeDetailModal';
import './CalendarView.css';

export default function CalendarView() {
  const { trades } = useTrades();
  const [selectedTrade, setSelectedTrade] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(() => {
    // Default to the month with the most trades
    const months = {};
    for (const t of trades) {
      const m = t.entry_datetime.substring(0, 7);
      months[m] = (months[m] || 0) + 1;
    }
    const best = Object.entries(months).sort((a, b) => b[1] - a[1])[0];
    return best ? new Date(best[0] + '-01') : new Date();
  });

  const enriched = useMemo(() => enrichTrades(trades), [trades]);

  // Group trades by date
  const tradesByDate = useMemo(() => {
    const map = {};
    for (const t of enriched) {
      const date = t.entry_datetime.split(' ')[0];
      if (!map[date]) map[date] = [];
      map[date].push(t);
    }
    return map;
  }, [enriched]);

  // Daily summaries
  const dailySummary = useMemo(() => {
    const map = {};
    for (const [date, dayTrades] of Object.entries(tradesByDate)) {
      const pnl = dayTrades.reduce((s, t) => s + t.pnl, 0);
      const wins = dayTrades.filter((t) => t.pnl > 0).length;
      map[date] = {
        pnl: Math.round(pnl * 100) / 100,
        trades: dayTrades.length,
        wins,
        losses: dayTrades.length - wins,
      };
    }
    return map;
  }, [tradesByDate]);

  // Calendar grid
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const calendarDays = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

  const monthLabel = currentMonth.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const formatDate = (day) => {
    const m = String(month + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${year}-${m}-${d}`;
  };

  // Monthly totals
  const monthlyTotal = useMemo(() => {
    const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;
    let pnl = 0;
    let tradeCount = 0;
    let wins = 0;
    for (const [date, summary] of Object.entries(dailySummary)) {
      if (date.startsWith(prefix)) {
        pnl += summary.pnl;
        tradeCount += summary.trades;
        wins += summary.wins;
      }
    }
    return {
      pnl: Math.round(pnl * 100) / 100,
      trades: tradeCount,
      winRate: tradeCount > 0 ? Math.round((wins / tradeCount) * 100) : 0,
    };
  }, [dailySummary, year, month]);

  return (
    <div className="calendar-view">
      {/* Header */}
      <div className="calendar-header">
        <button onClick={prevMonth} className="cal-nav-btn">&larr;</button>
        <h2 className="cal-month-label">{monthLabel}</h2>
        <button onClick={nextMonth} className="cal-nav-btn">&rarr;</button>
      </div>

      {/* Monthly summary */}
      <div className="cal-monthly-summary">
        <span className={`cal-monthly-pnl ${monthlyTotal.pnl >= 0 ? 'positive' : 'negative'}`}>
          {monthlyTotal.pnl >= 0 ? '+' : ''}${monthlyTotal.pnl.toFixed(2)}
        </span>
        <span className="cal-monthly-meta">
          {monthlyTotal.trades} trades &middot; {monthlyTotal.winRate}% win rate
        </span>
      </div>

      {/* Calendar Grid */}
      <div className="calendar-grid">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="cal-day-header">{d}</div>
        ))}
        {calendarDays.map((day, i) => {
          if (day === null) return <div key={`empty-${i}`} className="cal-cell empty" />;
          const dateStr = formatDate(day);
          const summary = dailySummary[dateStr];
          const dayTrades = tradesByDate[dateStr];
          return (
            <div
              key={day}
              className={`cal-cell ${summary ? 'has-trades' : ''} ${summary?.pnl >= 0 && summary ? 'cal-win' : ''} ${summary?.pnl < 0 ? 'cal-loss' : ''}`}
            >
              <div className="cal-day-number">{day}</div>
              {summary && (
                <div className="cal-day-content">
                  <div className={`cal-day-pnl ${summary.pnl >= 0 ? 'positive' : 'negative'}`}>
                    {summary.pnl >= 0 ? '+' : ''}${summary.pnl.toFixed(2)}
                  </div>
                  <div className="cal-day-meta">
                    {summary.trades}T &middot; {summary.wins}W {summary.losses}L
                  </div>
                  <div className="cal-day-trades">
                    {dayTrades.map((t) => (
                      <button
                        key={t.id}
                        className={`cal-trade-chip ${t.pnl >= 0 ? 'chip-win' : 'chip-loss'}`}
                        onClick={() => setSelectedTrade(t)}
                      >
                        {t.symbol.replace('USDT', '')}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {selectedTrade && (
        <TradeDetailModal trade={selectedTrade} onClose={() => setSelectedTrade(null)} />
      )}
    </div>
  );
}
