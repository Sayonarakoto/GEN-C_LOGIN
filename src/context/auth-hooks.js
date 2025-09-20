import { useContext } from 'react';
import { AuthContext } from './AuthContext';

let authToken = null;

export const useAuth = () => {
  return useContext(AuthContext);
};

export const getAuthToken = () => authToken;

export const setAuthToken = (token) => {
  authToken = token;
  if (token) {
    localStorage.setItem('token', token);
  } else {
    localStorage.removeItem('token');
  }
};