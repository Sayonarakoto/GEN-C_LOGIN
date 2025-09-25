// src/api/client.js
import axios from 'axios';
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001',
});

api.interceptors.request.use((config) => {
  // Consider using httpOnly cookies or secure token storage
  const token = sessionStorage.getItem('token'); // Implement secure token retrieval
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;