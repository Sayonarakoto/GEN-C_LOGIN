/**
 * Resolves profile image URL based on environment.
 * If the URL is absolute (starts with http/https or blob:), returns it as-is or updates local dev paths.
 * Otherwise, prepends the backend base URL (localhost in dev mode, or configured production API).
 * 
 * @param {string} url - The URL or path to resolve.
 * @returns {string} - The resolved absolute URL.
 */
export const resolveProfileImageUrl = (url) => {
    if (!url) return ''; // Fallback for missing/empty URLs
    
    // Check if it's already a blob object URL or absolute URL
    if (url.startsWith('blob:') || url.startsWith('data:')) {
        return url;
    }
    
    if (url.startsWith('http://') || url.startsWith('https://')) {
        // In dev mode, if an image URL points to remote production uploads or Render API, route to local API base if available
        if (import.meta.env.DEV && url.includes('gen-c-login.onrender.com')) {
            const pathOnly = url.split('gen-c-login.onrender.com')[1] || '';
            const devBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
            return `${devBaseUrl}${pathOnly}`;
        }
        return url;
    }
    
    // Prepend API base URL for relative paths
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
    
    // Ensure no double slashes when joining
    const cleanUrl = url.startsWith('/') ? url : `/${url}`;
    return `${baseUrl}${cleanUrl}`;
};

