/**
 * Resolves profile image URL.
 * If the URL is absolute (starts with http/https), returns it as-is.
 * Otherwise, prepends the backend base URL (local/Render).
 * 
 * @param {string} url - The URL or path to resolve.
 * @returns {string} - The resolved absolute URL.
 */
export const resolveProfileImageUrl = (url) => {
    if (!url) return ''; // Fallback for missing/empty URLs
    
    // Check if it's already an absolute URL (Blob or external)
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }
    
    // Otherwise, assume it's a local path and prepend the API base URL
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
    
    // Ensure no double slashes when joining
    const cleanUrl = url.startsWith('/') ? url : `/${url}`;
    return `${baseUrl}${cleanUrl}`;
};
