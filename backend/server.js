import express from 'express';
import fileUpload from 'express-fileupload'; // File upload middleware
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url'; // To get the current directory in ES modules
import { dirname } from 'path'; // To join the path correctly

const app = express();
const port = 5001;

// Use fileURLToPath to get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Middleware setup
app.use(cors()); // Enable CORS for all requests
app.use(express.json());
app.use(fileUpload()); // Enable file upload handling

// Upload route
app.post('/api/upload', (req, res) => {
  // Check if a file is uploaded
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
