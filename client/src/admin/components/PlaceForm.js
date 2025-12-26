import React, { useState, useEffect } from 'react';
import { uploadApi } from '../services/adminApi';

const PlaceForm = ({ place, onSave, onCancel, loading }) => {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    category: 'historical',
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
    audioUrl: '',
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
  
  // Category management
  const [categories, setCategories] = useState(['historical', 'workshop', 'restaurant', 'viewpoint']);
  const [subcategories, setSubcategories] = useState({
    historical: ['temple', 'palace', 'monument', 'square'],
    workshop: ['pottery', 'woodcarving', 'metalwork', 'painting', 'weaving'],
    restaurant: ['cafe', 'traditional', 'rooftop'],
    viewpoint: ['hilltop', 'tower'],
  });
  
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [showNewSubcategoryInput, setShowNewSubcategoryInput] = useState(false);
  const [newSubcategoryInput, setNewSubcategoryInput] = useState('');

  // Load saved categories from localStorage on mount
  useEffect(() => {
    const savedCategories = localStorage.getItem('placeCategories');
    const savedSubcategories = localStorage.getItem('placeSubcategories');
    
    if (savedCategories) {
      try {
        const parsed = JSON.parse(savedCategories);
        setCategories(parsed);
      } catch (e) {
        console.error('Error parsing saved categories:', e);
      }
    }
    
    if (savedSubcategories) {
      try {
        const parsed = JSON.parse(savedSubcategories);
        setSubcategories(parsed);
      } catch (e) {
        console.error('Error parsing saved subcategories:', e);
      }
    }
  }, []);

  // Save categories to localStorage when they change
  useEffect(() => {
    localStorage.setItem('placeCategories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('placeSubcategories', JSON.stringify(subcategories));
  }, [subcategories]);

  useEffect(() => {
    if (place) {
      // If place has a category not in our list, add it
      if (place.category && !categories.includes(place.category)) {
        setCategories(prev => [...prev, place.category]);
      }
      
      // If place has a subcategory not in our list, add it
      if (place.subcategory && place.category) {
        const currentSubs = subcategories[place.category] || [];
        if (!currentSubs.includes(place.subcategory)) {
          setSubcategories(prev => ({
            ...prev,
            [place.category]: [...currentSubs, place.subcategory]
          }));
        }
      }

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
        audioUrl: place.audioUrl || '',
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

  // Handle category change
  const handleCategoryChange = (e) => {
    const value = e.target.value;
    
    if (value === '__add_new__') {
      setShowNewCategoryInput(true);
    } else {
      setFormData(prev => ({
        ...prev,
        category: value,
        subcategory: '', // Reset subcategory when category changes
      }));
    }
  };

  // Add new category
  const handleAddCategory = () => {
    const trimmed = newCategoryInput.trim().toLowerCase();
    if (trimmed && !categories.includes(trimmed)) {
      setCategories(prev => [...prev, trimmed]);
      setSubcategories(prev => ({ ...prev, [trimmed]: [] }));
      setFormData(prev => ({ ...prev, category: trimmed, subcategory: '' }));
    }
    setNewCategoryInput('');
    setShowNewCategoryInput(false);
  };

  // Handle subcategory change
  const handleSubcategoryChange = (e) => {
    const value = e.target.value;
    
    if (value === '__add_new__') {
      setShowNewSubcategoryInput(true);
    } else {
      setFormData(prev => ({ ...prev, subcategory: value }));
    }
  };

  // Add new subcategory
  const handleAddSubcategory = () => {
    const trimmed = newSubcategoryInput.trim().toLowerCase();
    const currentCategory = formData.category;
    const currentSubs = subcategories[currentCategory] || [];
    
    if (trimmed && !currentSubs.includes(trimmed)) {
      setSubcategories(prev => ({
        ...prev,
        [currentCategory]: [...currentSubs, trimmed]
      }));
      setFormData(prev => ({ ...prev, subcategory: trimmed }));
    }
    setNewSubcategoryInput('');
    setShowNewSubcategoryInput(false);
  };

  // Delete category (optional - for cleanup)
  const handleDeleteCategory = (categoryToDelete) => {
    if (categories.length <= 1) {
      alert('Cannot delete the last category');
      return;
    }
    
    if (!window.confirm(`Delete category "${categoryToDelete}"? This will also delete its subcategories.`)) {
      return;
    }
    
    setCategories(prev => prev.filter(c => c !== categoryToDelete));
    setSubcategories(prev => {
      const newSubs = { ...prev };
      delete newSubs[categoryToDelete];
      return newSubs;
    });
    
    // If current category was deleted, switch to first available
    if (formData.category === categoryToDelete) {
      const remaining = categories.filter(c => c !== categoryToDelete);
      setFormData(prev => ({ ...prev, category: remaining[0] || 'historical', subcategory: '' }));
    }
  };

  // Delete subcategory
  const handleDeleteSubcategory = (subcategoryToDelete) => {
    const currentCategory = formData.category;
    
    setSubcategories(prev => ({
      ...prev,
      [currentCategory]: (prev[currentCategory] || []).filter(s => s !== subcategoryToDelete)
    }));
    
    if (formData.subcategory === subcategoryToDelete) {
      setFormData(prev => ({ ...prev, subcategory: '' }));
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
      setUploadProgress('✓ Image uploaded!');
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
      const newVideo = {
        url: result.url,
        title: file.name.replace(/\.[^/.]+$/, ''),
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

  const handleAudioUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('audio/')) {
      setUploadProgress('✗ Error: Please select an audio file (MP3, WAV, etc.)');
      setTimeout(() => setUploadProgress(''), 3000);
      return;
    }

    setUploading(true);
    setUploadProgress('Uploading audio guide...');

    try {
      const result = await uploadApi.uploadSingle(file, 'audio');
      setFormData(prev => ({ ...prev, audioUrl: result.url }));
      setUploadProgress('✓ Audio uploaded!');
    } catch (err) {
      setUploadProgress(`✗ Error: ${err.message}`);
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(''), 3000);
    }
  };

  const removeAudio = () => {
    setFormData(prev => ({ ...prev, audioUrl: '' }));
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
      videos: formData.videos,
      audioUrl: formData.audioUrl || undefined,
      hasWorkshop: formData.hasWorkshop,
      workshopPrice: formData.hasWorkshop ? {
        halfDay: parseFloat(formData.workshopPrice.halfDay) || undefined,
        fullDay: parseFloat(formData.workshopPrice.fullDay) || undefined,
      } : undefined,
      tags: formData.tags,
      isSponsored: formData.isSponsored,
    };

    Object.keys(submitData).forEach(key => {
      if (submitData[key] === undefined) {
        delete submitData[key];
      }
    });

    onSave(submitData);
  };

  const currentSubcategories = subcategories[formData.category] || [];

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
            <div className="select-with-action">
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
            </div>
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

        {/* Subcategory with Add New Option */}
        <div className="form-group">
          <label>Subcategory</label>
          {showNewSubcategoryInput ? (
            <div className="inline-add-input">
              <input
                type="text"
                value={newSubcategoryInput}
                onChange={(e) => setNewSubcategoryInput(e.target.value)}
                placeholder="New subcategory name"
                autoFocus
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubcategory();
                  }
                }}
              />
              <button type="button" onClick={handleAddSubcategory} className="btn-inline-add">
                ✓
              </button>
              <button 
                type="button" 
                onClick={() => { setShowNewSubcategoryInput(false); setNewSubcategoryInput(''); }} 
                className="btn-inline-cancel"
              >
                ✗
              </button>
            </div>
          ) : (
            <select 
              name="subcategory" 
              value={formData.subcategory} 
              onChange={handleSubcategoryChange}
            >
              <option value="">Select subcategory</option>
              {currentSubcategories.map(sub => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
              <option value="__add_new__">➕ Add New Subcategory...</option>
            </select>
          )}
          
          {/* Show existing subcategories as chips for management */}
          {currentSubcategories.length > 0 && (
            <div className="category-chips-manage">
              {currentSubcategories.map(sub => (
                <span key={sub} className={`category-chip-small ${formData.subcategory === sub ? 'active' : ''}`}>
                  {sub}
                  <button 
                    type="button" 
                    onClick={() => handleDeleteSubcategory(sub)}
                    title="Delete subcategory"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
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

      {/* Audio Guide Section */}
      <div className="form-section">
        <h3>🎧 Audio Guide</h3>
        <p className="form-help-text" style={{ fontSize: '0.875rem', color: '#9ca3af', marginBottom: '1rem' }}>
          Upload an MP3 audio guide that will auto-play when users approach this location.
        </p>
        <div className="upload-zone">
          <input
            type="file"
            accept="audio/*"
            onChange={handleAudioUpload}
            disabled={uploading}
            id="audio-upload"
          />
          <label htmlFor="audio-upload" className="upload-label">
            🎵 Click to upload audio guide (MP3)
          </label>
        </div>
        
        {formData.audioUrl && (
          <div className="audio-preview" style={{
            marginTop: '1rem',
            padding: '1rem',
            background: 'rgba(16, 185, 129, 0.1)',
            borderRadius: '0.5rem',
            border: '1px solid rgba(16, 185, 129, 0.3)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1.5rem' }}>🎧</span>
              <span style={{ color: '#10b981', fontWeight: '500' }}>Audio Guide Uploaded</span>
            </div>
            <audio 
              controls 
              src={formData.audioUrl} 
              style={{ width: '100%', marginBottom: '0.5rem' }}
            >
              Your browser does not support the audio element.
            </audio>
            <button 
              type="button" 
              onClick={removeAudio} 
              className="remove-btn"
              style={{ marginTop: '0.5rem' }}
            >
              Remove Audio
            </button>
          </div>
        )}
        
        <div className="form-group" style={{ marginTop: '1rem' }}>
          <label>Or paste Audio URL (Cloudinary/S3)</label>
          <input
            type="url"
            name="audioUrl"
            value={formData.audioUrl}
            onChange={handleChange}
            placeholder="https://..."
          />
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
