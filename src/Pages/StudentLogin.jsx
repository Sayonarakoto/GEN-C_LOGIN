import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../api/client';
import { Eye, EyeSlash } from 'react-bootstrap-icons';
import { Container, Row, Col } from 'react-bootstrap';
import './StudentLogin.css';

const StudentLogin = () => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('idle');
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [btnText, setBtnText] = useState('Sign In');
  const navigate = useNavigate();
  const { login } = useAuth();

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const onFinish = async (event) => {
    event.preventDefault();
    setLoading(true);
    setStatus('processing');
    setBtnText('Signing In...');

    try {
      const response = await api.post(
        '/auth/login',
        { role: 'student', studentId, password },
        { headers: { 'X-Skip-Interceptor': true } }
      );

      const { token } = response.data;
      if (!token) throw new Error('No token received from server');

      login(token);
      setStatus('completed');
      setBtnText('✓ Success');

      setTimeout(() => {
        navigate('/student');
      }, 900);
    } catch (error) {
      console.error('Login error:', error);
      setStatus('error');
      setBtnText('Try Again');
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
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              </div>
              <h1 className="login-title">Student Login</h1>
              <p className="login-subtitle">
                Sign in to continue to your academic workspace.
              </p>
            </div>

            <form onSubmit={onFinish} className="space-y-5">
              <div>
                <label className="field-label" htmlFor="studentId">
                  Student ID
                </label>
                <input
                  id="studentId"
                  type="text"
                  className="glass-input w-full"
                  placeholder="Enter your student ID"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="field-label" htmlFor="password">
                  Password
                </label>
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
               

                <Link to="/forgot-password" className="forgot-link">
                  Forgot Password?
                </Link>
              </div>

              <button type="submit" disabled={loading} className={`login-btn ${status}`}>
                <span>{btnText}</span>
                {loading && <span className="btn-loader" />}
              </button>
            </form>
          </div>
        </Col>

        <Col xs={12} lg={7} className="login-visual-panel d-none d-lg-block">
          <img
            src="/images/Student.png"
            alt="Student Cover"
            className="cover-image"
          />

          <div className="visual-overlay" />

          <div className="visual-layer visual-layer-top">
            <div className="glass-chip">
              <span className="chip-dot" />
              Campus access ready
            </div>
          </div>

          <div className="visual-content">
            <div className="caption-strip">
              <span className="caption-kicker">GEN C</span>
              <h2>Access your campus world</h2>
              <p>
                Library passes, academic tools, and your dashboard in one seamless space.
              </p>
            </div>

            <div className="glass-mini-card card-left">
              <span className="mini-label">Status</span>
              <strong>{status === 'idle' ? 'Idle' : status === 'processing' ? 'Processing' : status === 'completed' ? 'Done' : 'Error'}</strong>
            </div>

            <div className="glass-mini-card card-right">
              <span className="mini-label">Next action</span>
              <strong>{status === 'idle' ? 'Sign in securely' : status === 'processing' ? 'Verifying...' : status === 'completed' ? 'Redirecting...' : 'Retry login'}</strong>
            </div>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default StudentLogin;