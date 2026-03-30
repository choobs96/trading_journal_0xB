import { useState } from 'react';
import { useTrades } from '../context/TradeContext';
import { useNavigate } from 'react-router-dom';
import './AddTrade.css';

const INITIAL = {
  symbol: '',
  side: 'long',
  quantity: '',
  entry_price: '',
  exit_price: '',
  stop_loss: '',
  entry_datetime: '',
  exit_datetime: '',
};

export default function AddTrade() {
  const { addTrade } = useTrades();
  const navigate = useNavigate();
  const [form, setForm] = useState(INITIAL);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.symbol.trim()) errs.symbol = 'Symbol is required';
    if (!form.quantity || Number(form.quantity) <= 0) errs.quantity = 'Valid quantity required';
    if (!form.entry_price || Number(form.entry_price) <= 0) errs.entry_price = 'Valid entry price required';
    if (!form.exit_price || Number(form.exit_price) <= 0) errs.exit_price = 'Valid exit price required';
    if (!form.stop_loss || Number(form.stop_loss) <= 0) errs.stop_loss = 'Valid stop loss required';
    if (!form.entry_datetime) errs.entry_datetime = 'Entry time required';
    if (!form.exit_datetime) errs.exit_datetime = 'Exit time required';
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    addTrade({
      symbol: form.symbol.toUpperCase().trim(),
      side: form.side,
      quantity: Number(form.quantity),
      entry_price: Number(form.entry_price),
      exit_price: Number(form.exit_price),
      stop_loss: Number(form.stop_loss),
      entry_datetime: form.entry_datetime.replace('T', ' ') + ':00',
      exit_datetime: form.exit_datetime.replace('T', ' ') + ':00',
    });
    setForm(INITIAL);
    navigate('/trades');
  };

  return (
    <div className="add-trade-page">
      <div className="add-trade-card">
        <h2 className="add-trade-title">Log New Trade</h2>
        <form onSubmit={handleSubmit} className="add-trade-form">
          <div className="form-row">
            <div className="form-group">
              <label>Symbol</label>
              <input
                type="text"
                name="symbol"
                value={form.symbol}
                onChange={handleChange}
                placeholder="e.g. BTCUSDT"
              />
              {errors.symbol && <span className="form-error">{errors.symbol}</span>}
            </div>
            <div className="form-group">
              <label>Side</label>
              <select name="side" value={form.side} onChange={handleChange}>
                <option value="long">Long</option>
                <option value="short">Short</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Quantity</label>
              <input
                type="number"
                name="quantity"
                value={form.quantity}
                onChange={handleChange}
                placeholder="0"
                step="any"
              />
              {errors.quantity && <span className="form-error">{errors.quantity}</span>}
            </div>
            <div className="form-group">
              <label>Entry Price</label>
              <input
                type="number"
                name="entry_price"
                value={form.entry_price}
                onChange={handleChange}
                placeholder="0.00"
                step="any"
              />
              {errors.entry_price && <span className="form-error">{errors.entry_price}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Exit Price</label>
              <input
                type="number"
                name="exit_price"
                value={form.exit_price}
                onChange={handleChange}
                placeholder="0.00"
                step="any"
              />
              {errors.exit_price && <span className="form-error">{errors.exit_price}</span>}
            </div>
            <div className="form-group">
              <label>Stop Loss</label>
              <input
                type="number"
                name="stop_loss"
                value={form.stop_loss}
                onChange={handleChange}
                placeholder="0.00"
                step="any"
              />
              {errors.stop_loss && <span className="form-error">{errors.stop_loss}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Entry Time</label>
              <input
                type="datetime-local"
                name="entry_datetime"
                value={form.entry_datetime}
                onChange={handleChange}
              />
              {errors.entry_datetime && <span className="form-error">{errors.entry_datetime}</span>}
            </div>
            <div className="form-group">
              <label>Exit Time</label>
              <input
                type="datetime-local"
                name="exit_datetime"
                value={form.exit_datetime}
                onChange={handleChange}
              />
              {errors.exit_datetime && <span className="form-error">{errors.exit_datetime}</span>}
            </div>
          </div>

          <button type="submit" className="submit-btn">Add Trade</button>
        </form>
      </div>
    </div>
  );
}
