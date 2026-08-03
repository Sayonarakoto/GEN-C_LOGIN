/**
 * Middleware to enforce development environment boundaries and guard against unintentional
 * production service requests (e.g. Vercel Blob cloud uploads, production API routing).
 */
const logger = require('../utils/logger');

const devGuard = (req, res, next) => {
  try {
    const isDev = (process.env.NODE_ENV || 'development').trim().toLowerCase() === 'development';
    
    if (isDev) {
      // Set header to indicate response from local dev server
      res.setHeader('X-Environment-Mode', 'development');

      // Block Vercel Blob upload token generation in dev mode if VITE_USE_VERCEL_BLOB is false
      if (req.path.includes('/blob/profile-picture-upload')) {
        const useVercelBlob = (process.env.VITE_USE_VERCEL_BLOB || '').toString().trim().toLowerCase() === 'true';
        if (!useVercelBlob) {
          logger.warn({ path: req.path }, '[DEV GUARD BLOCKED] Intercepted Vercel Blob upload token request in development mode');
          return res.status(403).json({
            success: false,
            message: 'Vercel Blob upload is disabled in development environment. Use local upload endpoint (/api/students/upload-profile-picture).',
            isDevBlocked: true,
          });
        }
      }
    }
    
    next();
  } catch (error) {
    logger.error({ error }, 'Error in devGuard middleware');
    next();
  }
};

module.exports = devGuard;
