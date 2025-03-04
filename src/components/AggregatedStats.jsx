// AggregatedStats.js
import trades from "../data";  // Assuming the trade data is imported from data.js

const calculateAggregatedData = (trades) => {
  const aggregatedData = {};

  trades.forEach((trade) => {
    const date = new Date(trade.entry_datetime).toISOString().split('T')[0];  // Get the date part of entry_datetime

    if (!aggregatedData[date]) {
      aggregatedData[date] = {
        totalPNL: 0,  // Changed totalProfit to totalPNL
        totalTrades: 0,
        totalRR: 0,
        winningTrades: 0,
        losingTrades: 0,
      };
    }

    // Calculate PNL for the day
    let pnl = 0;
    if (trade.side === "long") {
      pnl = (trade.exit_price - trade.entry_price) * trade.quantity;
    } else if (trade.side === "short") {
      pnl = (trade.entry_price - trade.exit_price) * trade.quantity;
    }

    // Calculate RR for the day
    let rr = 0;
    if (trade.side === "long") {
      rr = (trade.exit_price - trade.entry_price) / (trade.entry_price - trade.stop_loss);
    } else if (trade.side === "short") {
      rr = (trade.entry_price - trade.exit_price) / (trade.stop_loss - trade.entry_price);
    }

    // Update aggregated data
    aggregatedData[date].totalPNL += pnl;  // Using totalPNL instead of totalProfit
    aggregatedData[date].totalTrades += 1;
    aggregatedData[date].totalRR += rr;

    if ((trade.side === "long" && trade.exit_price > trade.entry_price) || (trade.side === "short" && trade.exit_price < trade.entry_price)) {
      aggregatedData[date].winningTrades += 1;
    } else {
      aggregatedData[date].losingTrades += 1;
    }
  });

  // Convert aggregated data to an array format
  const resultArray = Object.keys(aggregatedData).map((date) => {
    const dayData = aggregatedData[date];
    return {
      date,
      totalPNL: dayData.totalPNL.toFixed(2),  // Displaying total PNL
      totalTrades: dayData.totalTrades,
      averageRR: (dayData.totalRR / dayData.totalTrades).toFixed(2),
      winRate: (dayData.winningTrades / dayData.totalTrades * 100).toFixed(2),
    };
  });

  return resultArray;
};

// Call the function and export the result
const aggregatedData = calculateAggregatedData(trades);
export default aggregatedData;
