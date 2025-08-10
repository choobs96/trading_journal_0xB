import React from 'react';
import { Card, Row, Col, Statistic, Progress, Divider, Typography, Space, Tooltip, Button, Breadcrumb, Select, DatePicker } from 'antd';
import { 
  ArrowUpOutlined, 
  ArrowDownOutlined, 
  DollarOutlined, 
  ClockCircleOutlined,
  TrophyOutlined,
  ExclamationCircleOutlined,
  BarChartOutlined,
  CalendarOutlined,
  UserOutlined,
  FireOutlined,
  ArrowLeftOutlined,
  HomeOutlined,
  BarChartOutlined as BarChartIcon
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

export default function Insights({ tradedata }) {
  console.log('Insights component rendered with data:', tradedata);
  const navigate = useNavigate();
  
  // Filter state variables
  const [selectedAccount, setSelectedAccount] = React.useState('all');
  const [dateRange, setDateRange] = React.useState(null);
  const [filteredData, setFilteredData] = React.useState(tradedata);
  
  // Update filtered data when tradedata changes
  React.useEffect(() => {
    setFilteredData(tradedata);
  }, [tradedata]);
  
  // Function to handle account filtering
  const handleAccountFilter = (account) => {
    setSelectedAccount(account);
    applyFilters(account, dateRange);
  };

  // Function to handle date range filtering
  const handleDateRangeFilter = (dates) => {
    setDateRange(dates);
    applyFilters(selectedAccount, dates);
  };

  // Function to apply both filters together
  const applyFilters = (account, dates) => {
    let filtered = [...tradedata];
    
    // Apply account filter
    if (account && account !== 'all') {
      filtered = filtered.filter(trade => trade.trade_account === account);
    }
    
    // Apply date filter
    if (dates && dates.length === 2) {
      const startDate = dates[0].startOf('day');
      const endDate = dates[1].endOf('day');
      
      filtered = filtered.filter(trade => {
        const entryDate = new Date(trade.time_of_first_entry);
        const exitDate = new Date(trade.time_of_last_exit);
        
        // Check if either entry or exit date falls within the range
        return (entryDate >= startDate && entryDate <= endDate) || 
               (exitDate >= startDate && exitDate <= endDate);
      });
    }
    
    setFilteredData(filtered);
  };

  // Function to clear all filters
  const clearFilters = () => {
    setSelectedAccount('all');
    setDateRange(null);
    setFilteredData(tradedata);
  };

  // Check if any filters are active
  const hasActiveFilters = selectedAccount !== 'all' || dateRange;

  // Get unique account names for filter dropdown
  const accountOptions = React.useMemo(() => {
    if (!tradedata) return [];
    const accounts = [...new Set(tradedata.map(trade => trade.trade_account))];
    return accounts.sort();
  }, [tradedata]);
  
  // Calculate comprehensive analytics
  const calculateAnalytics = () => {
    if (!filteredData || filteredData.length === 0) {
      console.log('No filtered trade data available for analytics');
      return null;
    }

    console.log('Calculating analytics for', filteredData.length, 'filtered trades');
    
    try {
      const totalTrades = filteredData.length;
      const totalPnL = filteredData.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
      const winningTrades = filteredData.filter(trade => (trade.pnl || 0) > 0);
      const losingTrades = filteredData.filter(trade => (trade.pnl || 0) < 0);
      const breakEvenTrades = filteredData.filter(trade => (trade.pnl || 0) === 0);
      
      const winRate = totalTrades > 0 ? (winningTrades.length / totalTrades) * 100 : 0;
      const avgWin = winningTrades.length > 0 ? winningTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0) / winningTrades.length : 0;
      const avgLoss = losingTrades.length > 0 ? Math.abs(losingTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0) / losingTrades.length) : 0;
      const profitFactor = avgLoss > 0 ? avgWin / avgLoss : 0;
      
      // Risk/Reward analysis - based on actual trade outcomes
      const tradesWithRR = filteredData.filter(trade => trade.stop_loss && trade.avg_entry_price && trade.avg_exit_price);
      const avgRR = tradesWithRR.length > 0 ? tradesWithRR.reduce((sum, trade) => {
        try {
          const entryPrice = parseFloat(trade.avg_entry_price);
          const exitPrice = parseFloat(trade.avg_exit_price);
          const stopLoss = parseFloat(trade.stop_loss);
          const side = trade.side;
          
          if (side === 'Buy') {
            // For long trades
            const actualPnL = exitPrice - entryPrice;
            const riskDistance = entryPrice - stopLoss;
            
            if (actualPnL > 0) {
              // Winning trade - calculate actual R-multiple
              const rewardDistance = exitPrice - entryPrice;
              return riskDistance > 0 ? sum + (rewardDistance / riskDistance) : sum;
            } else {
              // Losing trade - always -1R
              return sum - 1;
            }
          } else {
            // For short trades
            const actualPnL = entryPrice - exitPrice;
            const riskDistance = stopLoss - entryPrice;
            
            if (actualPnL > 0) {
              // Winning trade - calculate actual R-multiple
              const rewardDistance = entryPrice - exitPrice;
              return riskDistance > 0 ? sum + (rewardDistance / riskDistance) : sum;
            } else {
              // Losing trade - always -1R
              return sum - 1;
            }
          }
        } catch (e) {
          return sum;
        }
      }, 0) / tradesWithRR.length : 0;
      
      // Duration analysis
      const tradesWithDuration = filteredData.filter(trade => trade.time_of_first_entry && trade.time_of_last_exit);
      const avgDuration = tradesWithDuration.length > 0 ? tradesWithDuration.reduce((sum, trade) => {
        try {
          const entryDate = new Date(trade.time_of_first_entry);
          const exitDate = new Date(trade.time_of_last_exit);
          if (exitDate > entryDate) {
            return sum + (exitDate - entryDate);
          }
          return sum;
        } catch (e) {
          return sum;
        }
      }, 0) / tradesWithDuration.length : 0;
      
      // Side analysis
      const longTrades = filteredData.filter(trade => 
        trade.side && (trade.side.toUpperCase() === 'LONG' || trade.side.toUpperCase() === 'BUY')
      );
      const shortTrades = filteredData.filter(trade => 
        trade.side && (trade.side.toUpperCase() === 'SHORT' || trade.side.toUpperCase() === 'SELL')
      );
      
      // Account performance
      const accountPerformance = {};
      filteredData.forEach(trade => {
        if (trade.trade_account) {
          if (!accountPerformance[trade.trade_account]) {
            accountPerformance[trade.trade_account] = { pnl: 0, trades: 0, wins: 0 };
          }
          accountPerformance[trade.trade_account].pnl += (trade.pnl || 0);
          accountPerformance[trade.trade_account].trades += 1;
          if ((trade.pnl || 0) > 0) accountPerformance[trade.trade_account].wins += 1;
        }
      });
      
      // Monthly performance
      const monthlyPerformance = {};
      filteredData.forEach(trade => {
        if (trade.time_of_first_entry) {
          try {
            const month = new Date(trade.time_of_first_entry).toISOString().slice(0, 7); // YYYY-MM
            if (!monthlyPerformance[month]) {
              monthlyPerformance[month] = { pnl: 0, trades: 0, wins: 0 };
            }
            monthlyPerformance[month].pnl += (trade.pnl || 0);
            monthlyPerformance[month].trades += 1;
            if ((trade.pnl || 0) > 0) monthlyPerformance[month].wins += 1;
          } catch (e) {
            console.warn('Error processing trade date:', trade.time_of_first_entry);
          }
        }
      });
      
      // Best and worst trades
      const bestTrade = filteredData.reduce((best, trade) => 
        (trade.pnl || 0) > (best.pnl || 0) ? trade : best, { pnl: 0 }
      );
      const worstTrade = filteredData.reduce((worst, trade) => 
        (trade.pnl || 0) < (worst.pnl || 0) ? trade : worst, { pnl: 0 }
      );
      
      // Consecutive wins/losses
      let maxConsecutiveWins = 0;
      let maxConsecutiveLosses = 0;
      let currentWins = 0;
      let currentLosses = 0;
      
      filteredData.forEach(trade => {
        if ((trade.pnl || 0) > 0) {
          currentWins++;
          currentLosses = 0;
          maxConsecutiveWins = Math.max(maxConsecutiveWins, currentWins);
        } else if ((trade.pnl || 0) < 0) {
          currentLosses++;
          currentWins = 0;
          maxConsecutiveLosses = Math.max(maxConsecutiveLosses, currentLosses);
        }
      });
      
      // Expected Value calculation
      const expectedValue = (winRate / 100) * avgWin - ((100 - winRate) / 100) * avgLoss;
      
      // Sharpe Ratio approximation (using PnL volatility)
      const pnlValues = filteredData.map(trade => trade.pnl || 0);
      const meanPnL = pnlValues.reduce((sum, val) => sum + val, 0) / pnlValues.length;
      const variance = pnlValues.reduce((sum, val) => sum + Math.pow(val - meanPnL, 2), 0) / pnlValues.length;
      const stdDev = Math.sqrt(variance);
      const sharpeRatio = stdDev > 0 ? meanPnL / stdDev : 0;
      
      return {
        totalTrades,
        totalPnL,
        winningTrades: winningTrades.length,
        losingTrades: losingTrades.length,
        breakEvenTrades: breakEvenTrades.length,
        winRate,
        avgWin,
        avgLoss,
        profitFactor,
        avgRR,
        avgDuration,
        longTrades: longTrades.length,
        shortTrades: shortTrades.length,
        accountPerformance,
        monthlyPerformance,
        bestTrade,
        worstTrade,
        maxConsecutiveWins,
        maxConsecutiveLosses,
        expectedValue,
        sharpeRatio
      };
    } catch (error) {
      console.error('Error calculating analytics:', error);
      return null;
    }
  };

  const analytics = calculateAnalytics();

  if (!analytics) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
        {/* Breadcrumb */}
        <div style={{ marginBottom: '16px', textAlign: 'left' }}>
          <Breadcrumb
            items={[
              {
                title: <a onClick={() => navigate('/')}><HomeOutlined /> Dashboard</a>,
              },
              {
                title: <span><BarChartIcon /> Insights & Analytics</span>,
              },
            ]}
          />
        </div>
        
        <div style={{ marginBottom: '24px', textAlign: 'left' }}>
          <Button 
            type="primary" 
            icon={<ArrowLeftOutlined />} 
            onClick={() => navigate('/')}
            style={{ marginBottom: '16px' }}
          >
            Back to Dashboard
          </Button>
        </div>
        <Title level={3}>📊 Trading Insights & Analytics</Title>
        <Text type="secondary">No trade data available for analysis.</Text>
        <div style={{ marginTop: '16px', padding: '16px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #d9d9d9' }}>
          <Text strong>Debug Info:</Text>
          <div>Data received: {tradedata ? 'Yes' : 'No'}</div>
          <div>Data length: {tradedata ? tradedata.length : 'N/A'}</div>
          <div>Data type: {typeof tradedata}</div>
        </div>
      </div>
    );
  }

  // Helper function to format duration
  const formatDuration = (milliseconds) => {
    if (!milliseconds || milliseconds <= 0) return 'N/A';
    
    const days = Math.floor(milliseconds / (1000 * 60 * 60 * 24));
    const hours = Math.floor((milliseconds % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    
    let result = '';
    if (days > 0) result += `${days}d `;
    if (hours > 0) result += `${hours}h `;
    if (minutes > 0) result += `${minutes}m`;
    
    return result.trim() || 'Less than 1m';
  };

  return (
    <div style={{ padding: '24px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      {/* Breadcrumb */}
      <div style={{ marginBottom: '16px', textAlign: 'left' }}>
        <Breadcrumb
          items={[
            {
              title: <a onClick={() => navigate('/')}><HomeOutlined /> Dashboard</a>,
            },
            {
              title: <span><BarChartIcon /> Insights & Analytics</span>,
            },
          ]}
        />
      </div>
      
      {/* Back Button */}
      <div style={{ marginBottom: '24px', textAlign: 'left' }}>
        <Button 
          type="primary" 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate('/')}
          style={{ marginBottom: '16px' }}
        >
          Back to Dashboard
        </Button>
      </div>
      
      <Title level={2} style={{ marginBottom: '32px', textAlign: 'center' }}>
        📊 Trading Insights & Analytics
      </Title>

      {/* Data Overview Card */}
      <Card 
        size="small" 
        style={{ 
          marginBottom: '16px', 
          backgroundColor: '#f6ffed',
          border: '1px solid #b7eb8f'
        }}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>📊 Data Overview</span>
          </div>
        }
      >
        <Row gutter={[16, 8]} align="middle">
          <Col xs={24} sm={8}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#52c41a' }}>
                {tradedata ? tradedata.length : 0}
              </div>
              <div style={{ fontSize: '12px', color: '#8c8c8c' }}>Total Trades</div>
            </div>
          </Col>
          <Col xs={24} sm={8}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1890ff' }}>
                {filteredData.length}
              </div>
              <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
                {hasActiveFilters ? 'Filtered Trades' : 'Analyzed Trades'}
              </div>
            </div>
          </Col>
          <Col xs={24} sm={8}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#fa8c16' }}>
                {hasActiveFilters ? 'Filtered' : 'All Data'}
              </div>
              <div style={{ fontSize: '12px', color: '#8c8c8c' }}>Analysis Scope</div>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Enhanced Filter Section */}
      <Card 
        size="small" 
        style={{ 
          marginBottom: '24px', 
          backgroundColor: hasActiveFilters ? '#fff7e6' : '#fafafa',
          border: hasActiveFilters ? '1px solid #ffd591' : '1px solid #f0f0f0'
        }}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🔍 Insights Filters</span>
            {hasActiveFilters && (
              <span style={{ 
                fontSize: '12px', 
                backgroundColor: '#fa8c16', 
                color: 'white', 
                padding: '2px 6px', 
                borderRadius: '10px',
                fontWeight: '500'
              }}>
                ACTIVE
              </span>
            )}
          </div>
        }
      >
        <Row gutter={[16, 8]} align="middle">
          <Col xs={24} sm={12} md={6}>
            <Tooltip title="Filter insights by specific trading account">
              <div style={{ fontWeight: '500', marginBottom: '4px', color: '#262626' }}>
                Account
              </div>
            </Tooltip>
            <Select
              value={selectedAccount}
              style={{ width: '100%' }}
              onChange={handleAccountFilter}
              placeholder="Select Account"
              allowClear
            >
              <Option value="all">All Accounts</Option>
              {accountOptions.map(account => (
                <Option key={account} value={account}>{account}</Option>
              ))}
            </Select>
          </Col>
          
          <Col xs={24} sm={12} md={8}>
            <Tooltip title="Filter insights by entry or exit date range">
              <div style={{ fontWeight: '500', marginBottom: '4px', color: '#262626' }}>
                Date Range
              </div>
            </Tooltip>
            <RangePicker
              value={dateRange}
              onChange={handleDateRangeFilter}
              style={{ width: '100%' }}
              placeholder={['Start Date', 'End Date']}
              format="YYYY-MM-DD"
              allowClear
            />
          </Col>
          
          <Col xs={24} sm={12} md={4}>
            <Tooltip title="Clear all active filters">
              <div style={{ fontWeight: '500', marginBottom: '4px', color: '#262626' }}>
                Actions
              </div>
            </Tooltip>
            <Button 
              onClick={clearFilters} 
              disabled={!hasActiveFilters}
              size="small"
              style={{ width: '100%' }}
              type={hasActiveFilters ? "primary" : "default"}
            >
              Clear Filters
            </Button>
          </Col>
          
          <Col xs={24} sm={12} md={6}>
            <Tooltip title="Number of trades used for current insights">
              <div style={{ fontWeight: '500', marginBottom: '4px', color: '#262626' }}>
                Filtered Results
              </div>
            </Tooltip>
            <div style={{ 
              padding: '4px 8px', 
              backgroundColor: '#e6f7ff', 
              border: '1px solid #91d5ff',
              borderRadius: '4px',
              textAlign: 'center',
              fontWeight: '500'
            }}>
              {filteredData.length} trades
              {hasActiveFilters && (
                <div style={{ fontSize: '12px', color: '#1890ff' }}>
                  (of {tradedata.length} total)
                </div>
              )}
            </div>
          </Col>
        </Row>
      </Card>
      
      {/* Key Performance Indicators */}
      <Row gutter={[16, 16]} style={{ marginBottom: '32px' }}>
        <Col xs={24} sm={12} md={6} style={{ display: 'flex' }}>
          <Card style={{ width: '100%' }}>
            <Statistic
              title="Total P&L"
              value={analytics.totalPnL}
              precision={2}
              valueStyle={{ color: analytics.totalPnL >= 0 ? '#3f8600' : '#cf1322' }}
              prefix={<DollarOutlined />}
              suffix="$"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6} style={{ display: 'flex' }}>
          <Card style={{ width: '100%' }}>
            <Statistic
              title="Win Rate"
              value={analytics.winRate}
              precision={2}
              valueStyle={{ color: analytics.winRate >= 50 ? '#3f8600' : '#cf1322' }}
              prefix={<TrophyOutlined />}
              suffix="%"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6} style={{ display: 'flex' }}>
          <Card style={{ width: '100%' }}>
            <Statistic
              title="Total Trades"
              value={analytics.totalTrades}
              prefix={<BarChartOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6} style={{ display: 'flex' }}>
          <Card style={{ width: '100%' }}>
            <Statistic
              title="Profit Factor"
              value={analytics.profitFactor}
              precision={2}
              valueStyle={{ color: analytics.profitFactor >= 1.5 ? '#3f8600' : analytics.profitFactor >= 1 ? '#faad14' : '#cf1322' }}
              prefix={<ArrowUpOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Advanced Metrics */}
      <Row gutter={[16, 16]} style={{ marginBottom: '32px' }}>
        <Col xs={24} sm={12} md={6} style={{ display: 'flex' }}>
          <Card style={{ width: '100%' }}>
            <Statistic
              title="Expected Value"
              value={analytics.expectedValue}
              precision={2}
              valueStyle={{ color: analytics.expectedValue >= 0 ? '#3f8600' : '#cf1322' }}
              prefix={<DollarOutlined />}
              suffix="$"
            />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              Per trade average
            </Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6} style={{ display: 'flex' }}>
          <Card style={{ width: '100%' }}>
            <Statistic
              title="Sharpe Ratio"
              value={analytics.sharpeRatio}
              precision={2}
              valueStyle={{ color: analytics.sharpeRatio >= 1 ? '#3f8600' : analytics.sharpeRatio >= 0.5 ? '#faad14' : '#cf1322' }}
              prefix={<BarChartOutlined />}
            />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              Risk-adjusted return
            </Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6} style={{ display: 'flex' }}>
          <Card style={{ width: '100%' }}>
            <Statistic
              title="Avg R-Multiple"
              value={analytics.avgRR}
              precision={2}
              valueStyle={{ color: analytics.avgRR >= 2 ? '#3f8600' : analytics.avgRR >= 1.5 ? '#faad14' : '#cf1322' }}
              prefix={<ArrowUpOutlined />}
              suffix="R"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6} style={{ display: 'flex' }}>
          <Card style={{ width: '100%' }}>
            <Statistic
              title="Avg Duration"
              value={formatDuration(analytics.avgDuration)}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Performance Breakdown */}
      <Row gutter={[16, 16]} style={{ marginBottom: '32px' }}>
        <Col xs={24} lg={12} style={{ display: 'flex' }}>
          <Card title="📈 Performance Breakdown" size="small" style={{ width: '100%' }}>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <div style={{ textAlign: 'center' }}>
                  <Progress
                    type="circle"
                    percent={analytics.winRate}
                    format={percent => `${percent.toFixed(2)}%`}
                    strokeColor={analytics.winRate >= 50 ? '#52c41a' : '#faad14'}
                  />
                  <div style={{ marginTop: '8px' }}>
                    <Text strong>Win Rate</Text>
                  </div>
                </div>
              </Col>
              <Col span={12}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}>
                    {analytics.winningTrades}/{analytics.totalTrades}
                  </div>
                  <div style={{ marginTop: '8px' }}>
                    <Text>Winning Trades</Text>
                  </div>
                </div>
              </Col>
            </Row>
            <Divider />
            <Row gutter={[16, 16]}>
              <Col span={8}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#52c41a' }}>
                    {analytics.winningTrades}
                  </div>
                  <Text>Wins</Text>
                </div>
              </Col>
              <Col span={8}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#cf1322' }}>
                    {analytics.losingTrades}
                  </div>
                  <Text>Losses</Text>
                </div>
              </Col>
              <Col span={8}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#faad14' }}>
                    {analytics.breakEvenTrades}
                  </div>
                  <Text>Break Even</Text>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>
        
        <Col xs={24} lg={12} style={{ display: 'flex' }}>
          <Card title="💰 P&L Analysis" size="small" style={{ width: '100%' }}>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#52c41a' }}>
                    ${analytics.avgWin.toFixed(2)}
                  </div>
                  <Text>Average Win</Text>
                </div>
              </Col>
              <Col span={12}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#cf1322' }}>
                    ${analytics.avgLoss.toFixed(2)}
                  </div>
                  <Text>Average Loss</Text>
                </div>
              </Col>
            </Row>
            <Divider />
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1890ff' }}>
                    {analytics.maxConsecutiveWins}
                  </div>
                  <Text>Max Consecutive Wins</Text>
                </div>
              </Col>
              <Col span={12}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#cf1322' }}>
                    {analytics.maxConsecutiveLosses}
                  </div>
                  <Text>Max Consecutive Losses</Text>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* Trade Analysis */}
      <Row gutter={[16, 16]} style={{ marginBottom: '32px' }}>
        <Col xs={24} lg={12} style={{ display: 'flex' }}>
          <Card title="🎯 Trade Characteristics" size="small" style={{ width: '100%' }}>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1890ff' }}>
                    {analytics.longTrades}
                  </div>
                  <Text>Long Trades</Text>
                </div>
              </Col>
              <Col span={12}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#fa8c16' }}>
                    {analytics.shortTrades}
                  </div>
                  <Text>Short Trades</Text>
                </div>
              </Col>
            </Row>
            <Divider />
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#722ed1' }}>
                    {analytics.avgRR.toFixed(2)}R
                  </div>
                  <Text>Avg R-Multiple</Text>
                </div>
              </Col>
              <Col span={12}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#13c2c2' }}>
                    {formatDuration(analytics.avgDuration)}
                  </div>
                  <Text>Avg Duration</Text>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>
        
        <Col xs={24} lg={12} style={{ display: 'flex' }}>
          <Card title="🏆 Best & Worst Trades" size="small" style={{ width: '100%' }}>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#52c41a' }}>
                    ${analytics.bestTrade.pnl?.toFixed(2) || '0.00'}
                  </div>
                  <Text>Best Trade</Text>
                  {analytics.bestTrade.symbol && (
                    <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
                      {analytics.bestTrade.symbol}
                    </div>
                  )}
                </div>
              </Col>
              <Col span={12}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#cf1322' }}>
                    ${analytics.worstTrade.pnl?.toFixed(2) || '0.00'}
                  </div>
                  <Text>Worst Trade</Text>
                  {analytics.worstTrade.symbol && (
                    <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
                      {analytics.worstTrade.symbol}
                    </div>
                  )}
                </div>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* Account Performance */}
      {Object.keys(analytics.accountPerformance).length > 0 && (
        <Card title="🏦 Account Performance" style={{ marginBottom: '32px' }}>
          <Row gutter={[16, 16]}>
            {Object.entries(analytics.accountPerformance).map(([account, data]) => (
              <Col xs={24} sm={12} md={8} key={account}>
                <Card size="small" style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>
                    {account}
                  </div>
                  <div style={{ 
                    fontSize: '20px', 
                    fontWeight: 'bold', 
                    color: data.pnl >= 0 ? '#52c41a' : '#cf1322',
                    marginBottom: '8px'
                  }}>
                    ${data.pnl.toFixed(2)}
                  </div>
                  <div style={{ fontSize: '14px', color: '#8c8c8c' }}>
                    {data.trades} trades | {(data.wins / data.trades * 100).toFixed(2)}% win rate
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>
      )}

      {/* Monthly Performance */}
      {Object.keys(analytics.monthlyPerformance).length > 0 && (
        <Card title="📅 Monthly Performance" style={{ marginBottom: '32px' }}>
          <Row gutter={[16, 16]}>
            {Object.entries(analytics.monthlyPerformance)
              .sort(([a], [b]) => b.localeCompare(a)) // Sort by date descending
              .slice(0, 12) // Show last 12 months
              .map(([month, data]) => (
                <Col xs={24} sm={12} md={6} key={month}>
                  <Card size="small" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>
                      {new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </div>
                    <div style={{ 
                      fontSize: '18px', 
                      fontWeight: 'bold', 
                      color: data.pnl >= 0 ? '#52c41a' : '#cf1322',
                      marginBottom: '8px'
                    }}>
                      ${data.pnl.toFixed(2)}
                    </div>
                    <div style={{ fontSize: '14px', color: '#8c8c8c' }}>
                      {data.trades} trades | {(data.wins / data.trades * 100).toFixed(2)}% win rate
                    </div>
                  </Card>
                </Col>
              ))}
          </Row>
        </Card>
      )}

      {/* Trading Insights & Recommendations */}
      <Card title="💡 Trading Insights & Recommendations">
        {hasActiveFilters && (
          <div style={{ 
            marginBottom: '16px', 
            padding: '12px', 
            backgroundColor: '#e6f7ff', 
            border: '1px solid #91d5ff',
            borderRadius: '6px',
            fontSize: '14px'
          }}>
            <Text strong>📊 Filtered Analysis:</Text> These insights are based on {filteredData.length} trades from your selected filters. 
            Use the filters above to analyze specific time periods or accounts.
          </div>
        )}
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12} style={{ display: 'flex' }}>
            <Card title="📊 Performance Analysis" size="small" type="inner" style={{ width: '100%' }}>
              <ul style={{ paddingLeft: '20px' }}>
                {analytics.winRate >= 60 && (
                  <li><Text strong style={{ color: '#52c41a' }}>🎯 Excellent win rate! Your strategy is working well.</Text></li>
                )}
                {analytics.winRate < 40 && (
                  <li><Text strong style={{ color: '#cf1322' }}>⚠️ Low win rate suggests strategy review needed.</Text></li>
                )}
                {analytics.profitFactor >= 2 && (
                  <li><Text strong style={{ color: '#52c41a' }}>💰 Strong profit factor indicates good risk management.</Text></li>
                )}
                {analytics.profitFactor < 1 && (
                  <li><Text strong style={{ color: '#cf1322' }}>🚨 Profit factor below 1 - focus on risk management.</Text></li>
                )}
                {analytics.avgRR >= 2 && (
                  <li><Text strong style={{ color: '#52c41a' }}>⚖️ Good R-multiple on average.</Text></li>
                )}
                {analytics.avgRR < 1.5 && (
                  <li><Text strong style={{ color: '#faad14' }}>📈 Consider improving R-multiples.</Text></li>
                )}
                {analytics.expectedValue >= 0 && (
                  <li><Text strong style={{ color: '#52c41a' }}>📊 Positive expected value - strategy is profitable long-term.</Text></li>
                )}
                {analytics.expectedValue < 0 && (
                  <li><Text strong style={{ color: '#cf1322' }}>📉 Negative expected value - strategy needs improvement.</Text></li>
                )}
              </ul>
            </Card>
          </Col>
          
          <Col xs={24} lg={12} style={{ display: 'flex' }}>
            <Card title="🎯 Action Items" size="small" type="inner" style={{ width: '100%' }}>
              <ul style={{ paddingLeft: '20px' }}>
                {analytics.maxConsecutiveLosses > 5 && (
                  <li><Text strong style={{ color: '#cf1322' }}>🛑 High consecutive losses - implement stop-loss strategy.</Text></li>
                )}
                {analytics.avgLoss > analytics.avgWin && (
                  <li><Text strong style={{ color: '#faad14' }}>📉 Average loss exceeds average win - review exit strategy.</Text></li>
                )}
                {analytics.longTrades > analytics.shortTrades * 2 && (
                  <li><Text>📈 Heavy long bias - consider diversifying with short trades.</Text></li>
                )}
                {analytics.shortTrades > analytics.longTrades * 2 && (
                  <li><Text>📉 Heavy short bias - consider diversifying with long trades.</Text></li>
                )}
                {analytics.totalTrades < 20 && (
                  <li><Text>📊 Limited sample size - continue trading to gather more data.</Text></li>
                )}
                {analytics.sharpeRatio < 0.5 && (
                  <li><Text strong style={{ color: '#faad14' }}>📊 Low Sharpe ratio - consider reducing position sizes or improving entry timing.</Text></li>
                )}
                {analytics.sharpeRatio >= 1 && (
                  <li><Text strong style={{ color: '#52c41a' }}>📊 Excellent Sharpe ratio - your strategy has good risk-adjusted returns!</Text></li>
                )}
              </ul>
            </Card>
          </Col>
        </Row>
      </Card>
    </div>
  );
}
