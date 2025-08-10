import React, { useState, useEffect } from 'react';
import axios from 'axios';
import JournalEntry from './JournalEntry';
import config from '../config.js';

const Journals = ({ onClose }) => {
  const [journals, setJournals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrade, setSelectedTrade] = useState(null);
  const [showJournalModal, setShowJournalModal] = useState(false);

  const token = localStorage.getItem('auth_token');

  useEffect(() => {
    fetchJournals();
  }, []);

  const fetchJournals = async () => {
    try {
      const response = await axios.get(`${config.api.baseURL}/api/journals`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        setJournals(response.data.journals);
      }
    } catch (error) {
      console.error('Error fetching journals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJournalClick = (journal) => {
    // Create a trade object from journal data for the JournalEntry component
    const trade = {
      trade_id: journal.trade_id,
      symbol: journal.symbol,
      side: journal.side,
      pnl: journal.pnl,
      outcome: journal.outcome,
      trade_account: journal.trade_account,
      avg_entry_price: journal.journal_content.trade_summary?.entry_price || 'N/A',
      avg_exit_price: journal.journal_content.trade_summary?.exit_price || 'N/A',
      time_of_first_entry: journal.journal_content.trade_summary?.entry_time || 'N/A',
      time_of_last_exit: journal.journal_content.trade_summary?.exit_time || 'N/A',
    };

    setSelectedTrade(trade);
    setShowJournalModal(true);
  };

  const handleJournalSave = () => {
    fetchJournals(); // Refresh the journals list
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const truncateContent = (content, maxLength = 150) => {
    if (!content) return 'No content';
    const strippedContent = content.replace(/<[^>]*>/g, '');
    return strippedContent.length > maxLength 
      ? strippedContent.substring(0, maxLength) + '...' 
      : strippedContent;
  };

  if (loading) {
    return (
      <div className="journals-container">
        <div className="journals-header">
          <h2>Trade Journals</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="loading">Loading journals...</div>
      </div>
    );
  }

  return (
    <>
      <div className="journals-container">
        <div className="journals-header">
          <h2>Trade Journals ({journals.length})</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {journals.length === 0 ? (
          <div className="no-journals">
            <p>No journal entries found. Create your first journal entry from a trade!</p>
          </div>
        ) : (
          <div className="journals-list">
            {journals.map((journal) => (
              <div 
                key={journal.journal_id} 
                className="journal-card"
                onClick={() => handleJournalClick(journal)}
              >
                <div className="journal-header">
                  <div className="trade-info">
                    <span className="symbol">{journal.symbol}</span>
                    <span className={`side ${journal.side.toLowerCase()}`}>
                      {journal.side}
                    </span>
                    <span className={`pnl ${journal.pnl >= 0 ? 'profit' : 'loss'}`}>
                      ${journal.pnl}
                    </span>
                    <span className={`outcome ${journal.outcome.toLowerCase()}`}>
                      {journal.outcome}
                    </span>
                  </div>
                  <div className="journal-date">
                    {formatDate(journal.created_at)}
                  </div>
                </div>

                <div className="journal-content">
                  <p>{truncateContent(journal.journal_content.content)}</p>
                </div>

                <div className="journal-footer">
                  <span className="account">{journal.trade_account}</span>
                  <span className="updated">
                    Updated: {formatDate(journal.updated_at)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showJournalModal && selectedTrade && (
        <JournalEntry
          trade={selectedTrade}
          onClose={() => {
            setShowJournalModal(false);
            setSelectedTrade(null);
          }}
          onSave={handleJournalSave}
        />
      )}

      <style jsx>{`
        .journals-container {
          background: white;
          border-radius: 8px;
          padding: 20px;
          width: 90%;
          max-width: 1000px;
          max-height: 80vh;
          overflow-y: auto;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .journals-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          border-bottom: 1px solid #eee;
          padding-bottom: 10px;
        }

        .journals-header h2 {
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

        .loading, .no-journals {
          text-align: center;
          padding: 40px;
          color: #666;
        }

        .journals-list {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .journal-card {
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          padding: 15px;
          cursor: pointer;
          transition: all 0.2s ease;
          background: #fafafa;
        }

        .journal-card:hover {
          border-color: #007bff;
          box-shadow: 0 2px 8px rgba(0, 123, 255, 0.1);
          transform: translateY(-1px);
        }

        .journal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }

        .trade-info {
          display: flex;
          gap: 10px;
          align-items: center;
          flex-wrap: wrap;
        }

        .symbol {
          font-weight: bold;
          font-size: 16px;
          color: #333;
        }

        .side {
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: bold;
          text-transform: uppercase;
        }

        .side.buy {
          background-color: #d4edda;
          color: #155724;
        }

        .side.sell {
          background-color: #f8d7da;
          color: #721c24;
        }

        .pnl {
          font-weight: bold;
          font-size: 14px;
        }

        .pnl.profit {
          color: #28a745;
        }

        .pnl.loss {
          color: #dc3545;
        }

        .outcome {
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: bold;
          text-transform: uppercase;
        }

        .outcome.profit {
          background-color: #d4edda;
          color: #155724;
        }

        .outcome.loss {
          background-color: #f8d7da;
          color: #721c24;
        }

        .journal-date {
          font-size: 12px;
          color: #666;
        }

        .journal-content {
          margin-bottom: 10px;
        }

        .journal-content p {
          margin: 0;
          color: #555;
          line-height: 1.5;
        }

        .journal-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 12px;
          color: #888;
        }

        .account {
          font-weight: 500;
        }

        .updated {
          font-style: italic;
        }
      `}</style>
    </>
  );
};

export default Journals;
