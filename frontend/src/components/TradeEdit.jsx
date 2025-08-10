import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Form, Input, Select, DatePicker, InputNumber, Button, message, Space, Divider } from 'antd';
import dayjs from 'dayjs';
import config from '../config.js';

const { Option } = Select;

const TradeEdit = ({ trade, onClose, onSave, onDelete }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const token = localStorage.getItem('auth_token');

  useEffect(() => {
    if (trade) {
      // Format dates for DatePicker components
      const entryDate = trade.time_of_first_entry ? dayjs(trade.time_of_first_entry) : null;
      const exitDate = trade.time_of_last_exit ? dayjs(trade.time_of_last_exit) : null;
      
      form.setFieldsValue({
        symbol: trade.symbol,
        side: trade.side,
        total_entry_stock_amount: trade.total_entry_stock_amount,
        avg_entry_price: trade.avg_entry_price,
        avg_exit_price: trade.avg_exit_price,
        num_entries: trade.num_entries,
        num_exits: trade.num_exits,
        stop_loss: trade.stop_loss,
        price_target: trade.price_target,
        time_of_first_entry: entryDate,
        time_of_last_exit: exitDate,
        trade_account: trade.trade_account,
        notes: trade.notes || ''
      });
    }
  }, [trade, form]);

  const handleSave = async (values) => {
    if (!values.symbol || !values.side) {
      message.error('Symbol and Side are required fields');
      return;
    }

    setLoading(true);
    try {
      const updatedTrade = {
        ...trade,
        ...values,
        time_of_first_entry: values.time_of_first_entry ? values.time_of_first_entry.toISOString() : null,
        time_of_last_exit: values.time_of_last_exit ? values.time_of_last_exit.toISOString() : null,
        // Recalculate PNL based on updated values
        pnl: calculatePNL(values),
        // Update outcome based on new PNL
        outcome: calculatePNL(values) >= 0 ? 'Profit' : 'Loss'
      };

      const response = await axios.put(
        `${config.api.baseURL}/api/trades/${trade.trade_id}`,
        updatedTrade,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        message.success('Trade updated successfully!');
        onSave && onSave(updatedTrade);
        onClose();
      } else {
        message.error(response.data.message || 'Failed to update trade');
      }
    } catch (error) {
      console.error('Error updating trade:', error);
      message.error('Error updating trade. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const calculatePNL = (values) => {
    const { side, total_entry_stock_amount, avg_entry_price, avg_exit_price } = values;
    if (side === 'Buy') {
      return Math.round(total_entry_stock_amount * (avg_exit_price - avg_entry_price));
    } else {
      return Math.round(total_entry_stock_amount * -1 * (avg_exit_price - avg_entry_price));
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this trade? This action cannot be undone.')) {
      return;
    }

    setDeleteLoading(true);
    try {
      const response = await axios.delete(
        `${config.api.baseURL}/api/trades/${trade.trade_id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        message.success('Trade deleted successfully!');
        onDelete && onDelete(trade.trade_id);
        onClose();
      } else {
        message.error(response.data.message || 'Failed to delete trade');
      }
    } catch (error) {
      console.error('Error deleting trade:', error);
      message.error('Error deleting trade. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  if (!trade) return null;

  return (
    <div className="trade-edit-overlay" onClick={onClose}>
      <div className="trade-edit-modal" onClick={(e) => e.stopPropagation()}>
        <div className="trade-edit-header">
          <h2>Edit Trade - {trade.symbol} ({trade.side})</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          className="trade-edit-form"
        >
          <div className="form-sections">
            {/* Basic Trade Information */}
            <div className="form-section">
              <h3>Basic Information</h3>
              <div className="form-row">
                <Form.Item
                  name="symbol"
                  label="Symbol"
                  rules={[{ required: true, message: 'Symbol is required' }]}
                  className="form-item-half"
                >
                  <Input placeholder="e.g., FOREXCOM:EURUSD" />
                </Form.Item>
                
                <Form.Item
                  name="side"
                  label="Side"
                  rules={[{ required: true, message: 'Side is required' }]}
                  className="form-item-half"
                >
                  <Select placeholder="Select side">
                    <Option value="Buy">Buy</Option>
                    <Option value="Sell">Sell</Option>
                  </Select>
                </Form.Item>
              </div>

              <div className="form-row">
                <Form.Item
                  name="total_entry_stock_amount"
                  label="Quantity"
                  rules={[{ required: true, message: 'Quantity is required' }]}
                  className="form-item-half"
                >
                  <InputNumber
                    placeholder="Enter quantity"
                    style={{ width: '100%' }}
                    min={0}
                    formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                  />
                </Form.Item>

                <Form.Item
                  name="trade_account"
                  label="Trade Account"
                  className="form-item-half"
                >
                  <Input placeholder="Trade account identifier" />
                </Form.Item>
              </div>
            </div>

            {/* Price Information */}
            <div className="form-section">
              <h3>Price Information</h3>
              <div className="form-row">
                <Form.Item
                  name="avg_entry_price"
                  label="Entry Price"
                  rules={[{ required: true, message: 'Entry price is required' }]}
                  className="form-item-half"
                >
                  <InputNumber
                    placeholder="0.00000"
                    style={{ width: '100%' }}
                    min={0}
                    precision={5}
                  />
                </Form.Item>

                <Form.Item
                  name="avg_exit_price"
                  label="Exit Price"
                  rules={[{ required: true, message: 'Exit price is required' }]}
                  className="form-item-half"
                >
                  <InputNumber
                    placeholder="0.00000"
                    style={{ width: '100%' }}
                    min={0}
                    precision={5}
                  />
                </Form.Item>
              </div>

              <div className="form-row">
                <Form.Item
                  name="stop_loss"
                  label="Stop Loss"
                  className="form-item-half"
                >
                  <InputNumber
                    placeholder="0.00000"
                    style={{ width: '100%' }}
                    min={0}
                    precision={5}
                  />
                </Form.Item>

                <Form.Item
                  name="price_target"
                  label="Take Profit"
                  className="form-item-half"
                >
                  <InputNumber
                    placeholder="0.00000"
                    style={{ width: '100%' }}
                    min={0}
                    precision={5}
                  />
                </Form.Item>
              </div>
            </div>

            {/* Trade Execution Details */}
            <div className="form-section">
              <h3>Execution Details</h3>
              <div className="form-row">
                <Form.Item
                  name="num_entries"
                  label="Number of Entries"
                  rules={[{ required: true, message: 'Number of entries is required' }]}
                  className="form-item-half"
                >
                  <InputNumber
                    placeholder="1"
                    style={{ width: '100%' }}
                    min={1}
                    integer
                  />
                </Form.Item>

                <Form.Item
                  name="num_exits"
                  label="Number of Exits"
                  rules={[{ required: true, message: 'Number of exits is required' }]}
                  className="form-item-half"
                >
                  <InputNumber
                    placeholder="1"
                    style={{ width: '100%' }}
                    min={1}
                    integer
                  />
                </Form.Item>
              </div>

              <div className="form-row">
                <Form.Item
                  name="time_of_first_entry"
                  label="Entry Date & Time"
                  rules={[{ required: true, message: 'Entry date is required' }]}
                  className="form-item-half"
                >
                  <DatePicker
                    showTime={{ format: 'HH:mm:ss' }}
                    format="YYYY-MM-DD HH:mm:ss"
                    style={{ width: '100%' }}
                    placeholder="Select entry date & time"
                  />
                </Form.Item>

                <Form.Item
                  name="time_of_last_exit"
                  label="Exit Date & Time"
                  rules={[{ required: true, message: 'Exit date is required' }]}
                  className="form-item-half"
                >
                  <DatePicker
                    showTime={{ format: 'HH:mm:ss' }}
                    format="YYYY-MM-DD HH:mm:ss"
                    style={{ width: '100%' }}
                    placeholder="Select exit date & time"
                  />
                </Form.Item>
              </div>
            </div>

            {/* Notes */}
            <div className="form-section">
              <h3>Additional Notes</h3>
              <Form.Item name="notes" label="Trade Notes">
                <Input.TextArea
                  rows={3}
                  placeholder="Add any additional notes about this trade..."
                />
              </Form.Item>
            </div>
          </div>

          <Divider />

          {/* Action Buttons */}
          <div className="trade-edit-actions">
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                size="large"
              >
                {loading ? 'Updating...' : 'Update Trade'}
              </Button>
              
              <Button
                danger
                onClick={handleDelete}
                loading={deleteLoading}
                size="large"
              >
                {deleteLoading ? 'Deleting...' : 'Delete Trade'}
              </Button>
              
              <Button
                onClick={handleCancel}
                size="large"
              >
                Cancel
              </Button>
            </Space>
          </div>
        </Form>
      </div>

      <style jsx>{`
        .trade-edit-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.6);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
          padding: 20px;
        }

        .trade-edit-modal {
          background: white;
          border-radius: 12px;
          width: 100%;
          max-width: 900px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }

        .trade-edit-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px 24px 0 24px;
          border-bottom: 1px solid #f0f0f0;
          margin-bottom: 24px;
        }

        .trade-edit-header h2 {
          margin: 0;
          color: #1f2937;
          font-size: 1.5rem;
          font-weight: 600;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #6b7280;
          padding: 4px;
          border-radius: 4px;
          transition: all 0.2s;
        }

        .close-btn:hover {
          color: #374151;
          background-color: #f3f4f6;
        }

        .trade-edit-form {
          padding: 0 24px 24px 24px;
        }

        .form-sections {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .form-section {
          background: #f9fafb;
          padding: 20px;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
        }

        .form-section h3 {
          margin: 0 0 16px 0;
          color: #374151;
          font-size: 1.1rem;
          font-weight: 600;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 16px;
        }

        .form-row:last-child {
          margin-bottom: 0;
        }

        .form-item-half {
          margin-bottom: 0;
        }

        .trade-edit-actions {
          display: flex;
          justify-content: center;
          padding-top: 16px;
        }

        @media (max-width: 768px) {
          .form-row {
            grid-template-columns: 1fr;
          }
          
          .trade-edit-modal {
            margin: 10px;
            max-height: 95vh;
          }
        }
      `}</style>
    </div>
  );
};

export default TradeEdit;
