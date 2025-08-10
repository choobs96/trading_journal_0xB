import express from 'express';
import fileUpload from 'express-fileupload';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import db from './db.js'; // ✅ SQLite connection
import processTrades from './processTrades.js'; // ✅ Process CSV data
import multer from 'multer';
import config from './config.js';

const app = express();
const port = config.server.port;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Middleware setup
app.use(cors());
app.use(express.json());
app.use(fileUpload()); // Enable file uploads

console.log('✅ Server is running');

// **Middleware to authenticate JWT**
const authenticateToken = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];

  if (!token) {
    console.warn('❌ No token provided');
    return res.status(403).json({ success: false, message: 'Access Denied: No token provided' });
  }

  jwt.verify(token, config.jwt.secret, (err, user) => {
    if (err) {
      console.error('❌ Invalid token:', err.message);
      return res.status(403).json({ success: false, message: 'Invalid token' });
    }

    req.user = user;
    console.log(req.user); // ✅ Attach `user_id` to request
    next();
  });
};

// **User Login Route**
app.post('/api/login', async (req, res) => {
  console.log('🔑 Logging in...');
  const { email, password } = req.body;

  try {
    // ✅ Use parameterized query to fetch user by email
    const user = await db.get(`SELECT user_id, email, password FROM users WHERE email = ?;`, [
      email,
    ]);

    if (!user) {
      console.warn('❌ Login failed: Invalid credentials');
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    // ✅ Compare entered password with hashed password in DB
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.warn('❌ Login failed: Incorrect password');
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    // ✅ Store `user_id` in the JWT token
    const token = jwt.sign(
      { user_id: user.user_id, email: user.email },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    console.log('✅ Login successful');
    res.json({ success: true, token });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ success: false, message: 'Login failed' });
  }
});

