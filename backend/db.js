import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import config from './config.js';

let db = null;

// Initialize SQLite database
async function initializeDatabase() {
  try {
    db = await open({
      filename: config.database.filename,
      driver: sqlite3.Database
    });

    console.log('✅ Connected to SQLite database');

    // Create tables if they don't exist
    await createTables();
    
    return db;
  } catch (error) {
    console.error('❌ SQLite connection error:', error);
    throw error;
  }
}

// Create database tables
async function createTables() {
  try {
    // Users table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        user_id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Trades table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS trades (
        trade_id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        trade_account TEXT NOT NULL,
        symbol TEXT NOT NULL,
        side TEXT CHECK(side IN ('Buy', 'Sell')),
        time_of_first_entry DATETIME NOT NULL,
        avg_entry_price REAL NOT NULL,
        total_entry_stock_amount INTEGER NOT NULL,
        time_of_last_exit DATETIME NOT NULL,
        avg_exit_price REAL NOT NULL,
        total_exit_stock_amount INTEGER NOT NULL,
        total_buy REAL NOT NULL,
        total_sell REAL NOT NULL,
        pnl REAL NOT NULL,
        outcome TEXT CHECK(outcome IN ('Profit', 'Loss')),
        num_entries INTEGER DEFAULT 0,
        num_exits INTEGER DEFAULT 0,
        stop_loss REAL,
        price_target REAL,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (user_id)
      )
    `);

    // Trade journals table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS trade_journals (
        journal_id INTEGER PRIMARY KEY AUTOINCREMENT,
        trade_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        trade_account TEXT NOT NULL,
        journal_content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (trade_id) REFERENCES trades (trade_id),
        FOREIGN KEY (user_id) REFERENCES users (user_id)
      )
    `);

    console.log('✅ Database tables created successfully');
    
    // Add notes column to existing trades table if it doesn't exist
    try {
      await db.exec(`ALTER TABLE trades ADD COLUMN notes TEXT`);
      console.log('✅ Added notes column to trades table');
    } catch (error) {
      // Column already exists, ignore error
      console.log('ℹ️ Notes column already exists in trades table');
    }
  } catch (error) {
    console.error('❌ Error creating tables:', error);
    throw error;
  }
}

// Initialize database on module load
const database = await initializeDatabase();

export default database;
