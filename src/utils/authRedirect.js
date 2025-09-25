import { getAuthLogoutCallback } from './authUtils'; // Import the logout callback

let navigateFunction = null;

export const setNavigateFunction = (navigate) => {
  navigateFunction = navigate;
};

export const handleUnauthorized = () => {
  console.log('handleUnauthorized: Function called.');
  const logout = getAuthLogoutCallback();
  if (logout) {
    logout('/'); // Call the AuthContext's logout function with redirect path
  } else {
    sessionStorage.removeItem('token'); // Fallback: Clear the token if logout callback isn't available
    // Fallback redirection if logout callback isn't available
    if (navigateFunction) {
      navigateFunction('/');
    } else {
      window.location.href = '/';
    }
  }
};