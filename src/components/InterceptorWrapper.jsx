import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../hooks/useAuth';
import useToastService from '../hooks/useToastService';

const InterceptorWrapper = ({ children }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const toast = useToastService();

  useEffect(() => {
    // Set up the response interceptor
    const resInterceptor = api.interceptors.response.use(
      (response) => response,
      (error) => {
        // Check if the error is a 401 Unauthorized
        if (error.response && error.response.status === 401) {
          const requestUrl = error.config.url || '';
          // Filter out login/register endpoints to avoid redirecting on wrong password
          const isAuthRequest = 
            requestUrl.includes('/login') || 
            requestUrl.includes('/signin') || 
            requestUrl.includes('/register') ||
            requestUrl.includes('/unified-login');

          if (!isAuthRequest) {
            toast.error('Session expired. Please log in again.');
            logout(); 
            navigate('/'); 
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.response.eject(resInterceptor);
    };
  }, [navigate, logout, toast]);

  return children;
};

export default InterceptorWrapper;
