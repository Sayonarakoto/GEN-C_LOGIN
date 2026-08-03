import React from 'react';
import { Button } from 'react-bootstrap';

const AuthSubmitButton = ({ loading, children, className = '', disabled = false }) => {
  return (
    <Button
      variant="primary"
      type="submit"
      size="lg"
      className={`w-100 mt-3 ${className}`.trim()}
      disabled={loading || disabled}
    >
      {loading ? 'Processing...' : children}
    </Button>
  );
};

export default AuthSubmitButton;
