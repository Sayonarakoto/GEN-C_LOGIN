import React, { useState } from 'react';
import { Form, Input, Button, Typography, message, Spin } from 'antd';
import { EyeOutlined, EyeInvisibleOutlined, MailOutlined, LockOutlined } from '@ant-design/icons';
// Ant Design CSS is not imported here to avoid compilation errors.
// All styles are applied using inline styles to maintain the look.

const { Title, Text, Link } = Typography;

const App = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // Handles the form submission
  const onFinish = async (values) => {
    setLoading(true);
    console.log('Form values:', values);

    try {
      // Simulate an API call for sign-in
      await new Promise(resolve => setTimeout(resolve, 2000));
      message.success('Sign in successful!');
      console.log('Sign in successful!');
    } catch (error) {
      message.error('Sign in failed. Please check your credentials.');
      console.error('Sign in failed:', error);
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
          {/* Email Input Field */}
          <Form.Item
            label={<span style={{ color: '#a0a0a0' }}>Email address</span>}
            name="email"
            rules={[{ required: true, message: 'Please input your Email!' }]}
          >
            <Input
              prefix={<MailOutlined style={{ color: '#a0a0a0' }} />}
              placeholder="hello@gmail.com"
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
            <Link href="#" style={{ color: '#1890ff', fontSize: '12px' }}>
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

export default App;