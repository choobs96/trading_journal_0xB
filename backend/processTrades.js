import fs from 'fs';
import papa from 'papaparse';
import db from './db.js'; // ✅ Import PostgreSQL connection

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
const processTrades = async (historyFilePath, positionsFilePath, user_id, trade_account) => {
  try {
    console.log(
      `🔄 Processing trade files for user ${user_id}:\n - History: ${historyFilePath}\n - Positions: ${positionsFilePath}`
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

    // Insert trades into PostgreSQL
    for (const trade of tradeSummary) {
      const symbol = trade.Symbol;
      const side = trade.Side;
      const entryOrders = trade.entry_orders;
      const exitOrders = trade.exit_orders;

      if (entryOrders.length === 0 || exitOrders.length === 0) continue; // Skip incomplete trades

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

      // Insert into PostgreSQL
      await db.query(
        `INSERT INTO trades 
        (user_id, trade_account, symbol, side, time_of_first_entry, avg_entry_price, total_entry_stock_amount, 
         time_of_last_exit, avg_exit_price, total_exit_stock_amount, total_buy, total_sell, pnl, outcome) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        [
          user_id,
          trade_account,
          symbol,
          side,
          convertToSGT(firstEntryTime),
          avgEntryPrice,
          totalEntryQty,
          convertToSGT(lastExitTime),
          avgExitPrice,
          totalExitQty,
          totalBuy,
          totalSell,
          pnl,
          outcome,
        ]
      );
    }

    console.log('✅ Trade data successfully inserted into PostgreSQL!');
  } catch (error) {
    console.error('❌ Error processing trades:', error);
  }
};

export default processTrades;
