import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';

export default function FileUpload({ onUploadClose }) {
  const [files, setFiles] = useState([]);
  const [selectedLabels, setSelectedLabels] = useState({}); // Store labels for each file

  // Handle file drop
  const handleDrop = (acceptedFiles) => {
    // Create file objects with a placeholder label
    const newFiles = acceptedFiles.map((file) => ({
      file: file,
      label: '', // Initially empty, user will assign label later
    }));
    setFiles((prevFiles) => [...prevFiles, ...newFiles]);
  };

  // Handle label change (user selects a label for the file)
  const handleLabelChange = (index, label) => {
    setSelectedLabels((prevLabels) => ({
      ...prevLabels,
      [index]: label,
    }));
  };

  // Set up React Dropzone
  const { getRootProps, getInputProps } = useDropzone({
    onDrop: handleDrop,
    accept: '.csv', // Accept only CSV files
  });
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
          {files.map((fileObj, index) => (
            <div key={index} style={{ marginBottom: '10px' }}>
              <strong>{fileObj.file.name}</strong> ({fileObj.file.size} bytes)
              {/* Label selection for each file */}
              <div style={{ marginTop: '10px' }}>
                <label>Select Label: </label>
                <select
                  onChange={(e) => handleLabelChange(index, e.target.value)}
                  value={selectedLabels[index] || ''}
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
            {files.map((fileObj, index) => (
              <li key={index}>
                {fileObj.file.name} - {selectedLabels[index] || 'No label assigned'}
              </li>
            ))}
          </ul>
        </div>
        <button type="submit" className="submit-btn">
          Upload File
        </button>
      </div>
    </div>
  );
}

// export default FileUpload;
