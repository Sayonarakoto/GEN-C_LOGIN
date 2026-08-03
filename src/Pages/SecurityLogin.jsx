import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from '../hooks/useAuth';
import client from '../api/client';
import useToastService from '../hooks/useToastService';
import '../Pages/Auth.css';
import { Form, InputGroup } from 'react-bootstrap';
import AuthShell from '../components/common/AuthShell';
import AuthField from '../components/common/AuthField';
import AuthSubmitButton from '../components/common/AuthSubmitButton';


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
      const response = await client.post('/auth/login', {
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
    <AuthShell
      title="Security Portal"
      subtitle="Please enter the security passkey to proceed."
      sideTitle="Secure campus operations"
      sideDescription="Manage verification and access workflows from one central point."
    >
      <Form onSubmit={onFinish}>
        <AuthField
          id="formPasskey"
          label="Security Passkey"
          type={showPasskey ? 'text' : 'password'}
          value={passkey}
          onChange={(e) => setPasskey(e.target.value)}
          placeholder="Enter security passkey"
          required
        >
          <InputGroup.Text onClick={togglePasskeyVisibility} style={{ cursor: 'pointer' }}>
            <i className={showPasskey ? 'bx bx-hide' : 'bx bx-show'}></i>
          </InputGroup.Text>
        </AuthField>

        <AuthSubmitButton loading={loading}>Login</AuthSubmitButton>
      </Form>
    </AuthShell>
  );
};

export default SecurityLogin;
