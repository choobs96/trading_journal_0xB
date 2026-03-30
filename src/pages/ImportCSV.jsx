import { useState, useRef } from 'react';
import { useTrades } from '../context/TradeContext';
import { useNavigate } from 'react-router-dom';
import './ImportCSV.css';

const REQUIRED_FIELDS = ['symbol', 'side', 'quantity', 'entry_price', 'exit_price', 'stop_loss', 'entry_datetime', 'exit_datetime'];

function parseCSV(text) {
  const lines = text.trim().split('\n');
  if (lines.length < 2) throw new Error('CSV must have a header row and at least one data row');

  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/\s+/g, '_').replace(/"/g, ''));

  // Map common aliases
  const aliases = {
    'entry': 'entry_price',
    'exit': 'exit_price',
    'stop': 'stop_loss',
    'stoploss': 'stop_loss',
    'sl': 'stop_loss',
    'qty': 'quantity',
    'size': 'quantity',
    'direction': 'side',
    'pair': 'symbol',
    'ticker': 'symbol',
    'instrument': 'symbol',
    'entry_time': 'entry_datetime',
    'exit_time': 'exit_datetime',
    'open_time': 'entry_datetime',
    'close_time': 'exit_datetime',
    'open_date': 'entry_datetime',
    'close_date': 'exit_datetime',
  };

  const mappedHeaders = headers.map((h) => aliases[h] || h);

  const missing = REQUIRED_FIELDS.filter((f) => !mappedHeaders.includes(f));
  if (missing.length > 0) {
    throw new Error(`Missing required columns: ${missing.join(', ')}\n\nRequired: ${REQUIRED_FIELDS.join(', ')}\n\nFound: ${headers.join(', ')}`);
  }

  const trades = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Handle quoted values with commas
    const values = [];
    let current = '';
    let inQuotes = false;
    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    const row = {};
    for (let j = 0; j < mappedHeaders.length; j++) {
      row[mappedHeaders[j]] = values[j] || '';
    }

    trades.push({
      id: Date.now() + i,
      symbol: row.symbol.toUpperCase().trim(),
      side: row.side.toLowerCase().trim(),
      quantity: Number(row.quantity),
      entry_price: Number(row.entry_price),
      exit_price: Number(row.exit_price),
      stop_loss: Number(row.stop_loss),
      entry_datetime: row.entry_datetime.replace('T', ' '),
      exit_datetime: row.exit_datetime.replace('T', ' '),
    });
  }

  // Validate
  for (let i = 0; i < trades.length; i++) {
    const t = trades[i];
    if (!t.symbol) throw new Error(`Row ${i + 2}: Missing symbol`);
    if (!['long', 'short'].includes(t.side)) throw new Error(`Row ${i + 2}: Side must be "long" or "short", got "${t.side}"`);
    if (isNaN(t.quantity) || t.quantity <= 0) throw new Error(`Row ${i + 2}: Invalid quantity`);
    if (isNaN(t.entry_price) || t.entry_price <= 0) throw new Error(`Row ${i + 2}: Invalid entry_price`);
    if (isNaN(t.exit_price) || t.exit_price <= 0) throw new Error(`Row ${i + 2}: Invalid exit_price`);
    if (isNaN(t.stop_loss) || t.stop_loss <= 0) throw new Error(`Row ${i + 2}: Invalid stop_loss`);
  }

  return trades;
}

export default function ImportCSV() {
  const { importTrades } = useTrades();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const processFile = (file) => {
    if (!file) return;
    setFileName(file.name);
    setError('');
    setPreview(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const trades = parseCSV(e.target.result);
        setPreview(trades);
      } catch (err) {
        setError(err.message);
      }
    };
    reader.readAsText(file);
  };

  const handleFileChange = (e) => processFile(e.target.files[0]);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    processFile(e.dataTransfer.files[0]);
  };

  const handleImport = () => {
    if (!preview) return;
    importTrades(preview);
    navigate('/trades');
  };

  return (
    <div className="import-page">
      <div className="import-card">
        <h2 className="import-title">Import Trades from CSV</h2>
        <p className="import-desc">
          Upload a CSV file with your trade history. The file must include headers for the required fields.
        </p>

        {/* Required fields reference */}
        <div className="import-fields-ref">
          <div className="fields-ref-title">Required CSV Columns</div>
          <div className="fields-ref-grid">
            {REQUIRED_FIELDS.map((f) => (
              <code key={f} className="field-badge">{f}</code>
            ))}
          </div>
          <div className="fields-ref-note">
            Common aliases are supported (e.g., qty, sl, ticker, direction, open_time, close_time)
          </div>
        </div>

        {/* Drop zone */}
        <div
          className={`drop-zone ${dragActive ? 'drag-active' : ''} ${fileName ? 'has-file' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            accept=".csv"
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          {fileName ? (
            <div className="drop-zone-file">
              <span className="file-icon">CSV</span>
              <span className="file-name">{fileName}</span>
              <span className="file-action">Click to change</span>
            </div>
          ) : (
            <div className="drop-zone-empty">
              <span className="drop-icon">+</span>
              <span className="drop-text">Drop CSV file here or click to browse</span>
            </div>
          )}
        </div>

        {error && <div className="import-error">{error}</div>}

        {/* Preview */}
        {preview && (
          <div className="import-preview">
            <div className="preview-header">
              <span className="preview-count">{preview.length} trades found</span>
              <button onClick={handleImport} className="import-btn">
                Import {preview.length} Trades
              </button>
            </div>
            <div className="preview-table-wrapper">
              <table className="preview-table">
                <thead>
                  <tr>
                    <th>Symbol</th>
                    <th>Side</th>
                    <th>Qty</th>
                    <th>Entry</th>
                    <th>Exit</th>
                    <th>Stop</th>
                    <th>Entry Time</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.slice(0, 10).map((t, i) => (
                    <tr key={i}>
                      <td>{t.symbol}</td>
                      <td><span className={`side-badge side-${t.side}`}>{t.side.toUpperCase()}</span></td>
                      <td>{t.quantity}</td>
                      <td>{t.entry_price}</td>
                      <td>{t.exit_price}</td>
                      <td>{t.stop_loss}</td>
                      <td>{t.entry_datetime}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {preview.length > 10 && (
                <div className="preview-more">...and {preview.length - 10} more trades</div>
              )}
            </div>
          </div>
        )}

        {/* Sample CSV */}
        <details className="sample-csv">
          <summary>View sample CSV format</summary>
          <pre className="sample-csv-content">{`symbol,side,quantity,entry_price,exit_price,stop_loss,entry_datetime,exit_datetime
BTCUSDT,long,10,42000.00,43500.00,41500.00,2025-02-01 10:00:00,2025-02-01 14:30:00
ETHUSDT,short,50,2800.00,2750.00,2850.00,2025-02-01 11:15:00,2025-02-01 16:45:00
EURUSD,long,100,1.085,1.092,1.080,2025-02-02 09:00:00,2025-02-02 13:20:00`}</pre>
        </details>
      </div>
    </div>
  );
}
