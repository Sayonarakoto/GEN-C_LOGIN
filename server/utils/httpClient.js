/**
 * Server-Side HTTP Client with Axios Interceptor for Development Environment Guard.
 * Intercepts outbound HTTP requests to prevent unintended third-party/production calls during development.
 */
const axios = require('axios');

const httpClient = axios.create({
  timeout: 10000,
});

httpClient.interceptors.request.use(
  (config) => {
    const isDev = (process.env.NODE_ENV || 'development').trim().toLowerCase() === 'development';

    if (isDev) {
      // Log outbound request in development mode
      console.log(`[SERVER DEV HTTP GUARD] Outbound ${config.method.toUpperCase()} request to: ${config.url}`);

      // Block or intercept requests targeting production render domain or external production blobs
      if (config.url && config.url.includes('gen-c-login.onrender.com')) {
        console.warn(`[SERVER DEV HTTP GUARD BLOCKED] Outbound request to production URL blocked in dev mode: ${config.url}`);
        throw new Error(`[DEV GUARD BLOCKED] Outbound request to ${config.url} is disabled in development environment.`);
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (process.env.NODE_ENV === 'development') {
      console.error(`[SERVER DEV HTTP ERROR]: ${error.message}`);
    }
    return Promise.reject(error);
  }
);

module.exports = httpClient;
