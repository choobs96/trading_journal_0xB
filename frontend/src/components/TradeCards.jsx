import { Editor as TinyMCEEditor } from '@tinymce/tinymce-react';
import React from 'react';
export default function TradeCards({ trade, onClose }) {
  if (!trade) return null; // Don't render if no trade is selected
  function handleOverlayClick(event) {
    if (event.target.classList.contains('overlay')) {
      onClose();
    }
  }
  const results =
    trade.side === 'Buy'
      ? trade.total_entry_stock_amount * (trade.avg_exit_price - trade.avg_entry_price) > 0
        ? 'Profit'
        : 'Loss'
      : trade.total_entry_stock_amount * (trade.avg_exit_price - trade.avg_entry_price) > 0
        ? 'Loss'
        : 'Profit';
  console.log(results);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [tinyMCEValue, setTinyMCEValue] = React.useState('');
  return (
    <div className="overlay" onClick={handleOverlayClick}>
      <div className="trade-container">
        <div className="card-header">
          <h2>Trade Details</h2>
          <button className="close-btn" onClick={onClose}>
            X
          </button>
        </div>
        <div className="trade-content">
          <p>
            <strong>Trade ID:</strong> {trade.trade_id}
          </p>
          <p>
            <strong>Symbol:</strong> {trade.symbol}
          </p>
          <p>
            <strong>Side:</strong> {trade.side}
          </p>
          <p>
            <strong>Quantity:</strong> {trade.total_entry_stock_amount}
          </p>
          <p>
            <strong>Entry Price:</strong> {trade.avg_entry_price}
          </p>
          <p>
            <strong>Exit Price:</strong> {trade.avg_exit_price}
          </p>
          <p>
            <strong>Outcome:</strong>
            <span className={results === 'Profit' ? 'outcomeProfit' : 'outcomeLost'}>
              {results}
            </span>
          </p>
          <p>
            <strong>PNL:</strong> $
            <span className={results ? 'outcomeProfit' : 'outcomeLost'}>
              {trade.side === 'Buy'
                ? Math.round(
                    trade.total_entry_stock_amount * (trade.avg_exit_price - trade.avg_entry_price)
                  )
                : Math.round(
                    trade.total_entry_stock_amount *
                      -1 *
                      (trade.avg_exit_price - trade.avg_entry_price)
                  )}
            </span>
          </p>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '2rem', flexDirection: 'column' }}>
        <div style={{ width: '80%' }}>
          {/* TinyMCE Editor */}
          <TinyMCEEditor
            apiKey="e5xcrvnum6m3pm6l1gwgjz6b3lev10rep62w36muc9zjh0yq"
            value={tinyMCEValue}
            onEditorChange={(content) => setTinyMCEValue(content)}
            init={{
              height: 500,
              menubar: false,
              plugins: [
                'anchor',
                'autolink',
                'charmap',
                'codesample',
                'emoticons',
                'image',
                'link',
                'lists',
                'media',
                'searchreplace',
                'table',
                'visualblocks',
                'wordcount',
              ],
              toolbar:
                'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | link image media table mergetags | addcomment showcomments | spellcheckdialog a11ycheck typography | align lineheight | checklist numlist bullist indent outdent | emoticons charmap | removeformat',
              tinycomments_mode: 'embedded',
              tinycomments_author: 'Author name',
              mergetags_list: [
                { value: 'First.Name', title: 'First Name' },
                { value: 'Email', title: 'Email' },
              ],
              ai_request: (request, respondWith) =>
                respondWith.string(() => Promise.reject('See docs to implement AI Assistant')),
            }}
          />
        </div>
      </div>
    </div>
  );
}
