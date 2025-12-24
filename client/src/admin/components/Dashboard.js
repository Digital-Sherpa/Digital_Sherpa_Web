import React, { useState, useEffect } from 'react';
import { statsApi } from '../services/adminApi';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await statsApi.getAll();
      setStats(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="error-message">Error: {error}</div>;
  }

  return (
    <div className="dashboard">
      <h2>Dashboard</h2>
      <p className="dashboard-subtitle">Welcome to Digital Sherpa Admin Panel</p>

      <div className="stats-grid">
        <div className="stat-card places">
          <div className="stat-icon">📍</div>
          <div className="stat-info">
            <span className="stat-value">{stats?.places?.total || 0}</span>
            <span className="stat-label">Places</span>
            {stats?.places?.withWorkshop > 0 && (
              <span className="stat-detail">{stats.places.withWorkshop} with workshops</span>
            )}
          </div>
        </div>

        <div className="stat-card craftsmen">
          <div className="stat-icon">👨‍🎨</div>
          <div className="stat-info">
            <span className="stat-value">{stats?.craftsmen?.total || 0}</span>
            <span className="stat-label">Craftsmen</span>
            {stats?.craftsmen?.available > 0 && (
              <span className="stat-detail">{stats.craftsmen.available} available</span>
            )}
          </div>
        </div>

        <div className="stat-card roadmaps">
          <div className="stat-icon">🗺️</div>
          <div className="stat-info">
            <span className="stat-value">{stats?.roadmaps?.total || 0}</span>
            <span className="stat-label">Roadmaps</span>
            {stats?.roadmaps?.active > 0 && (
              <span className="stat-detail">{stats.roadmaps.active} active</span>
            )}
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      {stats?.places?.byCategory && stats.places.byCategory.length > 0 && (
        <div className="category-breakdown">
          <h3>Places by Category</h3>
          <div className="category-chips">
            {stats.places.byCategory.map((cat) => (
              <span key={cat._id} className="category-chip">
                {cat._id}: {cat.count}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="action-buttons">
          <button 
            className="action-btn"
            onClick={() => window.location.hash = '#places'}
          >
            <span className="action-icon">➕</span>
            Add New Place
          </button>
          <button 
            className="action-btn"
            onClick={() => window.location.hash = '#craftsmen'}
          >
            <span className="action-icon">👤</span>
            Add Craftsman
          </button>
          <button 
            className="action-btn"
            onClick={() => window.location.hash = '#roadmaps'}
          >
            <span className="action-icon">🛤️</span>
            Create Roadmap
          </button>
        </div>
      </div>

      <div className="info-cards">
        <div className="info-card">
          <h4>📚 Getting Started</h4>
          <ul>
            <li>Add <strong>Places</strong> first (historical sites, craft shops, etc.)</li>
            <li>Create <strong>Craftsmen</strong> profiles for artisans</li>
            <li>Build <strong>Roadmaps</strong> by combining places into trails</li>
          </ul>
        </div>

        <div className="info-card">
          <h4>💡 Tips</h4>
          <ul>
            <li>Upload high-quality images for better user experience</li>
            <li>Add detailed descriptions to attract tourists</li>
            <li>Include workshop prices for craft-focused places</li>
            <li>Test roadmaps on the map before publishing</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