// for registration route
app.post('/api/register', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  }

  try {
    // Check if user already exists
    const existingUser = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already in use' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user into SQLite
    const result = await db.run(
      'INSERT INTO users (email, password) VALUES (?, ?)',
      [email, hashedPassword]
    );

    res.json({
      success: true,
      message: 'User registered successfully',
      user: { user_id: result.lastID, email }, // Return user ID and email
    });
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// **Get All Trades for the Logged-in User**
app.get('/api/data', authenticateToken, async (req, res) => {
  console.log(`📊 Fetching trades for user_id: ${req.user.user_id}...`);

  try {
    const trades = await db.all(
      `SELECT * FROM trades WHERE user_id = ? ORDER BY time_of_first_entry DESC;`,
      [req.user.user_id]
    );

    res.json({ success: true, data: trades });
  } catch (error) {
    console.error('❌ Error fetching trades:', error);
    res.status(500).json({ success: false, message: 'Error fetching trade data' });
  }
});

app.get('/api/agg_daily_data', authenticateToken, async (req, res) => {
  console.log(`📊 Fetching daily stats for user_id: ${req.user.user_id}...`);

  try {
    const trades = await db.all(
      `SELECT 
            DATE(time_of_first_entry) AS trade_date,
            COUNT(*) AS total_trades,
            ROUND(COALESCE(SUM(pnl), 0), 2) AS total_pnl,
            ROUND(COALESCE(
                CASE 
                    WHEN COUNT(*) = 0 THEN NULL
                    ELSE SUM(CASE WHEN pnl > 0 THEN 1 ELSE 0 END) * 100.0 / COUNT(*)
                END, 0), 2
            ) AS win_rate,
            (
              SUM(
                  CASE 
                      WHEN side = 'Buy' THEN 
                          CASE 
                              WHEN (avg_exit_price - avg_entry_price) > 0 
                              THEN ROUND((avg_exit_price - avg_entry_price) / NULLIF(avg_entry_price - stop_loss, 0), 2) 
                              ELSE -1 
                          END
                      ELSE 
                          CASE 
                              WHEN (avg_entry_price - avg_exit_price) > 0 
                              THEN ROUND((avg_entry_price - avg_exit_price) / NULLIF(stop_loss - avg_entry_price, 0), 2) 
                              ELSE -1 
                          END
                  END
              ) 
            ) AS total_rr
        FROM trades 
        WHERE user_id = ?
        GROUP BY trade_date
        ORDER BY trade_date;`,
      [req.user.user_id]
    );

    res.json({ success: true, data: trades });
  } catch (error) {
    console.error('❌ Error fetching agg stats:', error);
    res.status(500).json({ success: false, message: 'Error fetching agg stats' });
  }
});

// **Get Trade Accounts for the Logged-in User**
app.get('/api/trade-accounts', authenticateToken, async (req, res) => {
  console.log(`📂 Fetching trade accounts for user_id: ${req.user.user_id}...`);

  try {
    const tradeAccounts = await db.all(
      `SELECT DISTINCT trade_account FROM trades WHERE user_id = ?;`,
      [req.user.user_id]
    );

    res.json({
      success: true,
      tradeAccounts: tradeAccounts.map((row) => row.trade_account), // Extract trade account names
    });
  } catch (error) {
    console.error('❌ Error fetching trade accounts:', error);
    res.status(500).json({ success: false, message: 'Error fetching trade accounts' });
  }
});

// **Update Trade**
app.put('/api/trades/:tradeId', authenticateToken, async (req, res) => {
  console.log(`✏️ Updating trade ${req.params.tradeId}...`);
  const tradeId = req.params.tradeId;
  const user_id = req.user.user_id;
  const updateData = req.body;

  try {
    // Verify the trade belongs to the user
    const existingTrade = await db.get(
      'SELECT trade_id FROM trades WHERE trade_id = ? AND user_id = ?',
      [tradeId, user_id]
    );

    if (!existingTrade) {
      return res.status(404).json({ 
        success: false, 
        message: 'Trade not found or access denied' 
      });
    }

    // Prepare the update query dynamically based on provided fields
    const allowedFields = [
      'symbol', 'side', 'total_entry_stock_amount', 'avg_entry_price', 'avg_exit_price',
      'num_entries', 'num_exits', 'stop_loss', 'price_target', 'time_of_first_entry',
      'time_of_last_exit', 'trade_account', 'notes'
    ];

    const updateFields = [];
    const updateValues = [];
    
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        updateFields.push(`${field} = ?`);
        updateValues.push(updateData[field]);
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No valid fields to update' 
      });
    }

    // Add trade_id and user_id to the values array
    updateValues.push(tradeId, user_id);

    const updateQuery = `
      UPDATE trades 
      SET ${updateFields.join(', ')}, 
          pnl = CASE 
            WHEN side = 'Buy' THEN total_entry_stock_amount * (avg_exit_price - avg_entry_price)
            ELSE total_entry_stock_amount * -1 * (avg_exit_price - avg_entry_price)
          END,
          outcome = CASE 
            WHEN (CASE 
              WHEN side = 'Buy' THEN total_entry_stock_amount * (avg_exit_price - avg_entry_price)
              ELSE total_entry_stock_amount * -1 * (avg_exit_price - avg_entry_price)
            END) >= 0 THEN 'Profit'
            ELSE 'Loss'
          END
      WHERE trade_id = ? AND user_id = ?
    `;

    const result = await db.run(updateQuery, updateValues);

    if (result.changes > 0) {
      console.log(`✅ Trade ${tradeId} updated successfully`);
      res.json({ 
        success: true, 
        message: 'Trade updated successfully',
        changes: result.changes
      });
    } else {
      res.status(400).json({ 
        success: false, 
        message: 'No changes made to the trade' 
      });
    }
  } catch (error) {
    console.error('❌ Error updating trade:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error updating trade' 
    });
  }
});

// **Delete Trade**
app.delete('/api/trades/:tradeId', authenticateToken, async (req, res) => {
  console.log(`🗑️ Deleting trade ${req.params.tradeId}...`);
  const tradeId = req.params.tradeId;
  const user_id = req.user.user_id;

  try {
    // Verify the trade belongs to the user
    const existingTrade = await db.get(
      'SELECT trade_id FROM trades WHERE trade_id = ? AND user_id = ?',
      [tradeId, user_id]
    );

    if (!existingTrade) {
      return res.status(404).json({ 
        success: false, 
        message: 'Trade not found or access denied' 
      });
    }

    // Delete the trade (journal entries will be automatically deleted due to CASCADE)
    const result = await db.run(
      'DELETE FROM trades WHERE trade_id = ? AND user_id = ?',
      [tradeId, user_id]
    );

    if (result.changes > 0) {
      console.log(`✅ Trade ${tradeId} deleted successfully`);
      res.json({ 
        success: true, 
        message: 'Trade deleted successfully',
        changes: result.changes
      });
    } else {
      res.status(400).json({ 
        success: false, 
        message: 'Failed to delete trade' 
      });
    }
  } catch (error) {
    console.error('❌ Error deleting trade:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting trade' 
    });
  }
});

