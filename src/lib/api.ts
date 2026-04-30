import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://accountooze-backend-yfny.onrender.com';

export const api = axios.create({
  baseURL: API_BASE_URL,
});

// Request Interceptor: Attach Token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor: Handle Errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Check if the error is a JWT expiration or unauthorized
    if (error.response?.status === 401 || (typeof error.response?.data === 'string' && error.response.data.includes('expired'))) {
      localStorage.removeItem('accessToken');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/sign-up') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
