import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Editor } from '@tinymce/tinymce-react';
import config from '../config.js';

const JournalEntry = ({ trade, onClose, onSave }) => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [existingJournal, setExistingJournal] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const token = localStorage.getItem('auth_token');

  useEffect(() => {
    if (trade) {
      fetchExistingJournal();
    }
  }, [trade]);

  const fetchExistingJournal = async () => {
    try {
      const response = await axios.get(`${config.api.baseURL}/api/journal/${trade.trade_id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        setExistingJournal(response.data.journal);
        setContent(response.data.journal.journal_content.content || '');
        setIsEditing(true);
      }
    } catch (error) {
      if (error.response?.status !== 404) {
        console.error('Error fetching journal:', error);
      }
    }
  };

  const handleSave = async () => {
    if (!content.trim()) {
      alert('Please enter some content for your journal entry.');
      return;
    }

    setLoading(true);

    try {
      const journalData = {
        trade_id: trade.trade_id,
        trade_account: trade.trade_account,
        journal_content: {
          content: content,
          trade_summary: {
            symbol: trade.symbol,
            side: trade.side,
            pnl: trade.pnl,
            outcome: trade.outcome,
            entry_price: trade.avg_entry_price,
            exit_price: trade.avg_exit_price,
            entry_time: trade.time_of_first_entry,
            exit_time: trade.time_of_last_exit,
          },
          created_at: new Date().toISOString(),
        },
      };

      let response;
      if (isEditing) {
        response = await axios.put(
          `${config.api.baseURL}/api/journal/${trade.trade_id}`,
          { journal_content: journalData.journal_content },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      } else {
        response = await axios.post(
          `${config.api.baseURL}/api/journal`,
          journalData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }

      if (response.data.success) {
        alert(isEditing ? 'Journal updated successfully!' : 'Journal created successfully!');
        onSave && onSave();
        onClose();
      }
    } catch (error) {
      console.error('Error saving journal:', error);
      alert('Error saving journal entry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!existingJournal || !window.confirm('Are you sure you want to delete this journal entry?')) {
      return;
    }

    setLoading(true);

    try {
      const response = await axios.delete(
        `${config.api.baseURL}/api/journal/${trade.trade_id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        alert('Journal deleted successfully!');
        setExistingJournal(null);
        setContent('');
        setIsEditing(false);
        onSave && onSave();
        onClose();
      }
    } catch (error) {
      console.error('Error deleting journal:', error);
      alert('Error deleting journal entry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!trade) {
    return null;
  }

  return (
    <div className="journal-modal-overlay" onClick={onClose}>
      <div className="journal-modal" onClick={(e) => e.stopPropagation()}>
        <div className="journal-header">
          <h2>
            {isEditing ? 'Edit' : 'Create'} Journal Entry - {trade.symbol} ({trade.side})
          </h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="trade-summary">
          <div className="trade-info">
            <span><strong>Symbol:</strong> {trade.symbol}</span>
            <span><strong>Side:</strong> {trade.side}</span>
            <span><strong>Entry Price:</strong> ${trade.avg_entry_price}</span>
            <span><strong>Exit Price:</strong> ${trade.avg_exit_price}</span>
            <span><strong>PNL:</strong> <span className={trade.pnl >= 0 ? 'profit' : 'loss'}>${trade.pnl}</span></span>
            <span><strong>Outcome:</strong> <span className={trade.outcome.toLowerCase()}>{trade.outcome}</span></span>
          </div>
        </div>

        <div className="editor-container">
          <Editor
            apiKey="your-tinymce-api-key" // You'll need to get a free API key from TinyMCE
            value={content}
            onEditorChange={(content) => setContent(content)}
            init={{
              height: 400,
              menubar: false,
              plugins: [
                'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
              ],
              toolbar: 'undo redo | blocks | ' +
                'bold italic forecolor | alignleft aligncenter ' +
                'alignright alignjustify | bullist numlist outdent indent | ' +
                'removeformat | help',
              content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }'
            }}
          />
        </div>

        <div className="journal-actions">
          <button 
            className="save-btn" 
            onClick={handleSave} 
            disabled={loading}
          >
            {loading ? 'Saving...' : (isEditing ? 'Update' : 'Save')}
          </button>
          
          {isEditing && (
            <button 
              className="delete-btn" 
              onClick={handleDelete} 
              disabled={loading}
            >
              {loading ? 'Deleting...' : 'Delete'}
            </button>
          )}
          
          <button 
            className="cancel-btn" 
            onClick={onClose} 
            disabled={loading}
          >
            Cancel
          </button>
        </div>
      </div>

      <style jsx>{`
        .journal-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }

        .journal-modal {
          background: white;
          border-radius: 8px;
          padding: 20px;
          width: 90%;
          max-width: 800px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .journal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          border-bottom: 1px solid #eee;
          padding-bottom: 10px;
        }

        .journal-header h2 {
          margin: 0;
          color: #333;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #666;
        }

        .close-btn:hover {
          color: #333;
        }

        .trade-summary {
          background: #f8f9fa;
          padding: 15px;
          border-radius: 6px;
          margin-bottom: 20px;
        }

        .trade-info {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 10px;
        }

        .trade-info span {
          font-size: 14px;
        }

        .profit {
          color: #28a745;
          font-weight: bold;
        }

        .loss {
          color: #dc3545;
          font-weight: bold;
        }

        .editor-container {
          margin-bottom: 20px;
        }

        .journal-actions {
          display: flex;
          gap: 10px;
          justify-content: flex-end;
        }

        .save-btn, .delete-btn, .cancel-btn {
          padding: 10px 20px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
          transition: background-color 0.2s;
        }

        .save-btn {
          background-color: #007bff;
          color: white;
        }

        .save-btn:hover:not(:disabled) {
          background-color: #0056b3;
        }

        .delete-btn {
          background-color: #dc3545;
          color: white;
        }

        .delete-btn:hover:not(:disabled) {
          background-color: #c82333;
        }

        .cancel-btn {
          background-color: #6c757d;
          color: white;
        }

        .cancel-btn:hover:not(:disabled) {
          background-color: #545b62;
        }

        button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default JournalEntry;
