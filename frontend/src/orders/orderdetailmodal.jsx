import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './OrderModal.css';

const OrderDetailModal = ({ orderId, onClose, token, API }) => {
  const [order, setOrder] = useState(null);

  useEffect(() => {
    axios.get(`${API}/orders/${orderId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setOrder(res.data))
      .catch(console.error);
  }, [orderId]);

  if (!order) return null;

  const statusFlow = ['Pending','Confirmed','Processing','Shipped','Delivered'];
  const cancelledOrDelivered = ['Cancelled','Delivered'].includes(order.status);
  const currentStep = statusFlow.indexOf(order.status);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box modal-lg" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>Order {order.order_number}</h2>
            <span className={`badge badge-${order.status.toLowerCase()}`}>{order.status}</span>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {/* Status progress */}
          {!cancelledOrDelivered && (
            <div className="status-progress">
              {statusFlow.map((s, i) => (
                <React.Fragment key={s}>
                  <div className={`step ${i < currentStep ? 'done' : i === currentStep ? 'current' : ''}`}>
                    <div className="step-dot">{i < currentStep ? '✓' : i + 1}</div>
                    <div className="step-label">{s}</div>
                  </div>
                  {i < statusFlow.length - 1 && <div className={`step-line ${i < currentStep ? 'done' : ''}`} />}
                </React.Fragment>
              ))}
            </div>
          )}
          {order.status === 'Cancelled' && <div className="alert alert-danger">This order was cancelled.</div>}

          <div className="form-grid-2" style={{ marginTop: '16px' }}>
            <div>
              <div className="detail-label">Customer</div>
              <div className="detail-value">{order.customer_name}</div>
              <div className="detail-sub">{order.customer_email}</div>
            </div>
            <div>
              <div className="detail-label">Created By</div>
              <div className="detail-value">{order.created_by_name}</div>
              <div className="detail-sub">{new Date(order.created_at).toLocaleString('en-IN')}</div>
            </div>
          </div>

          {order.notes && <div style={{ marginTop: '12px', fontSize: '13px', color: '#64748b' }}>Notes: {order.notes}</div>}

          <div style={{ marginTop: '20px' }}>
            <strong style={{ fontSize: '13px' }}>Items</strong>
            <table className="data-table" style={{ marginTop: '8px' }}>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Qty</th>
                  <th>Unit Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {(order.items || []).map(item => (
                  <tr key={item.id}>
                    <td>{item.product_name}</td>
                    <td><code>{item.sku}</code></td>
                    <td>{item.quantity}</td>
                    <td>₹{parseFloat(item.unit_price).toLocaleString('en-IN')}</td>
                    <td><strong>₹{parseFloat(item.total_price).toLocaleString('en-IN')}</strong></td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={4} style={{ textAlign: 'right', fontWeight: '700', paddingRight: '14px' }}>Grand Total</td>
                  <td><strong>₹{parseFloat(order.total_amount).toLocaleString('en-IN')}</strong></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailModal;