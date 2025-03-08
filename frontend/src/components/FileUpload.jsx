import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';

export default function FileUpload({ onUploadClose }) {
  const [files, setFiles] = useState([]);
  const [selectedLabels, setSelectedLabels] = useState({}); // Store labels for each file
  const [uploadStatus, setUploadStatus] = useState(null);

  // Handle file drop
  const handleDrop = (acceptedFiles) => {
    // Limit to only 2 files
    if (files.length + acceptedFiles.length > 2) {
      alert('You can only upload up to 2 files.');
      return;
    }

    // Only allow CSV files
    const validFiles = acceptedFiles.filter((file) => file.type === 'text/csv');
    if (validFiles.length !== acceptedFiles.length) {
      alert('Only CSV files are allowed.');
      return;
    }

    // Create file objects with a placeholder label
    const newFiles = validFiles.filter(
      (file) => !files.some((existingFile) => existingFile.name === file.name)
    );

    setFiles((prevFiles) => [...prevFiles, ...newFiles]);
  };

  // Handle label change (user selects a label for the file)
  const handleLabelChange = (fileName, label) => {
    setSelectedLabels((prevLabels) => ({
      ...prevLabels,
      [fileName]: label,
    }));
  };

  // Set up React Dropzone
  const { getRootProps, getInputProps } = useDropzone({
    onDrop: handleDrop,
    accept: '.csv', // Accept only CSV files
  });

  // Handle file upload to backend
  const handleFileUpload = async (e) => {
    e.preventDefault();

    if (files.length !== 2) {
      alert('You must upload exactly 2 files: History.csv and Positions.csv.');
      return;
    }

    if (!selectedLabels[files[0].name] || !selectedLabels[files[1].name]) {
      alert('Please assign labels to both files before uploading.');
      return;
    }

    const labels = Object.values(selectedLabels);
    if (!labels.includes('History.csv') || !labels.includes('Positions.csv')) {
      alert('You must assign one file as History.csv and the other as Positions.csv.');
      return;
    }

    const token = localStorage.getItem('auth_token');
    if (!token) {
      alert('No token found, please log in.');
      return;
    }

    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('file', file);
        formData.append('label', selectedLabels[file.name]);
      });

      const response = await axios.post('http://localhost:5001/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });

      setUploadStatus({ success: response.data.success, message: response.data.message });
      alert(response.data.message);
      onUploadClose();
    } catch (error) {
      setUploadStatus({
        success: false,
        message: error.response?.data?.message || 'Upload failed. Please try again.',
      });
      alert(error.response?.data?.message || 'Error uploading file.');
    }
  };

  function handleOverlayClick(event) {
    if (event.target.classList.contains('overlay')) {
      onUploadClose();
    }
  }

  return (
    <div className="overlay" onClick={handleOverlayClick}>
      <div className="upload-container">
        <div className="login-header">
          <h1>Upload TradingView Paper Trade Data</h1>
          <button className="close-btn" onClick={onUploadClose}>
            X
          </button>
        </div>
        <div
          {...getRootProps()}
          style={{
            padding: '20px',
            border: '2px dashed #ccc',
            borderRadius: '5px',
            textAlign: 'center',
            marginBottom: '20px',
          }}
        >
          <input {...getInputProps()} />
          <p>Download Positions & History data from trading view & Upload here</p>
          <p>Drag & drop CSV files here, or click to select files</p>
        </div>

        {/* Display uploaded files with label selection */}
        <div>
          <h3>Uploaded Files:</h3>
          {files.map((file) => (
            <div key={file.name} style={{ marginBottom: '10px' }}>
              <strong>{file.name}</strong> ({file.size} bytes)
              {/* Label selection for each file */}
              <div style={{ marginTop: '10px' }}>
                <label>Select Label: </label>
                <select
                  onChange={(e) => handleLabelChange(file.name, e.target.value)}
                  value={selectedLabels[file.name] || ''}
                >
                  <option value="">Select Label</option>
                  <option value="History.csv">History</option>
                  <option value="Positions.csv">Positions</option>
                </select>
              </div>
            </div>
          ))}
        </div>

        {/* Show selected labels for the files */}
        <div style={{ marginTop: '20px' }}>
          <h4>File Labels:</h4>
          <ul>
            {files.map((file) => (
              <li key={file.name}>
                {file.name} - {selectedLabels[file.name] || 'No label assigned'}
              </li>
            ))}
          </ul>
        </div>
        <button type="submit" className="submit-btn" onClick={handleFileUpload}>
          Upload File
        </button>

        {/* Upload status */}
        {uploadStatus && (
          <p style={{ color: uploadStatus.success ? 'green' : 'red' }}>{uploadStatus.message}</p>
        )}
      </div>
    </div>
  );
}
