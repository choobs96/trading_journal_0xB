import express from 'express';
import fileUpload from 'express-fileupload'; // File upload middleware
import path from 'path';
import { fileURLToPath } from 'url'; // To get the current directory in ES modules
import { dirname } from 'path'; // To join the path correctly

const router = express.Router();

// Use fileURLToPath to get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// POST route for file upload
router.post('/upload', (req, res) => {
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
