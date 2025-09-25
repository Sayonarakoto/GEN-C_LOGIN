// src/components/AlertMessage.jsx
import React, { useState, useEffect } from 'react';
import { Alert } from 'react-bootstrap'; // Import Bootstrap Alert
import './AlertMessage.css'; // Keep custom CSS if needed for other styles

const AlertMessage = ({ message, type, duration = 3000 }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  if (!visible) return null;

  const getVariant = (type) => {
    switch (type) {
      case 'success':
        return 'success';
      case 'error':
        return 'danger';
      case 'info':
        return 'info';
      default:
        return 'info';
    }
  };

  return (
    <Alert variant={getVariant(type)} onClose={() => setVisible(false)} dismissible>
      {message}
    </Alert>
  );
};

export default AlertMessage;
