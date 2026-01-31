import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../api/client';
import './LibrarianLogin.css'; // Custom styles extracted from the original CSS

const LibrarianLogin = () => {
  const [facultyId, setFacultyId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const togglePassword = () => setShowPassword(!showPassword);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.post('/api/auth/librarian-login', {
        facultyId,
        password,
      });

      const { token, user } = response.data;
      login(token, user);
      navigate('/librarian/dashboard');

    } catch (error) {
      console.error('Login failed:', error);
      // You can add a toast notification here to show the error to the user
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-container" style={{ fontFamily: "'Poppins', sans-serif" }}>
      {/* Left Section - Login Form */}
      <section className="login-section">
        <div className="login-content">
          
          <div className="welcome-text">
            <h1 id="welcomeTitle">Welcome Back</h1>
            <p id="welcomeSubtitle">Sign in to access your librarian dashboard and manage the digital collection</p>
          </div>
          <form id="loginForm" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="facultyId" className="form-label" id="facultyIdLabel">Faculty ID</label>
              <div className="input-wrapper">
                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                <input
                  type="text"
                  id="facultyId"
                  className="form-input"
                  placeholder="Faculty ID"
                  required
                  value={facultyId}
                  onChange={e => setFacultyId(e.target.value)}
                  aria-describedby="facultyIdLabel"
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label" id="passwordLabel">Password</label>
              <div className="input-wrapper">
                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  className="form-input"
                  placeholder="Enter your password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  aria-describedby="passwordLabel"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={togglePassword}
                  aria-label={showPassword ? "Hide Password" : "Show Password"}
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <path d="M6.72 16.32a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="form-options">
              <div className="remember-me">
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={() => setRememberMe(!rememberMe)}
                  aria-label="Remember me"
                />
                <label htmlFor="rememberMe">Remember me</label>
              </div>
              <Link to="/forgot-password" className="forgot-password" id="forgotPasswordLink">Forgot Password?</Link>
            </div>

            <button type="submit" className="login-button" id="loginButton" disabled={loading}>
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>
        </div>
      </section>

      {/* Right Section - Illustration */}
      <section className="illustration-section">
        <div className="glow-orb orb-1" aria-hidden="true"></div>
        <div className="glow-orb orb-2" aria-hidden="true"></div>

        {/* Bookshelf Background */}
        <div className="bookshelf-wall" aria-hidden="true">
          {/* Shelves and books (can be abstracted into components if desired) */}
          {[5, 28, 51, 74].map((top, idx) => (
            <div key={idx} className="shelf-row" style={{ top: `${top}%` }}>
              <div className="books">
                {[...Array(10)].map((_, i) => {
                  // Height and gradient colors based on original inline styles
                  const heights = [75, 85, 70, 90, 78, 82, 88, 75, 80, 85,
                    80, 88, 75, 85, 78, 90, 82, 76, 84, 80,
                    85, 78, 90, 82, 75, 88, 80, 76, 84, 82,
                    78, 85, 80, 88, 76, 84, 90, 82, 78, 86];
                  const colors = [
                    ['#d4af37', '#c19d2f'], ['#6b46c1', '#5a3ba1'], ['#8b5fc7', '#7348b3'], ['#c19d2f', '#a58825'], ['#6b46c1', '#5a3ba1'],
                    ['#d4af37', '#c19d2f'], ['#8b5fc7', '#7348b3'], ['#6b46c1', '#5a3ba1'], ['#c19d2f', '#a58825'], ['#8b5fc7', '#7348b3']
                  ];
                  const index = idx * 10 + i;
                  const height = heights[index] || 80;
                  const [startColor, endColor] = colors[i % 10];
                  const bg = `linear-gradient(135deg, ${startColor} 0%, ${endColor} 100%)`;

                  return <div key={i} className="book" style={{ height: `${height}%`, background: bg }} />;
                })}
              </div>
              <div className="shelf"></div>
            </div>
          ))}
        </div>

        {/* Librarian and Desk */}
        <div className="librarian-container" aria-hidden="true">
          <div className="circulation-desk">
            <div className="monitor">
              <div className="monitor-screen" />
            </div>
            <div className="desk-front" />
          </div>
          <div className="librarian">
            <div className="librarian-head">
              <div className="librarian-hair" />
              <div className="librarian-eyes">
                <div className="eye" />
                <div className="eye" />
              </div>
              <div className="librarian-face-smile" />
            </div>
            <div className="librarian-body">
              <div className="librarian-collar" />
            </div>
            <div className="librarian-arms">
              <div className="arm left">
                <div className="hand" />
              </div>
              <div className="arm right">
                <div className="hand" />
              </div>
            </div>
          </div>
        </div>

        {/* Floating Security Icons */}
        <div className="floating-icons" aria-hidden="true">
          <div className="floating-icon icon-key">
            <div className="security-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
              </svg>
            </div>
          </div>
          <div className="floating-icon icon-check">
            <div className="security-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
          </div>
          <div className="floating-icon icon-database">
            <div className="security-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <ellipse cx="12" cy="5" rx="9" ry="3" />
                <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
                <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
              </svg>
            </div>
          </div>
          <div className="floating-icon icon-shield">
            <div className="security-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default LibrarianLogin;
