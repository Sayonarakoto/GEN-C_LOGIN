import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../hooks/useAuth';
import useToastService from '../hooks/useToastService';
import { tokenStore } from '../utils/tokenStore';

const isAuthUrl = (url = '') =>
  url.includes('/login') ||
  url.includes('/signin') ||
  url.includes('/register') ||
  url.includes('/unified-login') ||
  url.includes('/auth/refresh');

const InterceptorWrapper = ({ children }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const toast = useToastService();

  useEffect(() => {
    const resInterceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const status = error.response?.status;
        const message = error.response?.data?.message || '';
        const requestUrl = error.config?.url || '';

        // Slow network / slow production DB: friendly timeout message (no logout).
        // Auth pages (login/register) show their own inline error — no duplicate toast.
        if (error.code === 'ECONNABORTED') {
          if (!isAuthUrl(requestUrl)) {
            toast.error('The server is taking too long to respond. Please try again.');
          }
          return Promise.reject(error);
        }

        // 401 = missing/invalid token; 403 + this message = expired token (middleware convention)
        const isSessionLost =
          status === 401 || (status === 403 && message === 'Invalid or expired token');

        if (isSessionLost && !isAuthUrl(requestUrl)) {
          const hadRefresh = !!tokenStore.getRefreshToken();
          const alreadyRetried = !!error.config?._retried;

          // Silent refresh + one retry of the original request
          if (hadRefresh && !alreadyRetried) {
            try {
              const { data } = await api.post('/auth/refresh', {
                refreshToken: tokenStore.getRefreshToken(),
              });
              if (data?.token) {
                tokenStore.setToken(data.token);
                if (data.refreshToken) tokenStore.setRefreshToken(data.refreshToken);
                error.config._retried = true;
                error.config.headers.Authorization = `Bearer ${data.token}`;
                return api(error.config);
              }
            } catch (refreshError) {
              // Refresh failed → fall through to session cleanup below
              console.warn('Silent refresh failed during 401 handling');
            }
          }

          toast.error('Session expired. Please log in again.');
          logout();
          navigate('/');
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
