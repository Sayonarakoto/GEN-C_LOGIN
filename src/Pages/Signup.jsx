import React, { useState } from 'react';
import { Form, Input, Button, Typography, message } from 'antd';
import {
  EyeOutlined,
  EyeInvisibleOutlined,
  LockOutlined,
  UserOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const { Title, Text, Link } = Typography;

const Signin = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    console.log('Submitting with User ID:', values.studentId, 'and Password:', values.password);
    try {
      const response = await axios.post('http://localhost:3001/auth/signin', {
        studentId: values.studentId,
        password: values.password,
      });
      message.success(response.data.message || 'Sign in successful!');
      setTimeout(() => {
        navigate('/student');
      }, 1000);
    } catch (error) {
      console.error('Sign in failed:', error);
      message.error('Sign in failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const onFinishFailed = (errorInfo) => {
    console.log('Failed:', errorInfo);
    message.error('Please fill out all the required fields correctly.');
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#F9FAFB', // Off White Background
        padding: '24px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '400px',
          padding: '40px',
          backgroundColor: '#FFFFFF', // White Login Box
          borderRadius: '12px',
          boxShadow: '0 6px 20px rgba(0, 0, 0, 0.06)', // Soft subtle shadow
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <Title level={2} style={{ color: '#111827', fontWeight: 600, margin: 0 }}>
            Sign in
          </Title>
          <div style={{ marginTop: '8px' }}>
            <Text style={{ color: '#6B7280' }}>
              Don’t have an account?{' '}
              <Link href="#" style={{ color: '#2563EB' }}>
                Get started
              </Link>
            </Text>
          </div>
        </div>

        <Form
          form={form}
          name="basic"
          initialValues={{ remember: true }}
          onFinish={onFinish}
          onFinishFailed={onFinishFailed}
          layout="vertical"
        >
          {/* User ID */}
          <Form.Item
            label={<span style={{ color: '#111827' }}>User ID</span>}
            name="studentId"
            rules={[{ required: true, message: 'Please input your User ID!' }]}
          >
            <Input
              prefix={<UserOutlined style={{ color: '#6B7280' }} />}
              placeholder="User ID"
              style={{
                borderRadius: '8px',
                padding: '12px 16px',
                border: '1px solid #D1D5DB',
              }}
            />
          </Form.Item>

          {/* Password */}
          <Form.Item
            label={<span style={{ color: '#111827' }}>Password</span>}
            name="password"
            rules={[{ required: true, message: 'Please input your Password!' }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#6B7280' }} />}
              placeholder="Password"
              iconRender={(visible) =>
                visible ? (
                  <EyeOutlined style={{ color: '#6B7280' }} />
                ) : (
                  <EyeInvisibleOutlined style={{ color: '#6B7280' }} />
                )
              }
              style={{
                borderRadius: '8px',
                padding: '12px 16px',
                border: '1px solid #D1D5DB',
              }}
            />
          </Form.Item>

          <div style={{ textAlign: 'right', marginBottom: '20px' }}>
            <Link href="/sent-reset" style={{ color: '#2563EB', fontSize: '13px' }}>
              Forgot password?
            </Link>
          </div>

          {/* Submit Button */}
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              style={{
                width: '100%',
                height: '48px',
                borderRadius: '8px',
                fontWeight: 600,
                backgroundColor: '#2563EB', // Royal Blue Button
                border: 'none',
                color: '#FFFFFF', // White Text
              }}
            >
              Sign in
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default Signin;
