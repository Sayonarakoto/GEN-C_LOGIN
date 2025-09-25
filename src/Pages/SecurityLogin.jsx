import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from '../hooks/useAuth'; // Import useAuth from hooks
import client from '../api/client';
import LoginCard from '../components/common/LoginCard';
import { Form, Button } from 'react-bootstrap'; // Import Bootstrap components
import useToastService from '../hooks/useToastService'; // Import ToastService

const SecurityLogin = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const toast = useToastService(); // Initialize toast service
  const [loading, setLoading] = useState(false);
  const [passkey, setPasskey] = useState('');

  const onFinish = async (event) => {
    event.preventDefault(); // Prevent default form submission
    setLoading(true);
    toast.info('Logging in...'); // Show info toast
    try {
      const response = await client.post('/auth/security-login', {
        passkey: passkey,
      }, {
        timeout: 10000,
        headers: { 'X-Skip-Interceptor': true }
      });
      
      const { token } = response.data;
      
      if (!token) {
        throw new Error('No token received from server');
      }
      
      login(token);
      toast.success(response.data.message || 'Login successful!');
      navigate('/security-dashboard');
    } catch (error) {
      console.error("Login error:", error);
      console.error("Login error details:", error.response?.data);
      const userMessage = error.response?.status === 401
        ? "Invalid passkey. Please try again."
        : "Login failed. Please try again later.";
      toast.error(userMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <LoginCard>
        <div style={{ textAlign: 'center' }}>
          <img src={'/images/genc-log.jpeg'} alt="Genc Logo" style={{ width: '100px', marginBottom: '1rem' }} />
          <h2 style={{ color: 'var(--text-dark)' }}>
            Security Portal
          </h2>
          <p style={{ color: 'var(--text-light)' }}>
            Please enter the security passkey to proceed.
          </p>
        </div>

        <Form onSubmit={onFinish}>
          <Form.Group className="mb-3" controlId="formPasskey">
            <Form.Label>Security Passkey</Form.Label>
            <Form.Control
              type="password"
              placeholder="Enter security passkey"
              value={passkey}
              onChange={(e) => setPasskey(e.target.value)}
              required
              size="lg"
            />
          </Form.Group>

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
};

export default SecurityLogin;