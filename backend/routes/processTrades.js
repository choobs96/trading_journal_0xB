import fs from 'fs';
import papa from 'papaparse';

// Function to get actual fill price from an order row
function getFillPrice(order) {
  return order['Fill Price'] || order['Stop Price'] || order['Limit Price'] || null;
}

// Function to convert UTC date to Singapore Time (SGT)
function convertToSGT(date) {
  if (!date) return null;
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return null; // Ensure valid date

  const offsetSGT = 8 * 60; // Singapore Time is UTC +8 hours
  dateObj.setMinutes(dateObj.getMinutes() + offsetSGT);
  return dateObj.toISOString().replace('T', ' ').split('.')[0]; // Format: 'YYYY-MM-DD HH:mm:ss'
}

// Function to process trade data
const processTrades = async (historyFilePath, positionsFilePath) => {
  try {
    console.log(
      `🔄 Processing trade files:\n - History: ${historyFilePath}\n - Positions: ${positionsFilePath}`
    );

    // Ensure both required files exist
    if (!fs.existsSync(historyFilePath) || !fs.existsSync(positionsFilePath)) {
      throw new Error('❌ One or both required files (History.csv, Positions.csv) are missing.');
    }

    // Read and parse CSV files
    const historyCsv = fs.readFileSync(historyFilePath, 'utf-8');
    const positionsCsv = fs.readFileSync(positionsFilePath, 'utf-8');

    if (!historyCsv.trim() || !positionsCsv.trim()) {
      throw new Error('❌ Error: One or both CSV files are empty.');
    }

    console.log('✅ CSV files successfully read...');

    const historyData = papa.parse(historyCsv, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
    }).data;

    const positionsData = papa.parse(positionsCsv, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
    }).data;

    if (historyData.length === 0 || positionsData.length === 0) {
      throw new Error('❌ Error: One or both CSV files contain no valid data.');
    }

    console.log(
      `✅ Parsed CSV data: History (${historyData.length} rows), Positions (${positionsData.length} rows)`
    );

    // Prepare trade summary array
    const tradeSummary = [];

    // Process each symbol's trade history
    const processTradeLogic = () => {
      const symbols = [...new Set(historyData.map((item) => item['Symbol']))];

      symbols.forEach((symbol) => {
        let symbolHistory = historyData
          .filter((item) => item['Symbol'] === symbol)
          .sort((a, b) => new Date(a['Closing Time']) - new Date(b['Closing Time']));

        let positionQty = 0; // Track current position for this symbol
        let currentTrade = null;

        symbolHistory.forEach((order) => {
          const status = order['Status'];
          const side = order['Side']; // 'Buy' or 'Sell'
          const qty = order['Qty'];

          if (status !== 'Filled') return; // Ignore non-filled orders

          const qtySigned = side === 'Buy' ? qty : -qty;

          if (positionQty === 0) {
            positionQty = qtySigned;
            currentTrade = {
              Symbol: symbol,
              Side: side,
              entry_orders: [order],
              exit_orders: [],
            };
          } else {
            if (positionQty * qtySigned > 0) {
              positionQty += qtySigned;
              currentTrade.entry_orders.push(order);
            } else {
              if (Math.abs(qtySigned) < Math.abs(positionQty)) {
                positionQty += qtySigned;
                currentTrade.exit_orders.push(order);
              } else {
                currentTrade.exit_orders.push(order);
                tradeSummary.push(currentTrade);

                positionQty = qtySigned + positionQty;
                const newSide = positionQty > 0 ? 'Buy' : 'Sell';
                currentTrade = {
                  Symbol: symbol,
                  Side: newSide,
                  entry_orders: [
                    { ...order, Qty: Math.abs(qtySigned) - Math.abs(positionQty), Side: newSide },
                  ],
                  exit_orders: [],
                };
              }
            }
          }
        });

        if (currentTrade && currentTrade.entry_orders.length > 0) {
          tradeSummary.push(currentTrade);
        }
      });
    };

    // Process trades
    processTradeLogic();

    console.log(`✅ Processed ${tradeSummary.length} trades.`);

    // Convert trades to output format
    const buildOutputRows = () => {
      return tradeSummary
        .map((trade) => {
          const tradeId = `uuid-${Math.random().toString(36).substr(2, 9)}`;
          const symbol = trade.Symbol;
          const side = trade.Side;
          const entryOrders = trade.entry_orders;
          const exitOrders = trade.exit_orders;

          if (entryOrders.length === 0 || exitOrders.length === 0) return null; // Skip incomplete trades

          const firstEntryTime = new Date(
            Math.min(...entryOrders.map((o) => new Date(o['Closing Time'])))
          );
          const lastExitTime = new Date(
            Math.max(...exitOrders.map((o) => new Date(o['Closing Time'])))
          );

          const totalEntryQty = entryOrders.reduce((acc, o) => acc + o['Qty'], 0);
          const avgEntryPrice =
            entryOrders.reduce((acc, o) => acc + getFillPrice(o) * o['Qty'], 0) / totalEntryQty;

          const totalExitQty = exitOrders.reduce((acc, o) => acc + o['Qty'], 0);
          const avgExitPrice =
            exitOrders.reduce((acc, o) => acc + getFillPrice(o) * o['Qty'], 0) / totalExitQty;

          const totalBuy = totalEntryQty * avgEntryPrice;
          const totalSell = totalExitQty * avgExitPrice;
          const pnl = side === 'Buy' ? totalSell - totalBuy : totalBuy - totalSell;
          const outcome = pnl > 0 ? 'Profit' : 'Loss';

          return {
            tradeid: tradeId,
            symbol: symbol,
            side: side,
            time_of_first_entry: convertToSGT(firstEntryTime),
            avg_entry_price: avgEntryPrice,
            total_entry_stock_amount: totalEntryQty,
            time_of_last_exit: convertToSGT(lastExitTime),
            avg_exit_price: avgExitPrice,
            total_exit_stock_amount: totalExitQty,
            total_buy: totalBuy,
            total_sell: totalSell,
            pnl: pnl,
            outcome: outcome,
          };
        })
        .filter((row) => row !== null);
    };

    // Build output and save it to data.js
    const outputRows = buildOutputRows();
    const outputJs = `const trades = ${JSON.stringify(
      outputRows,
      null,
      4
    )};\nexport default trades;`;
    fs.writeFileSync('./data.js', outputJs);

    console.log('✅ Trade data successfully processed and saved to data.js');
  } catch (error) {
    console.error('❌ Error processing trades:', error);
  }
};

export default processTrades;
