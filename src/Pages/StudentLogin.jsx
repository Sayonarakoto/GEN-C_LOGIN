import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../api/client';
import useToastService from '../hooks/useToastService';

// Import the glass-effect styles
import './Auth.css';

const StudentLogin = () => {
  const toast = useToastService();
  const [loading, setLoading] = useState(false);
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const onFinish = async (event) => {
    event.preventDefault();
    setLoading(true);
    toast.info('Logging in...');
    try {
      const response = await api.post('/auth/login', {
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
            <h2>Sign in</h2>
            
            <div className="inputBox">
              <input
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                required
              />
              <span>Student ID</span>
            </div>

            <div className="inputBox">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <span>Password</span>
            </div>

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
