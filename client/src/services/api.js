import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor: attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('parkmate_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response interceptor: handle 401 unauthorized
api.interceptors.response.use((response) => {
  return response;
}, (error) => {
  if (error.response && error.response.status === 401) {
    const isAuthRoute = window.location.pathname === '/login' || window.location.pathname === '/register';
    if (!isAuthRoute) {
      localStorage.removeItem('parkmate_token');
      localStorage.removeItem('parkmate_user');
      window.location.href = '/login?expired=true';
    }
  }
  return Promise.reject(error);
});

export default api;
