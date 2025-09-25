import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { ToastProvider } from './components/ToastProvider.jsx'; // New import

// Add these imports
import 'bootstrap/dist/css/bootstrap.min.css';
import 'boxicons/css/boxicons.min.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
      <ThemeProvider>
        <ToastProvider> {/* New wrapper */}
          <App />
        </ToastProvider>
      </ThemeProvider>
  </StrictMode>,
);