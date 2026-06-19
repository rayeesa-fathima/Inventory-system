import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './AuditLogs.css';

const API = import.meta.env.VITE_API_URL;

const actionColors = {
  ORDER_CREATED: 'badge-confirmed',
  ORDER_STATUS_UPDATED: 'badge-processing',
  STOCK_ADJUSTED: 'badge-pending',
  PRODUCT_CREATED: 'badge-delivered',
  PRODUCT_UPDATED: 'badge-shipped',
  PRODUCT_DELETED: 'badge-cancelled',
};

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });
  const [filters, setFilters] = useState({ search: '', action: '', page: 1 });
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ ...filters, limit: 20 }).toString();
      const { data } = await axios.get(`${API}/audit?${params}`, { headers });
      setLogs(data.data);
      setPagination(data.pagination);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Audit Logs</h1>
          <p className="page-subtitle">Track all system activities — {pagination.total} records</p>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="filter-row" style={{ margin: 0 }}>
            <div className="search-bar">
              <span>🔍</span>
              <input
                placeholder="Search by user or action..."
                value={filters.search}
                onChange={e => setFilters(f => ({ ...f, search: e.target.value, page: 1 }))}
              />
            </div>
            <select
              className="filter-select"
              value={filters.action}
              onChange={e => setFilters(f => ({ ...f, action: e.target.value, page: 1 }))}
            >
              <option value="">All Actions</option>
              {Object.keys(actionColors).map(a => <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>User</th>
                <th>Action</th>
                <th>Entity</th>
                <th>Details</th>
                <th>IP</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>Loading...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>No logs found</td></tr>
              ) : logs.map(log => {
                const details = typeof log.details === 'string' ? JSON.parse(log.details) : log.details;
                return (
                  <tr key={log.id}>
                    <td style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>
                      {new Date(log.created_at).toLocaleString('en-IN')}
                    </td>
                    <td>
                      <span className="user-chip">{log.user_name || 'System'}</span>
                    </td>
                    <td>
                      <span className={`badge ${actionColors[log.action] || 'badge-pending'}`}>
                        {log.action.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td style={{ textTransform: 'capitalize' }}>
                      {log.entity_type} {log.entity_id ? `#${log.entity_id}` : ''}
                    </td>
                    <td>
                      <div className="log-details">
                        {details && Object.entries(details).slice(0, 2).map(([k, v]) => (
                          <span key={k} className="detail-pill">
                            <strong>{k}:</strong> {String(v)}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td style={{ fontSize: '12px', color: '#94a3b8' }}>{log.ip_address || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {pagination.totalPages > 1 && (
          <div className="card-body" style={{ paddingTop: 0 }}>
            <div className="pagination">
              <button disabled={filters.page <= 1} onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}>‹</button>
              {Array.from({ length: Math.min(pagination.totalPages, 7) }, (_, i) => i + 1).map(p => (
                <button key={p} className={filters.page === p ? 'active' : ''} onClick={() => setFilters(f => ({ ...f, page: p }))}>{p}</button>
              ))}
              <button disabled={filters.page >= pagination.totalPages} onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}>›</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLogs;