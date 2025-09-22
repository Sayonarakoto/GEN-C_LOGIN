import React from 'react';
import './LoginCard.css';

const LoginCard = ({ children }) => {
  return (
    <div className="login-card-container">
      {children}
    </div>
  );
};

export default LoginCard;
