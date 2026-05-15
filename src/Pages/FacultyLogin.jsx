import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../api/client';
import { Eye, EyeSlash } from 'react-bootstrap-icons';
import { Container, Row, Col } from 'react-bootstrap';
import './FacultyLogin.css';

const FacultyLogin = () => {
  const [loading, setLoading] = useState(false);
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState('idle');
  const navigate = useNavigate();
  const { login } = useAuth();

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const handleLoginSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setStatus('processing');
    try {
      const response = await api.post('/api/auth/login', {
        role: 'faculty',
        employeeId,
        password,
      }, {
        headers: { 'X-Skip-Interceptor': true }
      });
      
      const { token, user } = response.data;
      if (!token) throw new Error('No token received');
      
      login(token, user);
      setStatus('completed');
      
      setTimeout(() => {
        const finalRole = user.designation.toUpperCase();
        navigate(finalRole === 'HOD' || finalRole === 'FACULTY' ? '/faculty/' : '/');
      }, 900);
    } catch (error) {
      console.error('Login error:', error);
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container fluid className="login-shell p-0">
      <Row className="g-0 min-vh-100">
        <Col xs={12} lg={5} className="login-form-panel">
          <div className="glass-card">
            <div className="task-badge">
              <span className={`status-dot ${status}`} />
              <span>
                {status === 'idle' && 'Awaiting input'}
                {status === 'processing' && 'Processing credentials'}
                {status === 'completed' && 'Access granted'}
                {status === 'error' && 'Authentication failed'}
              </span>
            </div>

            <div className="mb-6 text-center">
              <div className="brand-mark">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="#0f172a" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
              <h1 className="login-title">Faculty Access</h1>
              <p className="login-subtitle">
                Sign in to manage your academic department.
              </p>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-5">
              <div>
                <label className="field-label" htmlFor="employeeId">Employee ID</label>
                <input
                  id="employeeId"
                  type="text"
                  className="glass-input w-full"
                  placeholder="Enter your employee ID"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="field-label" htmlFor="password">Password</label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    className="glass-input w-full pr-14"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="eye-icon"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <Link to="/forgot-password" className="forgot-link">Forgot Password?</Link>
              </div>

              <button type="submit" disabled={loading} className={`login-btn ${status}`}>
                <span>{loading ? 'Signing In...' : 'Sign In'}</span>
                {loading && <span className="btn-loader" />}
              </button>
            </form>
          </div>
        </Col>

        <Col xs={12} lg={7} className="login-visual-panel d-none d-lg-block">
          <div className="visual-overlay" />
          <div className="visual-content">
            <div className="caption-strip">
              <span className="caption-kicker">GEN C</span>
              <h2>Manage your department</h2>
              <p>Streamline workflows, manage gate passes, and monitor academic progress.</p>
            </div>
            
            {/* Animated SVG Icons */}
            <div className="animated-icons">
               <svg className="anim-icon icon-book" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>
               <svg className="anim-icon icon-pen" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 19l7-7 3 3-7 7-3-3zM18 13l-1.5-7.5L2 2l7.5 1.5L18 13zM2 2l7.5 7.5" /></svg>
            </div>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default FacultyLogin;
