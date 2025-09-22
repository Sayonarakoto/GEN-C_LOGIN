import React, { useState } from "react";
import api from "../api/client";
import { Input, Button, Spin, message, Typography, Alert, Form } from "antd";
import LoginCard from '../components/common/LoginCard';

const { Title, Text } = Typography;

const ForgotPassword = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (values) => {
    if (!isValidEmail(values.email)) {
      message.error("Please enter a valid email!");
      return;
    }

    setLoading(true);
    try {
      await api.post('/api/forgot-password', {
        email: values.email,
      });
      setSubmitted(true);
      message.success("✅ A new password reset email has been sent!");
    } catch (err) {
      console.error(err);
      const errorMessage = err.response?.data?.message || "❌ Something went wrong. Please try again later.";
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Basic email regex
  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  return (
    <div className="login-container">
      <LoginCard>
        <Title level={3} style={{ textAlign: 'center', marginBottom: '16px', color: 'var(--text-dark)' }}>
          Forgot Password?
        </Title>
        <Text style={{ display: 'block', textAlign: 'center', marginBottom: '24px', color: 'var(--text-light)' }}>
          Enter your email and we’ll send you a link to reset your password.
        </Text>

        {!submitted ? (
                    <Form form={form} onFinish={handleSubmit} layout="vertical">
            <Form.Item
              name="email"
              rules={[
                { required: true, message: 'Please input your email!' },
                { type: 'email', message: 'Please enter a valid email!' }
              ]}
            >
              <Input
                placeholder="Enter your email"
                size="large"
                allowClear
                disabled={loading}
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                disabled={!form.getFieldValue('email') || !isValidEmail(form.getFieldValue('email')) || loading}
                block
                size="large"
              >
                {loading ? (
                  <>
                    <Spin size="small" style={{ marginRight: '8px' }} /> Sending...
                  </>
                ) : (
                  "Send Reset Link"
                )}
              </Button>
            </Form.Item>
          </Form>
        ) : (
          <>
            <Alert
              message="✅ Check your email"
              description="If an account with this email exists, you’ll receive a password reset link shortly."
              type="success"
              showIcon
            />
            <Button
              style={{ marginTop: '24px' }}
              type="default"
              onClick={() => handleSubmit(form.getFieldsValue())}
              disabled={loading}
              block
              size="large"
            >
              {loading ? (
                <>
                  <Spin size="small" style={{ marginRight: '8px' }} /> Resending...
                </>
              ) : (
                "Resend Email"
              )}
            </Button>
          </>
        )}
      </LoginCard>
    </div>
  );
};

export default ForgotPassword;