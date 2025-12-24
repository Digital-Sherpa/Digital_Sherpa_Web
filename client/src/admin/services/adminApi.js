const API_BASE = '/api/admin';

// Get auth token - USE THE SAME TOKEN AS MAIN APP
const getToken = () => localStorage.getItem('token');
const getRefreshToken = () => localStorage.getItem('refreshToken');

// Generic fetch wrapper with auth
const fetchAPI = async (endpoint, options = {}) => {
  const token = getToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  // Handle 401 - Token expired
  if (response.status === 401) {
    const refreshed = await refreshTokenFn();
    if (refreshed) {
      headers['Authorization'] = `Bearer ${getToken()}`;
      const retryResponse = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
      });
      if (!retryResponse.ok) {
        const error = await retryResponse.json().catch(() => ({ message: 'Request failed' }));
        throw new Error(error.message || `HTTP ${retryResponse.status}`);
      }
      return retryResponse.json();
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
      throw new Error('Session expired. Please login again.');
    }
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
};

// Refresh token helper
const refreshTokenFn = async () => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (response.ok) {
      const data = await response.json();
      localStorage.setItem('token', data.token);
      localStorage.setItem('refreshToken', data.refreshToken);
      return true;
    }
    return false;
  } catch {
    return false;
  }
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
    const token = getToken();
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    const response = await fetch(`${API_BASE}/upload/single`, {
      method: 'POST',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Upload failed' }));
      throw new Error(error.message);
    }

    return response.json();
  },

  uploadMultiple: async (files, folder = 'places') => {
    const token = getToken();
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    formData.append('folder', folder);

    const response = await fetch(`${API_BASE}/upload/multiple`, {
      method: 'POST',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
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

// === USERS ===
export const usersApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchAPI(`/users?${query}`);
  },
  getById: (id) => fetchAPI(`/users/${id}`),
  updateRole: (id, role) => fetchAPI(`/users/${id}/role`, {
    method: 'PUT',
    body: JSON.stringify({ role }),
  }),
  toggleStatus: (id, isActive) => fetchAPI(`/users/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ isActive }),
  }),
  resetPassword: (id, newPassword) => fetchAPI(`/users/${id}/reset-password`, {
    method: 'PUT',
    body: JSON.stringify({ newPassword }),
  }),
  delete: (id) => fetchAPI(`/users/${id}`, {
    method: 'DELETE',
  }),
  getStats: () => fetchAPI('/users/stats/overview'),
};

export default {
  places: placesApi,
  craftsmen: craftsmenApi,
  roadmaps: roadmapsApi,
  upload: uploadApi,
  stats: statsApi,
  users: usersApi,
};
