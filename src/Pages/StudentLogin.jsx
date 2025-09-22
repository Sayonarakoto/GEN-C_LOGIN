import React, { useState } from 'react';
import { Form, Input, Button, Typography, message, Alert } from 'antd';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios'; // Import axios
import LoginCard from '../components/common/LoginCard';

const { Title } = Typography;

const StudentLogin = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const onFinish = async (values) => {
    setLoading(true);
    setError(null); // Clear previous errors
    try {
      // Make axios post call directly
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/auth/login`, {
        role: 'student',
        studentId: values.studentId,
        password: values.password,
      });
      
      const { token } = response.data; // Extract token from response
      
      if (!token) {
        throw new Error('No token received from server');
      }
      
      login(token); // Call login from AuthContext with the token

      message.success('Login successful');
      message.success('Login successful');
      navigate('/student');
    } catch (error) {
      console.error('Login error:', error);
      setError(error.response?.data?.msg || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <LoginCard>
        <Title level={2} style={{ textAlign: 'center', marginBottom: '40px', color: 'var(--text-dark)' }}>Sign in</Title>
        <Form
          form={form}
          name="student_login"
          onFinish={onFinish}
          layout="vertical"
          onValuesChange={() => setError(null)} // Clear error on form change
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
            name="studentId"
            rules={[{ required: true, message: 'Please input your Student ID!' }]}
          >
            <Input placeholder="Student ID" />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Please input your password!' }]}
          >
            <Input.Password placeholder="Password" />
          </Form.Item>
          <div className="links">
            <Link to="/forgot-password" style={{ color: 'var(--text-light)' }}>Forgot Password</Link>
          </div>
          <Form.Item style={{ marginTop: '30px' }}>
            <Button type="primary" htmlType="submit" loading={loading} style={{ width: '100%' }}>
              Login
            </Button>
          </Form.Item>
        </Form>
      </LoginCard>
    </div>
  );
};

export default StudentLogin;
