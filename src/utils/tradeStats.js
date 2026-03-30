/**
 * Core trade statistics engine.
 * All PNL calculations, performance metrics, and aggregations live here.
 */

export function calculatePNL(trade) {
  const { side, quantity, entry_price, exit_price } = trade;
  if (side === 'long') {
    return (exit_price - entry_price) * quantity;
  }
  return (entry_price - exit_price) * quantity;
}

export function calculateRiskReward(trade) {
  const { side, entry_price, exit_price, stop_loss } = trade;
  const risk = Math.abs(entry_price - stop_loss);
  if (risk === 0) return 0;
  const reward =
    side === 'long'
      ? exit_price - entry_price
      : entry_price - exit_price;
  return reward / risk;
}

export function calculateDuration(trade) {
  const start = new Date(trade.entry_datetime);
  const end = new Date(trade.exit_datetime);
  return (end - start) / (1000 * 60); // minutes
}

export function formatDuration(minutes) {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return `${h}h ${m}m`;
}

export function isWin(trade) {
  return calculatePNL(trade) > 0;
}

export function enrichTrade(trade) {
  const pnl = calculatePNL(trade);
  const rr = calculateRiskReward(trade);
  const duration = calculateDuration(trade);
  const outcome = pnl > 0 ? 'Win' : pnl < 0 ? 'Loss' : 'Breakeven';
  return { ...trade, pnl, rr, duration, outcome };
}

export function enrichTrades(trades) {
  return trades.map(enrichTrade);
}

// ─── Aggregate Stats ───────────────────────────────────────────

export function computeStats(trades) {
  const enriched = enrichTrades(trades);
  if (enriched.length === 0) return emptyStats();

  const wins = enriched.filter((t) => t.pnl > 0);
  const losses = enriched.filter((t) => t.pnl < 0);

  const totalPNL = enriched.reduce((s, t) => s + t.pnl, 0);
  const grossProfit = wins.reduce((s, t) => s + t.pnl, 0);
  const grossLoss = Math.abs(losses.reduce((s, t) => s + t.pnl, 0));

  const winRate = (wins.length / enriched.length) * 100;
  const profitFactor = grossLoss === 0 ? Infinity : grossProfit / grossLoss;
  const avgWin = wins.length > 0 ? grossProfit / wins.length : 0;
  const avgLoss = losses.length > 0 ? grossLoss / losses.length : 0;
  const avgRR =
    enriched.reduce((s, t) => s + t.rr, 0) / enriched.length;
  const expectancy =
    (winRate / 100) * avgWin - ((100 - winRate) / 100) * avgLoss;

  const bestTrade = enriched.reduce(
    (best, t) => (t.pnl > best.pnl ? t : best),
    enriched[0],
  );
  const worstTrade = enriched.reduce(
    (worst, t) => (t.pnl < worst.pnl ? t : worst),
    enriched[0],
  );

  const avgDuration =
    enriched.reduce((s, t) => s + t.duration, 0) / enriched.length;

  // Max drawdown from equity curve
  const sorted = [...enriched].sort(
    (a, b) => new Date(a.exit_datetime) - new Date(b.exit_datetime),
  );
  let peak = 0;
  let cumPNL = 0;
  let maxDrawdown = 0;
  for (const t of sorted) {
    cumPNL += t.pnl;
    if (cumPNL > peak) peak = cumPNL;
    const dd = peak - cumPNL;
    if (dd > maxDrawdown) maxDrawdown = dd;
  }

  // Streaks
  let currentStreak = 0;
  let maxWinStreak = 0;
  let maxLossStreak = 0;
  let tempWin = 0;
  let tempLoss = 0;
  for (const t of sorted) {
    if (t.pnl > 0) {
      tempWin++;
      tempLoss = 0;
    } else {
      tempLoss++;
      tempWin = 0;
    }
    maxWinStreak = Math.max(maxWinStreak, tempWin);
    maxLossStreak = Math.max(maxLossStreak, tempLoss);
  }
  // Current streak
  for (let i = sorted.length - 1; i >= 0; i--) {
    const last = sorted[sorted.length - 1];
    if (sorted[i].pnl > 0 === last.pnl > 0) {
      currentStreak++;
    } else break;
  }
  currentStreak *= sorted[sorted.length - 1]?.pnl > 0 ? 1 : -1;

  return {
    totalPNL,
    totalTrades: enriched.length,
    wins: wins.length,
    losses: losses.length,
    winRate,
    profitFactor,
    avgWin,
    avgLoss,
    avgRR,
    expectancy,
    bestTrade,
    worstTrade,
    maxDrawdown,
    avgDuration,
    grossProfit,
    grossLoss,
    maxWinStreak,
    maxLossStreak,
    currentStreak,
  };
}

