import React, { useState, useEffect } from 'react';
import { craftsmenApi } from '../services/adminApi';
import CraftsmanForm from './CraftsmanForm';

const CraftsmanList = () => {
  const [craftsmen, setCraftsmen] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingCraftsman, setEditingCraftsman] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [searchTerm, setSearchTerm] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState('');

  const specialties = [
    'Pottery', 'Woodcarving', 'Metalwork', 'Thangka Painting',
    'Weaving', 'Mask Making', 'Stone Carving', 'Jewelry', 'Other'
  ];

  const fetchCraftsmen = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };
      if (searchTerm) params.search = searchTerm;
      if (specialtyFilter) params.specialty = specialtyFilter;

      const data = await craftsmenApi.getAll(params);
      setCraftsmen(data.craftsmen || []);
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
    fetchCraftsmen();
  }, [pagination.page, searchTerm, specialtyFilter]);

  const handleSave = async (data) => {
    setSaving(true);
    try {
      if (editingCraftsman) {
        await craftsmenApi.update(editingCraftsman._id, data);
      } else {
        await craftsmenApi.create(data);
      }
      setShowForm(false);
      setEditingCraftsman(null);
      fetchCraftsmen();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (craftsman) => {
    if (!window.confirm(`Delete "${craftsman.name}"? This cannot be undone.`)) return;
    
    try {
      await craftsmenApi.delete(craftsman._id);
      fetchCraftsmen();
    } catch (err) {
      alert('Error deleting: ' + err.message);
    }
  };

  const handleEdit = (craftsman) => {
    setEditingCraftsman(craftsman);
    setShowForm(true);
  };

  const handleAdd = () => {
    setEditingCraftsman(null);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingCraftsman(null);
  };

  // Helper to get specialty display
  const getSpecialtyDisplay = (specialty) => {
    if (Array.isArray(specialty)) {
      return specialty.join(', ');
    }
    return specialty || '-';
  };

  if (showForm) {
    return (
      <CraftsmanForm
        craftsman={editingCraftsman}
        onSave={handleSave}
        onCancel={handleCancel}
        loading={saving}
      />
    );
  }

  return (
    <div className="admin-list">
      <div className="list-header">
        <h2>👨‍🎨 Craftsmen</h2>
        <button onClick={handleAdd} className="btn-primary">
          + Add Craftsman
        </button>
      </div>

      <div className="list-filters">
        <input
          type="text"
          placeholder="Search craftsmen..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <select 
          value={specialtyFilter} 
          onChange={(e) => setSpecialtyFilter(e.target.value)}
          className="filter-select"
        >
          <option value="">All Specialties</option>
          {specialties.map(spec => (
            <option key={spec} value={spec.toLowerCase()}>{spec}</option>
          ))}
        </select>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading">Loading craftsmen...</div>
      ) : (
        <>
          <div className="table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Photo</th>
                  <th>Name</th>
                  <th>Specialty</th>
                  <th>Experience</th>
                  <th>Rating</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {craftsmen.map(craftsman => (
                  <tr key={craftsman._id}>
                    <td>
                      {(craftsman.imageUrl || craftsman.photo) ? (
                        <img 
                          src={craftsman.imageUrl || craftsman.photo} 
                          alt={craftsman.name}
                          className="table-thumbnail round"
                        />
                      ) : (
                        <div className="no-image round">👤</div>
                      )}
                    </td>
                    <td>
                      <strong>{craftsman.name}</strong>
                      <br />
                      <small>{craftsman.title || craftsman.location || '-'}</small>
                    </td>
                    <td>
                      <span className="specialty-badge">
                        {getSpecialtyDisplay(craftsman.specialty)}
                      </span>
                    </td>
                    <td>
                      {craftsman.experience || '-'}
                    </td>
                    <td>
                      {craftsman.rating ? (
                        <span className="rating">⭐ {Number(craftsman.rating).toFixed(1)}</span>
                      ) : '-'}
                    </td>
                    <td>
                      <span className={`status-badge ${(craftsman.isAvailable || craftsman.available) ? 'available' : 'unavailable'}`}>
                        {(craftsman.isAvailable || craftsman.available) ? 'Available' : 'Unavailable'}
                      </span>
                    </td>
                    <td className="actions">
                      <button onClick={() => handleEdit(craftsman)} className="btn-icon" title="Edit">
                        ✏️
                      </button>
                      <button onClick={() => handleDelete(craftsman)} className="btn-icon delete" title="Delete">
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {craftsmen.length === 0 && (
            <div className="empty-state">
              <p>No craftsmen found. Add your first craftsman!</p>
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

export default CraftsmanList;
