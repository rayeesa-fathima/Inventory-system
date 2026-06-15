import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import createorderModal from './createordermodal';
import orderdetailmodal from './orderdetailmodal';



const API = 'http://localhost:5000/api';

const statusOptions = ['', 'Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

const statusBadgeClass = {
  Pending: 'badge-pending', Confirmed: 'badge-confirmed', Processing: 'badge-processing',
  Shipped: 'badge-shipped', Delivered: 'badge-delivered', Cancelled: 'badge-cancelled'
};

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });
  const [filters, setFilters] = useState({ search: '', status: '', page: 1 });
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const user = JSON.parse(localStorage.getItem('ims_user') || '{}');

  const token = localStorage.getItem('ims_token');
  const headers = { Authorization: `Bearer ${token}` };

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ ...filters, limit: 10 }).toString();
      const { data } = await axios.get(`${API}/orders?${params}`, { headers });
      setOrders(data.data);
      setPagination(data.pagination);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleStatusUpdate = async (orderId, newStatus) => {
    if (!window.confirm(`Change status to "${newStatus}"?`)) return;
    try {
      await axios.patch(`${API}/orders/${orderId}/status`, { status: newStatus }, { headers });
      fetchOrders();
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating status');
    }
  };

  const getNextStatuses = (current, role) => {
    const flow = { Pending: ['Confirmed', 'Cancelled'], Confirmed: ['Processing', 'Cancelled'], Processing: ['Shipped', 'Cancelled'], Shipped: ['Delivered'] };
    const staffAllowed = ['Confirmed', 'Processing'];
    const options = flow[current] || [];
    if (role === 'staff') return options.filter(s => staffAllowed.includes(s));
    return options;
  };

  return (
    <div className="orders-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Orders</h1>
          <p className="page-subtitle">{pagination.total} total orders</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          + New Order
        </button>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="filter-row" style={{ margin: 0 }}>
            <div className="search-bar">
              <span>🔍</span>
              <input
                placeholder="Search orders..."
                value={filters.search}
                onChange={e => setFilters(f => ({ ...f, search: e.target.value, page: 1 }))}
              />
            </div>
            <select
              className="filter-select"
              value={filters.status}
              onChange={e => setFilters(f => ({ ...f, status: e.target.value, page: 1 }))}
            >
              {statusOptions.map(s => <option key={s} value={s}>{s || 'All Statuses'}</option>)}
            </select>
          </div>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Created By</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>Loading...</td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>No orders found</td></tr>
              ) : orders.map(order => (
                <tr key={order.id}>
                  <td><span className="order-num">{order.order_number}</span></td>
                  <td>
                    <div>{order.customer_name}</div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>{order.customer_email}</div>
                  </td>
                  <td><strong>₹{parseFloat(order.total_amount).toLocaleString('en-IN')}</strong></td>
                  <td>
                    <span className={`badge ${statusBadgeClass[order.status]}`}>{order.status}</span>
                  </td>
                  <td>{order.created_by_name}</td>
                  <td>{new Date(order.created_at).toLocaleDateString('en-IN')}</td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn btn-outline btn-sm" onClick={() => setSelectedOrder(order.id)}>View</button>
                      {getNextStatuses(order.status, user.role).map(ns => (
                        <button
                          key={ns}
                          className={`btn btn-sm ${ns === 'Cancelled' ? 'btn-danger' : 'btn-primary'}`}
                          onClick={() => handleStatusUpdate(order.id, ns)}
                        >
                          {ns}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {pagination.totalPages > 1 && (
          <div className="card-body" style={{ paddingTop: 0 }}>
            <div className="pagination">
              <button disabled={filters.page <= 1} onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}>‹</button>
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} className={filters.page === p ? 'active' : ''} onClick={() => setFilters(f => ({ ...f, page: p }))}>{p}</button>
              ))}
              <button disabled={filters.page >= pagination.totalPages} onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}>›</button>
            </div>
          </div>
        )}
      </div>

      {showCreate && (
        <CreateOrderModal
          onClose={() => setShowCreate(false)}
          onSuccess={() => { setShowCreate(false); fetchOrders(); }}
          token={token}
          API={API}
        />
      )}

      {selectedOrder && (
        <OrderDetailModal
          orderId={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          token={token}
          API={API}
        />
      )}
    </div>
  );
};

export default Orders;