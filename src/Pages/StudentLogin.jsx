import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../api/client';
import useToastService from '../hooks/useToastService';
import { InputGroup, FormControl, Button, FloatingLabel } from 'react-bootstrap';
import { Eye, EyeSlash } from 'react-bootstrap-icons';

// Import the glass-effect styles
import './Auth.css';

const StudentLogin = () => {
  const toast = useToastService();
  const [loading, setLoading] = useState(false);
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const onFinish = async (event) => {
    event.preventDefault();
    setLoading(true);
    toast.info('Logging in...');
    try {
      const response = await api.post('/api/auth/login', {
        role: 'student',
        studentId: studentId,
        password: password,
      }, {
        headers: { 'X-Skip-Interceptor': true }
      });

      const { token } = response.data;
      if (!token) {
        throw new Error('No token received from server');
      }

      login(token);
      toast.success(response.data.message || 'Login successful!');
      navigate('/student');
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.response?.data?.msg || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  // The new structure uses divs and classes from Auth.css
  return (
    <div className="auth-page-wrapper">
      <div className="auth-container">
        <div className="auth-box">
          <form onSubmit={onFinish}>
            <h2>Student Login</h2>
            
            <div className="inputBox">
              <input
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                required
              />
              <span>Student ID</span>
            </div>

            <InputGroup className="mb-3 inputBox">
              <FloatingLabel
                controlId="floatingPassword"
                label="Password"
              >
                <FormControl
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </FloatingLabel>
              <Button variant="outline-secondary" onClick={togglePasswordVisibility}>
                {showPassword ? <EyeSlash /> : <Eye />}
              </Button>
            </InputGroup>

            <div className="links">
              <Link to="/forgot-password">Forgot Password</Link>
            </div>

            <button type="submit" className="ant-btn-primary" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StudentLogin;
