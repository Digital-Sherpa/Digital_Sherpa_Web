import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import './auth.css';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const from = location.state?.from?.pathname || '/';
  const isAdminRedirect = from.startsWith('/admin');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const result = await login(formData.email, formData.password);
        if (result.success) {
          // Check if trying to access admin and user is not admin
          if (isAdminRedirect) {
            if (result.user.role === 'admin' || result.user.role === 'superadmin') {
              navigate('/admin');
            } else {
              setError('Admin access required');
              setLoading(false);
              return;
            }
          } else {
            navigate(from, { replace: true });
          }
        } else {
          setError(result.error);
        }
      } else {
        // Register
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }
        if (formData.password.length < 6) {
          setError('Password must be at least 6 characters');
          setLoading(false);
          return;
        }
        
        const result = await register(formData.name, formData.email, formData.password);
        if (result.success) {
          navigate('/', { replace: true });
        } else {
          setError(result.error);
        }
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <div className="auth-header">
          <div className="auth-logo">
            <span className="logo-icon">🏔️</span>
            <h1>Digital Sherpa</h1>
          </div>
          <p>{isLogin ? 'Welcome back! Sign in to continue.' : 'Create your account to start exploring.'}</p>
        </div>

        {/* Tab Switcher */}
        <div className="auth-tabs">
          <button 
            className={`auth-tab ${isLogin ? 'active' : ''}`}
            onClick={() => { setIsLogin(true); setError(''); }}
          >
            Sign In
          </button>
          <button 
            className={`auth-tab ${!isLogin ? 'active' : ''}`}
            onClick={() => { setIsLogin(false); setError(''); }}
          >
            Register
          </button>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your name"
                required={!isLogin}
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder={isLogin ? 'Enter your password' : 'Create a password (min 6 characters)'}
              required
            />
          </div>

          {!isLogin && (
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                required={!isLogin}
              />
            </div>
          )}

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? (
              <span className="loading-spinner-small"></span>
            ) : (
              isLogin ? 'Sign In' : 'Create Account'
            )}
          </button>
        </form>

        <div className="auth-footer">
          {isAdminRedirect && (
            <p className="admin-notice">
              🔐 Admin login required
            </p>
          )}
          <a href="/" className="back-link">
            ← Back to Map
          </a>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;