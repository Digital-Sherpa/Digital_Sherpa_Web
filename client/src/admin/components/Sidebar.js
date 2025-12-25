import React from 'react';
import { useNavigate } from 'react-router-dom';

const Sidebar = ({ activeSection, onSectionChange, user, onLogout }) => {
  const navigate = useNavigate();
  
  const menuItems = [
    { id: 'dashboard', icon: '🏠', label: 'Dashboard' },
    { id: 'places', icon: '📍', label: 'Places' },
    { id: 'craftsmen', icon: '👨‍🎨', label: 'Craftsmen' },
    { id: 'bookings', icon: '📅', label: 'Bookings' },
    { id: 'roadmaps', icon: '🗺️', label: 'Roadmaps' },
    { id: 'events', icon: '🎉', label: 'Events' },
    { id: 'users', icon: '👥', label: 'Users' },
  ];

  // Only show users to admin/superadmin
  const filteredItems = menuItems.filter(item => {
    if (item.id === 'users') {
      return user?.role === 'admin' || user?.role === 'superadmin';
    }
    return true;
  });

  return (
    <aside className="admin-sidebar">
      <div className="sidebar-header">
        <h1>🏛️ Digital Sherpa</h1>
        <span className="admin-badge">Admin</span>
      </div>

      {/* Go to Maps Button */}
      <button 
        className="go-to-maps-btn"
        onClick={() => navigate('/')}
      >
        <span className="maps-icon">🗺️</span>
        <span>Go to Maps</span>
        <span className="arrow">→</span>
      </button>

      <nav className="sidebar-nav">
        {filteredItems.map(item => (
          <button
            key={item.id}
            className={`nav-item ${activeSection === item.id ? 'active' : ''}`}
            onClick={() => onSectionChange(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <span className="user-name">{user?.name || 'Admin'}</span>
          <span className="user-role">{user?.role}</span>
        </div>
        <button className="logout-btn" onClick={onLogout}>
          🚪 Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
