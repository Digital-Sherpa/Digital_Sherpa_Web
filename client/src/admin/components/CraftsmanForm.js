import React, { useState, useEffect } from 'react';
import { uploadApi, placesApi } from '../services/adminApi';

const CraftsmanForm = ({ craftsman, onSave, onCancel, loading }) => {
  const [formData, setFormData] = useState({
    name: '',
    specialty: [],
    experience: '',
    bio: '',
    contact: {
      phone: '',
      email: '',
    },
    location: '',
    placeSlug: '',
    photo: '',
    gallery: [],
    rating: '',
    available: true,
    workshopTypes: [],
    languages: [],
  });

  const [places, setPlaces] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [languageInput, setLanguageInput] = useState('');
  const [specialtyInput, setSpecialtyInput] = useState('');

  const [newWorkshop, setNewWorkshop] = useState({
    type: '',
    duration: '',
    price: '',
    description: ''
  });

  useEffect(() => {
    fetchPlaces();
  }, []);

  const fetchPlaces = async () => {
    try {
      const data = await placesApi.getAll({ limit: 1000 });
      setPlaces(data.places || []);
    } catch (error) {
      console.error('Error fetching places:', error);
    }
  };

  useEffect(() => {
    if (craftsman) {
      setFormData({
        name: craftsman.name || '',
        specialty: Array.isArray(craftsman.specialty) ? craftsman.specialty : (craftsman.specialty ? [craftsman.specialty] : []),
        experience: craftsman.experience || '',
        bio: craftsman.bio || '',
        contact: {
          phone: craftsman.contact?.phone || '',
          email: craftsman.contact?.email || '',
        },
        location: craftsman.location || '',
        placeSlug: craftsman.placeSlug || '',
        photo: craftsman.photo || '',
        gallery: craftsman.gallery || [],
        rating: craftsman.rating || '',
        available: craftsman.available !== false,
        workshopTypes: craftsman.workshopTypes || [],
        languages: craftsman.languages || [],
      });
    }
  }, [craftsman]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }));
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setUploadProgress('Uploading photo...');

    try {
      const result = await uploadApi.uploadSingle(file, 'craftsmen');
      setFormData(prev => ({ ...prev, photo: result.url }));
      setUploadProgress('✓ Photo uploaded!');
    } catch (err) {
      setUploadProgress(`✗ Error: ${err.message}`);
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(''), 3000);
    }
  };

  const handleGalleryUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setUploading(true);
    setUploadProgress(`Uploading ${files.length} image(s)...`);

    try {
      const result = await uploadApi.uploadMultiple(files, 'craftsmen');
      const newUrls = result.files.map(f => f.url);
      setFormData(prev => ({
        ...prev,
        gallery: [...prev.gallery, ...newUrls],
      }));
      setUploadProgress('✓ Images uploaded!');
    } catch (err) {
      setUploadProgress(`✗ Error: ${err.message}`);
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

  // Tag Handling (Languages & Specialties)
  const handleAddTag = (field, value, setter) => {
    if (value.trim() && !formData[field].includes(value.trim())) {
      setFormData(prev => ({
        ...prev,
        [field]: [...prev[field], value.trim()],
      }));
      setter('');
    }
  };

  const removeTag = (field, tag) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter(t => t !== tag),
    }));
  };

  // Workshop Types Management
  const handleWorkshopChange = (e) => {
    const { name, value } = e.target;
    setNewWorkshop(prev => ({ ...prev, [name]: value }));
  };

  const addWorkshop = () => {
    if (newWorkshop.type && newWorkshop.price) {
      setFormData(prev => ({
        ...prev,
        workshopTypes: [...prev.workshopTypes, { ...newWorkshop, price: parseFloat(newWorkshop.price) }]
      }));
      setNewWorkshop({ type: '', duration: '', price: '', description: '' });
    }
  };

  const removeWorkshop = (index) => {
    setFormData(prev => ({
      ...prev,
      workshopTypes: prev.workshopTypes.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const submitData = {
      ...formData,
      experience: formData.experience ? parseInt(formData.experience) : undefined,
      rating: formData.rating ? parseFloat(formData.rating) : undefined,
    };

    onSave(submitData);
  };

  return (
    <form onSubmit={handleSubmit} className="admin-form">
      <h2>{craftsman ? 'Edit Craftsman' : 'Add New Craftsman'}</h2>

      <div className="form-grid">
        <div className="form-group">
          <label>Name *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="e.g., Ram Bahadur"
          />
        </div>

        <div className="form-group">
          <label>Years of Experience</label>
          <input
            type="number"
            name="experience"
            value={formData.experience}
            onChange={handleChange}
            min="0"
            placeholder="e.g., 20"
          />
        </div>

        <div className="form-group">
          <label>Location (Address)</label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="e.g., Pottery Square, Bhaktapur"
          />
        </div>

        {/* Place Link */}
        <div className="form-group">
          <label>Linked Place</label>
          <select name="placeSlug" value={formData.placeSlug} onChange={handleChange}>
            <option value="">Select a Place (Optional)</option>
            {places.map(place => (
              <option key={place._id} value={place.slug}>{place.name}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Phone</label>
          <input
            type="tel"
            name="contact.phone"
            value={formData.contact.phone}
            onChange={handleChange}
            placeholder="+977-..."
          />
        </div>

        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            name="contact.email"
            value={formData.contact.email}
            onChange={handleChange}
            placeholder="email@example.com"
          />
        </div>

        <div className="form-group">
          <label>Rating (0-5)</label>
          <input
            type="number"
            name="rating"
            value={formData.rating}
            onChange={handleChange}
            min="0"
            max="5"
            step="0.1"
            placeholder="e.g., 4.5"
          />
        </div>

        <div className="form-group checkbox-group">
          <label>
            <input
              type="checkbox"
              name="available"
              checked={formData.available}
              onChange={handleChange}
            />
            Available for bookings
          </label>
        </div>
      </div>

      <div className="form-group full-width">
        <label>Bio</label>
        <textarea
          name="bio"
          value={formData.bio}
          onChange={handleChange}
          rows={4}
          placeholder="Tell us about this craftsman..."
        />
      </div>

      {/* Specialties */}
      <div className="form-section">
        <h3>Specialties</h3>
        <div className="tag-input-group">
          <input
            type="text"
            value={specialtyInput}
            onChange={(e) => setSpecialtyInput(e.target.value)}
            placeholder="Add specialty (e.g. Pottery, Woodwork)..."
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag('specialty', specialtyInput, setSpecialtyInput))}
          />
          <button type="button" onClick={() => handleAddTag('specialty', specialtyInput, setSpecialtyInput)} className="btn-secondary">Add</button>
        </div>
        <div className="tags-list">
          {formData.specialty.map(spec => (
            <span key={spec} className="tag">
              {spec}
              <button type="button" onClick={() => removeTag('specialty', spec)}>×</button>
            </span>
          ))}
        </div>
      </div>

      {/* Workshop Types */}
      <div className="form-section">
        <h3>Workshop Types</h3>
        <div className="workshop-form-row">
          <input
            type="text"
            name="type"
            value={newWorkshop.type}
            onChange={handleWorkshopChange}
            placeholder="Type (e.g. Half Day)"
          />
          <input
            type="text"
            name="duration"
            value={newWorkshop.duration}
            onChange={handleWorkshopChange}
            placeholder="Duration (e.g. 3-4 hours)"
          />
          <input
            type="number"
            name="price"
            value={newWorkshop.price}
            onChange={handleWorkshopChange}
            placeholder="Price (Rs.)"
          />
          <button type="button" onClick={addWorkshop} className="btn-secondary">Add Workshop</button>
        </div>
        <div className="workshop-list">
          {formData.workshopTypes.map((ws, idx) => (
            <div key={idx} className="workshop-item">
              <span><strong>{ws.type}</strong> - {ws.duration} - Rs. {ws.price}</span>
              <button type="button" onClick={() => removeWorkshop(idx)} className="btn-icon text-red">✕</button>
            </div>
          ))}
          {formData.workshopTypes.length === 0 && <p className="text-muted">No workshops added yet.</p>}
        </div>
      </div>

      {/* Profile Photo */}
      <div className="form-section">
        <h3>Profile Photo</h3>
        <div className="upload-zone">
          <input
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
            disabled={uploading}
            id="photo-upload"
          />
          <label htmlFor="photo-upload" className="upload-label">
            📷 Click to upload profile photo
          </label>
        </div>
        {uploadProgress && <p className="upload-progress">{uploadProgress}</p>}
        
        {formData.photo && (
          <div className="photo-preview">
            <img src={formData.photo} alt="Profile" />
            <button type="button" onClick={() => setFormData(p => ({ ...p, photo: '' }))} className="remove-btn">
              Remove
            </button>
          </div>
        )}
      </div>

      {/* Gallery */}
      <div className="form-section">
        <h3>Work Gallery</h3>
        <div className="upload-zone">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleGalleryUpload}
            disabled={uploading}
            id="craftsman-gallery-upload"
          />
          <label htmlFor="craftsman-gallery-upload" className="upload-label">
            📷 Upload work samples
          </label>
        </div>
        
        <div className="gallery-preview">
          {formData.gallery.map((url, idx) => (
            <div key={idx} className="gallery-item">
              <img src={url} alt={`Work ${idx + 1}`} />
              <button type="button" onClick={() => removeGalleryImage(idx)} className="remove-btn">×</button>
            </div>
          ))}
        </div>
      </div>

      {/* Languages */}
      <div className="form-section">
        <h3>Languages Spoken</h3>
        <div className="tag-input-group">
          <input
            type="text"
            value={languageInput}
            onChange={(e) => setLanguageInput(e.target.value)}
            placeholder="Add language..."
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag('languages', languageInput, setLanguageInput))}
          />
          <button type="button" onClick={() => handleAddTag('languages', languageInput, setLanguageInput)} className="btn-secondary">Add</button>
        </div>
        <div className="tags-list">
          {formData.languages.map(lang => (
            <span key={lang} className="tag">
              {lang}
              <button type="button" onClick={() => removeTag('languages', lang)}>×</button>
            </span>
          ))}
        </div>
      </div>

      <div className="form-actions">
        <button type="button" onClick={onCancel} className="btn-secondary" disabled={loading}>
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={loading || uploading}>
          {loading ? 'Saving...' : (craftsman ? 'Update Craftsman' : 'Create Craftsman')}
        </button>
      </div>
    </form>
  );
};

export default CraftsmanForm;
