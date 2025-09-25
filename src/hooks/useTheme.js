import { useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext.jsx'; // Import the context object

export const useTheme = () => {
  const context = useContext(ThemeContext);
  
  // Optional: Check if the hook is used outside the provider
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  
  return context;
};