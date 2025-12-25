import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { getMyBookings, cancelBooking } from '../services/api';
import './profile.css';

const ProfilePage = () => {
  const { user, updateProfile, changePassword, logout, getToken } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('profile');
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [stats, setStats] = useState(null);
  const [journeys, setJourneys] = useState([]);
  const [bookings, setBookings] = useState([]);
  
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
      fetchJourneys();
      fetchBookings();
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

  const fetchJourneys = async () => {
    try {
      const token = getToken();
      const response = await fetch('/api/journeys?status=completed&limit=50', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setJourneys(data.journeys || []);
      }
    } catch (error) {
      console.error('Error fetching journeys:', error);
    }
  };

  const fetchBookings = async () => {
    try {
      const token = getToken();
      const data = await getMyBookings(token);
      setBookings(data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    
    try {
      const token = getToken();
      await cancelBooking(bookingId, token);
      setMessage({ type: 'success', text: 'Booking cancelled successfully' });
      fetchBookings(); // Refresh list
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    }
  };

  const downloadJourney = async (journeyId, format = 'png') => {
    try {
      const token = getToken();
      const response = await fetch(`/api/journeys/${journeyId}/export`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ format, transparent: format === 'png' }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `journey_${journeyId}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
      }
    } catch (error) {
      console.error('Error downloading journey:', error);
    }
  };

  const formatDuration = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m`;
  };

  const formatDistance = (meters) => {
    if (meters >= 1000) return `${(meters / 1000).toFixed(2)} km`;
    return `${Math.round(meters)} m`;
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
              className={`tab ${activeTab === 'bookings' ? 'active' : ''}`}
              onClick={() => setActiveTab('bookings')}
            >
              📅 Bookings
            </button>
            <button 
              className={`tab ${activeTab === 'journeys' ? 'active' : ''}`}
              onClick={() => setActiveTab('journeys')}
            >
              🚀 Journeys
            </button>
            <button 
              className={`tab ${activeTab === 'achievements' ? 'active' : ''}`}
              onClick={() => setActiveTab('achievements')}
            >
              🏆 Badges
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

          {/* Bookings Tab */}
          {activeTab === 'bookings' && (
            <div className="tab-content">
              <h3>📅 My Bookings</h3>
              {bookings.length > 0 ? (
                <div className="bookings-list">
                  {bookings.map((booking) => {
                    const bookingDate = new Date(booking.bookingDate);
                    const today = new Date();
                    const isUpcoming = bookingDate > today;
                    const diffTime = bookingDate - today;
                    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    
                    // Logic: Can cancel if more than 7 days left
                    const canCancel = booking.status !== 'cancelled' && booking.status !== 'completed' && daysLeft > 7;

                    return (
                      <div key={booking._id} className={`booking-card ${booking.status} ${!canCancel && isUpcoming ? 'locked' : ''}`}>
                        <div className="booking-header">
                          <div className="booking-title">
                            <h4>{booking.craftsmanName || booking.placeName}</h4>
                            <span className="booking-type">{booking.workshopType}</span>
                          </div>
                          <span className={`booking-status ${booking.status}`}>
                            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                          </span>
                        </div>
                        
                        <div className="booking-details">
                          <div className="booking-info-row">
                            <span>📅 Date:</span>
                            <span>{bookingDate.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                          </div>
                          <div className="booking-info-row">
                            <span>👥 People:</span>
                            <span>{booking.numberOfPeople}</span>
                          </div>
                          <div className="booking-info-row">
                            <span>💰 Total Price:</span>
                            <span>Rs. {booking.totalPrice}</span>
                          </div>
                          {booking.notes && (
                            <div className="booking-notes">
                              <strong>Note:</strong> {booking.notes}
                            </div>
                          )}
                        </div>

                        {booking.status === 'cancelled' && booking.cancellationReason && (
                          <div className="cancellation-reason">
                            Cancelled: {booking.cancellationReason}
                          </div>
                        )}

                        {booking.status === 'confirmed' && isUpcoming && (
                          <div className="booking-actions">
                            {canCancel ? (
                              <div className="cancellation-available">
                                <span className="text-green-small">✓ Free cancellation available ({daysLeft} days until event)</span>
                                <button 
                                  className="cancel-booking-btn"
                                  onClick={() => handleCancelBooking(booking._id)}
                                >
                                  Cancel Booking
                                </button>
                              </div>
                            ) : (
                              <div className="cancellation-locked">
                                <p className="cancel-note warning">
                                  ⚠️ Cancellation unavailable (Event is in {daysLeft} days).
                                  <br/>Policy requires 7 days notice.
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="empty-state">
                  <span className="empty-icon">🎫</span>
                  <p>No bookings yet. Explore workshops to book!</p>
                  <button className="explore-btn" onClick={() => navigate('/')}>
                    Explore Map →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Journeys Tab - NEW */}
          {activeTab === 'journeys' && (
            <div className="tab-content">
              <h3>🚀 My Journeys</h3>
              
              {/* Journey Stats */}
              <div className="journey-stats">
                <div className="journey-stat">
                  <span className="stat-number">{journeys.length}</span>
                  <span className="stat-text">Total Journeys</span>
                </div>
                <div className="journey-stat">
                  <span className="stat-number">
                    {(journeys.reduce((sum, j) => sum + (j.distance || 0), 0) / 1000).toFixed(1)}
                  </span>
                  <span className="stat-text">km Recorded</span>
                </div>
                <div className="journey-stat">
                  <span className="stat-number">
                    {formatDuration(journeys.reduce((sum, j) => sum + (j.duration || 0), 0))}
                  </span>
                  <span className="stat-text">Total Time</span>
                </div>
              </div>

              {/* Journey Cards */}
              {journeys.length > 0 ? (
                <div className="journeys-grid">
                  {journeys.map((journey) => (
                    <div key={journey._id} className="journey-card">
                      {journey.trackImage?.url ? (
                        <div className="journey-image">
                          <img src={journey.trackImage.url} alt={journey.title} />
                        </div>
                      ) : (
                        <div className="journey-image placeholder">
                          <span>🗺️</span>
                        </div>
                      )}
                      <div className="journey-info">
                        <h4>{journey.title}</h4>
                        <div className="journey-meta">
                          <span>📅 {new Date(journey.createdAt).toLocaleDateString()}</span>
                          <span>📍 {formatDistance(journey.distance)}</span>
                          <span>⏱️ {formatDuration(journey.duration)}</span>
                        </div>
                        {journey.roadmapName && (
                          <span className="journey-roadmap">
                            🛤️ {journey.roadmapName}
                          </span>
                        )}
                      </div>
                      <div className="journey-actions">
                        <button 
                          className="download-btn"
                          onClick={() => downloadJourney(journey._id, 'png')}
                          title="Download PNG"
                        >
                          📥 PNG
                        </button>
                        <button 
                          className="download-btn"
                          onClick={() => downloadJourney(journey._id, 'jpg')}
                          title="Download JPG"
                        >
                          📥 JPG
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <span className="empty-icon">🏃</span>
                  <p>No journeys recorded yet.</p>
                  <button className="explore-btn" onClick={() => navigate('/')}>
                    Start Recording →
                  </button>
                </div>
              )}
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
                  <p>No badges yet. Record journeys to earn badges!</p>
                </div>
              )}

              {/* Available Badges */}
              <h3 style={{ marginTop: '2rem' }}>🎯 Available Badges</h3>
              <div className="badges-grid locked">
                <div className="badge-card locked">
                  <span className="badge-icon">🥾</span>
                  <h4>First Steps</h4>
                  <p>Complete your first journey</p>
                  <span className="badge-progress">{journeys.length}/1</span>
                </div>
                <div className="badge-card locked">
                  <span className="badge-icon">🔥</span>
                  <h4>Trail Blazer</h4>
                  <p>Complete 5 journeys</p>
                  <span className="badge-progress">{journeys.length}/5</span>
                </div>
                <div className="badge-card locked">
                  <span className="badge-icon">🗺️</span>
                  <h4>Explorer</h4>
                  <p>Record 10km total</p>
                  <span className="badge-progress">
                    {(journeys.reduce((sum, j) => sum + (j.distance || 0), 0) / 1000).toFixed(1)}/10 km
                  </span>
                </div>
                <div className="badge-card locked">
                  <span className="badge-icon">🏃</span>
                  <h4>Marathon</h4>
                  <p>Record 42km total</p>
                  <span className="badge-progress">
                    {(journeys.reduce((sum, j) => sum + (j.distance || 0), 0) / 1000).toFixed(1)}/42 km
                  </span>
                </div>
              </div>
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