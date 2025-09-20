// src/api/client.js
import axios from 'axios';
import { getAuthToken } from '../context/auth-hooks';

const api = axios.create({
  baseURL: 'http://localhost:3001',
});

api.interceptors.request.use((config) => {
  // Consider using httpOnly cookies or secure token storage
  const token = getAuthToken(); // Implement secure token retrieval
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      // Optionally redirect to login
      // localStorage.removeItem('token');
    }
    return Promise.reject(err);
  }
);

export default api;
