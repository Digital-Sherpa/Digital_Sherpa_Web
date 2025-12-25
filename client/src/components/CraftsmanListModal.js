import React, { useState, useEffect } from 'react';
import { getCraftsmen } from '../services/api';

const CraftsmanListModal = ({ onClose, onSelectCraftsman }) => {
  const [craftsmen, setCraftsmen] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('All');

  useEffect(() => {
    fetchCraftsmen();
  }, []);

  const fetchCraftsmen = async () => {
    try {
      const data = await getCraftsmen();
      // Backend returns array directly for public endpoint
      setCraftsmen(Array.isArray(data) ? data : data.craftsmen || []);
    } catch (err) {
      setError('Failed to load craftsmen');
    } finally {
      setLoading(false);
    }
  };

  // Extract unique specialties for filter
  const specialties = ['All', ...new Set(craftsmen.flatMap(c => c.specialty || []))];

  const filteredCraftsmen = craftsmen.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (c.location && c.location.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesSpecialty = selectedSpecialty === 'All' || (c.specialty && c.specialty.includes(selectedSpecialty));
    return matchesSearch && matchesSpecialty;
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container wide glass-panel" onClick={e => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>×</button>
        
        <div className="modal-header">
          <h2>👨‍🎨 Meet Our Artisans</h2>
          <p className="modal-subtitle">Discover master craftsmen and learn traditional skills.</p>
        </div>

        <div className="craftsmen-controls">
          <div className="search-bar">
            <span className="search-icon">🔍</span>
            <input 
              type="text" 
              placeholder="Search artisans by name or location..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="specialty-filters">
            {specialties.slice(0, 6).map(spec => (
              <button 
                key={spec}
                className={`filter-chip ${selectedSpecialty === spec ? 'active' : ''}`}
                onClick={() => setSelectedSpecialty(spec)}
              >
                {spec}
              </button>
            ))}
          </div>
        </div>

        <div className="craftsmen-grid-container">
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Finding artisans...</p>
            </div>
          ) : error ? (
            <div className="error-state">{error}</div>
          ) : filteredCraftsmen.length > 0 ? (
            <div className="craftsmen-grid">
              {filteredCraftsmen.map(craftsman => (
                <div 
                  key={craftsman._id} 
                  className="craftsman-card"
                  onClick={() => onSelectCraftsman(craftsman)}
                >
                  <div className="craftsman-card-image">
                    {craftsman.photo ? (
                      <img src={craftsman.photo} alt={craftsman.name} />
                    ) : (
                      <div className="placeholder-avatar">{craftsman.name.charAt(0)}</div>
                    )}
                    {craftsman.rating && (
                      <div className="card-rating">⭐ {craftsman.rating}</div>
                    )}
                  </div>
                  <div className="craftsman-card-content">
                    <h3>{craftsman.name}</h3>
                    <p className="craftsman-specialty">
                      {Array.isArray(craftsman.specialty) ? craftsman.specialty.join(', ') : craftsman.specialty}
                    </p>
                    <p className="craftsman-location">📍 {craftsman.location || 'Kathmandu'}</p>
                    <div className="card-footer">
                        <span className="learn-more">View Profile →</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>No artisans found matching your criteria.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CraftsmanListModal;
