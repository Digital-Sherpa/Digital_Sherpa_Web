import React, { useState, useEffect } from 'react';
import { roadmapsApi } from '../services/adminApi';
import RoadmapForm from './RoadmapForm';

const RoadmapList = () => {
  const [roadmaps, setRoadmaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingRoadmap, setEditingRoadmap] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Load categories from localStorage (same as RoadmapForm)
  const [categories, setCategories] = useState([
    'cultural', 'craft', 'spiritual', 'food', 'adventure', 'woodcarving', 'pottery', 'heritage'
  ]);

  useEffect(() => {
    const savedCategories = localStorage.getItem('roadmapCategories');
    if (savedCategories) {
      try {
        const parsed = JSON.parse(savedCategories);
        setCategories(parsed);
      } catch (e) {
        console.error('Error parsing saved roadmap categories:', e);
      }
    }
  }, []);

  // Also refresh categories when form closes (in case new ones were added)
  useEffect(() => {
    if (!showForm) {
      const savedCategories = localStorage.getItem('roadmapCategories');
      if (savedCategories) {
        try {
          const parsed = JSON.parse(savedCategories);
          setCategories(parsed);
        } catch (e) {
          console.error('Error parsing saved roadmap categories:', e);
        }
      }
    }
  }, [showForm]);

  const fetchRoadmaps = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };
      if (searchTerm) params.search = searchTerm;
      if (categoryFilter) params.category = categoryFilter;

      const data = await roadmapsApi.getAll(params);
      setRoadmaps(data.roadmaps || []);
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
    fetchRoadmaps();
  }, [pagination.page, searchTerm, categoryFilter]);

  const handleSave = async (data) => {
    setSaving(true);
    try {
      if (editingRoadmap) {
        await roadmapsApi.update(editingRoadmap._id, data);
      } else {
        await roadmapsApi.create(data);
      }
      setShowForm(false);
      setEditingRoadmap(null);
      fetchRoadmaps();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (roadmap) => {
    if (!window.confirm(`Delete "${roadmap.name}"? This cannot be undone.`)) return;
    
    try {
      await roadmapsApi.delete(roadmap._id);
      fetchRoadmaps();
    } catch (err) {
      alert('Error deleting: ' + err.message);
    }
  };

  const handleEdit = (roadmap) => {
    setEditingRoadmap(roadmap);
    setShowForm(true);
  };

  const handleAdd = () => {
    setEditingRoadmap(null);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingRoadmap(null);
  };

  if (showForm) {
    return (
      <RoadmapForm
        roadmap={editingRoadmap}
        onSave={handleSave}
        onCancel={handleCancel}
        loading={saving}
      />
    );
  }

  return (
    <div className="admin-list">
      <div className="list-header">
        <h2>🗺️ Roadmaps</h2>
        <button onClick={handleAdd} className="btn-primary">
          + Create Roadmap
        </button>
      </div>

      <div className="list-filters">
        <input
          type="text"
          placeholder="Search roadmaps..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <select 
          value={categoryFilter} 
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="filter-select"
        >
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading">Loading roadmaps...</div>
      ) : (
        <>
          <div className="table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th></th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Difficulty</th>
                  <th>Duration</th>
                  <th>Stops</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {roadmaps.map(roadmap => (
                  <tr key={roadmap._id} className={roadmap._validation?.hasIssues ? 'has-warning' : ''}>
                    <td>
                      <span className="roadmap-icon" style={{ 
                        background: roadmap.color || '#333',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '40px',
                        height: '40px',
                        borderRadius: '8px',
                        fontSize: '1.25rem'
                      }}>
                        {roadmap.icon || '🗺️'}
                      </span>
                    </td>
                    <td>
                      <strong>{roadmap.name}</strong>
                      <br />
                      <small className="slug">{roadmap.slug}</small>
                    </td>
                    <td>
                      <span className="category-badge">{roadmap.category}</span>
                    </td>
                    <td>
                      <span className={`difficulty-badge ${roadmap.difficulty}`}>
                        {roadmap.difficulty}
                      </span>
                    </td>
                    <td>{roadmap.duration || '-'}</td>
                    <td>
                      <div className="stops-info">
                        {roadmap._validation?.hasIssues ? (
                          <>
                            <span className="stops-count warning">
                              ⚠️ {roadmap._validation.validStops}/{roadmap._validation.totalStops} valid
                            </span>
                            <div className="stops-warning">
                              Missing: {roadmap._validation.invalidStops.join(', ')}
                            </div>
                            {!roadmap._validation.isNavigable && (
                              <span className="error-badge">Not Navigable!</span>
                            )}
                          </>
                        ) : (
                          <>
                            <span className="stops-count">{roadmap.stops?.length || 0} stops</span>
                            {roadmap.stops && roadmap.stops.length > 0 && (
                              <div className="stops-preview">
                                {roadmap.stops.slice(0, 3).map((stop, idx) => (
                                  <span key={idx} className="stop-badge">
                                    {stop.order}. {stop.placeSlug}
                                  </span>
                                ))}
                                {roadmap.stops.length > 3 && (
                                  <span className="more-stops">+{roadmap.stops.length - 3} more</span>
                                )}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${roadmap.isActive ? 'active' : 'inactive'}`}>
                        {roadmap.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="actions">
                      <button onClick={() => handleEdit(roadmap)} className="btn-icon" title="Edit">
                        ✏️
                      </button>
                      <button onClick={() => handleDelete(roadmap)} className="btn-icon delete" title="Delete">
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {roadmaps.length === 0 && (
            <div className="empty-state">
              <p>No roadmaps found. Create your first roadmap!</p>
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

export default RoadmapList;
