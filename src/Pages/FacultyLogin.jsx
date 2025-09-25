import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from '../hooks/useAuth'; // Import useAuth from hooks
import client from '../api/client';
import LoginCard from '../components/common/LoginCard';
import { Form, Button } from 'react-bootstrap'; // Import Bootstrap components
import useToastService from '../hooks/useToastService'; // Import ToastService
import { Link } from 'react-router-dom'; // Import Link from react-router-dom

function FacultyLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const toast = useToastService(); // Initialize toast service
  const [loading, setLoading] = useState(false);
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');

  const onFinish = async (event) => {
    event.preventDefault(); // Prevent default form submission
    setLoading(true);
    toast.info('Logging in...'); // Show info toast
    try {
      const response = await client.post('/auth/faculty-login', {
        employeeId: employeeId,
        password: password,
      });
      
      const { token } = response.data;
      
      if (!token) {
        throw new Error('No token received from server');
      }
      
      login(token);
      toast.success(response.data.message || 'Login successful!');
      navigate('/faculty');
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.response?.data?.msg || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  
  

  return (
    <div className="login-container">
      <LoginCard>
        <h2 style={{ textAlign: 'center', marginBottom: '40px', color: 'var(--text-dark)' }}>Faculty Login</h2>
        <div style={{ marginTop: "8px", textAlign: 'center' }}>
          <p style={{ color: "var(--text-light)" }}>
            Don’t have an account?{" "}
            <Link
              to="/register"
              style={{ color: 'var(--primary-blue)', cursor: 'pointer' }}
            >
              <i className="bx bx-user-plus" style={{ marginRight: '5px' }}></i> Get started
            </Link>
          </p>
        </div>
        <Form onSubmit={onFinish}>
          <Form.Group className="mb-3" controlId="formEmployeeId">
            <Form.Label style={{ color: "var(--text-dark)" }}>Employee ID</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter your Employee ID"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="formPassword">
            <Form.Label style={{ color: "var(--text-dark)" }}>Password</Form.Label>
            <Form.Control
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </Form.Group>

          <div className="text-center" style={{ marginTop: '20px' }}>
            <Link
              to="/forgot-password"
              style={{
                color: "var(--text-light)",
                fontWeight: 500,
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              Forgot Password?
            </Link>
          </div>

          <div style={{ marginTop: '30px' }}>
            <Button
              variant="primary"
              type="submit"
              size="lg"
              className="w-100"
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </div>
        </Form>
      </LoginCard>
    </div>
  );
}

export default FacultyLogin;

