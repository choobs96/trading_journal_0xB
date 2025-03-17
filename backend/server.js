import express from 'express';
import fileUpload from 'express-fileupload';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import db from './db.js'; // ✅ PostgreSQL connection
import processTrades from './processTrades.js'; // ✅ Process CSV data
import multer from 'multer';

const app = express();
const port = 5001;

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

  jwt.verify(token, process.env.JWT_SECRET || 'test_secret_key', (err, user) => {
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
    const user = await db.query(`SELECT user_id, email, password FROM users WHERE email = $1;`, [
      email,
    ]);

    if (user.rows.length === 0) {
      console.warn('❌ Login failed: Invalid credentials');
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    // ✅ Compare entered password with hashed password in DB
    const isMatch = await bcrypt.compare(password, user.rows[0].password);
    if (!isMatch) {
      console.warn('❌ Login failed: Incorrect password');
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    // ✅ Store `user_id` in the JWT token
    const token = jwt.sign(
      { user_id: user.rows[0].user_id, email: user.rows[0].email },
      process.env.JWT_SECRET || 'test_secret_key',
      { expiresIn: '1h' }
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
    const existingUser = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Email already in use' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user into PostgreSQL
    const result = await db.query(
      'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING user_id, email',
      [email, hashedPassword]
    );

    res.json({
      success: true,
      message: 'User registered successfully',
      user: result.rows[0], // Return user ID and email
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
    const trades = await db.query(
      `SELECT * FROM trades WHERE user_id = $1 ORDER BY time_of_first_entry DESC;`,
      [req.user.user_id]
    );

    res.json({ success: true, data: trades.rows });
  } catch (error) {
    console.error('❌ Error fetching trades:', error);
    res.status(500).json({ success: false, message: 'Error fetching trade data' });
  }
});

app.get('/api/agg_daily_data', authenticateToken, async (req, res) => {
  console.log(`📊 Fetching daily stats for user_id: ${req.user.user_id}...`);

  try {
    const trades = await db.query(
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
        WHERE user_id = $1
        GROUP BY trade_date
        ORDER BY trade_date;


      `,
      [req.user.user_id]
    );

    res.json({ success: true, data: trades.rows });
  } catch (error) {
    console.error('❌ Error fetching agg stats:', error);
    res.status(500).json({ success: false, message: 'Error fetching agg stats' });
  }
});

// **Get Trade Accounts for the Logged-in User**
app.get('/api/trade-accounts', authenticateToken, async (req, res) => {
  console.log(`📂 Fetching trade accounts for user_id: ${req.user.user_id}...`);

  try {
    const tradeAccounts = await db.query(
      `SELECT DISTINCT trade_account FROM trades WHERE user_id = $1;`,
      [req.user.user_id]
    );

    res.json({
      success: true,
      tradeAccounts: tradeAccounts.rows.map((row) => row.trade_account), // Extract trade account names
    });
  } catch (error) {
    console.error('❌ Error fetching trade accounts:', error);
    res.status(500).json({ success: false, message: 'Error fetching trade accounts' });
  }
});

// **Protected file upload route (with PostgreSQL processing)**
app.post('/api/upload', authenticateToken, async (req, res) => {
  console.log('📂 Uploading process started...');

  if (!req.files || Object.keys(req.files).length === 0) {
    console.error('❌ No files uploaded.');
    return res.status(400).json({ success: false, message: 'No files were uploaded.' });
  }

  const uploadedFiles = Array.isArray(req.files.file) ? req.files.file : [req.files.file];
  const uploadDir = path.join(__dirname, 'uploads');

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
