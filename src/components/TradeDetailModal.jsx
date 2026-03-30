import { useState, useRef, useEffect } from 'react';
import { formatDuration } from '../utils/tradeStats';
import { useTrades } from '../context/TradeContext';
import './TradeDetailModal.css';

export default function TradeDetailModal({ trade, onClose }) {
  const { updateNote, getNote } = useTrades();
  const [activeTab, setActiveTab] = useState('details');
  const editorRef = useRef(null);
  const [noteContent, setNoteContent] = useState('');

  useEffect(() => {
    if (trade) {
      setNoteContent(getNote(trade.id));
    }
  }, [trade, getNote]);

  if (!trade) return null;

  const formatPNL = (val) => {
    const formatted = `$${Math.abs(val).toFixed(2)}`;
    return val >= 0 ? `+${formatted}` : `-${formatted}`;
  };

  const handleNoteChange = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      setNoteContent(html);
      updateNote(trade.id, html);
    }
  };

  const execCommand = (cmd, value) => {
    document.execCommand(cmd, false, value);
    editorRef.current?.focus();
    handleNoteChange();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card modal-card-wide" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>&times;</button>

        {/* Header */}
        <div className="modal-header">
          <span className="modal-symbol">{trade.symbol}</span>
          <span className={`side-badge side-${trade.side}`}>
            {trade.side.toUpperCase()}
          </span>
          <span className={`modal-outcome outcome-badge outcome-${trade.outcome?.toLowerCase()}`}>
            {trade.outcome}
          </span>
        </div>

        {/* P&L hero */}
        <div className={`modal-pnl ${trade.pnl >= 0 ? 'pnl-positive' : 'pnl-negative'}`}>
          {formatPNL(trade.pnl)}
        </div>

        {/* Tabs */}
        <div className="modal-tabs">
          <button
            className={`modal-tab ${activeTab === 'details' ? 'active' : ''}`}
            onClick={() => setActiveTab('details')}
          >
            Trade Details
          </button>
          <button
            className={`modal-tab ${activeTab === 'journal' ? 'active' : ''}`}
            onClick={() => setActiveTab('journal')}
          >
            Journal Notes
          </button>
        </div>

        {/* Details Tab */}
        {activeTab === 'details' && (
          <>
            <div className="modal-detail-grid">
              <div className="modal-detail">
                <span className="modal-detail-label">Trade ID</span>
                <span className="modal-detail-value">#{trade.id}</span>
              </div>
              <div className="modal-detail">
                <span className="modal-detail-label">Quantity</span>
                <span className="modal-detail-value">{trade.quantity}</span>
              </div>
              <div className="modal-detail">
                <span className="modal-detail-label">Entry Price</span>
                <span className="modal-detail-value">{trade.entry_price}</span>
              </div>
              <div className="modal-detail">
                <span className="modal-detail-label">Exit Price</span>
                <span className="modal-detail-value">{trade.exit_price}</span>
              </div>
              <div className="modal-detail">
                <span className="modal-detail-label">Stop Loss</span>
                <span className="modal-detail-value">{trade.stop_loss}</span>
              </div>
              <div className="modal-detail">
                <span className="modal-detail-label">R:R</span>
                <span className="modal-detail-value">{trade.rr?.toFixed(2) ?? 'N/A'}</span>
              </div>
              <div className="modal-detail">
                <span className="modal-detail-label">Duration</span>
                <span className="modal-detail-value">{trade.duration ? formatDuration(trade.duration) : 'N/A'}</span>
              </div>
              <div className="modal-detail">
                <span className="modal-detail-label">Entry Time</span>
                <span className="modal-detail-value">{trade.entry_datetime}</span>
              </div>
              <div className="modal-detail">
                <span className="modal-detail-label">Exit Time</span>
                <span className="modal-detail-value">{trade.exit_datetime}</span>
              </div>
            </div>

            {/* Risk visualization */}
            <div className="modal-risk-bar">
              <div className="risk-bar-label">Risk/Reward Visualization</div>
              <div className="risk-bar-track">
                <div
                  className="risk-bar-fill"
                  style={{
                    width: `${Math.min(Math.max((trade.rr || 0) / 5, 0), 1) * 100}%`,
                    background: trade.rr >= 1 ? '#4ade80' : '#f87171',
                  }}
                />
              </div>
              <div className="risk-bar-labels">
                <span>0R</span>
                <span>1R</span>
                <span>2R</span>
                <span>3R</span>
                <span>5R+</span>
              </div>
            </div>
          </>
        )}

        {/* Journal Tab */}
        {activeTab === 'journal' && (
          <div className="journal-section">
            <div className="journal-toolbar">
              <button onClick={() => execCommand('bold')} className="toolbar-btn" title="Bold"><b>B</b></button>
              <button onClick={() => execCommand('italic')} className="toolbar-btn" title="Italic"><i>I</i></button>
              <button onClick={() => execCommand('underline')} className="toolbar-btn" title="Underline"><u>U</u></button>
              <button onClick={() => execCommand('strikeThrough')} className="toolbar-btn" title="Strikethrough"><s>S</s></button>
              <span className="toolbar-divider" />
              <button onClick={() => execCommand('insertUnorderedList')} className="toolbar-btn" title="Bullet List">&#8226; List</button>
              <button onClick={() => execCommand('insertOrderedList')} className="toolbar-btn" title="Numbered List">1. List</button>
              <span className="toolbar-divider" />
              <button onClick={() => execCommand('formatBlock', 'h3')} className="toolbar-btn" title="Heading">H</button>
              <button onClick={() => execCommand('formatBlock', 'blockquote')} className="toolbar-btn" title="Quote">&ldquo;</button>
              <span className="toolbar-divider" />
              <button
                onClick={() => {
                  const url = prompt('Enter URL:');
                  if (url) execCommand('createLink', url);
                }}
                className="toolbar-btn"
                title="Insert Link"
              >
                Link
              </button>
              <button onClick={() => execCommand('removeFormat')} className="toolbar-btn" title="Clear Formatting">Clear</button>
            </div>
            <div
              ref={editorRef}
              className="journal-editor"
              contentEditable
              onInput={handleNoteChange}
              onBlur={handleNoteChange}
              dangerouslySetInnerHTML={{ __html: noteContent }}
              data-placeholder="Write your trade analysis, lessons learned, emotional state, setup quality, market conditions..."
            />
            <div className="journal-hint">
              Your notes are saved automatically. Use the toolbar to format text, add lists, links, and more.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
