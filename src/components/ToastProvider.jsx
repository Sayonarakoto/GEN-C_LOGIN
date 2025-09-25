import React, { useState, useRef } from 'react';
import { Toast, ToastContainer } from 'react-bootstrap';

import { ToastContext } from '../context/ToastContext';

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const toastIdCounter = useRef(0); // Use useRef for the counter

  const showToast = (message, variant = 'success', delay = 3000) => {
    toastIdCounter.current += 1; // Increment the ref
    const newId = toastIdCounter.current;
    const newToast = {
      id: newId,
      message,
      variant,
      delay,
      show: true,
    };
    setToasts((prevToasts) => [...prevToasts, newToast]);
  };

  const removeToast = (id) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      <ToastContainer position="top-end" className="p-3" style={{ zIndex: 1050 }}>
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            show={toast.show}
            onClose={() => removeToast(toast.id)}
            delay={toast.delay}
            autohide
            bg={toast.variant}
          >
            <Toast.Body className={toast.variant === 'dark' ? 'text-white' : ''}>
              <strong className="me-auto">Notification</strong>
            </Toast.Body>
            <Toast.Body className={toast.variant === 'dark' && 'text-white'}>
              {toast.message}
            </Toast.Body>
          </Toast>
        ))}
      </ToastContainer>
    </ToastContext.Provider>
  );
};
