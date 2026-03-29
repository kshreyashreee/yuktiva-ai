import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import NewProject from './pages/NewProject.jsx';
import ProjectDetail from './pages/ProjectDetail.jsx';
import ProductLaunch from './pages/ProductLaunch.jsx';
import FactCheck from './pages/FactCheck.jsx';
import StrategyPivot from './pages/StrategyPivot.jsx';
import ComplianceReview from './pages/ComplianceReview.jsx';
import ApprovalGate from './pages/ApprovalGate.jsx';
import AdminPanel from './pages/AdminPanel.jsx';
import SystemLogs from './pages/SystemLogs.jsx';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-dark-900">
      <div className="text-center">
        <div className="text-5xl mb-4">⚡</div>
        <div className="text-violet-400 text-xl font-bold animate-pulse">Yuktiva AI</div>
      </div>
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ children }) {
  const { user, isAdmin } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="projects/new" element={<NewProject />} />
        <Route path="projects/:id" element={<ProjectDetail />} />
        <Route path="projects/:id/launch" element={<ProductLaunch />} />
        <Route path="projects/:id/factcheck" element={<FactCheck />} />
        <Route path="projects/:id/strategy" element={<StrategyPivot />} />
        <Route path="projects/:id/compliance" element={<ComplianceReview />} />
        <Route path="projects/:id/approve" element={<ApprovalGate />} />
        <Route path="admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />
        <Route path="logs" element={<SystemLogs />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
