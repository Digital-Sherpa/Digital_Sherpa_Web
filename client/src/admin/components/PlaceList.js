import React, { useState, useEffect } from 'react';
import { placesApi } from '../services/adminApi';
import PlaceForm from './PlaceForm';

const PlaceList = () => {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingPlace, setEditingPlace] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const placeTypes = [
    'historical', 'workshop', 'restaurant', 'viewpoint',
    'temple', 'craft-shop', 'cultural', 'museum', 'market'
  ];

  const fetchPlaces = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };
      if (searchTerm) params.search = searchTerm;
      if (typeFilter) params.category = typeFilter;

      const data = await placesApi.getAll(params);
      setPlaces(data.places || []);
      if (data.pagination) {
        setPagination(prev => ({ ...prev, ...data.pagination }));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaces();
  }, [pagination.page, searchTerm, typeFilter]);

  const handleSave = async (data) => {
    setSaving(true);
    try {
      if (editingPlace) {
        await placesApi.update(editingPlace._id, data);
      } else {
        await placesApi.create(data);
      }
      setShowForm(false);
      setEditingPlace(null);
      fetchPlaces();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (place) => {
    if (!window.confirm(`Delete "${place.name}"? This cannot be undone.`)) return;
    
    try {
      await placesApi.delete(place._id);
      fetchPlaces();
    } catch (err) {
      alert('Error deleting: ' + err.message);
    }
  };

  const handleEdit = (place) => {
    setEditingPlace(place);
    setShowForm(true);
  };

  const handleAdd = () => {
    setEditingPlace(null);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingPlace(null);
  };

  if (showForm) {
    return (
      <PlaceForm
        place={editingPlace}
        onSave={handleSave}
        onCancel={handleCancel}
        loading={saving}
      />
    );
  }

  return (
    <div className="admin-list">
      <div className="list-header">
        <h2>📍 Places</h2>
        <button onClick={handleAdd} className="btn-primary">
          + Add Place
        </button>
      </div>

      <div className="list-filters">
        <input
          type="text"
          placeholder="Search places..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <select 
          value={typeFilter} 
          onChange={(e) => setTypeFilter(e.target.value)}
          className="filter-select"
        >
          <option value="">All Types</option>
          {placeTypes.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading">Loading places...</div>
      ) : (
        <>
          <div className="table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Coordinates</th>
                  <th>Workshop</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {places.map(place => (
                  <tr key={place._id}>
                    <td>
                      {(place.imageUrl || place.gallery?.[0]) ? (
                        <img 
                          src={place.imageUrl || place.gallery[0]} 
                          alt={place.name}
                          className="table-thumbnail"
                        />
                      ) : (
                        <div className="no-image">📷</div>
                      )}
                    </td>
                    <td>
                      <strong>{place.name}</strong>
                      <br />
                      <small className="slug">{place.slug}</small>
                    </td>
                    <td>
                      <span className={`type-badge ${place.category || place.type}`}>
                        {place.category || place.type}
                      </span>
                    </td>
                    <td className="coords">
                      {place.coordinates?.lat?.toFixed(4) || '-'},
                      <br />
                      {place.coordinates?.lng?.toFixed(4) || '-'}
                    </td>
                    <td>
                      {(place.hasWorkshop || place.workshopAvailable) ? (
                        <span className="badge workshop">
                          Rs. {place.workshopPrice?.halfDay || place.workshopPrice?.fullDay || '-'}
                        </span>
                      ) : (
                        <span className="badge none">-</span>
                      )}
                    </td>
                    <td className="actions">
                      <button onClick={() => handleEdit(place)} className="btn-icon" title="Edit">
                        ✏️
                      </button>
                      <button onClick={() => handleDelete(place)} className="btn-icon delete" title="Delete">
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {places.length === 0 && (
            <div className="empty-state">
              <p>No places found. Add your first place!</p>
            </div>
          )}

          {pagination.pages > 1 && (
            <div className="pagination">
              <button 
                disabled={pagination.page === 1}
                onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
              >
                ← Previous
              </button>
              <span>Page {pagination.page} of {pagination.pages}</span>
              <button 
                disabled={pagination.page === pagination.pages}
                onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PlaceList;
