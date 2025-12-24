import React from 'react';

const Sidebar = ({ activeSection, onSectionChange }) => {
  const menuItems = [
    { id: 'dashboard', icon: '🏠', label: 'Dashboard' },
    { id: 'places', icon: '📍', label: 'Places' },
    { id: 'craftsmen', icon: '👨‍🎨', label: 'Craftsmen' },
    { id: 'roadmaps', icon: '🗺️', label: 'Roadmaps' },
  ];

  return (
    <aside className="admin-sidebar">
      <div className="sidebar-header">
        <h1>🏛️ Digital Sherpa</h1>
        <span className="admin-badge">Admin</span>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map(item => (
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
        <a href="/" className="back-to-map">
          ← Back to Map
        </a>
      </div>
    </aside>
  );
};

export default Sidebar;
