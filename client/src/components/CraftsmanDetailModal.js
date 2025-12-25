import React, { useState } from 'react';

const CraftsmanDetailModal = ({ craftsman, onClose, onBook }) => {
  const [activeTab, setActiveTab] = useState('about');

  if (!craftsman) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container detail-modal glass-panel" onClick={e => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>×</button>
        
        <div className="craftsman-profile-header">
          <div className="profile-hero">
            {craftsman.photo ? (
              <img src={craftsman.photo} alt={craftsman.name} className="profile-hero-img" />
            ) : (
              <div className="profile-placeholder">{craftsman.name.charAt(0)}</div>
            )}
            <div className="profile-badges">
              {craftsman.available && <span className="status-badge available">Available for Booking</span>}
              {craftsman.rating && <span className="rating-badge">⭐ {craftsman.rating}</span>}
            </div>
          </div>
          
          <div className="profile-info-main">
            <h2>{craftsman.name}</h2>
            <p className="specialty-tags">
              {Array.isArray(craftsman.specialty) 
                ? craftsman.specialty.map(s => <span key={s} className="tag">{s}</span>)
                : <span className="tag">{craftsman.specialty}</span>
              }
            </p>
            <p className="location-text">📍 {craftsman.location || 'Kathmandu, Nepal'}</p>
          </div>
        </div>

        <div className="detail-tabs">
          <button 
            className={`tab-btn ${activeTab === 'about' ? 'active' : ''}`}
            onClick={() => setActiveTab('about')}
          >
            About
          </button>
          <button 
            className={`tab-btn ${activeTab === 'work' ? 'active' : ''}`}
            onClick={() => setActiveTab('work')}
          >
            Gallery
          </button>
           <button 
            className={`tab-btn ${activeTab === 'workshops' ? 'active' : ''}`}
            onClick={() => setActiveTab('workshops')}
          >
            Workshops
          </button>
        </div>

        <div className="detail-content scrollable">
          {activeTab === 'about' && (
            <div className="about-section fade-in">
              <h3>Biography</h3>
              <p className="bio-text">{craftsman.bio || 'No biography available for this artisan yet.'}</p>
              
              <div className="info-grid">
                <div className="info-item">
                  <span className="label">Experience</span>
                  <span className="value">{craftsman.experience ? `${craftsman.experience} Years` : 'N/A'}</span>
                </div>
                <div className="info-item">
                  <span className="label">Languages</span>
                  <span className="value">
                    {craftsman.languages?.length > 0 ? craftsman.languages.join(', ') : 'Nepali'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'work' && (
            <div className="gallery-section fade-in">
              {craftsman.gallery && craftsman.gallery.length > 0 ? (
                <div className="gallery-grid">
                  {craftsman.gallery.map((img, idx) => (
                    <img key={idx} src={img} alt={`Work ${idx + 1}`} className="gallery-img" />
                  ))}
                </div>
              ) : (
                <div className="empty-state-small">No gallery images uploaded.</div>
              )}
            </div>
          )}

          {activeTab === 'workshops' && (
            <div className="workshops-section fade-in">
              {craftsman.workshopTypes && craftsman.workshopTypes.length > 0 ? (
                <div className="workshop-list">
                  {craftsman.workshopTypes.map((workshop, idx) => (
                    <div key={idx} className="workshop-card-mini">
                      <div className="ws-info">
                        <h4>{workshop.type}</h4>
                        <p>{workshop.duration} • {workshop.description || 'Learn directly from the master.'}</p>
                      </div>
                      <div className="ws-price">
                        Rs. {workshop.price}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state-small">
                  <p>Standard workshops available.</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer-fixed">
          <button className="btn-secondary full-width" onClick={onClose}>Close</button>
          <button 
            className="btn-primary full-width"
            onClick={() => onBook(craftsman)}
            disabled={!craftsman.available}
          >
            {craftsman.available ? '📅 Book a Session' : 'Currently Unavailable'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CraftsmanDetailModal;
