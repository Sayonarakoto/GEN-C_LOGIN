import React, { useState } from "react";
import { Form, Input, Button, Typography, message } from "antd";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/auth-hooks";
import client from '../api/client';
import "bootstrap/dist/css/bootstrap.min.css";
import "./Frontpage.css";
import gencLogo from '../assets/genc-logo.png'; // Import the logo

const { Title, Text } = Typography;

const SecurityLogin = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const response = await client.post('/auth/security-login', {
        passkey: values.passkey,
      });
      if (response.data.success) {
        message.success(response.data.message);
        login(response.data.token);
        navigate("/security-dashboard");
      } else {
        message.error(response.data.message);
      }
    } catch (error) {
      console.error("Login error:", error);
      message.error(error.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box text-center">
        <img src={gencLogo} alt="Genc Logo" style={{ width: '100px', marginBottom: '1rem' }} />
        <Title level={2} className="auth-title">
          Security Portal
        </Title>
        <Text className="auth-sub">
          Please enter the security passkey to proceed.
        </Text>

        <Form
          form={form}
          name="security_login"
          onFinish={onFinish}
          layout="vertical"
          className="auth-form"
        >
          <Form.Item
            name="passkey"
            rules={[{ required: true, message: "Please input the passkey!" }]}
          >
            <Input.Password
              size="large"
              placeholder="Enter security passkey"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              block
              loading={loading}
              className="login-btn"
            >
              Login
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default SecurityLogin;