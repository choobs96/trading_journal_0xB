import './StatCard.css';

export default function StatCard({ title, value, subtitle, icon, trend }) {
  const trendClass =
    trend === 'positive' ? 'stat-trend-up' : trend === 'negative' ? 'stat-trend-down' : '';

  return (
    <div className={`stat-card ${trendClass}`}>
      <div className="stat-card-header">
        <span className="stat-card-icon">{icon}</span>
        <span className="stat-card-title">{title}</span>
      </div>
      <div className="stat-card-value">{value}</div>
      {subtitle && <div className="stat-card-subtitle">{subtitle}</div>}
    </div>
  );
}
