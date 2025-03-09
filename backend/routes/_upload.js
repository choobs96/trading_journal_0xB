import express from 'express';
import fileUpload from 'express-fileupload';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import jwt from 'jsonwebtoken';
import processTrades from './processTrades.js'; // Import processTrades function

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Enable file upload middleware
router.use(fileUpload());

// Middleware to check JWT
const authenticateToken = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];

  if (!token) {
    return res.status(403).json({ success: false, message: 'Access Denied: No token provided' });
  }

  jwt.verify(token, 'test_secret_key', (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// POST route for file upload
router.post('/upload', authenticateToken, async (req, res) => {
  console.log('✅ Uploading process started...');

  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).json({ success: false, message: 'No files were uploaded.' });
  }

  console.log('✅ Files received:', req.files);

  const uploadDir = path.join(__dirname, 'uploads');
  let historyPath = null;
  let positionsPath = null;

  try {
    const uploadedFiles = Array.isArray(req.files.file) ? req.files.file : [req.files.file];

    await Promise.all(
      uploadedFiles.map((file) => {
        if (!file || !file.name) {
          console.error('❌ Error: File is missing a name.');
          return res.status(400).json({ success: false, message: 'Invalid file uploaded.' });
        }

        const filePath = path.join(uploadDir, file.name);
        const fileNameLower = file.name.toLowerCase();

        return new Promise((resolve, reject) => {
          file.mv(filePath, (err) => {
            if (err) return reject(err);

            console.log(`✅ Uploaded: ${file.name}`);

            if (fileNameLower.includes('history.csv')) {
              historyPath = filePath;
            } else if (fileNameLower.includes('positions.csv')) {
              positionsPath = filePath;
            }

            resolve();
          });
        });
      })
    );

    console.log(`🛠️ Final Check: History Path: ${historyPath}, Positions Path: ${positionsPath}`);

    // Ensure both files exist before running processTrades
    if (!historyPath || !positionsPath) {
      return res.status(400).json({
        success: false,
        message: 'Both History.csv and Positions.csv must be uploaded.',
      });
    }

    console.log('⚡ Running processTrades...');
    await processTrades(historyPath, positionsPath);
    console.log('✅ processTrades completed successfully!');

    return res.status(200).json({
      success: true,
      message: 'Files uploaded and processed successfully!',
    });
  } catch (error) {
    console.error('❌ File upload error:', error);
    return res
      .status(500)
      .json({ success: false, message: 'Error uploading files.', error: error.message });
  }
});

export default router;
