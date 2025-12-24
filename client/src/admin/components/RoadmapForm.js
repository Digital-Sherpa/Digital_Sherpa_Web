import React, { useState, useEffect } from 'react';
import { placesApi } from '../services/adminApi';

const RoadmapForm = ({ roadmap, onSave, onCancel, loading }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'cultural',
    difficulty: 'easy',
    duration: '',
    distance: '',
    color: '#333333',
    icon: '🗺️',
    stops: [],
    isActive: true,
  });

  const [availablePlaces, setAvailablePlaces] = useState([]);
  const [loadingPlaces, setLoadingPlaces] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState('');
  const [stopDuration, setStopDuration] = useState('');
  const [stopNote, setStopNote] = useState('');
  const [isWorkshop, setIsWorkshop] = useState(false);

  const difficulties = ['easy', 'moderate', 'challenging'];
  const icons = ['🗺️', '🪵', '🏺', '🏛️', '🎨', '🍽️', '⛩️', '🚶', '🎭', '🏔️', '🌿', '🎪'];

  // Category management
  const [categories, setCategories] = useState([
    'cultural', 'craft', 'spiritual', 'food', 'adventure', 'woodcarving', 'pottery', 'heritage'
  ]);
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState('');

  // Load saved categories from localStorage on mount
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

  // Save categories to localStorage when they change
  useEffect(() => {
    localStorage.setItem('roadmapCategories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    fetchPlaces();
  }, []);

  useEffect(() => {
    if (roadmap) {
      // If roadmap has a category not in our list, add it
      if (roadmap.category && !categories.includes(roadmap.category)) {
        setCategories(prev => [...prev, roadmap.category]);
      }

      const formattedStops = (roadmap.stops || []).map((stop, index) => {
        if (typeof stop === 'string') {
          return {
            order: index + 1,
            placeSlug: stop,
            duration: '',
            note: '',
            isWorkshop: false,
          };
        }
        return {
          order: stop.order || index + 1,
          placeSlug: stop.placeSlug || stop,
          duration: stop.duration || '',
          note: stop.note || '',
          isWorkshop: stop.isWorkshop || false,
        };
      });

      setFormData({
        name: roadmap.name || '',
        description: roadmap.description || '',
        category: roadmap.category || 'cultural',
        difficulty: roadmap.difficulty || 'easy',
        duration: roadmap.duration || '',
        distance: roadmap.distance || '',
        color: roadmap.color || '#333333',
        icon: roadmap.icon || '🗺️',
        stops: formattedStops,
        isActive: roadmap.isActive !== false,
      });
    }
  }, [roadmap]);

  const fetchPlaces = async () => {
    setLoadingPlaces(true);
    try {
      const data = await placesApi.getAll({ limit: 100 });
      setAvailablePlaces(data.places || []);
    } catch (err) {
      console.error('Error fetching places:', err);
    } finally {
      setLoadingPlaces(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // Handle category change
  const handleCategoryChange = (e) => {
    const value = e.target.value;
    
    if (value === '__add_new__') {
      setShowNewCategoryInput(true);
    } else {
      setFormData(prev => ({ ...prev, category: value }));
    }
  };

  // Add new category
  const handleAddCategory = () => {
    const trimmed = newCategoryInput.trim().toLowerCase();
    if (trimmed && !categories.includes(trimmed)) {
      setCategories(prev => [...prev, trimmed]);
      setFormData(prev => ({ ...prev, category: trimmed }));
    }
    setNewCategoryInput('');
    setShowNewCategoryInput(false);
  };

  // Delete category
  const handleDeleteCategory = (categoryToDelete) => {
    if (categories.length <= 1) {
      alert('Cannot delete the last category');
      return;
    }
    
    if (!window.confirm(`Delete category "${categoryToDelete}"?`)) {
      return;
    }
    
    setCategories(prev => prev.filter(c => c !== categoryToDelete));
    
    if (formData.category === categoryToDelete) {
      const remaining = categories.filter(c => c !== categoryToDelete);
      setFormData(prev => ({ ...prev, category: remaining[0] || 'cultural' }));
    }
  };

  const handleAddStop = () => {
    if (!selectedPlace) return;

    if (formData.stops.some(s => s.placeSlug === selectedPlace)) {
      alert('This place is already in the roadmap');
      return;
    }

    const newStop = {
      order: formData.stops.length + 1,
      placeSlug: selectedPlace,
      duration: stopDuration || '30 min',
      note: stopNote || '',
      isWorkshop: isWorkshop,
    };

    setFormData(prev => ({
      ...prev,
      stops: [...prev.stops, newStop],
    }));

    setSelectedPlace('');
    setStopDuration('');
    setStopNote('');
    setIsWorkshop(false);
  };

  const removeStop = (placeSlug) => {
    setFormData(prev => ({
      ...prev,
      stops: prev.stops
        .filter(s => s.placeSlug !== placeSlug)
        .map((s, index) => ({ ...s, order: index + 1 })),
    }));
  };

  const moveStop = (index, direction) => {
    const newStops = [...formData.stops];
    const newIndex = index + direction;

    if (newIndex < 0 || newIndex >= newStops.length) return;

    [newStops[index], newStops[newIndex]] = [newStops[newIndex], newStops[index]];

    const reorderedStops = newStops.map((s, idx) => ({ ...s, order: idx + 1 }));

    setFormData(prev => ({ ...prev, stops: reorderedStops }));
  };

  const getPlaceBySlug = (slug) => {
    return availablePlaces.find(p => p.slug === slug);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (formData.stops.length < 2) {
      alert('A roadmap needs at least 2 stops');
      return;
    }

    const submitData = {
      name: formData.name,
      description: formData.description,
      category: formData.category,
      difficulty: formData.difficulty,
      duration: formData.duration,
      distance: formData.distance,
      color: formData.color,
      icon: formData.icon,
      stops: formData.stops.map((stop, index) => ({
        order: index + 1,
        placeSlug: stop.placeSlug,
        duration: stop.duration,
        note: stop.note,
        isWorkshop: stop.isWorkshop,
      })),
      sponsoredStops: [],
      tags: [],
      isActive: formData.isActive,
    };

    onSave(submitData);
  };

  return (
    <form onSubmit={handleSubmit} className="admin-form">
      <h2>{roadmap ? 'Edit Roadmap' : 'Create New Roadmap'}</h2>

      <div className="form-grid">
        <div className="form-group">
          <label>Name *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="e.g., Pottery Trail"
          />
        </div>

        {/* Category with Add New Option */}
        <div className="form-group">
          <label>Category *</label>
          {showNewCategoryInput ? (
            <div className="inline-add-input">
              <input
                type="text"
                value={newCategoryInput}
                onChange={(e) => setNewCategoryInput(e.target.value)}
                placeholder="New category name"
                autoFocus
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCategory();
                  }
                }}
              />
              <button type="button" onClick={handleAddCategory} className="btn-inline-add">
                ✓
              </button>
              <button 
                type="button" 
                onClick={() => { setShowNewCategoryInput(false); setNewCategoryInput(''); }} 
                className="btn-inline-cancel"
              >
                ✗
              </button>
            </div>
          ) : (
            <select 
              name="category" 
              value={formData.category} 
              onChange={handleCategoryChange} 
              required
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
              <option value="__add_new__">➕ Add New Category...</option>
            </select>
          )}
          
          {/* Show existing categories as chips for management */}
          <div className="category-chips-manage">
            {categories.map(cat => (
              <span key={cat} className={`category-chip-small ${formData.category === cat ? 'active' : ''}`}>
                {cat}
                {categories.length > 1 && (
                  <button 
                    type="button" 
                    onClick={() => handleDeleteCategory(cat)}
                    title="Delete category"
                  >
                    ×
                  </button>
                )}
              </span>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>Difficulty *</label>
          <select name="difficulty" value={formData.difficulty} onChange={handleChange} required>
            {difficulties.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Duration</label>
          <input
            type="text"
            name="duration"
            value={formData.duration}
            onChange={handleChange}
            placeholder="e.g., 2-3 hours"
          />
        </div>

        <div className="form-group">
          <label>Distance</label>
          <input
            type="text"
            name="distance"
            value={formData.distance}
            onChange={handleChange}
            placeholder="e.g., 1.5 km"
          />
        </div>

        <div className="form-group">
          <label>Color</label>
          <input
            type="color"
            name="color"
            value={formData.color}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>Icon</label>
          <select name="icon" value={formData.icon} onChange={handleChange}>
            {icons.map(icon => (
              <option key={icon} value={icon}>{icon}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-group full-width">
        <label>Description *</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          required
          rows={3}
          placeholder="Describe this roadmap experience..."
        />
      </div>

      <div className="form-group checkbox-group">
        <label>
          <input
            type="checkbox"
            name="isActive"
            checked={formData.isActive}
            onChange={handleChange}
          />
          Active (visible to users)
        </label>
      </div>

      {/* Stops Section */}
      <div className="form-section stops-section">
        <h3>Roadmap Stops ({formData.stops.length})</h3>
        <p className="helper-text">Add places in the order they should be visited. Minimum 2 stops required.</p>

        <div className="add-stop-form">
          <div className="form-grid">
            <div className="form-group">
              <label>Select Place</label>
              <select
                value={selectedPlace}
                onChange={(e) => setSelectedPlace(e.target.value)}
                disabled={loadingPlaces}
              >
                <option value="">Select a place to add...</option>
                {availablePlaces
                  .filter(p => !formData.stops.some(s => s.placeSlug === p.slug))
                  .map(place => (
                    <option key={place.slug} value={place.slug}>
                      {place.name} ({place.category})
                    </option>
                  ))}
              </select>
            </div>

            <div className="form-group">
              <label>Duration at Stop</label>
              <input
                type="text"
                value={stopDuration}
                onChange={(e) => setStopDuration(e.target.value)}
                placeholder="e.g., 30 min"
              />
            </div>

            <div className="form-group">
              <label>Note</label>
              <input
                type="text"
                value={stopNote}
                onChange={(e) => setStopNote(e.target.value)}
                placeholder="e.g., Main attraction"
              />
            </div>
          </div>

          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={isWorkshop}
                onChange={(e) => setIsWorkshop(e.target.checked)}
              />
              This is a workshop stop
            </label>
          </div>

          <button
            type="button"
            onClick={handleAddStop}
            className="btn-secondary"
            disabled={!selectedPlace}
          >
            + Add Stop
          </button>
        </div>

        <div className="stops-list">
          {formData.stops.length === 0 ? (
            <div className="empty-state">No stops added yet</div>
          ) : (
            formData.stops.map((stop, index) => {
              const place = getPlaceBySlug(stop.placeSlug);
              return (
                <div key={stop.placeSlug} className="stop-row">
                  <span className="stop-order">{stop.order}</span>
                  <div className="stop-info">
                    <strong>{place?.name || stop.placeSlug}</strong>
                    <small>
                      {stop.duration && `${stop.duration}`}
                      {stop.note && ` • ${stop.note}`}
                      {stop.isWorkshop && ' • 🎨 Workshop'}
                    </small>
                  </div>
                  <div className="stop-actions">
                    <button
                      type="button"
                      onClick={() => moveStop(index, -1)}
                      disabled={index === 0}
                      className="btn-icon"
                      title="Move up"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => moveStop(index, 1)}
                      disabled={index === formData.stops.length - 1}
                      className="btn-icon"
                      title="Move down"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => removeStop(stop.placeSlug)}
                      className="btn-icon delete"
                      title="Remove"
                    >
                      ×
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="form-actions">
        <button type="button" onClick={onCancel} className="btn-secondary" disabled={loading}>
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={loading || formData.stops.length < 2}>
          {loading ? 'Saving...' : (roadmap ? 'Update Roadmap' : 'Create Roadmap')}
        </button>
      </div>
    </form>
  );
};

export default RoadmapForm;
