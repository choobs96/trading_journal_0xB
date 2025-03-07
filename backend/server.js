import express from 'express';
import fileUpload from 'express-fileupload'; // File upload middleware
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url'; // To get the current directory in ES modules
import { dirname } from 'path'; // To join the path correctly
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import data from './data.js'; // Correct relative path


const app = express();
const port = 5001;

// Use fileURLToPath to get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Sample user data (ensure the password is hashed)
const users = [
  {
    id: 1,
    email: 'user@example.com',
    password: '$2b$10$DHV/w1YQDKitmxTOMOhwTOZfAUmkdPB5Tz/376Ls9d8qS/IxUCPgO' // hashed password: "password123"
  }
];

// Middleware setup
app.use(cors()); // Enable CORS for all requests
app.use(express.json());
app.use(fileUpload()); // Enable file upload handling

// Middleware to check JWT
// Middleware to authenticate the JWT token
const authenticateToken = (req, res, next) => {
  const token = req.header('Authorization') && req.header('Authorization').split(' ')[1]; // Get token from header

  if (!token) {
    return res.status(403).send('Access Denied: No token provided');
  }

  jwt.verify(token, 'test_secret_key', (err, user) => {
    if (err) {
      return res.status(403).send('Invalid token');
    }
    req.user = user; // Add user info to the request object
    next();
  });
};


// User Login Route
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  // Check if user exists
  const user = users.find((user) => user.email === email);
  if (!user) return res.status(400).send('Invalid credentials');

  // Compare password with hashed password in DB
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).send('Invalid credentials');

  // Create and sign the JWT token
  const token = jwt.sign({ id: user.id, email: user.email }, 'test_secret_key', {
    expiresIn: '1h',
  });

  res.json({ token });
});

// New API endpoint to serve data from data.js
app.get('/api/data', authenticateToken, (req, res) => {
  res.json(data); // Send the data from the data.js file
});

// Protected upload route
app.post('/api/upload', authenticateToken, (req, res) => {
  // File upload logic
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

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
