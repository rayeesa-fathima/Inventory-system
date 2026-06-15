import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/Layout/MainLayout';
import Dashboard from './pages/Dashboard/Dashboard';
import Products from './pages/Products/Products'; // your existing component
import Orders from './pages/Orders/Orders';
import AuditLogs from './pages/AuditLogs/AuditLogs';
import Login from './pages/Login/Login'; // your existing component
import './styles/theme.css';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (!token) return <Navigate to="/login" />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" />;
  return children;
};

function App() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <MainLayout user={user}><Dashboard /></MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/products" element={
          <ProtectedRoute>
            <MainLayout user={user}><Products /></MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/orders" element={
          <ProtectedRoute>
            <MainLayout user={user}><Orders /></MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/audit" element={
          <ProtectedRoute adminOnly={true}>
            <MainLayout user={user}><AuditLogs /></MainLayout>
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;