import { useEffect } from 'react';
import api from '../api/client';
import { useAuth } from './useAuth';

const useAxiosInterceptor = () => {
  const { logout } = useAuth();

  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (response) => response,
      (error) => {
        const isLoginAttempt = error.config.headers['X-Skip-Interceptor'];

        // 1. Check for 401/403
        if (error.response && error.response.status === 401) {
            // 2. ONLY redirect if it's NOT a login attempt
            if (!isLoginAttempt) {
                console.error('Session 401 caught. Logging out.');
                logout(); 
            } else {
                // 3. If it IS a login attempt, just show the error message.
                console.log('Login failed (401). Interceptor skipped.');
                // Crucial: Let the login component handle the error promise
                return Promise.reject(error); 
            }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.response.eject(interceptor);
    };
  }, [logout]);
};

export default useAxiosInterceptor;
