import React, { useState, useRef, useCallback } from 'react';
import { Snackbar, Alert } from '@mui/material';
import { ToastContext } from '../context/ToastContext';

const SEVERITY = {
  success: 'success',
  danger: 'error',
  info: 'info',
  warning: 'warning',
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const toastIdCounter = useRef(0);

  const showToast = useCallback((message, variant = 'success', delay = 3000) => {
    toastIdCounter.current += 1;
    const newToast = {
      id: toastIdCounter.current,
      message,
      variant,
      delay,
    };
    setToasts((prevToasts) => [...prevToasts, newToast]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      <div
        style={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          zIndex: 1400,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: 8,
          maxWidth: 'calc(100vw - 32px)',
        }}
      >
        {toasts.map((toast) => (
          <Snackbar
            key={toast.id}
            open
            autoHideDuration={toast.delay}
            onClose={() => removeToast(toast.id)}
            sx={{ position: 'static' }}
          >
            <Alert
              onClose={() => removeToast(toast.id)}
              severity={SEVERITY[toast.variant] || 'info'}
              variant="filled"
              sx={{ width: '100%' }}
            >
              {toast.message}
            </Alert>
          </Snackbar>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
