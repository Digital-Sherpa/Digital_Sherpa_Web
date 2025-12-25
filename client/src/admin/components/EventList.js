import React, { useState, useEffect } from 'react';
import { eventsApi } from '../services/adminApi';
import EventForm from './EventForm';

const EventList = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const categories = [
    'festival', 'cultural', 'religious', 'music', 'art', 'food', 'sports', 'market', 'other'
  ];

  const categoryIcons = {
    festival: '🎉',
    cultural: '🎭',
    religious: '🛕',
    music: '🎵',
    art: '🎨',
    food: '🍜',
    sports: '⚽',
    market: '🛒',
    other: '📅',
  };

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };
      if (searchTerm) params.search = searchTerm;
      if (categoryFilter) params.category = categoryFilter;

      const data = await eventsApi.getAll(params);
      setEvents(data.events || []);
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
    fetchEvents();
  }, [pagination.page, searchTerm, categoryFilter]);

  const handleSave = async (data) => {
    setSaving(true);
    try {
      if (editingEvent) {
        await eventsApi.update(editingEvent._id, data);
      } else {
        await eventsApi.create(data);
      }
      setShowForm(false);
      setEditingEvent(null);
      fetchEvents();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (event) => {
    if (!window.confirm(`Delete "${event.name}"? This cannot be undone.`)) return;
    try {
      await eventsApi.delete(event._id);
      fetchEvents();
    } catch (err) {
      alert('Error deleting: ' + err.message);
    }
  };

  const handleEdit = (event) => {
    setEditingEvent(event);
    setShowForm(true);
  };

  const handleAdd = () => {
    setEditingEvent(null);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingEvent(null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getEventStatus = (event) => {
    const now = new Date();
    const start = new Date(event.startDate);
    const end = event.endDate ? new Date(event.endDate) : start;

    if (now < start) return { label: 'Upcoming', class: 'upcoming' };
    if (now >= start && now <= end) return { label: 'Ongoing', class: 'ongoing' };
    return { label: 'Past', class: 'past' };
  };

  if (showForm) {
    return (
      <EventForm
        event={editingEvent}
        onSave={handleSave}
        onCancel={handleCancel}
        loading={saving}
      />
    );
  }

  return (
    <div className="admin-list">
      <div className="list-header">
        <h2>🎉 Events & Festivals</h2>
        <button onClick={handleAdd} className="btn-primary">
          + Create Event
        </button>
      </div>

      <div className="list-filters">
        <input
          type="text"
          placeholder="Search events..."
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
            <option key={cat} value={cat}>{categoryIcons[cat]} {cat}</option>
          ))}
        </select>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading">Loading events...</div>
      ) : (
        <>
          <div className="table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th></th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Date</th>
                  <th>Locations</th>
                  <th>Status</th>
                  <th>Featured</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.map(event => {
                  const status = getEventStatus(event);
                  return (
                    <tr key={event._id}>
                      <td>
                        <span className="event-icon" style={{ 
                          background: event.color || '#FF6B35',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '40px',
                          height: '40px',
                          borderRadius: '8px',
                          fontSize: '1.25rem'
                        }}>
                          {event.icon || '🎉'}
                        </span>
                      </td>
                      <td>
                        <strong>{event.name}</strong>
                        <br />
                        <small className="slug">{event.slug}</small>
                      </td>
                      <td>
                        <span className="category-badge">
                          {categoryIcons[event.category]} {event.category}
                        </span>
                      </td>
                      <td>
                        <div className="date-info">
                          <span>{formatDate(event.startDate)}</span>
                          {event.endDate && event.endDate !== event.startDate && (
                            <span className="date-to"> → {formatDate(event.endDate)}</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className="locations-count">
                          📍 {event.locations?.length || 0} location(s)
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge ${status.class}`}>
                          {status.label}
                        </span>
                      </td>
                      <td>
                        {event.isFeatured ? (
                          <span className="badge featured">⭐ Featured</span>
                        ) : (
                          <span className="badge">-</span>
                        )}
                      </td>
                      <td className="actions">
                        <button onClick={() => handleEdit(event)} className="btn-icon" title="Edit">
                          ✏️
                        </button>
                        <button onClick={() => handleDelete(event)} className="btn-icon delete" title="Delete">
                          🗑️
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {events.length === 0 && (
            <div className="empty-state">
              <p>No events found. Create your first event!</p>
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

export default EventList;