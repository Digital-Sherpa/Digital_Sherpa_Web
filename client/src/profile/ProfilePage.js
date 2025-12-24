import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import './profile.css';

const ProfilePage = () => {
  const { user, updateProfile, changePassword, logout, getToken } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('profile');
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [stats, setStats] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    location: '',
    phone: '',
    languages: [],
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [languageInput, setLanguageInput] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        bio: user.bio || '',
        location: user.location || '',
        phone: user.phone || '',
        languages: user.languages || [],
      });
      fetchStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchStats = async () => {
    try {
      const token = getToken();
      const response = await fetch('/api/users/stats', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const addLanguage = () => {
    if (languageInput.trim() && !formData.languages.includes(languageInput.trim())) {
      setFormData({
        ...formData,
        languages: [...formData.languages, languageInput.trim()]
      });
      setLanguageInput('');
    }
  };

  const removeLanguage = (lang) => {
    setFormData({
      ...formData,
      languages: formData.languages.filter(l => l !== lang)
    });
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    const result = await updateProfile(formData);
    
    if (result.success) {
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setEditing(false);
    } else {
      setMessage({ type: 'error', text: result.error });
    }
    setLoading(false);
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }

    setLoading(true);
    const result = await changePassword(passwordData.currentPassword, passwordData.newPassword);
    
    if (result.success) {
      setMessage({ type: 'success', text: 'Password changed successfully!' });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } else {
      setMessage({ type: 'error', text: result.error });
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (!user) {
    return (
      <div className="profile-loading">
        <div className="loading-spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <button className="back-btn" onClick={() => navigate('/')}>
          ← Back to Map
        </button>
        <h1>My Profile</h1>
        {(user.role === 'admin' || user.role === 'superadmin') && (
          <button className="admin-btn" onClick={() => navigate('/admin')}>
            🛡️ Admin Panel
          </button>
        )}
      </div>

      <div className="profile-content">
        {/* User Card */}
        <div className="user-card">
          <div className="user-avatar-large">
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} />
            ) : (
              <span>{user.name?.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <h2>{user.name}</h2>
          <p className="user-email">{user.email}</p>
          <span className={`role-badge ${user.role}`}>
            {user.role === 'superadmin' ? '👑 Super Admin' : 
             user.role === 'admin' ? '🛡️ Admin' : '🎒 Explorer'}
          </span>
          
          {/* Stats Summary */}
          {stats && (
            <div className="stats-mini">
              <div className="stat-item">
                <span className="stat-value">{stats.totalTrails}</span>
                <span className="stat-label">Trails</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{stats.points}</span>
                <span className="stat-label">Points</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">Lvl {stats.level}</span>
                <span className="stat-label">Level</span>
              </div>
            </div>
          )}

          <button className="logout-btn-card" onClick={handleLogout}>
            🚪 Logout
          </button>
        </div>

        {/* Main Content */}
        <div className="profile-main">
          {/* Tabs */}
          <div className="profile-tabs">
            <button 
              className={`tab ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              📝 Profile
            </button>
            <button 
              className={`tab ${activeTab === 'achievements' ? 'active' : ''}`}
              onClick={() => setActiveTab('achievements')}
            >
              🏆 Achievements
            </button>
            <button 
              className={`tab ${activeTab === 'trails' ? 'active' : ''}`}
              onClick={() => setActiveTab('trails')}
            >
              🗺️ Trails
            </button>
            <button 
              className={`tab ${activeTab === 'security' ? 'active' : ''}`}
              onClick={() => setActiveTab('security')}
            >
              🔒 Security
            </button>
          </div>

          {message.text && (
            <div className={`message ${message.type}`}>{message.text}</div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="tab-content">
              <div className="section-header">
                <h3>Personal Information</h3>
                {!editing ? (
                  <button className="edit-btn" onClick={() => setEditing(true)}>
                    ✏️ Edit
                  </button>
                ) : (
                  <button className="cancel-btn" onClick={() => {
                    setEditing(false);
                    setFormData({
                      name: user.name || '',
                      bio: user.bio || '',
                      location: user.location || '',
                      phone: user.phone || '',
                      languages: user.languages || [],
                    });
                  }}>
                    ✖️ Cancel
                  </button>
                )}
              </div>

              <form onSubmit={handleProfileUpdate} className="profile-form">
                <div className="form-group">
                  <label>Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    disabled={!editing}
                    placeholder="Your name"
                  />
                </div>

                <div className="form-group">
                  <label>Bio</label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    disabled={!editing}
                    placeholder="Tell us about yourself..."
                    rows={3}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Location</label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      disabled={!editing}
                      placeholder="City, Country"
                    />
                  </div>
                  <div className="form-group">
                    <label>Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      disabled={!editing}
                      placeholder="+1 234 567 8900"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Languages</label>
                  <div className="languages-container">
                    <div className="language-tags">
                      {formData.languages.map((lang, idx) => (
                        <span key={idx} className="language-tag">
                          {lang}
                          {editing && (
                            <button 
                              type="button" 
                              className="remove-lang"
                              onClick={() => removeLanguage(lang)}
                            >
                              ×
                            </button>
                          )}
                        </span>
                      ))}
                    </div>
                    {editing && (
                      <div className="add-language">
                        <input
                          type="text"
                          value={languageInput}
                          onChange={(e) => setLanguageInput(e.target.value)}
                          placeholder="Add language"
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addLanguage())}
                        />
                        <button type="button" onClick={addLanguage}>+</button>
                      </div>
                    )}
                  </div>
                </div>

                {editing && (
                  <button type="submit" className="save-btn" disabled={loading}>
                    {loading ? 'Saving...' : '💾 Save Changes'}
                  </button>
                )}
              </form>
            </div>
          )}

          {/* Achievements Tab */}
          {activeTab === 'achievements' && (
            <div className="tab-content">
              <h3>🏆 Badges & Achievements</h3>
              
              {user.badges && user.badges.length > 0 ? (
                <div className="badges-grid">
                  {user.badges.map((badge, idx) => (
                    <div key={idx} className="badge-card">
                      <span className="badge-icon">{badge.icon || '🏅'}</span>
                      <h4>{badge.name}</h4>
                      <p>{badge.description}</p>
                      <span className="badge-date">
                        {new Date(badge.earnedAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <span className="empty-icon">🎯</span>
                  <p>No badges yet. Complete trails to earn badges!</p>
                </div>
              )}

              {/* Available Badges */}
              <h3 style={{ marginTop: '2rem' }}>🎯 Available Badges</h3>
              <div className="badges-grid locked">
                <div className="badge-card locked">
                  <span className="badge-icon">🥾</span>
                  <h4>Trail Blazer</h4>
                  <p>Complete your first trail</p>
                  <span className="badge-progress">0/1</span>
                </div>
                <div className="badge-card locked">
                  <span className="badge-icon">🗺️</span>
                  <h4>Explorer</h4>
                  <p>Complete 5 trails</p>
                  <span className="badge-progress">{stats?.totalTrails || 0}/5</span>
                </div>
                <div className="badge-card locked">
                  <span className="badge-icon">⛰️</span>
                  <h4>Adventurer</h4>
                  <p>Complete 10 trails</p>
                  <span className="badge-progress">{stats?.totalTrails || 0}/10</span>
                </div>
                <div className="badge-card locked">
                  <span className="badge-icon">🏔️</span>
                  <h4>Mountain Master</h4>
                  <p>Complete 25 trails</p>
                  <span className="badge-progress">{stats?.totalTrails || 0}/25</span>
                </div>
              </div>
            </div>
          )}

          {/* Trails Tab */}
          {activeTab === 'trails' && (
            <div className="tab-content">
              <h3>🗺️ Completed Trails</h3>
              
              {/* Stats Overview */}
              {stats && (
                <div className="trails-stats">
                  <div className="trail-stat">
                    <span className="stat-number">{stats.totalTrails}</span>
                    <span className="stat-text">Total Trails</span>
                  </div>
                  <div className="trail-stat">
                    <span className="stat-number">{stats.totalDistance?.toFixed(1) || 0}</span>
                    <span className="stat-text">km Traveled</span>
                  </div>
                  <div className="trail-stat">
                    <span className="stat-number">{stats.favoriteRoadmaps || 0}</span>
                    <span className="stat-text">Favorites</span>
                  </div>
                </div>
              )}

              {user.completedTrails && user.completedTrails.length > 0 ? (
                <div className="trails-list">
                  {user.completedTrails.map((trail, idx) => (
                    <div key={idx} className="trail-card">
                      <div className="trail-info">
                        <h4>{trail.roadmapName || trail.roadmapSlug}</h4>
                        <span className="trail-date">
                          {new Date(trail.completedAt).toLocaleDateString()}
                        </span>
                      </div>
                      {trail.rating && (
                        <div className="trail-rating">
                          {'⭐'.repeat(trail.rating)}
                        </div>
                      )}
                      {trail.duration && (
                        <span className="trail-duration">{trail.duration} min</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <span className="empty-icon">🚶</span>
                  <p>No trails completed yet.</p>
                  <button className="explore-btn" onClick={() => navigate('/')}>
                    Start Exploring →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="tab-content">
              <h3>🔒 Security Settings</h3>
              
              <div className="security-section">
                <h4>Change Password</h4>
                <form onSubmit={handlePasswordUpdate} className="password-form">
                  <div className="form-group">
                    <label>Current Password</label>
                    <input
                      type="password"
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      placeholder="Enter current password"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>New Password</label>
                    <input
                      type="password"
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      placeholder="Enter new password (min 6 characters)"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Confirm New Password</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      placeholder="Confirm new password"
                      required
                    />
                  </div>
                  <button type="submit" className="change-password-btn" disabled={loading}>
                    {loading ? 'Updating...' : '🔐 Update Password'}
                  </button>
                </form>
              </div>

              <div className="security-section">
                <h4>Account Information</h4>
                <div className="account-info">
                  <div className="info-row">
                    <span className="info-label">Email</span>
                    <span className="info-value">{user.email}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Account Created</span>
                    <span className="info-value">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Last Login</span>
                    <span className="info-value">
                      {user.lastLogin 
                        ? new Date(user.lastLogin).toLocaleString() 
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Account Status</span>
                    <span className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}>
                      {user.isActive ? '✅ Active' : '❌ Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="security-section danger-zone">
                <h4>⚠️ Danger Zone</h4>
                <p>Once you log out, you'll need to sign in again to access your account.</p>
                <button className="logout-btn-danger" onClick={handleLogout}>
                  🚪 Logout from Account
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;