function emptyStats() {
  return {
    totalPNL: 0,
    totalTrades: 0,
    wins: 0,
    losses: 0,
    winRate: 0,
    profitFactor: 0,
    avgWin: 0,
    avgLoss: 0,
    avgRR: 0,
    expectancy: 0,
    bestTrade: null,
    worstTrade: null,
    maxDrawdown: 0,
    avgDuration: 0,
    grossProfit: 0,
    grossLoss: 0,
    maxWinStreak: 0,
    maxLossStreak: 0,
    currentStreak: 0,
  };
}

// ─── Time-series data for charts ───────────────────────────────

export function getEquityCurve(trades) {
  const enriched = enrichTrades(trades);
  const sorted = [...enriched].sort(
    (a, b) => new Date(a.exit_datetime) - new Date(b.exit_datetime),
  );
  let cumPNL = 0;
  return sorted.map((t) => {
    cumPNL += t.pnl;
    return {
      date: t.exit_datetime.split(' ')[0],
      datetime: t.exit_datetime,
      pnl: t.pnl,
      cumPNL: Math.round(cumPNL * 100) / 100,
      symbol: t.symbol,
      id: t.id,
    };
  });
}

export function getDailyPNL(trades) {
  const enriched = enrichTrades(trades);
  const daily = {};
  for (const t of enriched) {
    const date = t.entry_datetime.split(' ')[0];
    if (!daily[date]) {
      daily[date] = { date, pnl: 0, trades: 0, wins: 0, losses: 0 };
    }
    daily[date].pnl += t.pnl;
    daily[date].trades++;
    if (t.pnl > 0) daily[date].wins++;
    else daily[date].losses++;
  }
  return Object.values(daily)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((d) => ({ ...d, pnl: Math.round(d.pnl * 100) / 100 }));
}

export function getPNLBySymbol(trades) {
  const enriched = enrichTrades(trades);
  const bySymbol = {};
  for (const t of enriched) {
    if (!bySymbol[t.symbol]) {
      bySymbol[t.symbol] = {
        symbol: t.symbol,
        pnl: 0,
        trades: 0,
        wins: 0,
        winRate: 0,
      };
    }
    bySymbol[t.symbol].pnl += t.pnl;
    bySymbol[t.symbol].trades++;
    if (t.pnl > 0) bySymbol[t.symbol].wins++;
  }
  return Object.values(bySymbol).map((s) => ({
    ...s,
    pnl: Math.round(s.pnl * 100) / 100,
    winRate: Math.round((s.wins / s.trades) * 100),
  }));
}

export function getPNLBySide(trades) {
  const enriched = enrichTrades(trades);
  const bySide = { long: { pnl: 0, trades: 0, wins: 0 }, short: { pnl: 0, trades: 0, wins: 0 } };
  for (const t of enriched) {
    bySide[t.side].pnl += t.pnl;
    bySide[t.side].trades++;
    if (t.pnl > 0) bySide[t.side].wins++;
  }
  return [
    {
      side: 'Long',
      pnl: Math.round(bySide.long.pnl * 100) / 100,
      trades: bySide.long.trades,
      winRate: bySide.long.trades > 0 ? Math.round((bySide.long.wins / bySide.long.trades) * 100) : 0,
    },
    {
      side: 'Short',
      pnl: Math.round(bySide.short.pnl * 100) / 100,
      trades: bySide.short.trades,
      winRate: bySide.short.trades > 0 ? Math.round((bySide.short.wins / bySide.short.trades) * 100) : 0,
    },
  ];
}

