import React from 'react';

const Sidebar = ({ activeSection, onSectionChange, user, onLogout }) => {
  const menuItems = [
    { id: 'dashboard', icon: '🏠', label: 'Dashboard' },
    { id: 'places', icon: '📍', label: 'Places' },
    { id: 'craftsmen', icon: '👨‍🎨', label: 'Craftsmen' },
    { id: 'roadmaps', icon: '🗺️', label: 'Roadmaps' },
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
        {user && (
          <div className="user-info">
            <div className="user-avatar">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} />
              ) : (
                <span>{user.name?.charAt(0).toUpperCase() || '👤'}</span>
              )}
            </div>
            <div className="user-details">
              <span className="user-name">{user.name}</span>
              <span className="user-role">{user.role}</span>
            </div>
          </div>
        )}
        
        <div className="footer-actions">
          <a href="/" className="back-to-map">
            ← Back to Map
          </a>
          {user && (
            <button onClick={onLogout} className="logout-btn">
              🚪 Logout
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
