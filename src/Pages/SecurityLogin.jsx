import React, { useState } from "react";
import { Form, Input, Button, Typography, message, Alert } from "antd";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import client from '../api/client';
import LoginCard from '../components/common/LoginCard';
import gencLogo from '../assets/genc-logo.png'; // Import the logo

const { Title, Text } = Typography;

const SecurityLogin = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const onFinish = async (values) => {
    setLoading(true);
    setError(null);
    try {
      const response = await client.post('/auth/security-login', {
        passkey: values.passkey,
      });
      
      const { token } = response.data; // Extract token from response
      
      if (!token) {
        throw new Error('No token received from server');
      }
      
      login(token); // Call login from AuthContext with the token

      message.success('Login successful');
      navigate("/security-dashboard");
    } catch (error) {
      console.error("Login error:", error);
      // Log the actual error for debugging
      console.error("Login error details:", error.response?.data);
      // Display generic message to user
      const userMessage = error.response?.status === 401
        ? "Invalid passkey. Please try again."
        : "Login failed. Please try again later.";
      setError(userMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <LoginCard>
        <div style={{ textAlign: 'center' }}>
          <img src={gencLogo} alt="Genc Logo" style={{ width: '100px', marginBottom: '1rem' }} />
          <Title level={2} style={{ color: 'var(--text-dark)' }}>
            Security Portal
          </Title>
          <Text style={{ color: 'var(--text-light)' }}>
            Please enter the security passkey to proceed.
          </Text>
        </div>

        <Form
          form={form}
          name="security_login"
          onFinish={onFinish}
          layout="vertical"
          onValuesChange={() => setError(null)}
          style={{ marginTop: '30px' }}
        >
          {error && (
            <Form.Item style={{ marginBottom: 24 }}>
              <Alert
                message="Login Failed"
                description={error}
                type="error"
                showIcon
              />
            </Form.Item>
          )}
          <Form.Item
            name="passkey"
            rules={[{ required: true, message: "Please input the passkey!" }]}
          >
            <Input.Password
              size="large"
              placeholder="Enter security passkey"
            />
          </Form.Item>

          <Form.Item style={{ marginTop: '30px' }}>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              block
              loading={loading}
              style={{ width: '100%' }}
            >
              Login
            </Button>
          </Form.Item>
        </Form>
      </LoginCard>
    </div>
  );
};

export default SecurityLogin;

