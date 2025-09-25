import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { ToastProvider } from './components/ToastProvider.jsx'; // New import
import { BrowserRouter as Router } from 'react-router-dom'; // Import Router here
import { AuthProvider } from './context/AuthContext.jsx'; // NEW

// Add these imports
import 'bootstrap/dist/css/bootstrap.min.css';
import 'boxicons/css/boxicons.min.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider> {/* New wrapper */}
            <App />
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  </StrictMode>,
);