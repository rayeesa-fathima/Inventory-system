import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import './Sidebar.css';

const menuItems = [
  { path: '/dashboard', icon: '⊞', label: 'Dashboard' },
  { path: '/products', icon: '📦', label: 'Products' },
  { path: '/orders', icon: '🛒', label: 'Orders' },
  { path: '/stock', icon: '📊', label: 'Stock' },
  { path: '/audit', icon: '📋', label: 'Audit Logs', adminOnly: true },
];

const Sidebar = ({ user }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-icon">📦</div>
        <div className="brand-text">
          <span className="brand-name">InvenTrack</span>
          <span className="brand-sub">Management System</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">MAIN MENU</div>
        {menuItems.map((item) => {
          if (item.adminOnly && user?.role !== 'admin') return null;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">{user?.name?.charAt(0).toUpperCase()}</div>
          <div className="user-details">
            <span className="user-name">{user?.name}</span>
            <span className={`user-role role-${user?.role}`}>{user?.role}</span>
          </div>
        </div>
        <button className="logout-btn" onClick={handleLogout}>⏻ Logout</button>
      </div>
    </aside>
  );
};

export default Sidebar;