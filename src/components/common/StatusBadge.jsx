// src/components/common/StatusBadge.jsx
import React from 'react';

export const StatusBadge = ({ status }) => {
  const statusClasses: Record<string, string> = {
    idle: 'text-gray-400',
    processing: 'text-yellow-500',
    completed: 'text-green-600',
    error: 'text-red-600',
  };

  return (
    <span className={`status-dot ${statusClasses[status] || 'text-gray-400'}`} />
  );
};

export default StatusBadge;