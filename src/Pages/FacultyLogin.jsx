import React, { useState } from "react";
import { Form, Input, Button, Typography, message, Alert } from "antd";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import client from '../api/client';
import LoginCard from '../components/common/LoginCard';

const { Title, Text, Link } = Typography;

function FacultyLogin() {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const onFinish = async (values) => {
    setLoading(true);
    setError(null);
    try {
      const response = await client.post('/auth/faculty-login', {
        employeeId: values.employeeId,
        password: values.password,
      });
      
      const { token } = response.data; // Extract token from response
      
      if (!token) {
        throw new Error('No token received from server');
      }
      
      login(token); // Call login from AuthContext with the token

      message.success('Login successful');
      setTimeout(() => {
        navigate('/faculty');
      }, 5000); // 5-second delay
    } catch (error) {
      console.error('Login error:', error);
      setError(error.response?.data?.msg || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordClick = () => {
    navigate("/forgot-password");
  };
  const handleGetStartedClick = () => {
    navigate("/register");
  };

  return (
    <div className="login-container">
      <LoginCard>
        <Title level={2} style={{ textAlign: 'center', marginBottom: '40px', color: 'var(--text-dark)' }}>Faculty Login</Title>
        <div style={{ marginTop: "8px", textAlign: 'center' }}>
          <Text style={{ color: "var(--text-light)" }}>
            Don’t have an account?{" "}
            <Link
              onClick={handleGetStartedClick}
              style={{ color: "var(--primary-blue)", cursor: "pointer" }}
            >
              Get started
            </Link>
          </Text>
        </div>
        <Form
          form={form}
          name="faculty_login"
          onFinish={onFinish}
          layout="vertical"
          requiredMark={false}
          onValuesChange={() => setError(null)}
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
            label={<span style={{ color: "var(--text-dark)" }}>Employee ID</span>}
            name="employeeId"
            rules={[
              { required: true, message: "Please enter your Employee ID." },
            ]}
          >
            <Input placeholder="Enter your Employee ID" />
          </Form.Item>

          <Form.Item
            label={<span style={{ color: "var(--text-dark)" }}>Password</span>}
            name="password"
            rules={[{ required: true, message: "Please enter your password." }]}
          >
            <Input.Password placeholder="Enter your password" />
          </Form.Item>

          <div className="text-center" style={{ marginTop: '20px' }}>
            <Link
              onClick={handleForgotPasswordClick}
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
}

export default FacultyLogin;
