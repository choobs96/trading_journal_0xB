import React from 'react';
import { Table as AntTable, Pagination, Button, Space, Select, DatePicker, Card, Row, Col, Tooltip } from 'antd'; // Import Tooltip
import JournalEntry from './JournalEntry';
import TradeEdit from './TradeEdit';
import dayjs from 'dayjs'; // Import dayjs for date operations

const { Option } = Select;
const { RangePicker } = DatePicker;

export default function Table({ tradedata }) {
  const [currentPage, setCurrentPage] = React.useState(1); // Track the current page
  const [pageSize, setPageSize] = React.useState(5); // Track the current page size
  const [sortedData, setSortedData] = React.useState(tradedata); // To store the sorted dataset
  const [showJournalModal, setShowJournalModal] = React.useState(false);
  const [selectedTradeForJournal, setSelectedTradeForJournal] = React.useState(null);
  const [showEditModal, setShowEditModal] = React.useState(false);
  const [selectedTradeForEdit, setSelectedTradeForEdit] = React.useState(null);
  const [selectedAccount, setSelectedAccount] = React.useState('all'); // For account filtering
  const [dateRange, setDateRange] = React.useState(null); // For date range filtering

  // Initialize sortedData when tradedata changes
  React.useEffect(() => {
    setSortedData(tradedata);
  }, [tradedata]);

  // Function for handling row click - now opens journal modal
  function clickHandler(tradeInput) {
    // Get the most up-to-date trade data from sortedData
    const currentTrade = sortedData.find(t => t.trade_id === tradeInput.trade_id);
    if (currentTrade) {
      setSelectedTradeForJournal(currentTrade);
    } else {
      setSelectedTradeForJournal(tradeInput);
    }
    setShowJournalModal(true);
  }

  // Function to handle journal button click
  const handleJournalClick = (trade, event) => {
    event.stopPropagation(); // Prevent row click
    
    // Get the most up-to-date trade data from sortedData
    const currentTrade = sortedData.find(t => t.trade_id === trade.trade_id);
    if (currentTrade) {
      setSelectedTradeForJournal(currentTrade);
    } else {
      setSelectedTradeForJournal(trade);
    }
    setShowJournalModal(true);
  };

  // Function to handle edit button click
  const handleEditClick = (trade, event) => {
    event.stopPropagation(); // Prevent row click
    
    // Get the most up-to-date trade data from sortedData
    const currentTrade = sortedData.find(t => t.trade_id === trade.trade_id);
    if (currentTrade) {
      setSelectedTradeForEdit(currentTrade);
    } else {
      setSelectedTradeForEdit(trade);
    }
    setShowEditModal(true);
  };

  // Function to handle trade update
  const handleTradeUpdate = (updatedTrade) => {
    // Update the local data
    const updatedData = sortedData.map(trade => 
      trade.trade_id === updatedTrade.trade_id ? updatedTrade : trade
    );
    setSortedData(updatedData);
    
    // Also update the original tradedata prop if needed
    if (tradedata) {
      const updatedOriginalData = tradedata.map(trade => 
        trade.trade_id === updatedTrade.trade_id ? updatedTrade : trade
      );
      // Note: In a real app, you might want to call a parent callback to update the main data
    }
  };

  // Function to handle trade deletion
  const handleTradeDelete = (deletedTradeId) => {
    // Remove the deleted trade from local data
    const updatedData = sortedData.filter(trade => trade.trade_id !== deletedTradeId);
    setSortedData(updatedData);
    
    // Also update the original tradedata prop if needed
    if (tradedata) {
      const updatedOriginalData = tradedata.filter(trade => trade.trade_id !== deletedTradeId);
      // Note: In a real app, you might want to call a parent callback to update the main data
    }
  };

  // Function to handle account filtering
  const handleAccountFilter = (account) => {
    setSelectedAccount(account);
    setCurrentPage(1); // Reset to first page when filtering
    applyFilters(account, dateRange);
  };

  // Function to handle date range filtering
  const handleDateRangeFilter = (dates) => {
    setDateRange(dates);
    setCurrentPage(1); // Reset to first page when filtering
    applyFilters(selectedAccount, dates);
  };

  // Function to get the display month for the date picker based on selected range
  const getDisplayMonth = () => {
    if (!dateRange || dateRange.length !== 2) return undefined;
    
    const startDate = dateRange[0];
    const endDate = dateRange[1];
    const diffInDays = endDate.diff(startDate, 'day');
    
    // If range is 1 month or less, show the month of the start date
    if (diffInDays <= 31) {
      return startDate;
    }
    
    // If range is more than 1 month, show the month of the end date (most recent)
    return endDate;
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
    
    setSortedData(filtered);
  };

  // Function to clear all filters
  const clearFilters = () => {
    setSelectedAccount('all');
    setDateRange(null);
    setCurrentPage(1);
    setSortedData(tradedata);
  };

  // Check if any filters are active
  const hasActiveFilters = selectedAccount !== 'all' || dateRange;

  // Get unique account names for filter dropdown
  const accountOptions = React.useMemo(() => {
    const accounts = [...new Set(tradedata.map(trade => trade.trade_account))];
    return accounts.sort();
  }, [tradedata]);

  // Function to calculate Risk/Reward (RR) - based on actual trade outcomes
  const calculateRiskReward = (row) => {
    const { stop_loss, avg_entry_price, avg_exit_price, side } = row;
    if (!stop_loss || !avg_entry_price || !avg_exit_price) return 'N/A';

    try {
      const entryPrice = parseFloat(avg_entry_price);
      const exitPrice = parseFloat(avg_exit_price);
      const stopLoss = parseFloat(stop_loss);
      
      if (side === 'Buy') {
        // For long trades
        const actualPnL = exitPrice - entryPrice;
        const riskDistance = entryPrice - stopLoss;
        
        if (actualPnL > 0) {
          // Winning trade - calculate actual R-multiple
          const rewardDistance = exitPrice - entryPrice;
          return riskDistance > 0 ? (rewardDistance / riskDistance).toFixed(2) : 'N/A';
        } else {
          // Losing trade - always -1R
          return '-1.00';
        }
      } else {
        // For short trades
        const actualPnL = entryPrice - exitPrice;
        const riskDistance = stopLoss - entryPrice;
        
        if (actualPnL > 0) {
          // Winning trade - calculate actual R-multiple
          const rewardDistance = entryPrice - exitPrice;
          return riskDistance > 0 ? (rewardDistance / riskDistance).toFixed(2) : 'N/A';
        } else {
          // Losing trade - always -1R
          return '-1.00';
        }
      }
    } catch (e) {
      return 'N/A';
    }
  };

  // Function to calculate duration between entry and exit
  const calculateDuration = (entryDatetime, exitDatetime) => {
    if (!entryDatetime || !exitDatetime) return { duration: 'N/A', durationInMinutes: 0 };

    const entry = new Date(entryDatetime);
    const exit = new Date(exitDatetime);
    const diffMs = exit - entry;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    let duration;
    if (diffDays > 0) {
      duration = `${diffDays}d ${diffHours % 24}h ${diffMins % 60}m`;
    } else if (diffHours > 0) {
      duration = `${diffHours}h ${diffMins % 60}m`;
    } else {
      duration = `${diffMins}m`;
    }

    return { duration, durationInMinutes: diffMins };
  };

  // Prepare data for Ant Design Table
  const data = sortedData.map((tradeInput) => ({
    ...tradeInput,
    pnl: tradeInput.pnl,
    outcome: tradeInput.outcome,
    risk_reward: calculateRiskReward(tradeInput), // Add RiskReward column to data
    duration: calculateDuration(tradeInput.time_of_first_entry, tradeInput.time_of_last_exit), // Add duration to data
    durationInMinutes: calculateDuration(
      tradeInput.time_of_first_entry,
      tradeInput.time_of_last_exit
    ).durationInMinutes,
  }));

  // Columns for the Ant Design Table
  const columns = [
    {
      title: 'TradeID',
      dataIndex: 'trade_id',
      key: 'trade_id',
      sorter: { compare: (a, b) => a.id - b.id, multiple: 1 },
    },
    {
      title: 'Symbol',
      dataIndex: 'symbol',
      key: 'symbol',
      sorter: { compare: (a, b) => a.symbol.localeCompare(b.symbol), multiple: 2 },
    },
    {
      title: 'Side',
      dataIndex: 'side',
      key: 'side',
      sorter: { compare: (a, b) => a.side.localeCompare(b.side), multiple: 3 },
      render: (text) => text
    },
    { title: 'Quantity', dataIndex: 'total_entry_stock_amount', key: 'total_entry_stock_amount' },
    { 
      title: 'Entry Price', 
      dataIndex: 'avg_entry_price', 
      key: 'avg_entry_price',
      render: (text) => text
    },
    { 
      title: 'Exit Price', 
      dataIndex: 'avg_exit_price', 
      key: 'avg_exit_price',
      render: (text) => text
    },
    // num_entries, num_exits, stop_loss, price_target;
    { title: 'No. Entries', dataIndex: 'num_entries', key: 'num_entries' },
    { title: 'No. Exits', dataIndex: 'num_exits', key: 'num_exits' },
    { 
      title: 'SL', 
      dataIndex: 'stop_loss', 
      key: 'stop_loss',
      render: (text) => text
    },
    { 
      title: 'TP', 
      dataIndex: 'price_target', 
      key: 'price_target',
      render: (text) => text
    },
    {
      title: 'R-Multiple',
      dataIndex: 'risk_reward',
      key: 'risk_reward',
      render: (text, record) => calculateRiskReward(record),
    },
    {
      title: 'Duration',
      dataIndex: 'duration',
      key: 'duration',
      render: (text, record) =>
        calculateDuration(record.time_of_first_entry, record.time_of_last_exit).duration,
      sorter: { compare: (a, b) => a.durationInMinutes - b.durationInMinutes, multiple: 4 },
    },
    {
      title: 'Entry DateTime',
      dataIndex: 'time_of_first_entry',
      key: 'time_of_first_entry',
      sorter: {
        compare: (a, b) => new Date(a.time_of_first_entry) - new Date(b.time_of_first_entry),
        multiple: 5,
      },
    },
    {
      title: 'Exit DateTime',
      dataIndex: 'time_of_last_exit',
      key: 'time_of_last_exit',
      sorter: {
        compare: (a, b) => new Date(a.time_of_last_exit) - new Date(b.time_of_last_exit),
        multiple: 6,
      },
    },
    {
      title: 'Outcome',
      dataIndex: 'outcome',
      key: 'outcome',
      render: (text, record) => {
        const { side, total_entry_stock_amount, avg_entry_price, avg_exit_price } = record;
        const results =
          side === 'Buy'
            ? total_entry_stock_amount * (avg_exit_price - avg_entry_price) > 0
            : total_entry_stock_amount * (avg_exit_price - avg_entry_price) < 0;
        return (
          <span className={results ? 'outcomeProfit' : 'outcomeLost'}>
            {results ? 'Profit' : 'Loss'}
          </span>
        );
      },
    },
    {
      title: 'PNL',
      dataIndex: 'pnl',
      key: 'pnl',
      render: (text, record) => {
        const { side, total_entry_stock_amount, avg_entry_price, avg_exit_price } = record;
        const results =
          side === 'Buy'
            ? total_entry_stock_amount * (avg_exit_price - avg_entry_price) > 0
            : total_entry_stock_amount * (avg_exit_price - avg_entry_price) < 0;
        const pnl =
          side === 'Buy'
            ? Math.round(total_entry_stock_amount * (avg_exit_price - avg_entry_price))
            : Math.round(total_entry_stock_amount * -1 * (avg_exit_price - avg_entry_price));
        return <span className={results ? 'outcomeProfit' : 'outcomeLost'}>${pnl}</span>;
      },
      sorter: { compare: (a, b) => a.pnl - b.pnl, multiple: 7 },
    },
    {
      title: 'Journal',
      key: 'journal',
      render: (text, record) => (
        <Button
          type="primary"
          size="small"
          onClick={(event) => handleJournalClick(record, event)}
          style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
        >
          📝 Journal
        </Button>
      ),
    },
    {
      title: 'Edit',
      key: 'edit',
      render: (text, record) => (
        <Button
          type="primary"
          size="small"
          onClick={(event) => handleEditClick(record, event)}
          style={{ backgroundColor: '#1890ff', borderColor: '#1890ff' }}
        >
          ✏️ Edit
        </Button>
      ),
    },
  ];

  // Sorting function for sorting entire dataset before pagination
  const handleTableChange = (pagination, filters, sorter) => {
    let sorted = [...sortedData];

    // Apply sorting to the full dataset
    if (Array.isArray(sorter)) {
      sorter.forEach((sort) => {
        const { columnKey, order } = sort;
        if (order) {
          sorted = sorted.sort((a, b) => {
            if (order === 'ascend') {
              return a[columnKey] > b[columnKey] ? 1 : -1;
            } else {
              return a[columnKey] < b[columnKey] ? 1 : -1;
            }
          });
        }
      });
    } else if (sorter.field && sorter.order) {
      const { field, order } = sorter;
      sorted = sorted.sort((a, b) => {
        if (order === 'ascend') {
          return a[field] > b[field] ? 1 : -1;
        } else {
          return a[field] < b[field] ? 1 : -1;
        }
      });
    }

    setSortedData(sorted); // Apply the sorted data to the state
  };

  // Slice the data based on the current page and page size
  const currentData = sortedData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div>
      <h1>Historical Trades</h1>

      {/* Enhanced Filter Section */}
      <Card 
        size="small" 
        style={{ 
          marginBottom: '16px', 
          backgroundColor: hasActiveFilters ? '#fff7e6' : '#fafafa',
          border: hasActiveFilters ? '1px solid #ffd591' : '1px solid #f0f0f0'
        }}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🔍 Trade Filters</span>
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
            <Tooltip title="Filter trades by specific trading account">
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
            <Tooltip title="Filter trades by entry or exit date range">
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
            <Tooltip title="Number of trades matching current filters">
              <div style={{ fontWeight: '500', marginBottom: '4px', color: '#262626' }}>
                Results
              </div>
            </Tooltip>
            <div style={{ 
              padding: '4px 8px', 
              backgroundColor: '#e6f7ff', 
              border: '1px solid #91d5ff',
              borderRadius: '4px',
              textAlign: 'center',
              color: '#1890ff',
              fontWeight: '500'
            }}>
              {sortedData.length} trades
            </div>
          </Col>
        </Row>
      </Card>

      {/* Filter Summary */}
      {hasActiveFilters && (
        <div style={{ 
          marginBottom: '16px', 
          padding: '8px 12px', 
          backgroundColor: '#f6ffed', 
          border: '1px solid #b7eb8f',
          borderRadius: '6px',
          fontSize: '14px',
          color: '#52c41a'
        }}>
          <span style={{ fontWeight: '500' }}>Active Filters:</span>
          {selectedAccount !== 'all' && (
            <span style={{ marginLeft: '8px' }}>
              Account: <strong>{selectedAccount}</strong>
            </span>
          )}
          {dateRange && (
            <span style={{ marginLeft: '8px' }}>
              Date Range: <strong>
                {dateRange[0].format('MMM DD, YYYY')} - {dateRange[1].format('MMM DD, YYYY')}
              </strong>
              <span style={{ marginLeft: '8px', fontSize: '12px', opacity: 0.8 }}>
                💡 Tip: Manually navigate calendar to {getDisplayMonth() ? getDisplayMonth().format('MMMM YYYY') : 'the filtered month'}
              </span>
            </span>
          )}
        </div>
      )}

      {/* Ant Design Table with custom pagination */}
      <AntTable
        columns={columns}
        dataSource={currentData} // Display only the sliced data
        pagination={false} // Disable default pagination
        rowKey="trade_id"
        onRow={(record) => ({
          onClick: () => clickHandler(record),
        })}
        bordered
        size="middle"
        rowClassName="editable-row"
        onChange={handleTableChange} // Allow multi-column sorting
      />

      {/* Custom Pagination with Dropdown for page size change */}
      <Pagination
        defaultCurrent={1} // Default page number
        defaultPageSize={5} // Default page size
        total={sortedData.length} // Total rows
        showSizeChanger
        pageSizeOptions={['5', '10', '15', '20']}
        onChange={(page, pageSize) => {
          setCurrentPage(page); // Set current page
          setPageSize(pageSize); // Set page size
        }}
        showTotal={(total, range) => {
          const start = range[0];
          const end = range[1];
          const filteredText = hasActiveFilters ? ' (filtered)' : '';
          return `${start}-${end} of ${total} trades${filteredText}`;
        }}
        style={{ marginTop: '16px', textAlign: 'center' }}
      />

      {/* Bottom Summary Section */}
      <Card 
        size="small" 
        style={{ 
          marginTop: '16px', 
          backgroundColor: '#fafafa',
          border: '1px solid #f0f0f0'
        }}
      >
        <Row gutter={[16, 8]} align="middle">
          <Col xs={24} sm={12} md={6}>
            <div style={{ fontWeight: '500', marginBottom: '4px', color: '#262626' }}>
              Filtered Summary
            </div>
            <div style={{ fontSize: '14px', color: '#595959' }}>
              {hasActiveFilters ? (
                <>
                  <div>📊 <strong>{sortedData.length}</strong> trades found</div>
                  {dateRange && (
                    <div>📅 {dateRange[0].format('MMM DD, YYYY')} - {dateRange[1].format('MMM DD, YYYY')}</div>
                  )}
                  {selectedAccount !== 'all' && (
                    <div>🏦 Account: {selectedAccount}</div>
                  )}
                </>
              ) : (
                <div>📊 Showing all {sortedData.length} trades</div>
              )}
            </div>
          </Col>
          
          <Col xs={24} sm={12} md={6}>
            <div style={{ fontWeight: '500', marginBottom: '4px', color: '#262626' }}>
              P&L Summary
            </div>
            <div style={{ fontSize: '14px', color: '#595959' }}>
              {(() => {
                const totalPnL = sortedData.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
                const winningTrades = sortedData.filter(trade => (trade.pnl || 0) > 0).length;
                const losingTrades = sortedData.filter(trade => (trade.pnl || 0) < 0).length;
                
                return (
                  <>
                    <div style={{ color: totalPnL >= 0 ? '#52c41a' : '#ff4d4f' }}>
                      💰 Total: <strong>${totalPnL.toFixed(2)}</strong>
                    </div>
                    <div>✅ Wins: {winningTrades} | ❌ Losses: {losingTrades}</div>
                  </>
                );
              })()}
            </div>
          </Col>
          
          <Col xs={24} sm={12} md={6}>
            <div style={{ fontWeight: '500', marginBottom: '4px', color: '#262626' }}>
              Trade Distribution
            </div>
            <div style={{ fontSize: '14px', color: '#595959' }}>
              {(() => {
                // Debug logging
                console.log('Trade distribution calculation:', {
                  totalTrades: sortedData.length,
                  sampleTrade: sortedData[0],
                  sides: sortedData.map(t => t.side)
                });
                
                // Properly detect long vs short trades
                const longTrades = sortedData.filter(trade => 
                  trade.side && (trade.side.toUpperCase() === 'LONG' || trade.side.toUpperCase() === 'BUY')
                ).length;
                const shortTrades = sortedData.filter(trade => 
                  trade.side && (trade.side.toUpperCase() === 'SHORT' || trade.side.toUpperCase() === 'SELL')
                ).length;
                
                // Calculate average duration more robustly
                let totalDuration = 0;
                let validDurations = 0;
                
                sortedData.forEach(trade => {
                  if (trade.time_of_first_entry && trade.time_of_last_exit) {
                    try {
                      const entryDate = new Date(trade.time_of_first_entry);
                      const exitDate = new Date(trade.time_of_last_exit);
                      
                      if (!isNaN(entryDate.getTime()) && !isNaN(exitDate.getTime()) && exitDate > entryDate) {
                        const duration = exitDate - entryDate;
                        totalDuration += duration;
                        validDurations++;
                      }
                    } catch (error) {
                      console.log('Error calculating duration for trade:', trade.trade_id, error);
                    }
                  }
                });
                
                const avgDuration = validDurations > 0 ? totalDuration / validDurations : 0;
                
                // Convert to more readable format
                let durationText = 'N/A';
                if (avgDuration > 0) {
                  const days = Math.floor(avgDuration / (1000 * 60 * 60 * 24));
                  const hours = Math.floor((avgDuration % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                  const minutes = Math.floor((avgDuration % (1000 * 60 * 60)) / (1000 * 60));
                  
                  if (days > 0) {
                    durationText = `${days}d ${hours}h`;
                  } else if (hours > 0) {
                    durationText = `${hours}h ${minutes}m`;
                  } else {
                    durationText = `${minutes}m`;
                  }
                }
                
                return (
                  <>
                    <div>📈 Long: {longTrades} | 📉 Short: {shortTrades}</div>
                    <div>⏱️ Avg Duration: {durationText}</div>
                    <div style={{ fontSize: '12px', opacity: 0.7 }}>
                      Total: {sortedData.length} | Valid Durations: {validDurations}
                    </div>
                  </>
                );
              })()}
            </div>
          </Col>
          
          <Col xs={24} sm={12} md={6}>
            <div style={{ fontWeight: '500', marginBottom: '4px', color: '#262626' }}>
              Current View
            </div>
            <div style={{ fontSize: '14px', color: '#595959' }}>
              <div>📄 Page {currentPage} of {Math.ceil(sortedData.length / pageSize)}</div>
              <div>📊 {pageSize} per page</div>
              <div>🔄 Showing {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length}</div>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Conditionally render the selected trade details */}
      {showJournalModal && selectedTradeForJournal && (
        <JournalEntry
          trade={selectedTradeForJournal}
          onClose={() => {
            setShowJournalModal(false);
            setSelectedTradeForJournal(null);
          }}
          onSave={() => {
            // Optionally refresh data or show success message
            console.log('Journal saved successfully');
          }}
        />
      )}

      {/* Conditionally render the edit modal */}
      {showEditModal && selectedTradeForEdit && (
        <TradeEdit
          trade={selectedTradeForEdit}
          onClose={() => {
            setShowEditModal(false);
            setSelectedTradeForEdit(null);
          }}
          onSave={handleTradeUpdate}
          onDelete={handleTradeDelete}
        />
      )}
    </div>
  );
}
