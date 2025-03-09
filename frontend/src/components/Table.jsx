import React from 'react';
import { Table as AntTable, Pagination } from 'antd'; // Import Ant Design Table and Pagination
import TradeCards from './TradeCards'; // Assuming you have this component

export default function Table({ tradedata }) {
  const [selectedTrade, setSelectedTrade] = React.useState(null);
  const [toggleTrades, setToggleTrades] = React.useState(false);
  const [currentPage, setCurrentPage] = React.useState(1); // Track the current page
  const [pageSize, setPageSize] = React.useState(10); // Track the current page size
  const [sortedData, setSortedData] = React.useState(tradedata); // To store the sorted dataset

  // Function for handling row click
  function clickHandler(tradeInput) {
    setSelectedTrade(tradeInput);
    if (selectedTrade && selectedTrade.trade_id === tradeInput.trade_id) {
      setToggleTrades((prev) => !prev); // Toggle visibility if the same trade is clicked
    } else {
      setSelectedTrade(tradeInput);
      setToggleTrades(true); // Ensure visibility if a new trade is clicked
    }
  }

  // Function to calculate Risk/Reward (RR)
  const calculateRiskReward = (row) => {
    const { side, avg_entry_price, avg_exit_price, stop_loss } = row;
    if (side === 'Buy') {
      const risk = avg_entry_price - stop_loss;
      const reward = avg_exit_price - avg_entry_price;
      return reward > 0 ? (reward / risk).toFixed(2) : -1;
    }
    // For "short" trades
    const risk = stop_loss - avg_entry_price;
    const reward = avg_entry_price - avg_exit_price;
    return reward > 0 ? (reward / risk).toFixed(2) : -1;
  };

  // Function to calculate Trade Duration (difference between exit and entry datetime)
  const calculateDuration = (entryDatetime, exitDatetime) => {
    const entry = new Date(entryDatetime);
    const exit = new Date(exitDatetime);
    const diff = (exit - entry) / 1000; // Difference in seconds
    const hours = Math.floor(diff / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    return {
      duration: `${hours}h ${minutes}m`,
      totalMinutes: hours * 60 + minutes,
    };
  };

  // Prepare data for Ant Design Table
  const data = tradedata.map((tradeInput) => ({
    ...tradeInput,
    pnl: tradeInput.pnl,
    outcome: tradeInput.outcome,
    risk_reward: calculateRiskReward(tradeInput), // Add RiskReward column to data
    duration: calculateDuration(tradeInput.time_of_first_entry, tradeInput.time_of_last_exit), // Add duration to data
    durationInMinutes: calculateDuration(
      tradeInput.time_of_first_entry,
      tradeInput.time_of_last_exit
    ).totalMinutes,
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
    },
    { title: 'Quantity', dataIndex: 'total_entry_stock_amount', key: 'total_entry_stock_amount' },
    { title: 'Entry Price', dataIndex: 'avg_entry_price', key: 'avg_entry_price' },
    { title: 'Exit Price', dataIndex: 'avg_exit_price', key: 'avg_exit_price' },
    {
      title: 'Risk/Reward',
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
  ];

  // Sorting function for sorting entire dataset before pagination
  const handleTableChange = (pagination, filters, sorter) => {
    let sorted = [...data];

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

      {/* Ant Design Table with custom pagination */}
      <AntTable
        columns={columns}
        dataSource={currentData} // Display only the sliced data
        pagination={false} // Disable default pagination
        rowKey="tradeid"
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
        defaultPageSize={10} // Default page size
        total={sortedData.length} // Total rows
        showSizeChanger
        pageSizeOptions={['5', '10', '15', '20']}
        onChange={(page, pageSize) => {
          setCurrentPage(page); // Set current page
          setPageSize(pageSize); // Set page size
        }}
        showTotal={(total, range) => `${range[0]}-${range[1]} of ${total} items`} // Show total and range
      />

      {/* Conditionally render the selected trade details */}
      {toggleTrades && <TradeCards trade={selectedTrade} onClose={() => setSelectedTrade(null)} />}
    </div>
  );
}
