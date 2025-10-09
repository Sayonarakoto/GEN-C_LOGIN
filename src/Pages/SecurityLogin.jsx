import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from '../hooks/useAuth';
import client from '../api/client';
import useToastService from '../hooks/useToastService';
import { Form, Button, InputGroup } from 'react-bootstrap';
import Logo from '../components/common/Logo';
import './Auth.css'; // Import the CSS file

const SecurityLogin = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const toast = useToastService();
  const [loading, setLoading] = useState(false);
  const [passkey, setPasskey] = useState('');
  const [showPasskey, setShowPasskey] = useState(false);

  const togglePasskeyVisibility = () => {
    setShowPasskey(!showPasskey);
  };

  const onFinish = async (event) => {
    event.preventDefault();
    setLoading(true);
    toast.info('Logging in...');
    try {
      const response = await client.post('/api/auth/login', {
        role: 'security',
        passkey: passkey,
      }, {
        timeout: 10000,
        headers: { 'X-Skip-Interceptor': true }
      });
      
      const { token, user } = response.data;
      
      if (!token) {
        throw new Error('No token received from server');
      }
      
      login(token, user);
      toast.success(response.data.message || 'Login successful!');
      navigate('/security-dashboard');
    } catch (error) {
      console.error("Login error:", error);
      const userMessage = error.response?.status === 401
        ? "Invalid passkey. Please try again."
        : "Login failed. Please try again later.";
      toast.error(userMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-container">
        <div className="auth-box">
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <Logo />
            <h2 style={{ marginTop: '1rem' }}>Security Portal</h2>
            <p>Please enter the security passkey to proceed.</p>
          </div>

          <Form onSubmit={onFinish}>
            <Form.Group className="mb-3" controlId="formPasskey">
              <Form.Label>Security Passkey</Form.Label>
              <InputGroup>
                <Form.Control
                  type={showPasskey ? "text" : "password"}
                  placeholder="Enter security passkey"
                  value={passkey}
                  onChange={(e) => setPasskey(e.target.value)}
                  required
                  size="lg"
                />
                <InputGroup.Text onClick={togglePasskeyVisibility} style={{ cursor: 'pointer' }}>
                  <i className={showPasskey ? "bx bx-hide" : "bx bx-show"}></i>
                </InputGroup.Text>
              </InputGroup>
            </Form.Group>

            <Button
              variant="primary"
              type="submit"
              size="lg"
              className="w-100 mt-3"
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default SecurityLogin;
