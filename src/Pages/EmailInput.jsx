import React, { useState } from "react";
import { Input, Button, Spin, message, Typography, Alert } from "antd";
import axios from "axios";

const { Title, Text } = Typography;

const EmailInput = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setEmail(e.target.value);
  };

  const handleSubmit = async () => {
    if (!isValidEmail(email)) {
      message.error("Please enter a valid email!");
      return;
    }

    setLoading(true);
    try {
      await axios.post("http://localhost:3001/auth/send-reset", {
        email: email,
      });
      setSubmitted(true);
      message.success("✅ A new password reset email has been sent!");
    } catch (err) {
      console.error(err);
      message.error("❌ Something went wrong. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Basic email regex
  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  return (
    <div className="container mt-5 p-4 shadow rounded bg-white" style={{ maxWidth: "420px" }}>
      <Title level={3} className="text-center mb-3">
        Forgot Password?
      </Title>
      <Text type="secondary" className="d-block text-center mb-4">
        Enter your email and we’ll send you a link to reset your password.
      </Text>

      {!submitted ? (
        <>
          <Input
            type="email"
            value={email}
            onChange={handleChange}
            placeholder="Enter your email"
            size="large"
            allowClear
            disabled={loading}
            className="mb-3"
          />

          <Button
            type="primary"
            onClick={handleSubmit}
            disabled={!isValidEmail(email) || loading}
            block
            size="large"
          >
            {loading ? (
              <>
                <Spin size="small" className="me-2" /> Sending...
              </>
            ) : (
              "Send Reset Link"
            )}
          </Button>
        </>
      ) : (
        <>
          <Alert
            message="✅ Check your email"
            description="If an account with this email exists, you’ll receive a password reset link shortly."
            type="success"
            showIcon
          />
          <Button
            className="mt-3"
            type="default"
            onClick={handleSubmit}
            disabled={loading}
            block
            size="large"
          >
            {loading ? (
              <>
                <Spin size="small" className="me-2" /> Resending...
              </>
            ) : (
              "Resend Email"
            )}
          </Button>
        </>
      )}
    </div>
  );
};

export default EmailInput;
