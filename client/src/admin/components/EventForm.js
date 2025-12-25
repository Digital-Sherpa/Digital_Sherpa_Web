import React, { useState, useEffect } from 'react';
import { uploadApi, placesApi } from '../services/adminApi';

const EventForm = ({ event, onSave, onCancel, loading }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'festival',
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    isAllDay: false,
    isRecurring: false,
    recurringPattern: '',
    locations: [],
    imageUrl: '',
    gallery: [],
    videoUrl: '',
    entryFee: {
      isFree: true,
      price: 0,
      note: '',
    },
    organizer: '',
    contactInfo: '',
    website: '',
    color: '#FF6B35',
    icon: '🎉',
    tags: [],
    isFeatured: false,
    isActive: true,
  });

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [availablePlaces, setAvailablePlaces] = useState([]);
  const [loadingPlaces, setLoadingPlaces] = useState(false);
  
  // New location form state
  const [newLocation, setNewLocation] = useState({
    name: '',
    slug: '',
    coordinates: { lat: '', lng: '' },
    address: '',
    note: '',
  });

  const categories = [
    'festival', 'cultural', 'religious', 'music', 'art', 'food', 'sports', 'market', 'other'
  ];

  const icons = ['🎉', '🎭', '🛕', '🎵', '🎨', '🍜', '⚽', '🛒', '📅', '🪔', '🏮', '🎊', '🎪', '�ثقافي'];

  const colors = [
    '#FF6B35', '#E63946', '#2A9D8F', '#E9C46A', '#F4A261',
    '#264653', '#8338EC', '#3A86FF', '#FF006E', '#FB5607'
  ];

  useEffect(() => {
    fetchPlaces();
  }, []);

  useEffect(() => {
    if (event) {
      setFormData({
        name: event.name || '',
        description: event.description || '',
        category: event.category || 'festival',
        startDate: event.startDate ? event.startDate.split('T')[0] : '',
        endDate: event.endDate ? event.endDate.split('T')[0] : '',
        startTime: event.startTime || '',
        endTime: event.endTime || '',
        isAllDay: event.isAllDay || false,
        isRecurring: event.isRecurring || false,
        recurringPattern: event.recurringPattern || '',
        locations: event.locations || [],
        imageUrl: event.imageUrl || '',
        gallery: event.gallery || [],
        videoUrl: event.videoUrl || '',
        entryFee: event.entryFee || { isFree: true, price: 0, note: '' },
        organizer: event.organizer || '',
        contactInfo: event.contactInfo || '',
        website: event.website || '',
        color: event.color || '#FF6B35',
        icon: event.icon || '🎉',
        tags: event.tags || [],
        isFeatured: event.isFeatured || false,
        isActive: event.isActive !== false,
      });
    }
  }, [event]);

  const fetchPlaces = async () => {
    setLoadingPlaces(true);
    try {
      const data = await placesApi.getAll({ limit: 200 });
      setAvailablePlaces(data.places || []);
    } catch (err) {
      console.error('Error fetching places:', err);
    } finally {
      setLoadingPlaces(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('entryFee.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        entryFee: {
          ...prev.entryFee,
          [field]: field === 'isFree' ? checked : (field === 'price' ? parseFloat(value) || 0 : value),
        },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }));
    }
  };

  const handleNewLocationChange = (e) => {
    const { name, value } = e.target;
    if (name === 'lat' || name === 'lng') {
      setNewLocation(prev => ({
        ...prev,
        coordinates: { ...prev.coordinates, [name]: value },
      }));
    } else {
      setNewLocation(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSelectPlace = (e) => {
    const placeSlug = e.target.value;
    if (!placeSlug) return;
    
    const place = availablePlaces.find(p => p.slug === placeSlug);
    if (place) {
      setNewLocation({
        name: place.name,
        slug: place.slug,
        coordinates: { lat: place.coordinates.lat, lng: place.coordinates.lng },
        address: place.address || '',
        note: '',
      });
    }
  };

  const handleAddLocation = () => {
    if (!newLocation.name || !newLocation.coordinates.lat || !newLocation.coordinates.lng) {
      alert('Please provide location name and coordinates');
      return;
    }

    const locationToAdd = {
      name: newLocation.name,
      slug: newLocation.slug || '',
      coordinates: {
        lat: parseFloat(newLocation.coordinates.lat),
        lng: parseFloat(newLocation.coordinates.lng),
      },
      address: newLocation.address,
      note: newLocation.note,
    };

    setFormData(prev => ({
      ...prev,
      locations: [...prev.locations, locationToAdd],
    }));

    setNewLocation({
      name: '',
      slug: '',
      coordinates: { lat: '', lng: '' },
      address: '',
      note: '',
    });
  };

  const handleRemoveLocation = (index) => {
    setFormData(prev => ({
      ...prev,
      locations: prev.locations.filter((_, i) => i !== index),
    }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setUploadProgress('Uploading image...');
    try {
      const result = await uploadApi.uploadSingle(file, 'events');
      setFormData(prev => ({ ...prev, imageUrl: result.url }));
      setUploadProgress('✓ Image uploaded!');
    } catch (err) {
      setUploadProgress('✗ Upload failed: ' + err.message);
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(''), 3000);
    }
  };

  const handleGalleryUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    setUploadProgress(`Uploading ${files.length} images...`);
    try {
      const result = await uploadApi.uploadMultiple(files, 'events');
      const newUrls = result.files.map(f => f.url);
      setFormData(prev => ({
        ...prev,
        gallery: [...prev.gallery, ...newUrls],
      }));
      setUploadProgress('✓ Gallery images uploaded!');
    } catch (err) {
      setUploadProgress('✗ Upload failed: ' + err.message);
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(''), 3000);
    }
  };

  const removeGalleryImage = (index) => {
    setFormData(prev => ({
      ...prev,
      gallery: prev.gallery.filter((_, i) => i !== index),
    }));
  };

  const handleAddTag = () => {
    const trimmed = tagInput.trim().toLowerCase();
    if (trimmed && !formData.tags.includes(trimmed)) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, trimmed] }));
    }
    setTagInput('');
  };

  const handleRemoveTag = (tag) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.name || !formData.startDate) {
      alert('Please provide event name and start date');
      return;
    }

    if (formData.locations.length === 0) {
      alert('Please add at least one location for the event');
      return;
    }

    const submitData = {
      ...formData,
      startDate: formData.startDate ? new Date(formData.startDate).toISOString() : undefined,
      endDate: formData.endDate ? new Date(formData.endDate).toISOString() : undefined,
    };

    onSave(submitData);
  };

  return (
    <form onSubmit={handleSubmit} className="admin-form">
      <div className="form-header">
        <h2>{event ? '✏️ Edit Event' : '🎉 Create New Event'}</h2>
        <button type="button" onClick={onCancel} className="btn-close">✕</button>
      </div>

      {/* Basic Info */}
      <div className="form-section">
        <h3>Basic Information</h3>
        
        <div className="form-grid">
          <div className="form-group">
            <label>Event Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="e.g., Sonam Lhosar"
            />
          </div>

          <div className="form-group">
            <label>Category *</label>
            <select name="category" value={formData.category} onChange={handleChange} required>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            placeholder="Describe the event, its significance, and what visitors can expect..."
          />
        </div>
      </div>

      {/* Date & Time */}
      <div className="form-section">
        <h3>📅 Date & Time</h3>
        
        <div className="form-grid">
          <div className="form-group">
            <label>Start Date *</label>
            <input
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>End Date</label>
            <input
              type="date"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
              min={formData.startDate}
            />
          </div>
        </div>

        <div className="form-group checkbox-group">
          <label>
            <input
              type="checkbox"
              name="isAllDay"
              checked={formData.isAllDay}
              onChange={handleChange}
            />
            All Day Event
          </label>
        </div>

        {!formData.isAllDay && (
          <div className="form-grid">
            <div className="form-group">
              <label>Start Time</label>
              <input
                type="time"
                name="startTime"
                value={formData.startTime}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>End Time</label>
              <input
                type="time"
                name="endTime"
                value={formData.endTime}
                onChange={handleChange}
              />
            </div>
          </div>
        )}

        <div className="form-group checkbox-group">
          <label>
            <input
              type="checkbox"
              name="isRecurring"
              checked={formData.isRecurring}
              onChange={handleChange}
            />
            🔄 Recurring Event (happens every year)
          </label>
        </div>

        {formData.isRecurring && (
          <div className="form-group">
            <label>Recurring Pattern</label>
            <select name="recurringPattern" value={formData.recurringPattern} onChange={handleChange}>
              <option value="">Select pattern</option>
              <option value="yearly">Yearly</option>
              <option value="monthly">Monthly</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>
        )}
      </div>

      {/* Locations */}
      <div className="form-section">
        <h3>📍 Event Locations ({formData.locations.length})</h3>
        <p className="helper-text">Add all locations where this event/festival will be celebrated.</p>

        {/* Existing Locations */}
        {formData.locations.length > 0 && (
          <div className="locations-list">
            {formData.locations.map((loc, index) => (
              <div key={index} className="location-item">
                <div className="location-info">
                  <strong>{loc.name}</strong>
                  {loc.slug && <span className="place-link"> (linked: {loc.slug})</span>}
                  <br />
                  <small>
                    📍 {loc.coordinates.lat.toFixed(4)}, {loc.coordinates.lng.toFixed(4)}
                    {loc.address && ` • ${loc.address}`}
                  </small>
                  {loc.note && <p className="location-note">📝 {loc.note}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveLocation(index)}
                  className="btn-icon delete"
                  title="Remove location"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add New Location */}
        <div className="add-location-form">
          <h4>➕ Add Location</h4>
          
          <div className="form-group">
            <label>Select from existing places</label>
            <select onChange={handleSelectPlace} disabled={loadingPlaces} defaultValue="">
              <option value="">-- Or enter custom location below --</option>
              {availablePlaces.map(place => (
                <option key={place.slug} value={place.slug}>
                  {place.name} ({place.category})
                </option>
              ))}
            </select>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>Location Name *</label>
              <input
                type="text"
                name="name"
                value={newLocation.name}
                onChange={handleNewLocationChange}
                placeholder="e.g., Tundikhel"
              />
            </div>
            <div className="form-group">
              <label>Address</label>
              <input
                type="text"
                name="address"
                value={newLocation.address}
                onChange={handleNewLocationChange}
                placeholder="e.g., Kathmandu"
              />
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>Latitude *</label>
              <input
                type="number"
                step="any"
                name="lat"
                value={newLocation.coordinates.lat}
                onChange={handleNewLocationChange}
                placeholder="e.g., 27.7041"
              />
            </div>
            <div className="form-group">
              <label>Longitude *</label>
              <input
                type="number"
                step="any"
                name="lng"
                value={newLocation.coordinates.lng}
                onChange={handleNewLocationChange}
                placeholder="e.g., 85.3145"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Note (what happens at this location)</label>
            <input
              type="text"
              name="note"
              value={newLocation.note}
              onChange={handleNewLocationChange}
              placeholder="e.g., Main celebration venue, cultural programs"
            />
          </div>

          <button type="button" onClick={handleAddLocation} className="btn-secondary">
            + Add This Location
          </button>
        </div>
      </div>

      {/* Entry Fee */}
      <div className="form-section">
        <h3>💰 Entry Information</h3>
        
        <div className="form-group checkbox-group">
          <label>
            <input
              type="checkbox"
              name="entryFee.isFree"
              checked={formData.entryFee.isFree}
              onChange={handleChange}
            />
            Free Entry
          </label>
        </div>

        {!formData.entryFee.isFree && (
          <div className="form-grid">
            <div className="form-group">
              <label>Entry Price (Rs.)</label>
              <input
                type="number"
                name="entryFee.price"
                value={formData.entryFee.price}
                onChange={handleChange}
                min="0"
              />
            </div>
            <div className="form-group">
              <label>Fee Note</label>
              <input
                type="text"
                name="entryFee.note"
                value={formData.entryFee.note}
                onChange={handleChange}
                placeholder="e.g., VIP seats extra"
              />
            </div>
          </div>
        )}
      </div>

      {/* Organizer Info */}
      <div className="form-section">
        <h3>👤 Organizer Information</h3>
        
        <div className="form-grid">
          <div className="form-group">
            <label>Organizer</label>
            <input
              type="text"
              name="organizer"
              value={formData.organizer}
              onChange={handleChange}
              placeholder="e.g., Nepal Tourism Board"
            />
          </div>
          <div className="form-group">
            <label>Contact Info</label>
            <input
              type="text"
              name="contactInfo"
              value={formData.contactInfo}
              onChange={handleChange}
              placeholder="e.g., +977-1-1234567"
            />
          </div>
        </div>

        <div className="form-group">
          <label>Website</label>
          <input
            type="url"
            name="website"
            value={formData.website}
            onChange={handleChange}
            placeholder="https://..."
          />
        </div>
      </div>

      {/* Appearance */}
      <div className="form-section">
        <h3>🎨 Appearance</h3>
        
        <div className="form-group">
          <label>Icon</label>
          <div className="icon-selector">
            {icons.map(ic => (
              <button
                key={ic}
                type="button"
                className={`icon-btn ${formData.icon === ic ? 'selected' : ''}`}
                onClick={() => setFormData(prev => ({ ...prev, icon: ic }))}
              >
                {ic}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>Color Theme</label>
          <div className="color-selector">
            {colors.map(c => (
              <button
                key={c}
                type="button"
                className={`color-btn ${formData.color === c ? 'selected' : ''}`}
                style={{ backgroundColor: c }}
                onClick={() => setFormData(prev => ({ ...prev, color: c }))}
                title={c}
              />
            ))}
            <input
              type="color"
              value={formData.color}
              onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
              title="Custom color"
              className="color-input"
            />
          </div>
        </div>
      </div>

      {/* Media */}
      <div className="form-section">
        <h3>🖼️ Media</h3>

        <div className="form-group">
          <label>Main Image</label>
          <div className="upload-zone">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={uploading}
              id="event-image-upload"
            />
            <label htmlFor="event-image-upload" className="upload-label">
              📷 Click to upload main image
            </label>
          </div>
          
          {formData.imageUrl && (
            <div className="image-preview">
              <img src={formData.imageUrl} alt="Event" />
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, imageUrl: '' }))}
                className="remove-btn"
              >
                Remove
              </button>
            </div>
          )}
        </div>

        <div className="form-group">
          <label>Gallery Images</label>
          <div className="upload-zone">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleGalleryUpload}
              disabled={uploading}
              id="event-gallery-upload"
            />
            <label htmlFor="event-gallery-upload" className="upload-label">
              📷 Click to upload gallery images
            </label>
          </div>
          
          {formData.gallery.length > 0 && (
            <div className="gallery-preview">
              {formData.gallery.map((url, index) => (
                <div key={index} className="gallery-item">
                  <img src={url} alt={`Gallery ${index + 1}`} />
                  <button
                    type="button"
                    onClick={() => removeGalleryImage(index)}
                    className="remove-btn"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="form-group">
          <label>Video URL (YouTube or direct link)</label>
          <input
            type="url"
            name="videoUrl"
            value={formData.videoUrl}
            onChange={handleChange}
            placeholder="https://youtube.com/watch?v=..."
          />
        </div>

        {uploadProgress && <p className="upload-progress">{uploadProgress}</p>}
      </div>

      {/* Tags */}
      <div className="form-section">
        <h3>🏷️ Tags</h3>
        
        <div className="tag-input-group">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
            placeholder="Add a tag and press Enter..."
          />
          <button type="button" onClick={handleAddTag} className="btn-secondary">
            Add
          </button>
        </div>

        {formData.tags.length > 0 && (
          <div className="tags-list">
            {formData.tags.map(tag => (
              <span key={tag} className="tag">
                #{tag}
                <button type="button" onClick={() => handleRemoveTag(tag)}>×</button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Status */}
      <div className="form-section">
        <h3>⚙️ Status</h3>
        
        <div className="form-group checkbox-group">
          <label>
            <input
              type="checkbox"
              name="isFeatured"
              checked={formData.isFeatured}
              onChange={handleChange}
            />
            ⭐ Featured Event (shows prominently in sidebar and events page)
          </label>
        </div>

        <div className="form-group checkbox-group">
          <label>
            <input
              type="checkbox"
              name="isActive"
              checked={formData.isActive}
              onChange={handleChange}
            />
            ✅ Active (visible to users)
          </label>
        </div>
      </div>

      {/* Actions */}
      <div className="form-actions">
        <button type="button" onClick={onCancel} className="btn-secondary">
          Cancel
        </button>
        <button type="submit" disabled={loading || uploading} className="btn-primary">
          {loading ? 'Saving...' : (event ? 'Update Event' : 'Create Event')}
        </button>
      </div>
    </form>
  );
};

export default EventForm;