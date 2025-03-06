const express = require('express');
const multer = require('multer');
const csvParser = require('csv-parser');
const cors = require('cors');
const fs = require('fs');

const app = express();
const port = 5000; // Set the port to run your server

// Enable CORS for local development
app.use(cors());

// Set up multer for file upload
const upload = multer({ dest: 'uploads/' });

// Route to handle file uploads and processing
app.post('/upload', upload.single('file'), (req, res) => {
  const filePath = req.file.path;

  const result = [];

  // Read and process the CSV file
  fs.createReadStream(filePath)
    .pipe(csvParser())
    .on('data', (row) => {
      // Handle each row of data
      result.push(row);
    })
    .on('end', () => {
      // After reading the file, send the result back
      res.json({ success: true, data: result });
    })
    .on('error', (error) => {
      res.status(500).json({ success: false, message: 'Error reading the file' });
    });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
