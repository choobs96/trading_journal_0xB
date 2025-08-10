import React, { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import config from '../config.js';

export default function FileUpload({ onUploadClose }) {
  const [files, setFiles] = useState([]);
  const [selectedLabels, setSelectedLabels] = useState({});
  const [uploadStatus, setUploadStatus] = useState(null);
  const [tradeAccounts, setTradeAccounts] = useState([]); // Store trade accounts from DB
  const [selectedAccount, setSelectedAccount] = useState(''); // Selected trade account
  const [newAccount, setNewAccount] = useState(''); // Temporarily store new trade account input

  const token = localStorage.getItem('auth_token'); // Retrieve auth token

  useEffect(() => {
    fetchTradeAccounts();
  }, []);

  // ✅ Fetch trade accounts from the backend
  const fetchTradeAccounts = async () => {
    try {
      const response = await axios.get(`${config.api.baseURL}/api/trade-accounts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTradeAccounts(response.data);
    } catch (error) {
      console.error('❌ Error fetching trade accounts:', error);
    }
  };

  // ✅ Handle file drop (using useDropzone)
  const { getRootProps, getInputProps } = useDropzone({
    onDrop: (acceptedFiles) => {
      if (files.length + acceptedFiles.length > 2) {
        alert('⚠️ You can only upload up to 2 files.');
        return;
      }

      const validFiles = acceptedFiles.filter((file) => file.type === 'text/csv');
      if (validFiles.length !== acceptedFiles.length) {
        alert('⚠️ Only CSV files are allowed.');
        return;
      }

      const newFiles = validFiles.filter(
        (file) => !files.some((existingFile) => existingFile.name === file.name)
      );

      setFiles((prevFiles) => [...prevFiles, ...newFiles]);
    },
    accept: '.csv',
  });

  // ✅ Handle label selection
  const handleLabelChange = (fileName, label) => {
    setSelectedLabels((prevLabels) => ({
      ...prevLabels,
      [fileName]: label,
    }));
  };

  // ✅ Handle trade account selection
  const handleAccountChange = (e) => {
    const value = e.target.value;
    if (value === 'new') {
      setNewAccount('');
      setSelectedAccount('');
    } else {
      setNewAccount('');
      setSelectedAccount(value);
    }
  };

  // ✅ Handle new trade account input (without adding to DB yet)
  const handleNewAccountChange = (e) => {
    setNewAccount(e.target.value);
  };

  // ✅ Handle file upload
  const handleFileUpload = async (e) => {
    e.preventDefault();

    if (files.length !== 2) {
      alert('⚠️ You must upload exactly 2 files: History.csv and Positions.csv.');
      return;
    }

    const tradeAccountToUse = newAccount.trim() || selectedAccount;
    if (!tradeAccountToUse) {
      alert('⚠️ Please select or enter a trade account.');
      return;
    }

    const labels = Object.values(selectedLabels);
    if (!labels.includes('History.csv') || !labels.includes('Positions.csv')) {
      alert('⚠️ You must assign one file as History.csv and the other as Positions.csv.');
      return;
    }

    if (!token) {
      alert('⚠️ No token found, please log in.');
      return;
    }

    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('file', file);
        formData.append('label', selectedLabels[file.name]);
      });
      formData.append('trade_account', tradeAccountToUse); // Send the selected or new account

      const response = await axios.post(`${config.api.baseURL}/api/upload`, formData, {
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
  console.log('this is to get trade acc:', tradeAccounts);
  return (
    <div
      className="overlay"
      onClick={(e) => e.target.classList.contains('overlay') && onUploadClose()}
    >
      <div className="upload-container">
        <div className="login-header">
          <h1>Upload TradingView Paper Trade Data</h1>
          <button className="close-btn" onClick={onUploadClose}>
            X
          </button>
        </div>

        {/* ✅ Dropzone for file upload */}
        <div
          {...getRootProps()}
          style={{
            padding: '20px',
            border: '2px dashed #ccc',
            textAlign: 'center',
            marginBottom: '20px',
          }}
        >
          <input {...getInputProps()} />
          <p>📂 Drag & drop CSV files here, or click to select files</p>
        </div>

        {/* ✅ Trade Account Dropdown */}
        {tradeAccounts.length < 1 && (
          <div>
            <label>Trade Account:</label>
            <select
              value={selectedAccount || (newAccount ? 'new' : '')}
              onChange={handleAccountChange}
            >
              <option value="">Select an account</option>
              {tradeAccounts.map((account) => (
                <option key={account.user_id} value={account.name}>
                  {account.name}
                </option>
              ))}
              <option value="new">+ Add New Account</option>
            </select>
          </div>
        )}

        {/* ✅ New Account Input (only shown when "Add New Account" is selected) */}
        {selectedAccount === '' && (
          <div>
            <input
              type="text"
              placeholder="Enter new account name"
              value={newAccount}
              onChange={handleNewAccountChange}
            />
          </div>
        )}

        {/* ✅ Uploaded Files with Labels */}
        <div>
          <h3>Uploaded Files:</h3>
          {files.map((file) => (
            <div key={file.name} style={{ marginBottom: '10px' }}>
              <strong>{file.name}</strong> ({file.size} bytes)
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

        {/* ✅ Upload Button */}
        <button type="submit" className="submit-btn" onClick={handleFileUpload}>
          Upload File
        </button>

        {/* ✅ Upload Status */}
        {uploadStatus && (
          <p style={{ color: uploadStatus.success ? 'green' : 'red' }}>{uploadStatus.message}</p>
        )}
      </div>
    </div>
  );
}