// **Create Journal Entry**
app.post('/api/journal', authenticateToken, async (req, res) => {
  console.log('📝 Creating journal entry...');
  const { trade_id, trade_account, journal_content } = req.body;
  const user_id = req.user.user_id;

  if (!trade_id || !trade_account || !journal_content) {
    return res.status(400).json({ 
      success: false, 
      message: 'Trade ID, trade account, and journal content are required' 
    });
  }

  try {
    // Verify the trade belongs to the user
    const trade = await db.get(
      'SELECT trade_id FROM trades WHERE trade_id = ? AND user_id = ?',
      [trade_id, user_id]
    );

    if (!trade) {
      return res.status(404).json({ 
        success: false, 
        message: 'Trade not found or access denied' 
      });
    }

    // Check if journal entry already exists
    const existingJournal = await db.get(
      'SELECT journal_id FROM trade_journals WHERE trade_id = ? AND user_id = ?',
      [trade_id, user_id]
    );

    if (existingJournal) {
      return res.status(400).json({ 
        success: false, 
        message: 'Journal entry already exists for this trade' 
      });
    }

    // Create journal entry
    const result = await db.run(
      'INSERT INTO trade_journals (trade_id, user_id, trade_account, journal_content) VALUES (?, ?, ?, ?)',
      [trade_id, user_id, trade_account, JSON.stringify(journal_content)]
    );

    res.json({
      success: true,
      message: 'Journal entry created successfully',
      journal_id: result.lastID
    });
  } catch (error) {
    console.error('❌ Error creating journal entry:', error);
    res.status(500).json({ success: false, message: 'Error creating journal entry' });
  }
});

// **Get Journal Entry for a Trade**
app.get('/api/journal/:trade_id', authenticateToken, async (req, res) => {
  console.log(`📖 Fetching journal for trade_id: ${req.params.trade_id}...`);
  const { trade_id } = req.params;
  const user_id = req.user.user_id;

  try {
    const journal = await db.get(
      'SELECT * FROM trade_journals WHERE trade_id = ? AND user_id = ?',
      [trade_id, user_id]
    );

    if (!journal) {
      return res.status(404).json({ 
        success: false, 
        message: 'Journal entry not found' 
      });
    }

    // Parse the JSON content
    journal.journal_content = JSON.parse(journal.journal_content);

    res.json({
      success: true,
      journal
    });
  } catch (error) {
    console.error('❌ Error fetching journal entry:', error);
    res.status(500).json({ success: false, message: 'Error fetching journal entry' });
  }
});

// **Update Journal Entry**
app.put('/api/journal/:trade_id', authenticateToken, async (req, res) => {
  console.log(`✏️ Updating journal for trade_id: ${req.params.trade_id}...`);
  const { trade_id } = req.params;
  const { journal_content } = req.body;
  const user_id = req.user.user_id;

  if (!journal_content) {
    return res.status(400).json({ 
      success: false, 
      message: 'Journal content is required' 
    });
  }

  try {
    // Check if journal entry exists and belongs to user
    const existingJournal = await db.get(
      'SELECT journal_id FROM trade_journals WHERE trade_id = ? AND user_id = ?',
      [trade_id, user_id]
    );

    if (!existingJournal) {
      return res.status(404).json({ 
        success: false, 
        message: 'Journal entry not found' 
      });
    }

    // Update journal entry
    await db.run(
      'UPDATE trade_journals SET journal_content = ?, updated_at = CURRENT_TIMESTAMP WHERE trade_id = ? AND user_id = ?',
      [JSON.stringify(journal_content), trade_id, user_id]
    );

    res.json({
      success: true,
      message: 'Journal entry updated successfully'
    });
  } catch (error) {
    console.error('❌ Error updating journal entry:', error);
    res.status(500).json({ success: false, message: 'Error updating journal entry' });
  }
});

