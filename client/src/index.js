import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider, useAuth } from "./auth/AuthContext";
import App from "./App";
import AdminApp from "./admin/AdminApp";
import AuthPage from "./auth/AuthPage";
import ProfilePage from "./profile/ProfilePage";

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0f1419',
        color: '#fff'
      }}>
        Loading...
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: window.location }} replace />;
  }
  
  return children;
};

// Admin Protected Route
const AdminRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0f1419',
        color: '#fff'
      }}>
        Loading...
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: { pathname: '/admin' } }} replace />;
  }
  
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

const rootElement = document.getElementById("root");
const root = createRoot(rootElement);

root.render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/profile" element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } />
          <Route path="/admin/*" element={
            <AdminRoute>
              <AdminApp />
            </AdminRoute>
          } />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
