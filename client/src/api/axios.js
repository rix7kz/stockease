import axios from 'axios';

// Central axios instance. Base URL is empty because Vite's dev proxy
// (see vite.config.js) forwards "/api/..." requests to the Express backend.
const api = axios.create({
  baseURL: '/api',
});

// Attach the saved JWT (if any) to every outgoing request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('stockease_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// If the backend says the token is invalid/expired, clear it so the user
// is sent back to the login screen instead of seeing broken pages.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('stockease_token');
      localStorage.removeItem('stockease_user');
    }
    return Promise.reject(error);
  }
);

export default api;
