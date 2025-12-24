import React, { useState, useEffect } from 'react';
import { uploadApi } from '../services/adminApi';

const PlaceForm = ({ place, onSave, onCancel, loading }) => {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    category: 'historical',  // Changed from 'type' to 'category'
    subcategory: '',
    coordinates: { lat: '', lng: '' },
    description: '',
    address: '',
    openingHours: '',
    entryFee: {
      nepali: 0,
      saarc: 0,
      foreign: 0,
    },
    imageUrl: '',
    gallery: [],
    videoUrl: '',
    videos: [],
    hasWorkshop: false,
    workshopPrice: {
      halfDay: '',
      fullDay: '',
    },
    tags: [],
    isSponsored: false,
  });

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [tagInput, setTagInput] = useState('');

  // Updated to match the Place model enum
  const placeCategories = ['historical', 'workshop', 'restaurant', 'viewpoint'];
  
  const subcategories = {
    historical: ['temple', 'palace', 'monument', 'square'],
    workshop: ['pottery', 'woodcarving', 'metalwork', 'painting', 'weaving'],
    restaurant: ['cafe', 'traditional', 'rooftop'],
    viewpoint: ['hilltop', 'tower'],
  };

  useEffect(() => {
    if (place) {
      setFormData({
        name: place.name || '',
        slug: place.slug || '',
        category: place.category || 'historical',
        subcategory: place.subcategory || '',
        coordinates: {
          lat: place.coordinates?.lat || '',
          lng: place.coordinates?.lng || '',
        },
        description: place.description || '',
        address: place.address || '',
        openingHours: place.openingHours || '',
        entryFee: {
          nepali: place.entryFee?.nepali || 0,
          saarc: place.entryFee?.saarc || 0,
          foreign: place.entryFee?.foreign || 0,
        },
        imageUrl: place.imageUrl || '',
        gallery: place.gallery || [],
        videoUrl: place.videoUrl || '',
        videos: place.videos || [],
        hasWorkshop: place.hasWorkshop || false,
        workshopPrice: {
          halfDay: place.workshopPrice?.halfDay || '',
          fullDay: place.workshopPrice?.fullDay || '',
        },
        tags: place.tags || [],
        isSponsored: place.isSponsored || false,
      });
    }
  }, [place]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'number' ? (value ? parseFloat(value) : '') : value,
        },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }));
    }
  };

  const handleMainImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setUploadProgress('Uploading main image...');

    try {
      const result = await uploadApi.uploadSingle(file, 'places');
      setFormData(prev => ({ ...prev, imageUrl: result.url }));
      setUploadProgress('✓ Main image uploaded!');
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
      const result = await uploadApi.uploadMultiple(files, 'places');
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

  const handleVideoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setUploadProgress('Uploading video (this may take a while)...');

    try {
      const result = await uploadApi.uploadSingle(file, 'videos');
      // Videos should be objects with url, title, thumbnail
      const newVideo = {
        url: result.url,
        title: file.name.replace(/\.[^/.]+$/, ''), // Remove extension for title
        thumbnail: formData.imageUrl || '',
      };
      setFormData(prev => ({
        ...prev,
        videos: [...prev.videos, newVideo],
      }));
      setUploadProgress('✓ Video uploaded!');
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

  const removeVideo = (index) => {
    setFormData(prev => ({
      ...prev,
      videos: prev.videos.filter((_, i) => i !== index),
    }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim().toLowerCase()],
      }));
      setTagInput('');
    }
  };

  const removeTag = (tag) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Prepare data matching the backend model
    const submitData = {
      name: formData.name,
      category: formData.category,
      subcategory: formData.subcategory || undefined,
      description: formData.description,
      coordinates: {
        lat: parseFloat(formData.coordinates.lat),
        lng: parseFloat(formData.coordinates.lng),
      },
      address: formData.address || undefined,
      openingHours: formData.openingHours || undefined,
      entryFee: {
        nepali: parseFloat(formData.entryFee.nepali) || 0,
        saarc: parseFloat(formData.entryFee.saarc) || 0,
        foreign: parseFloat(formData.entryFee.foreign) || 0,
      },
      imageUrl: formData.imageUrl || undefined,
      gallery: formData.gallery,
      videoUrl: formData.videoUrl || undefined,
      videos: formData.videos, // Already in correct format [{url, title, thumbnail}]
      hasWorkshop: formData.hasWorkshop,
      workshopPrice: formData.hasWorkshop ? {
        halfDay: parseFloat(formData.workshopPrice.halfDay) || undefined,
        fullDay: parseFloat(formData.workshopPrice.fullDay) || undefined,
      } : undefined,
      tags: formData.tags,
      isSponsored: formData.isSponsored,
    };

    // Remove undefined values
    Object.keys(submitData).forEach(key => {
      if (submitData[key] === undefined) {
        delete submitData[key];
      }
    });

    onSave(submitData);
  };

  return (
    <form onSubmit={handleSubmit} className="admin-form">
      <h2>{place ? 'Edit Place' : 'Add New Place'}</h2>

      <div className="form-grid">
        <div className="form-group">
          <label>Name *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="e.g., Pottery Square"
          />
        </div>

        <div className="form-group">
          <label>Category *</label>
          <select name="category" value={formData.category} onChange={handleChange} required>
            {placeCategories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Subcategory</label>
          <select name="subcategory" value={formData.subcategory} onChange={handleChange}>
            <option value="">Select subcategory</option>
            {(subcategories[formData.category] || []).map(sub => (
              <option key={sub} value={sub}>{sub}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Latitude *</label>
          <input
            type="number"
            name="coordinates.lat"
            value={formData.coordinates.lat}
            onChange={handleChange}
            step="any"
            required
            placeholder="27.6710"
          />
        </div>

        <div className="form-group">
          <label>Longitude *</label>
          <input
            type="number"
            name="coordinates.lng"
            value={formData.coordinates.lng}
            onChange={handleChange}
            step="any"
            required
            placeholder="85.4298"
          />
        </div>

        <div className="form-group">
          <label>Address</label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="e.g., Taumadhi Square, Bhaktapur"
          />
        </div>

        <div className="form-group">
          <label>Opening Hours</label>
          <input
            type="text"
            name="openingHours"
            value={formData.openingHours}
            onChange={handleChange}
            placeholder="e.g., 6:00 AM - 6:00 PM"
          />
        </div>
      </div>

      <div className="form-group full-width">
        <label>Description *</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          required
          rows={4}
          placeholder="Describe this place..."
        />
      </div>

      {/* Entry Fee Section */}
      <div className="form-section">
        <h3>Entry Fee (Rs.)</h3>
        <div className="form-grid three-col">
          <div className="form-group">
            <label>Nepali</label>
            <input
              type="number"
              name="entryFee.nepali"
              value={formData.entryFee.nepali}
              onChange={handleChange}
              min="0"
              placeholder="0"
            />
          </div>
          <div className="form-group">
            <label>SAARC</label>
            <input
              type="number"
              name="entryFee.saarc"
              value={formData.entryFee.saarc}
              onChange={handleChange}
              min="0"
              placeholder="0"
            />
          </div>
          <div className="form-group">
            <label>Foreign</label>
            <input
              type="number"
              name="entryFee.foreign"
              value={formData.entryFee.foreign}
              onChange={handleChange}
              min="0"
              placeholder="0"
            />
          </div>
        </div>
      </div>

      {/* Workshop Section */}
      <div className="form-section">
        <h3>Workshop Information</h3>
        <div className="form-group checkbox-group">
          <label>
            <input
              type="checkbox"
              name="hasWorkshop"
              checked={formData.hasWorkshop}
              onChange={handleChange}
            />
            Workshop Available
          </label>
        </div>
        
        {formData.hasWorkshop && (
          <div className="form-grid">
            <div className="form-group">
              <label>Half Day Price (Rs.)</label>
              <input
                type="number"
                name="workshopPrice.halfDay"
                value={formData.workshopPrice.halfDay}
                onChange={handleChange}
                min="0"
                placeholder="e.g., 1500"
              />
            </div>
            <div className="form-group">
              <label>Full Day Price (Rs.)</label>
              <input
                type="number"
                name="workshopPrice.fullDay"
                value={formData.workshopPrice.fullDay}
                onChange={handleChange}
                min="0"
                placeholder="e.g., 3000"
              />
            </div>
          </div>
        )}
      </div>

      {/* Sponsored */}
      <div className="form-group checkbox-group">
        <label>
          <input
            type="checkbox"
            name="isSponsored"
            checked={formData.isSponsored}
            onChange={handleChange}
          />
          Sponsored Place (shows as recommended)
        </label>
      </div>

      {/* Main Image Section */}
      <div className="form-section">
        <h3>Main Image</h3>
        <div className="upload-zone">
          <input
            type="file"
            accept="image/*"
            onChange={handleMainImageUpload}
            disabled={uploading}
            id="main-image-upload"
          />
          <label htmlFor="main-image-upload" className="upload-label">
            📷 Click to upload main image
          </label>
        </div>
        
        {formData.imageUrl && (
          <div className="image-preview">
            <img src={formData.imageUrl} alt="Main" />
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

      {/* Gallery Section */}
      <div className="form-section">
        <h3>Gallery Images</h3>
        <div className="upload-zone">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleGalleryUpload}
            disabled={uploading}
            id="gallery-upload"
          />
          <label htmlFor="gallery-upload" className="upload-label">
            📷 Click to upload gallery images
          </label>
        </div>
        {uploadProgress && <p className="upload-progress">{uploadProgress}</p>}
        
        <div className="gallery-preview">
          {formData.gallery.map((url, idx) => (
            <div key={idx} className="gallery-item">
              <img src={url} alt={`Gallery ${idx + 1}`} />
              <button type="button" onClick={() => removeGalleryImage(idx)} className="remove-btn">×</button>
            </div>
          ))}
        </div>
      </div>

      {/* Videos Section */}
      <div className="form-section">
        <h3>Videos</h3>
        <div className="upload-zone">
          <input
            type="file"
            accept="video/*"
            onChange={handleVideoUpload}
            disabled={uploading}
            id="video-upload"
          />
          <label htmlFor="video-upload" className="upload-label">
            🎬 Click to upload video (max 100MB)
          </label>
        </div>
        
        <div className="form-group">
          <label>Or paste Video URL (YouTube/Cloudinary)</label>
          <input
            type="url"
            name="videoUrl"
            value={formData.videoUrl}
            onChange={handleChange}
            placeholder="https://..."
          />
        </div>
        
        <div className="videos-preview">
          {formData.videos.map((video, idx) => (
            <div key={idx} className="video-item">
              <div className="video-info">
                <span className="video-title">{video.title || `Video ${idx + 1}`}</span>
                <video src={video.url} controls width="200" />
              </div>
              <button type="button" onClick={() => removeVideo(idx)} className="remove-btn">×</button>
            </div>
          ))}
        </div>
      </div>

      {/* Tags Section */}
      <div className="form-section">
        <h3>Tags</h3>
        <div className="tag-input-group">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            placeholder="Add a tag..."
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddTag();
              }
            }}
          />
          <button type="button" onClick={handleAddTag} className="btn-secondary">Add</button>
        </div>
        <div className="tags-list">
          {formData.tags.map(tag => (
            <span key={tag} className="tag">
              {tag}
              <button type="button" onClick={() => removeTag(tag)}>×</button>
            </span>
          ))}
        </div>
      </div>

      <div className="form-actions">
        <button type="button" onClick={onCancel} className="btn-secondary" disabled={loading}>
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={loading || uploading}>
          {loading ? 'Saving...' : (place ? 'Update Place' : 'Create Place')}
        </button>
      </div>
    </form>
  );
};

export default PlaceForm;
