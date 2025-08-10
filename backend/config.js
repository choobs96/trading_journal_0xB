import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config();

// Backend configuration
const config = {
  // Database Configuration
  database: {
    filename: process.env.DB_FILENAME || 'trading_journal.db',
    verbose: process.env.DB_VERBOSE === 'true' || false,
  },

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },

  // Server Configuration
  server: {
    port: process.env.PORT || 5001,
    host: process.env.HOST || '0.0.0.0',
  },

  // Upload Configuration
  upload: {
    directory: process.env.UPLOAD_DIR || 'uploads',
    maxFileSize: process.env.MAX_FILE_SIZE || 10 * 1024 * 1024, // 10MB
    allowedTypes: process.env.ALLOWED_FILE_TYPES || '.csv,.xlsx,.xls',
  },

  // CORS Configuration
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: process.env.CORS_CREDENTIALS === 'true' || false,
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || 'logs.txt',
  }
};

export default config;
