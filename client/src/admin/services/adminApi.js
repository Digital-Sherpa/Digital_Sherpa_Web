const API_BASE = '/api/admin';

// Generic fetch wrapper with error handling
const fetchAPI = async (endpoint, options = {}) => {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
};

// === PLACES ===
export const placesApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchAPI(`/places?${query}`);
  },

  getById: (id) => fetchAPI(`/places/${id}`),

  create: (data) => fetchAPI('/places', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  update: (id, data) => fetchAPI(`/places/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  delete: (id) => fetchAPI(`/places/${id}`, {
    method: 'DELETE',
  }),
};

// === CRAFTSMEN ===
export const craftsmenApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchAPI(`/craftsmen?${query}`);
  },

  getById: (id) => fetchAPI(`/craftsmen/${id}`),

  create: (data) => fetchAPI('/craftsmen', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  update: (id, data) => fetchAPI(`/craftsmen/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  delete: (id) => fetchAPI(`/craftsmen/${id}`, {
    method: 'DELETE',
  }),
};

// === ROADMAPS ===
export const roadmapsApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchAPI(`/roadmaps?${query}`);
  },

  getById: (id) => fetchAPI(`/roadmaps/${id}`),

  create: (data) => fetchAPI('/roadmaps', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  update: (id, data) => fetchAPI(`/roadmaps/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  delete: (id) => fetchAPI(`/roadmaps/${id}`, {
    method: 'DELETE',
  }),
};

// === UPLOADS ===
export const uploadApi = {
  uploadSingle: async (file, folder = 'places') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    const response = await fetch(`${API_BASE}/upload/single`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Upload failed' }));
      throw new Error(error.message);
    }

    return response.json();
  },

  uploadMultiple: async (files, folder = 'places') => {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    formData.append('folder', folder);

    const response = await fetch(`${API_BASE}/upload/multiple`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Upload failed' }));
      throw new Error(error.message);
    }

    return response.json();
  },

  delete: (publicId) => fetchAPI('/upload/delete', {
    method: 'DELETE',
    body: JSON.stringify({ publicId }),
  }),
};

// === STATS ===
export const statsApi = {
  getAll: () => fetchAPI('/stats'),
};

export default {
  places: placesApi,
  craftsmen: craftsmenApi,
  roadmaps: roadmapsApi,
  upload: uploadApi,
  stats: statsApi,
};
