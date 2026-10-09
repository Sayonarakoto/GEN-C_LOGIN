import axios from 'axios';
import { tokenStore } from '../utils/tokenStore';

const api = axios.create({
  baseURL: (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001') + '/api',
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  if (!config.headers.Authorization) {
    const token = tokenStore.getToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Guarantees error.response.data.message is always something the user can read,
// so every `err.response?.data?.message || fallback` call site shows friendly text.
const STATUS_FALLBACKS = {
  400: 'Please check the information you entered and try again.',
  401: 'Please log in to continue.',
  403: "You don't have permission to do that.",
  404: "We couldn't find what you were looking for.",
  409: 'That value is already in use. Please choose a different one.',
  413: 'That file is too large.',
  415: "That file type isn't supported.",
  422: 'Please check the information you entered and try again.',
  429: 'Too many attempts. Please wait a moment and try again.',
};

const fallbackMessageFor = (status) => {
  if (status >= 500) return 'Something went wrong on our side. Please try again.';
  return STATUS_FALLBACKS[status] || 'Please check your request and try again.';
};

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Server took too long
    if (error.code === 'ECONNABORTED' && !error.response) {
      error.response = {
        status: 408,
        data: {
          success: false,
          code: 'TIMEOUT',
          message: 'The server is taking too long to respond. Please try again.',
        },
      };
      return Promise.reject(error);
    }

    // Offline / CORS / server not running
    if (!error.response) {
      error.response = {
        status: 0,
        data: {
          success: false,
          code: 'NETWORK_ERROR',
          message: "Can't reach the server. Check your internet connection and try again.",
        },
      };
      return Promise.reject(error);
    }

    const existing = error.response.data;
    const hasMessage = existing && typeof existing.message === 'string' && existing.message.trim() !== '';
    if (!hasMessage) {
      error.response.data = {
        ...(existing && typeof existing === 'object' ? existing : {}),
        success: false,
        code: (existing && existing.code) || undefined,
        message: fallbackMessageFor(error.response.status),
      };
    }

    return Promise.reject(error);
  }
);

export default api;
