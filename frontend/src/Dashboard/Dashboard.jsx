import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Dashboard.css';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const StatCard = ({ icon, title, value, subtitle, color }) => (
  <div className={`stat-card stat-card--${color}`}>
    <div className="stat-card__icon">{icon}</div>
    <div className="stat-card__body">
      <div className="stat-card__value">{value}</div>
      <div className="stat-card__title">{title}</div>
      {subtitle && <div className="stat-card__subtitle">{subtitle}</div>}
    </div>
  </div>
);

const statusBadge = (status) => {
  const map = {
    Pending: 'badge-pending', Confirmed: 'badge-confirmed',
    Processing: 'badge-processing', Shipped: 'badge-shipped',
    Delivered: 'badge-delivered', Cancelled: 'badge-cancelled'
  };
  return <span className={`badge ${map[status] || ''}`}>{status}</span>;
};

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    axios.get(`${API}/dashboard`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => { setStats(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-state">Loading dashboard...</div>;

  return (
    <div className="dashboard">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Business overview and key metrics</p>
        </div>
        <span className="date-display">{new Date().toLocaleDateString('en-IN', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}</span>
      </div>

      {/* Stats Row */}
      <div className="stats-grid">
        <StatCard icon="📦" title="Total Products" value={stats?.total_products || 0} color="blue" />
        <StatCard icon="🛒" title="Total Orders" value={stats?.total_orders || 0} color="purple" />
        <StatCard icon="💰" title="Total Revenue" value={`₹${(stats?.total_revenue || 0).toLocaleString('en-IN')}`} color="green" />
        <StatCard icon="⏳" title="Pending Orders" value={stats?.pending_orders || 0} subtitle="Awaiting confirmation" color="yellow" />
        <StatCard icon="⚠️" title="Low Stock" value={stats?.low_stock_count || 0} subtitle="Products near limit" color="red" />
        <StatCard icon="✅" title="Active Products" value={stats?.active_products || 0} color="teal" />
      </div>

      <div className="dashboard-grid">
        {/* Recent Orders */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Recent Orders</span>
            <a href="/orders" className="btn btn-outline btn-sm">View All</a>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {(stats?.recent_orders || []).map(order => (
                  <tr key={order.id}>
                    <td><span className="order-num">{order.order_number}</span></td>
                    <td>{order.customer_name}</td>
                    <td>₹{parseFloat(order.total_amount).toLocaleString('en-IN')}</td>
                    <td>{statusBadge(order.status)}</td>
                    <td>{new Date(order.created_at).toLocaleDateString('en-IN')}</td>
                  </tr>
                ))}
                {(!stats?.recent_orders?.length) && (
                  <tr><td colSpan={5} style={{textAlign:'center', color:'#94a3b8', padding:'24px'}}>No orders yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">⚠️ Low Stock Alert</span>
            <a href="/products" className="btn btn-outline btn-sm">Manage</a>
          </div>
          <div className="card-body low-stock-list">
            {(stats?.low_stock_products || []).map(p => (
              <div key={p.id} className="low-stock-item">
                <div>
                  <div className="ls-name">{p.name}</div>
                  <div className="ls-sku">{p.sku}</div>
                </div>
                <div className="ls-qty">
                  <span className="badge badge-low">{p.stock_quantity} left</span>
                  <span className="ls-limit">Limit: {p.low_stock_limit}</span>
                </div>
              </div>
            ))}
            {(!stats?.low_stock_products?.length) && (
              <div className="empty-state">✅ All products have sufficient stock</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;