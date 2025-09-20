import React, { useState } from 'react';
import { Form, Input, Button, Typography, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/auth-hooks';
import axios from 'axios'; // Import axios

const { Title } = Typography;

const StudentLogin = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    setLoading(true);
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
      navigate('/student');
    } catch (error) {
      console.error('Login error:', error);
      message.error(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#F9FAFB',
        padding: '24px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '400px',
          padding: '40px',
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          boxShadow: '0 6px 20px rgba(0, 0, 0, 0.06)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <Title level={2} style={{ color: '#111827', fontWeight: 600, margin: 0 }}>
            Sign in
          </Title>
          
        </div>

        <Form
          form={form}
          name="student_login"
          onFinish={onFinish}
          layout="vertical"
        >
          <Form.Item
            label="Student ID"
            name="studentId"
            rules={[{ required: true, message: 'Please input your Student ID!' }]}
          >
            <Input size="large" placeholder="Enter your Student ID" />
          </Form.Item>

          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true, message: 'Please input your password!' }]}
          >
            <Input.Password size="large" placeholder="Enter your password" />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              block
              loading={loading}
            >
              Login
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default StudentLogin;
