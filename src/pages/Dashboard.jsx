import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import StatCard from '../components/StatCard';
import { useTrades } from '../context/TradeContext';
import {
  computeStats,
  getEquityCurve,
  getDailyPNL,
  getPNLBySymbol,
  getPNLBySide,
  getDrawdownCurve,
  getWeekdayPerformance,
  getHourlyPerformance,
  getRRDistribution,
  formatDuration,
} from '../utils/tradeStats';
import './Dashboard.css';

const COLORS = {
  green: '#4ade80',
  red: '#f87171',
  blue: '#60a5fa',
  purple: '#a78bfa',
  orange: '#fb923c',
  cyan: '#22d3ee',
  yellow: '#facc15',
};
const PIE_COLORS = [COLORS.green, COLORS.red];
const SYMBOL_COLORS = [COLORS.blue, COLORS.purple, COLORS.orange, COLORS.cyan, COLORS.yellow];

function formatCurrency(val) {
  if (val === undefined || val === null) return '$0.00';
  const abs = Math.abs(val);
  if (abs >= 1_000_000) return `$${(val / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `$${(val / 1_000).toFixed(1)}K`;
  return `$${val.toFixed(2)}`;
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-label">{label}</div>
      {payload.map((entry, i) => (
        <div key={i} className="chart-tooltip-row">
          <span style={{ color: entry.color }}>{entry.name}:</span>
          <span>
            {typeof entry.value === 'number' ? formatCurrency(entry.value) : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const { trades } = useTrades();

  const stats = useMemo(() => computeStats(trades), [trades]);
  const equityCurve = useMemo(() => getEquityCurve(trades), [trades]);
  const dailyPNL = useMemo(() => getDailyPNL(trades), [trades]);
  const pnlBySymbol = useMemo(() => getPNLBySymbol(trades), [trades]);
  const pnlBySide = useMemo(() => getPNLBySide(trades), [trades]);
  const drawdownCurve = useMemo(() => getDrawdownCurve(trades), [trades]);
  const weekdayPerf = useMemo(() => getWeekdayPerformance(trades), [trades]);
  const hourlyPerf = useMemo(() => getHourlyPerformance(trades), [trades]);
  const rrDist = useMemo(() => getRRDistribution(trades), [trades]);

  const winLossData = [
    { name: 'Wins', value: stats.wins },
    { name: 'Losses', value: stats.losses },
  ];

  return (
    <div className="dashboard">
      {/* ── KPI Cards ── */}
      <div className="stats-grid">
        <StatCard
          title="Total P&L"
          value={formatCurrency(stats.totalPNL)}
          subtitle={`${stats.totalTrades} trades`}
          icon="$"
          trend={stats.totalPNL >= 0 ? 'positive' : 'negative'}
        />
        <StatCard
          title="Win Rate"
          value={`${stats.winRate.toFixed(1)}%`}
          subtitle={`${stats.wins}W / ${stats.losses}L`}
          icon="%"
          trend={stats.winRate >= 50 ? 'positive' : 'negative'}
        />
        <StatCard
          title="Profit Factor"
          value={stats.profitFactor === Infinity ? 'N/A' : stats.profitFactor.toFixed(2)}
          subtitle={`GP: ${formatCurrency(stats.grossProfit)} / GL: ${formatCurrency(stats.grossLoss)}`}
          icon="x"
          trend={stats.profitFactor >= 1 ? 'positive' : 'negative'}
        />
        <StatCard
          title="Expectancy"
          value={formatCurrency(stats.expectancy)}
          subtitle="Per trade expected value"
          icon="E"
          trend={stats.expectancy >= 0 ? 'positive' : 'negative'}
        />
        <StatCard
          title="Avg Win"
          value={formatCurrency(stats.avgWin)}
          subtitle={`Avg Loss: ${formatCurrency(stats.avgLoss)}`}
          icon="W"
          trend="positive"
        />
        <StatCard
          title="Max Drawdown"
          value={formatCurrency(stats.maxDrawdown)}
          subtitle="Peak to trough"
          icon="D"
          trend="negative"
        />
        <StatCard
          title="Avg R:R"
          value={stats.avgRR.toFixed(2)}
          subtitle="Risk-reward ratio"
          icon="R"
          trend={stats.avgRR >= 1 ? 'positive' : 'negative'}
        />
        <StatCard
          title="Best Trade"
          value={stats.bestTrade ? formatCurrency(stats.bestTrade.pnl) : 'N/A'}
          subtitle={stats.bestTrade ? `${stats.bestTrade.symbol} #${stats.bestTrade.id}` : ''}
          icon="^"
          trend="positive"
        />
        <StatCard
          title="Worst Trade"
          value={stats.worstTrade ? formatCurrency(stats.worstTrade.pnl) : 'N/A'}
          subtitle={stats.worstTrade ? `${stats.worstTrade.symbol} #${stats.worstTrade.id}` : ''}
          icon="v"
          trend="negative"
        />
        <StatCard
          title="Avg Duration"
          value={formatDuration(stats.avgDuration)}
          subtitle="Per trade"
          icon="T"
        />
        <StatCard
          title="Win Streak"
          value={`${stats.maxWinStreak}`}
          subtitle={`Loss streak: ${stats.maxLossStreak}`}
          icon="S"
          trend="positive"
        />
        <StatCard
          title="Current Streak"
          value={`${Math.abs(stats.currentStreak)}${stats.currentStreak > 0 ? 'W' : 'L'}`}
          subtitle="Running streak"
          icon="#"
          trend={stats.currentStreak > 0 ? 'positive' : 'negative'}
        />
      </div>

      {/* ── Equity Curve ── */}
      <div className="chart-section full-width">
        <h3 className="chart-title">Equity Curve</h3>
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={equityCurve}>
            <defs>
              <linearGradient id="gradientPNL" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.green} stopOpacity={0.3} />
                <stop offset="95%" stopColor={COLORS.green} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2d35" />
            <XAxis
              dataKey="date"
              stroke="#6a6f78"
              tick={{ fontSize: 11 }}
              tickFormatter={(v) => v.slice(5)}
            />
            <YAxis
              stroke="#6a6f78"
              tick={{ fontSize: 11 }}
              tickFormatter={(v) => formatCurrency(v)}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="cumPNL"
              stroke={COLORS.green}
              fill="url(#gradientPNL)"
              strokeWidth={2}
              name="Cumulative P&L"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ── Drawdown ── */}
      <div className="chart-section full-width">
        <h3 className="chart-title">Drawdown</h3>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={drawdownCurve}>
            <defs>
              <linearGradient id="gradientDD" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.red} stopOpacity={0.3} />
                <stop offset="95%" stopColor={COLORS.red} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2d35" />
            <XAxis
              dataKey="date"
              stroke="#6a6f78"
              tick={{ fontSize: 11 }}
              tickFormatter={(v) => v.slice(5)}
            />
            <YAxis
              stroke="#6a6f78"
              tick={{ fontSize: 11 }}
              tickFormatter={(v) => formatCurrency(v)}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="drawdown"
              stroke={COLORS.red}
              fill="url(#gradientDD)"
              strokeWidth={2}
              name="Drawdown"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ── Daily P&L + Win/Loss Pie ── */}
      <div className="chart-row">
        <div className="chart-section flex-2">
          <h3 className="chart-title">Daily P&L</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={dailyPNL}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2d35" />
              <XAxis
                dataKey="date"
                stroke="#6a6f78"
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => v.slice(5)}
              />
              <YAxis
                stroke="#6a6f78"
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => formatCurrency(v)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="pnl" name="P&L" radius={[4, 4, 0, 0]}>
                {dailyPNL.map((entry, index) => (
                  <Cell key={index} fill={entry.pnl >= 0 ? COLORS.green : COLORS.red} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-section flex-1">
          <h3 className="chart-title">Win / Loss</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={winLossData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={4}
                dataKey="value"
              >
                {winLossData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── P&L by Symbol + Side ── */}
      <div className="chart-row">
        <div className="chart-section flex-2">
          <h3 className="chart-title">P&L by Symbol</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={pnlBySymbol} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2d35" />
              <XAxis
                type="number"
                stroke="#6a6f78"
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => formatCurrency(v)}
              />
              <YAxis
                type="category"
                dataKey="symbol"
                stroke="#6a6f78"
                tick={{ fontSize: 12 }}
                width={80}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="pnl" name="P&L" radius={[0, 4, 4, 0]}>
                {pnlBySymbol.map((entry, index) => (
                  <Cell key={index} fill={entry.pnl >= 0 ? COLORS.green : COLORS.red} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-section flex-1">
          <h3 className="chart-title">Long vs Short</h3>
          <div className="side-stats">
            {pnlBySide.map((s) => (
              <div key={s.side} className="side-stat-card">
                <div className="side-stat-label">{s.side}</div>
                <div
                  className="side-stat-pnl"
                  style={{ color: s.pnl >= 0 ? COLORS.green : COLORS.red }}
                >
                  {formatCurrency(s.pnl)}
                </div>
                <div className="side-stat-meta">
                  {s.trades} trades &middot; {s.winRate}% WR
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── R:R Distribution ── */}
      <div className="chart-section full-width">
        <h3 className="chart-title">R:R Distribution</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={rrDist}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2d35" />
            <XAxis dataKey="label" stroke="#6a6f78" tick={{ fontSize: 11 }} />
            <YAxis stroke="#6a6f78" tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="count" name="Trades" fill={COLORS.purple} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Weekday + Hourly Performance ── */}
      <div className="chart-row">
        <div className="chart-section flex-1">
          <h3 className="chart-title">Performance by Day of Week</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={weekdayPerf}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2d35" />
              <XAxis dataKey="day" stroke="#6a6f78" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(0, 3)} />
              <YAxis stroke="#6a6f78" tick={{ fontSize: 11 }} tickFormatter={(v) => formatCurrency(v)} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="pnl" name="P&L" radius={[4, 4, 0, 0]}>
                {weekdayPerf.map((entry, index) => (
                  <Cell key={index} fill={entry.pnl >= 0 ? COLORS.green : COLORS.red} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-section flex-1">
          <h3 className="chart-title">Performance by Hour</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={hourlyPerf}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2d35" />
              <XAxis dataKey="hour" stroke="#6a6f78" tick={{ fontSize: 10 }} />
              <YAxis stroke="#6a6f78" tick={{ fontSize: 11 }} tickFormatter={(v) => formatCurrency(v)} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="pnl" name="P&L" radius={[4, 4, 0, 0]}>
                {hourlyPerf.map((entry, index) => (
                  <Cell key={index} fill={entry.pnl >= 0 ? COLORS.green : COLORS.red} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
