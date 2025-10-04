import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from '../hooks/useAuth';
import client from '../api/client';
import useToastService from '../hooks/useToastService';

// Import the new light-theme styles
import './Auth.css';

function FacultyLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const toast = useToastService();
  const [loading, setLoading] = useState(false);
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');

  const handleLoginSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    toast.info('Logging in...');
    try {
      const response = await client.post('/auth/faculty-login', {
        employeeId: employeeId,
        password: password,
      }, {
        headers: { 'X-Skip-Interceptor': true }
      });
      
      const newToken = response.data.token;
      const userObject = response.data.faculty; // This object has designation: 'hod'

      if (!newToken) {
        throw new Error('No token received from server');
      }
      
      login(newToken, userObject); // Call the context login function with BOTH pieces of data
      toast.success(response.data.message || 'Login successful!');

      // CRITICAL: Use the FRESH user data to make the immediate routing decision
      const finalRole = userObject.designation.toUpperCase(); // Use the designation from the response

      if (finalRole === 'HOD') {
          navigate('/faculty/'); // Use the base path /faculty/
      } else if (finalRole === 'FACULTY') {
          navigate('/faculty/'); // Use the base path /faculty/
      } else {
          navigate('/');
      }
      
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.response?.data?.msg || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-container">
        <div className="auth-box">
          <form onSubmit={handleLoginSubmit}>
            <h2>Faculty Login</h2>
            
            <div className="inputBox">
              <input
                type="text"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                required
              />
              <span>Employee ID</span>
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
              <Link to="/forgot-password">Forgot Password?</Link>
              <Link to="/register">New user? Register here</Link>
            </div>

            <button type="submit" className="ant-btn-primary" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default FacultyLogin;