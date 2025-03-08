import express from 'express';
import fileUpload from 'express-fileupload';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import data from './data.js'; // ✅ Ensure correct import of trade data

const app = express();
const port = 5001;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Sample user data (hashed password: "password123")
const users = [
  {
    id: 1,
    email: 'user@example.com',
    password: '$2b$10$DHV/w1YQDKitmxTOMOhwTOZfAUmkdPB5Tz/376Ls9d8qS/IxUCPgO',
  },
];

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

  jwt.verify(token, 'test_secret_key', (err, user) => {
    if (err) {
      console.error('❌ Invalid token:', err.message);
      return res.status(403).json({ success: false, message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// **User Login Route**
app.post('/api/login', async (req, res) => {
  console.log('🔑 Logging in...');
  const { email, password } = req.body;

  const user = users.find((user) => user.email === email);
  if (!user) {
    console.warn('❌ Login failed: Invalid credentials');
    return res.status(400).json({ success: false, message: 'Invalid credentials' });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    console.warn('❌ Login failed: Incorrect password');
    return res.status(400).json({ success: false, message: 'Invalid credentials' });
  }

  const token = jwt.sign({ id: user.id, email: user.email }, 'test_secret_key', { expiresIn: '1h' });
  console.log('✅ Login successful');
  res.json({ success: true, token });
});

// **API endpoint to serve trade data**
app.get('/api/data', authenticateToken, (req, res) => {
  console.log('📊 Fetching trade data...');
  res.json({ success: true, data });
});

// **Protected file upload route**
app.post('/api/upload', authenticateToken, async (req, res) => {
  console.log('📂 Uploading process started...');

  // **Debugging: Print request files**
  console.log('📂 Files received:', req.files);

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
    // **Upload all files**
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

            // Assign correct paths
            const fileNameLower = file.name.toLowerCase();
            if (fileNameLower.includes('history.csv')) historyPath = filePath;
            if (fileNameLower.includes('positions.csv')) positionsPath = filePath;

            resolve();
          });
        });
      })
    );

    // **Ensure both required files exist**
    if (!historyPath || !positionsPath) {
      console.error('❌ Missing required files: History.csv or Positions.csv');
      return res.status(400).json({
        success: false,
        message: 'Both History.csv and Positions.csv are required.',
      });
    }

    console.log(`📂 History Path: ${historyPath}`);
    console.log(`📂 Positions Path: ${positionsPath}`);

    // **Call processTrades function here if needed**
    // await processTrades(historyPath, positionsPath);

    return res.status(200).json({
      success: true,
      message: 'Files uploaded successfully!',
      files: { historyPath, positionsPath },
    });
  } catch (error) {
    console.error('❌ Upload error:', error);
    return res.status(500).json({ success: false, message: 'Error uploading files.', error: error.message });
  }
});

// **Start the server**
app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});
