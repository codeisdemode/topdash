import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export const authAPI = axios.create({
  baseURL: API_BASE_URL + '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
authAPI.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
authAPI.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API functions
export const serversAPI = {
  getAll: () => authAPI.get('/servers'),
  getById: (id) => authAPI.get(`/servers/${id}`),
  register: (data) => authAPI.post('/servers/register', data),
  delete: (id) => authAPI.delete(`/servers/${id}`),
};

export const alertsAPI = {
  getAll: (params) => authAPI.get('/alerts', { params }),
  getStats: () => authAPI.get('/alerts/stats'),
  resolve: (id) => authAPI.patch(`/alerts/${id}/resolve`),
  delete: (id) => authAPI.delete(`/alerts/${id}`),
};

export const metricsAPI = {
  getByServer: (serverId, hours = 24) => 
    authAPI.get(`/metrics/${serverId}?hours=${hours}`),
};

export const settingsAPI = {
  get: () => authAPI.get('/settings'),
  update: (data) => authAPI.put('/settings', data),
};