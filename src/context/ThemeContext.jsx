import React, { createContext, useState, useEffect, useMemo } from 'react';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// 1. Define the initial context values for better type safety and clarity
export const ThemeContext = createContext({
  theme: 'light',
  toggleTheme: () => {},
});

export const ThemeProvider = ({ children }) => {
  const [mode, setMode] = useState('light'); // Renamed 'theme' to 'mode' to avoid conflict with MuiTheme

  useEffect(() => {
    // Load theme from localStorage on initial mount
    const savedMode = localStorage.getItem('theme');
    if (savedMode) {
      setMode(savedMode);
    }
  }, []);

  useEffect(() => {
    // Apply theme class to body for global styling (for non-MUI elements)
    if (typeof document !== 'undefined') {
      document.body.classList.remove('light', 'dark');
      document.body.classList.add(mode);
    }

    // Persist theme to localStorage with error handling
    try {
      localStorage.setItem('theme', mode);
    } catch (error) {
      console.warn('Failed to save theme to localStorage:', error);
    }
  }, [mode]);

  const toggleTheme = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  // Create a Material-UI theme object based on the current mode
  const muiTheme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          ...(mode === 'light'
            ? { // Light mode palette
                primary: { main: '#3b82f6' }, // Blue
                secondary: { main: '#6b7280' }, // Gray
                success: { main: '#22c55e' },
                warning: { main: '#f59e42' },
                error: { main: '#ef4444' },
                background: {
                  default: '#f3f4f6',
                  paper: '#ffffff',
                },
                text: {
                  primary: '#111827',
                  secondary: '#6b7280',
                },
              }
            : { // Dark mode palette
                primary: { main: '#6aa8f5' }, // Lighter blue
                secondary: { main: '#adb5bd' }, // Lighter gray
                success: { main: '#22c55e' },
                warning: { main: '#f59e42' },
                error: { main: '#ef4444' },
                background: {
                  default: '#121212',
                  paper: '#1e1e1e',
                },
                text: {
                  primary: '#e9ecef',
                  secondary: '#adb5bd',
                },
              }),
        },
        typography: {
          fontFamily: 'Inter, sans-serif',
        },
        components: {
          MuiCssBaseline: {
            styleOverrides: {
              body: {
                backgroundColor: mode === 'light' ? '#f3f4f6' : '#121212',
                color: mode === 'light' ? '#111827' : '#e9ecef',
              },
            },
          },
          MuiAppBar: {
            styleOverrides: {
              root: {
                backgroundColor: mode === 'light' ? '#ffffff' : '#1e1e1e',
                borderBottom: `1px solid ${mode === 'light' ? '#e5e7eb' : '#3e444a'}`,
              },
            },
          },
          MuiDrawer: {
            styleOverrides: {
              paper: {
                backgroundColor: mode === 'light' ? '#ffffff' : '#1e1e1e',
                borderRight: `1px solid ${mode === 'light' ? '#e5e7eb' : '#3e444a'}`,
              },
            },
          },
          MuiPaper: {
            styleOverrides: {
              root: {
                backgroundColor: mode === 'light' ? '#ffffff' : '#1e1e1e',
              },
            },
          },
          MuiList: {
            styleOverrides: {
              root: {
                backgroundColor: mode === 'light' ? '#ffffff' : '#1e1e1e',
              },
            },
          },
          MuiListItem: {
            styleOverrides: {
              root: {
                color: mode === 'light' ? '#475569' : '#adb5bd',
                '&.Mui-selected': {
                  color: mode === 'light' ? '#3b82f6' : '#6aa8f5',
                  backgroundColor: mode === 'light' ? '#e0f2fe' : 'rgba(106, 168, 245, 0.2)',
                  '& .MuiSvgIcon-root': {
                    color: mode === 'light' ? '#3b82f6' : '#6aa8f5',
                  },
                },
                '& .MuiSvgIcon-root': {
                  color: mode === 'light' ? '#475569' : '#adb5bd',
                },
              },
            },
          },
          MuiIconButton: {
            styleOverrides: {
              root: {
                color: mode === 'light' ? '#475569' : '#e9ecef',
              },
            },
          },
          MuiTypography: {
            styleOverrides: {
              root: {
                color: mode === 'light' ? '#111827' : '#e9ecef',
              },
            },
          },
          MuiTableCell: {
            styleOverrides: {
              root: {
                color: mode === 'light' ? '#111827' : '#e9ecef',
              },
            },
          },
        },
      }),
    [mode],
  );

  return (
    <ThemeContext.Provider value={{ theme: mode, toggleTheme }}>
      <MuiThemeProvider theme={muiTheme}>
        <CssBaseline /> {/* Normalize CSS and apply background color */}
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};
