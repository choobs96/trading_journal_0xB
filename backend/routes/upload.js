import express from 'express';
import fileUpload from 'express-fileupload'; // File upload middleware
import path from 'path';
import { fileURLToPath } from 'url'; // To get the current directory in ES modules
import { dirname } from 'path'; // To join the path correctly
import jwt from 'jsonwebtoken'; // For JWT verification

const router = express.Router();

// Use fileURLToPath to get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Middleware to check JWT
const authenticateToken = (req, res, next) => {
  const token = req.header('Authorization') && req.header('Authorization').split(' ')[1]; // Get token from header

  if (!token) {
    return res.status(403).send('Access Denied: No token provided');
  }

  jwt.verify(token, 'your_secret_key', (err, user) => {
    if (err) {
      return res.status(403).send('Invalid token');
    }
    req.user = user; // Add the user info to the request
    next();
  });
};

// POST route for file upload
router.post('/upload', authenticateToken, (req, res) => {
  // Check if the file is uploaded
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send('No files were uploaded.');
  }

  // Get the uploaded file from the request
  const uploadedFile = req.files.file;

  // Define the upload path
  const uploadPath = path.join(__dirname, 'uploads', uploadedFile.name);

  // Move the uploaded file to the 'uploads' folder
  uploadedFile.mv(uploadPath, (err) => {
    if (err) {
      return res.status(500).send(err);
    }
    res.send('File uploaded successfully!');
  });
});

export default router;