// **Delete Journal Entry**
app.delete('/api/journal/:trade_id', authenticateToken, async (req, res) => {
  console.log(`🗑️ Deleting journal for trade_id: ${req.params.trade_id}...`);
  const { trade_id } = req.params;
  const user_id = req.user.user_id;

  try {
    // Check if journal entry exists and belongs to user
    const existingJournal = await db.get(
      'SELECT journal_id FROM trade_journals WHERE trade_id = ? AND user_id = ?',
      [trade_id, user_id]
    );

    if (!existingJournal) {
      return res.status(404).json({ 
        success: false, 
        message: 'Journal entry not found' 
      });
    }

    // Delete journal entry
    await db.run(
      'DELETE FROM trade_journals WHERE trade_id = ? AND user_id = ?',
      [trade_id, user_id]
    );

    res.json({
      success: true,
      message: 'Journal entry deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting journal entry:', error);
    res.status(500).json({ success: false, message: 'Error deleting journal entry' });
  }
});

// **Get All Journal Entries for User**
app.get('/api/journals', authenticateToken, async (req, res) => {
  console.log(`📚 Fetching all journals for user_id: ${req.user.user_id}...`);
  const user_id = req.user.user_id;

  try {
    const journals = await db.all(
      `SELECT j.*, t.symbol, t.side, t.pnl, t.outcome 
       FROM trade_journals j 
       JOIN trades t ON j.trade_id = t.trade_id 
       WHERE j.user_id = ? 
       ORDER BY j.created_at DESC`,
      [user_id]
    );

    // Parse JSON content for each journal
    journals.forEach(journal => {
      journal.journal_content = JSON.parse(journal.journal_content);
    });

    res.json({
      success: true,
      journals
    });
  } catch (error) {
    console.error('❌ Error fetching journals:', error);
    res.status(500).json({ success: false, message: 'Error fetching journals' });
  }
});

// **Protected file upload route (with SQLite processing)**
app.post('/api/upload', authenticateToken, async (req, res) => {
  console.log('📂 Uploading process started...');

  if (!req.files || Object.keys(req.files).length === 0) {
    console.error('❌ No files uploaded.');
    return res.status(400).json({ success: false, message: 'No files were uploaded.' });
  }

  const uploadedFiles = Array.isArray(req.files.file) ? req.files.file : [req.files.file];
      const uploadDir = path.join(__dirname, config.upload.directory);

  if (!fs.existsSync(uploadDir)) {
    console.log('📂 Creating uploads directory...');
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  let historyPath = null;
  let positionsPath = null;

  try {
    await Promise.all(
      uploadedFiles.map((file) => {
        if (!file || !file.name) {
          console.error('❌ Error: File is missing a name.');
          return res.status(400).json({ success: false, message: 'Invalid file uploaded.' });
        }

        const filePath = path.join(uploadDir, file.name);
        console.log(`✅ Saving file: ${file.name}`);

        return new Promise((resolve, reject) => {
          file.mv(filePath, (err) => {
            if (err) {
              console.error(`❌ File move error for ${file.name}:`, err);
              return reject(err);
            }

            const fileNameLower = file.name.toLowerCase();
            if (fileNameLower.includes('history.csv')) historyPath = filePath;
            if (fileNameLower.includes('positions.csv')) positionsPath = filePath;

            resolve();
          });
        });
      })
    );

    if (!historyPath || !positionsPath) {
      console.error('❌ Missing required files: History.csv or Positions.csv');
      return res.status(400).json({
        success: false,
        message: 'Both History.csv and Positions.csv are required.',
      });
    }

    console.log(`📂 History Path: ${historyPath}`);
    console.log(`📂 Positions Path: ${positionsPath}`);

    // ✅ Extract user ID from the authenticated request
    const user_id = req.user?.user_id; // 🛠 Ensure `user_id` is retrieved correctly
    const { trade_account } = req.body;

    if (!user_id) {
      console.error('❌ User ID is undefined in the request');
      return res.status(400).json({ success: false, message: 'User authentication failed.' });
    }

    if (!trade_account) {
      return res.status(400).json({ success: false, message: 'Trade account is required.' });
    }

    console.log(`⚡ Processing trades for user ${user_id} and trade account ${trade_account}...`);

    // ✅ Call processTrades and pass user_id & trade_account
    await processTrades(historyPath, positionsPath, user_id, trade_account);

    console.log('✅ Trade data successfully processed to DB!');
    return res.status(200).json({
      success: true,
      message: 'Files uploaded and processed successfully!',
    });
  } catch (error) {
    console.error('❌ Upload error:', error);
    return res
      .status(500)
      .json({ success: false, message: 'Error uploading files.', error: error.message });
  }
});

// **Start the server**
app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});

// IN PROGRESS FOR NEW ITEMS INTERGRATION OF SAVING JOURNAL COMMENTS
