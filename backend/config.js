import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config();

const config = {
  // Database Configuration
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'dev',
    password: process.env.DB_PASSWORD || 'dev_password',
    name: process.env.DB_NAME || 'trading_journal',
    filename: process.env.DB_FILENAME || './trading_journal.db'
  },

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'dev_jwt_secret_key_for_local_development_only_12345',
    expiresIn: process.env.JWT_EXPIRES_IN || '1h'
  },

  // Server Configuration
  server: {
    port: process.env.PORT || 5001,
    nodeEnv: process.env.NODE_ENV || 'development'
  },

  // File Upload Configuration
  upload: {
    directory: process.env.UPLOAD_DIR || './uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760 // 10MB
  },

  // CORS Configuration
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173'
  }
};

export default config;
