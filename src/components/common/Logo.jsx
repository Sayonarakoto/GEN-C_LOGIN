import React from 'react';
import { Box } from '@mui/material';
import './Logo.css';

const Logo = () => {
  return (
    <Box className="profile-avatar-frame">
      <img src="/images/genc-log.jpeg" alt="Profile Avatar Logo" className="avatar-logo-fix" />
    </Box>
  );
};

export default Logo;
