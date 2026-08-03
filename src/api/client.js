// src/api/client.js
import axios from 'axios';

const getBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (import.meta.env.DEV) {
    // Force localhost in dev environment if configured to external or missing
    if (!envUrl || envUrl.includes('gen-c-login.onrender.com')) {
      return 'http://localhost:3001/api';
    }
  }
  return (envUrl || 'http://localhost:3001') + '/api';
};

const api = axios.create({
  baseURL: getBaseUrl(),
});

// Request Interceptor: Environment-based blocking and safety checks
api.interceptors.request.use(
  (config) => {
    if (import.meta.env.DEV) {
      // Guard against accidental production requests during dev mode
      if (config.url && config.url.includes('gen-c-login.onrender.com')) {
        console.warn('[DEV GUARD] Intercepted & redirected production request to localhost in dev mode:', config.url);
        config.url = config.url.replace('https://gen-c-login.onrender.com', 'http://localhost:3001');
      }
      if (config.baseURL && config.baseURL.includes('gen-c-login.onrender.com')) {
        console.warn('[DEV GUARD] Intercepted & redirected production baseURL to localhost in dev mode:', config.baseURL);
        config.baseURL = config.baseURL.replace('https://gen-c-login.onrender.com', 'http://localhost:3001');
      }

      // Add environment marker header
      config.headers['X-Client-Environment'] = 'development';
    }

    const token = sessionStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle dev-blocked operations cleanly
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.data && error.response.data.isDevBlocked) {
      console.warn('[DEV GUARD RESPONSE BLOCKED]:', error.response.data.message);
    }
    return Promise.reject(error);
  }
);

export default api;