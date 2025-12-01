import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from '../hooks/useAuth';
import client from '../api/client';

import { InputGroup, FormControl, Button, FloatingLabel } from 'react-bootstrap';
import { Eye, EyeSlash } from 'react-bootstrap-icons';
import './FacultyLogin.css'; // Import the new CSS file

function FacultyLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleLoginSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await client.post('/api/auth/login', {
        role: 'faculty',
        employeeId,
        password,
      }, {
        headers: { 'X-Skip-Interceptor': true }
      });
      
      const newToken = response.data.token;
      const userObject = response.data.user;

      if (!newToken) {
        throw new Error('No token received from server');
      }
      
      login(newToken, userObject);

      const finalRole = userObject.designation.toUpperCase();
      if (finalRole === 'HOD' || finalRole === 'FACULTY') {
          navigate('/faculty/');
      } else {
          navigate('/');
      }
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="illustration-panel">
        <div className="floating-elements">
          <svg className="floating-icon icon-book" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
          <svg className="floating-icon icon-pen" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 19l7-7 3 3-7 7-3-3z" />
            <path d="M18 13l-1.5-7.5L2 2l7.5 1.5L18 13z" />
            <path d="M2 2l7.5 7.5" />
          </svg>
          <svg className="floating-icon icon-globe" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
        </div>
        <div className="main-illustration">
          <svg className="main-icon icon-graduation-cap" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.43 10.91L12 2 2.57 10.91 12 20l9.43-9.09z" />
            <line x1="12" y1="2" x2="12" y2="20" />
            <line x1="2.57" y1="10.91" x2="21.43" y2="10.91" />
            <line x1="12" y1="20" x2="12" y2="22" />
            <line x1="7" y1="20" x2="17" y2="20" />
          </svg>
        </div>
      </div>
      <div className="login-panel">
        <div className="logo-area">
          <h1>Faculty Portal</h1>
          <p>Empowering Education Through Knowledge</p>
        </div>
        <form onSubmit={handleLoginSubmit}>
          <div className="form-group">
            <label htmlFor="employeeId">Employee ID</label>
            <input 
              id="employeeId"
              type="text"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              required 
              aria-label="Faculty Employee ID"
            />
          </div>
          <InputGroup className="form-group password-input">
            <FloatingLabel controlId="floatingPassword" label="Password">
              <FormControl
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                aria-label="Password"
              />
            </FloatingLabel>
            <Button variant="outline-secondary" onClick={togglePasswordVisibility} aria-label={showPassword ? "Hide password" : "Show password"}>
              {showPassword ? <EyeSlash /> : <Eye />}
            </Button>
          </InputGroup>
          <div className="links">
            <Link to="/forgot-password">Forgot Password?</Link>
              <Link to="/register">New user? Register here</Link>
          </div>
          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In to Portal'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default FacultyLogin;
