import fs from 'fs';
import papa from 'papaparse';

// Reading CSV files (Positions and History)
const positionsCsv = fs.readFileSync('./uploads/Positions.csv', 'utf-8');
const historyCsv = fs.readFileSync('./uploads/History.csv', 'utf-8');

// Parse the CSVs using papaparse
const positionsData = papa.parse(positionsCsv, { header: true, dynamicTyping: true }).data;
const historyData = papa.parse(historyCsv, {
  header: true,
  dynamicTyping: true,
  skipEmptyLines: true,
}).data;

// Helper function to get actual fill price from a row
function getFillPrice(order) {
  if (order['Fill Price'] != null) {
    return order['Fill Price'];
  }
  if (order['Stop Price'] != null) {
    return order['Stop Price'];
  }
  if (order['Limit Price'] != null) {
    return order['Limit Price'];
  }
  return null;
}

// Helper function to convert UTC to Singapore Time (SGT)
function convertToSGT(date) {
  const dateObj = new Date(date);
  const offsetSGT = 8 * 60; // Singapore Time is UTC +8 hours
  dateObj.setMinutes(dateObj.getMinutes() + offsetSGT);
  return dateObj.toISOString().replace('T', ' ').split('.')[0]; // Convert to 'YYYY-MM-DD HH:mm:ss'
}

// Prepare to collect trade summaries
const tradeSummary = [];

// Helper function to process each symbol's history to group trades
const processTrades = () => {
  const symbols = [...new Set(historyData.map((item) => item['Symbol']))];
  symbols.forEach((symbol) => {
    let symbolHistory = historyData
      .filter((item) => item['Symbol'] === symbol)
      .sort((a, b) => new Date(a['Closing Time']) - new Date(b['Closing Time']));
    let positionQty = 0; // track current position for this symbol
    let currentTrade = null;

    symbolHistory.forEach((order) => {
      const status = order['Status'];
      const side = order['Side']; // 'Buy' or 'Sell'
      const qty = order['Qty'];

      // Only consider filled orders for adjusting position (ignore cancelled here)
      if (status !== 'Filled') {
        return;
      }

      const qtySigned = side === 'Buy' ? qty : -qty;

      if (positionQty === 0) {
        positionQty = qtySigned;
        currentTrade = {
          Symbol: symbol,
          Side: side === 'Buy' ? 'Buy' : 'Sell',
          entry_orders: [],
          exit_orders: [],
        };
        currentTrade['entry_orders'].push(order);
      } else {
        if (positionQty * qtySigned > 0) {
          positionQty += qtySigned;
          currentTrade['entry_orders'].push(order);
        } else {
          if (Math.abs(qtySigned) < Math.abs(positionQty)) {
            positionQty += qtySigned;
            currentTrade['exit_orders'].push(order);
          } else {
            currentTrade['exit_orders'].push(order);
            if (Math.abs(qtySigned) > Math.abs(positionQty)) {
              const closedQty = Math.abs(positionQty);
              currentTrade['exit_orders'][currentTrade['exit_orders'].length - 1]['Qty'] =
                closedQty;

              tradeSummary.push(currentTrade);

              positionQty = qtySigned + positionQty;
              const newSide = positionQty > 0 ? 'Buy' : 'Sell';
              currentTrade = {
                Symbol: symbol,
                Side: newSide,
                entry_orders: [],
                exit_orders: [],
              };

              const newEntry = { ...order, Qty: Math.abs(qtySigned) - closedQty, Side: newSide };
              currentTrade['entry_orders'].push(newEntry);
            } else {
              positionQty = 0;
              tradeSummary.push(currentTrade);
              currentTrade = null;
            }
          }
        }
      }
    });
  });
};

// Build output rows based on the summary of trades
const buildOutputRows = () => {
  const outputRows = tradeSummary.map((trade) => {
    const tradeId = `uuid-${Math.random().toString(36).substr(2, 9)}`;
    const symbol = trade['Symbol'];
    const side = trade['Side'];
    const entryOrders = trade['entry_orders'];
    const exitOrders = trade['exit_orders'];

    const firstEntryTime = new Date(
      Math.min(...entryOrders.map((o) => new Date(o['Closing Time'])))
    );
    const lastExitTime = new Date(Math.max(...exitOrders.map((o) => new Date(o['Closing Time']))));

    const totalEntryQty = entryOrders.reduce((acc, o) => acc + o['Qty'], 0);
    const avgEntryPrice =
      entryOrders.reduce((acc, o) => acc + getFillPrice(o) * o['Qty'], 0) / totalEntryQty;

    const totalExitQty = exitOrders.reduce((acc, o) => acc + o['Qty'], 0);
    const avgExitPrice =
      exitOrders.reduce((acc, o) => acc + getFillPrice(o) * o['Qty'], 0) / totalExitQty;

    const numEntries = entryOrders.length;
    const numExits = exitOrders.length;

    let stopLossVal = '';
    let priceTargetVal = '';

    // Find Stop Loss and Price Target from History (cancelled orders during this trade)
    if (firstEntryTime && lastExitTime) {
      const mask = (historyData) =>
        historyData['Symbol'] === symbol &&
        new Date(historyData['Placing Time']) >= firstEntryTime &&
        new Date(historyData['Closing Time']) <= lastExitTime;
      const tradeHist = historyData.filter(mask);
      const oppositeSide = side === 'Buy' ? 'Sell' : 'Buy';

      const stopOrders = tradeHist.filter(
        (order) => order['Side'] === oppositeSide && order['Type'] === 'Stop'
      );
      if (stopOrders.length > 0) {
        const lastStop = stopOrders[stopOrders.length - 1];
        stopLossVal = lastStop['Stop Price'] || lastStop['Limit Price'];
      }

      const limitOrders = tradeHist.filter(
        (order) => order['Side'] === oppositeSide && order['Type'] === 'Limit'
      );
      if (limitOrders.length > 0) {
        const lastLimit = limitOrders[limitOrders.length - 1];
        priceTargetVal = lastLimit['Limit Price'] || lastLimit['Stop Price'];
      }
    }

    const totalBuy = totalEntryQty * avgEntryPrice;
    const totalSell = totalExitQty * avgExitPrice;
    const pnl = side === 'Buy' ? totalSell - totalBuy : totalBuy - totalSell;
    const outcome = pnl > 0 ? 'Profit' : 'Loss';

    return {
      tradeid: tradeId,
      symbol: symbol,
      side: side,
      time_of_first_entry: firstEntryTime ? convertToSGT(firstEntryTime) : '',
      avg_entry_price: avgEntryPrice,
      total_entry_stock_amount: totalEntryQty,
      stop_loss: stopLossVal,
      price_target: priceTargetVal,
      time_of_last_exit: lastExitTime ? convertToSGT(lastExitTime) : '',
      avg_exit_price: avgExitPrice,
      total_exit_stock_amount: totalExitQty,
      amount_of_different_entries: numEntries,
      amount_of_different_exits: numExits,
      total_buy: totalBuy,
      total_sell: totalSell,
      pnl: pnl,
      outcome: outcome,
    };
  });

  return outputRows;
};

// Process trades and build output
processTrades();
const outputRows = buildOutputRows();

// Write the output to a JavaScript file
const outputJs = `const trades = ${JSON.stringify(outputRows, null, 4)};\nexport default trades;`;

fs.writeFileSync('data.js', outputJs);

console.log('Output saved to data.js');