export function getDrawdownCurve(trades) {
  const enriched = enrichTrades(trades);
  const sorted = [...enriched].sort(
    (a, b) => new Date(a.exit_datetime) - new Date(b.exit_datetime),
  );
  let peak = 0;
  let cumPNL = 0;
  return sorted.map((t) => {
    cumPNL += t.pnl;
    if (cumPNL > peak) peak = cumPNL;
    const drawdown = cumPNL - peak;
    return {
      date: t.exit_datetime.split(' ')[0],
      datetime: t.exit_datetime,
      drawdown: Math.round(drawdown * 100) / 100,
    };
  });
}

export function getMonthlyReturns(trades) {
  const enriched = enrichTrades(trades);
  const monthly = {};
  for (const t of enriched) {
    const month = t.entry_datetime.substring(0, 7); // YYYY-MM
    if (!monthly[month]) {
      monthly[month] = { month, pnl: 0, trades: 0, wins: 0 };
    }
    monthly[month].pnl += t.pnl;
    monthly[month].trades++;
    if (t.pnl > 0) monthly[month].wins++;
  }
  return Object.values(monthly)
    .sort((a, b) => a.month.localeCompare(b.month))
    .map((m) => ({
      ...m,
      pnl: Math.round(m.pnl * 100) / 100,
      winRate: Math.round((m.wins / m.trades) * 100),
    }));
}

export function getWeekdayPerformance(trades) {
  const enriched = enrichTrades(trades);
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const byDay = {};
  for (const d of days) byDay[d] = { day: d, pnl: 0, trades: 0, wins: 0 };
  for (const t of enriched) {
    const dayName = days[new Date(t.entry_datetime).getDay()];
    byDay[dayName].pnl += t.pnl;
    byDay[dayName].trades++;
    if (t.pnl > 0) byDay[dayName].wins++;
  }
  return Object.values(byDay)
    .filter((d) => d.trades > 0)
    .map((d) => ({
      ...d,
      pnl: Math.round(d.pnl * 100) / 100,
      winRate: Math.round((d.wins / d.trades) * 100),
    }));
}

export function getHourlyPerformance(trades) {
  const enriched = enrichTrades(trades);
  const byHour = {};
  for (let h = 0; h < 24; h++) byHour[h] = { hour: `${h}:00`, pnl: 0, trades: 0, wins: 0 };
  for (const t of enriched) {
    const hour = new Date(t.entry_datetime).getHours();
    byHour[hour].pnl += t.pnl;
    byHour[hour].trades++;
    if (t.pnl > 0) byHour[hour].wins++;
  }
  return Object.values(byHour)
    .filter((h) => h.trades > 0)
    .map((h) => ({
      ...h,
      pnl: Math.round(h.pnl * 100) / 100,
      winRate: h.trades > 0 ? Math.round((h.wins / h.trades) * 100) : 0,
    }));
}

export function getRRDistribution(trades) {
  const enriched = enrichTrades(trades);
  const buckets = [
    { label: '< -3R', min: -Infinity, max: -3 },
    { label: '-3R to -2R', min: -3, max: -2 },
    { label: '-2R to -1R', min: -2, max: -1 },
    { label: '-1R to 0R', min: -1, max: 0 },
    { label: '0R to 1R', min: 0, max: 1 },
    { label: '1R to 2R', min: 1, max: 2 },
    { label: '2R to 3R', min: 2, max: 3 },
    { label: '> 3R', min: 3, max: Infinity },
  ];
  return buckets.map((b) => ({
    label: b.label,
    count: enriched.filter((t) => t.rr >= b.min && t.rr < b.max).length,
  }));
}
