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
    if (selectedTrade && selectedTrade.id === tradeInput.id) {
      setToggleTrades(prev => !prev); // Toggle visibility if the same trade is clicked
    } else {
      setSelectedTrade(tradeInput);
      setToggleTrades(true); // Ensure visibility if a new trade is clicked
    }
  }

  // Function to calculate Risk/Reward (RR)
  const calculateRiskReward = (row) => {
    const { side, entry_price, exit_price, stop_loss } = row;
    if (side === "long") {
      const risk = entry_price - stop_loss;
      const reward = exit_price - entry_price;
      return reward > 0 ? (reward / risk).toFixed(2) : -1;
    }
    // For "short" trades
    const risk = stop_loss - entry_price;
    const reward = entry_price - exit_price;
    return reward > 0 ? (reward / risk).toFixed(2) : -1;
  };

  // Function to calculate Trade Duration (difference between exit and entry datetime)
  const calculateDuration = (entryDatetime, exitDatetime) => {
    const entry = new Date(entryDatetime);
    const exit = new Date(exitDatetime);
    const diff = (exit - entry) / 1000; // Difference in seconds
    const hours = Math.floor(diff / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    return { duration: `${hours}h ${minutes}m`, totalMinutes: hours * 60 + minutes };
  };

  // Prepare data for Ant Design Table
  const data = tradedata.map((tradeInput) => ({
    ...tradeInput,
    pnl: tradeInput.side === "long"
      ? Math.round(tradeInput.quantity * (tradeInput.exit_price - tradeInput.entry_price))
      : Math.round(tradeInput.quantity * -1 * (tradeInput.exit_price - tradeInput.entry_price)),
    outcome: tradeInput.side === "long"
      ? tradeInput.quantity * (tradeInput.exit_price - tradeInput.entry_price) > 0
      : tradeInput.quantity * (tradeInput.exit_price - tradeInput.entry_price) < 0,
    risk_reward: calculateRiskReward(tradeInput), // Add RiskReward column to data
    duration: calculateDuration(tradeInput.entry_datetime, tradeInput.exit_datetime), // Add duration to data
    durationInMinutes: calculateDuration(tradeInput.entry_datetime, tradeInput.exit_datetime).totalMinutes
  }));

  // Columns for the Ant Design Table
  const columns = [
    { title: 'TradeID', dataIndex: 'id', key: 'id', sorter: { compare: (a, b) => a.id - b.id, multiple: 1 } },
    { title: 'Symbol', dataIndex: 'symbol', key: 'symbol', sorter: { compare: (a, b) => a.symbol.localeCompare(b.symbol), multiple: 2 } },
    { title: 'Side', dataIndex: 'side', key: 'side', sorter: { compare: (a, b) => a.side.localeCompare(b.side), multiple: 3 } },
    { title: 'Quantity', dataIndex: 'quantity', key: 'quantity' },
    { title: 'Entry Price', dataIndex: 'entry_price', key: 'entry_price' },
    { title: 'Exit Price', dataIndex: 'exit_price', key: 'exit_price' },
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
      render: (text, record) => calculateDuration(record.entry_datetime, record.exit_datetime).duration,
      sorter: { compare: (a, b) => a.durationInMinutes - b.durationInMinutes, multiple: 4 },
    },
    { title: 'Entry DateTime', dataIndex: 'entry_datetime', key: 'entry_datetime', sorter: { compare: (a, b) => new Date(a.entry_datetime) - new Date(b.entry_datetime), multiple: 5 } },
    { title: 'Exit DateTime', dataIndex: 'exit_datetime', key: 'exit_datetime', sorter: { compare: (a, b) => new Date(a.exit_datetime) - new Date(b.exit_datetime), multiple: 6 } },
    {
      title: 'Outcome',
      dataIndex: 'outcome',
      key: 'outcome',
      render: (text, record) => {
        const { side, quantity, entry_price, exit_price } = record;
        const results = side === 'long'
          ? quantity * (exit_price - entry_price) > 0
          : quantity * (exit_price - entry_price) < 0;
        return <span className={results ? "outcomeProfit" : "outcomeLost"}>{results ? "Profit" : "Loss"}</span>;
      },
    },
    {
      title: 'PNL',
      dataIndex: 'pnl',
      key: 'pnl',
      render: (text, record) => {
        const { side, quantity, entry_price, exit_price } = record;
        const results = side === 'long'
          ? quantity * (exit_price - entry_price) > 0
          : quantity * (exit_price - entry_price) < 0;
        const pnl = side === 'long'
          ? Math.round(quantity * (exit_price - entry_price))
          : Math.round(quantity * -1 * (exit_price - entry_price));
        return <span className={results ? "outcomeProfit" : "outcomeLost"}>${pnl}</span>;
      },
      sorter: { compare: (a, b) => a.pnl - b.pnl, multiple: 7 },
    },
  ];

  // Sorting function for sorting entire dataset before pagination
  const handleTableChange = (pagination, filters, sorter) => {
    let sorted = [...data];

    // Apply sorting to the full dataset
    if (Array.isArray(sorter)) {
      sorter.forEach(sort => {
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
        rowKey="id"
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



// import React from "react";
// import TradeCards from "./TradeCards";
// import { useTable, usePagination } from 'react-table';

  
// //   export default PaginatedTable;
// export default function Table({tradedata}) {


// const [selectedTrade, setSelectedTrade] = React.useState(null);
// const [toggleTrades,setToggleTrades] = React.useState(false);

// function clickHandler(tradeInput) {
//     setSelectedTrade(tradeInput)
//     if (selectedTrade && selectedTrade.id === tradeInput.id) {
//         // If clicking the same trade, toggle visibility
//         setToggleTrades(prev => !prev);
//     } else {
//         // If clicking a different trade, set new trade & ensure visibility is true
//         setSelectedTrade(tradeInput);
//         setToggleTrades(true);
//     }
// }
//     const tradeTables = tradedata.map(
//         (tradeInput) =>{    
//             const results = tradeInput.side === "long"
//             ? tradeInput.quantity * (tradeInput.exit_price - tradeInput.entry_price) > 0
//             : tradeInput.quantity * (tradeInput.exit_price - tradeInput.entry_price) < 0;
    
//         // Calculate PNL
//             const pnl = tradeInput.side === "long"
//             ? Math.round(tradeInput.quantity * (tradeInput.exit_price - tradeInput.entry_price))
//             : Math.round(tradeInput.quantity * -1 * (tradeInput.exit_price - tradeInput.entry_price));
//         return(

            
//             <tr onClick={() => clickHandler(tradeInput)} key={tradeInput.id} style={{ cursor: "pointer" }}>
//             <th scope="row">{tradeInput.id}</th>
//             <td>{tradeInput.symbol}</td>
//             <td>{tradeInput.side}</td>
//             <td>{tradeInput.quantity}</td>
//             <td>{tradeInput.entry_price}</td>
//             <td>{tradeInput.exit_price}</td>
//             {/* Apply Conditional Class for Outcome */}
//             <td className={results ? "outcomeProfit" : "outcomeLost"}>
//                 {results ? "Profit" : "Loss"}
//             </td>

//             {/* Apply Conditional Class for PNL */}
//             <td className={results ? "outcomeProfit" : "outcomeLost"}>
//                 ${pnl}
//             </td>
//         </tr>
//         )}
//     )

//     return (
//         <div>
//         <h1>Historical Trades</h1>
//         <table className="table table-hover"> 
//                 <thead>
//                 <tr >
//                     <th scope="col">TradeID</th>
//                     <th scope="col">Symbol</th>
//                     <th scope="col">Side</th>
//                     <th scope="col">Quantity</th>
//                     <th scope="col">Entry Price</th>
//                     <th scope="col">Exit Price</th>
//                     <th  scope="col">Outcome</th>
//                     <th  scope="col">PNL</th>
//                 </tr>
//                 </thead>
//             <tbody>
//             {tradeTables}
//             </tbody>
//         </table>
//         {/* {console.log("Trade selected:", toggleTrades,selectedTrade)} */}
//         {toggleTrades && <TradeCards trade={selectedTrade} onClose={() => setSelectedTrade(null)}/>}
//         </div>
        
//     );
// }


{/* <tr onClick={clickHandler} >
<th scope="row">{id}</th>
<td>{symbol}</td>
<td>{side}</td>
<td>{quantity}</td>
<td>{entry_price}</td>
<td>{exit_price}</td>
<td>{result}</td>
</tr> */}