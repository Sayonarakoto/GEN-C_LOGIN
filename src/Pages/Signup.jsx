import React, { useState } from 'react';
import { Form, Input, Button, Typography, message } from 'antd';
import { EyeOutlined, EyeInvisibleOutlined, MailOutlined, LockOutlined, UserOutlined } from '@ant-design/icons';
import axios from 'axios';
import StudentDashboard from '../Dashbaords/StudentDashboard'
import EmailInput from './EmailInput';
import { useNavigate } from 'react-router-dom';
const { Title, Text, Link } = Typography;

const Signin = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  // Handles the form submission using the provided API logic
  const onFinish = async (values) => {
    setLoading(true);
    console.log('Submitting with User ID:', values.studentId, 'and Password:', values.password);

    try {
      const response = await axios.post('http://localhost:3001/auth/signin', {
        studentId: values.studentId,
        password: values.password
      });

    message.success(response.data.message || 'Sign in successful!');
    setTimeout(() => {
      navigate('/student'); // 👈 This loads your student dashboard route
    }, 1000);

    } catch (error) {
      console.error('Sign in failed:', error);
      // Use Ant Design's message component instead of alert()
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
        backgroundColor: '#2c2c2c', // Dark background to match the image
        padding: '24px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '400px',
          padding: '40px',
          backgroundColor: '#3b3b3b', // Darker card background
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <Title level={2} style={{ color: '#ffffff', fontWeight: 600, margin: 0 }}>
            Sign in
          </Title>
          <div style={{ marginTop: '8px' }}>
            <Text style={{ color: '#a0a0a0' }}>
              Don't have an account?{' '}
              <Link href="#" style={{ color: '#1890ff' }}>
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
          {/* User ID Input Field (updated from Email) */}
          <Form.Item
            label={<span style={{ color: '#a0a0a0' }}>User ID</span>}
            name="studentId"
            rules={[{ required: true, message: 'Please input your User ID!' }]}
          >
            <Input
              prefix={<UserOutlined style={{ color: '#a0a0a0' }} />}
              placeholder="User ID"
              style={{ borderRadius: '8px', padding: '10px 14px' }}
            />
          </Form.Item>

          {/* Password Input Field */}
          <Form.Item
            label={<span style={{ color: '#a0a0a0' }}>Password</span>}
            name="password"
            rules={[{ required: true, message: 'Please input your Password!' }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#a0a0a0' }} />}
              placeholder="Password"
              iconRender={visible =>
                visible ? <EyeOutlined style={{ color: '#a0a0a0' }} /> : <EyeInvisibleOutlined style={{ color: '#a0a0a0' }} />
              }
              style={{ borderRadius: '8px', padding: '10px 14px' }}
            />
          </Form.Item>

          <div style={{ textAlign: 'right', marginBottom: '24px' }}>
            <Link href="/sent-reset" style={{ color: '#1890ff', fontSize: '12px' }}>
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
                backgroundColor: '#1890ff',
                borderColor: '#1890ff',
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
