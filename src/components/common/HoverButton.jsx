// src/components/common/HoverButton.jsx
import React from 'react';
import clsx from 'clsx';

export const HoverButton = ({ children, className = '', disabled = false, ...rest }) => {
  const btnClasses = clsx(
    'px-6 py-3 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500',
    disabled && 'opacity-50 cursor-not-allowed',
    className
  );

  return (
    <button
      type="button"
      className={btnClasses}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  );
};

export default HoverButton;