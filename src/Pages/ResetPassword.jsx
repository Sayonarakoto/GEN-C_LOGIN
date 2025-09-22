import React, { useState, useEffect } from "react";
import api from '../api/client';
import { Form, Input, Button, message, Typography } from 'antd';
import LoginCard from '../components/common/LoginCard';
import { useParams, useNavigate } from 'react-router-dom'; // Import useParams and useNavigate

const { Title, Text } = Typography;

function ResetPassword() { // Renamed from Forgetpass to ResetPassword
  const [form] = Form.useForm();
  const { token } = useParams(); // Get token from URL params
  const navigate = useNavigate(); // For navigation after reset

  // State variables
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false); // Added loading state

  // Use a useEffect hook to get the email and token from the URL (token is now from useParams)
  useEffect(() => {
    // No need to get email from URL here, as it's not used in this component's logic
    // The token is directly from useParams
    if (!token) {
      setError("❌ Invalid or expired password reset link.");
    }
  }, [token]); // Depend on token

  const handleSubmit = async (values) => {
    // Basic validation
    if (values.newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      setSuccess("");
      return;
    }

    if (values.newPassword !== values.confirmPassword) {
      setError("Passwords do not match.");
      setSuccess("");
      return;
    }

    // Check if token is present before making the request
    if (!token) {
        setError("❌ Invalid or missing token.");
        return;
    }

    setLoading(true); // Set loading to true
    // If validation passes, make the API call
    try {
      // Use the correct API endpoint for reset password
      const response = await api.post(`/api/reset-password/${encodeURIComponent(token)}`, {
        newPassword: values.newPassword
      });

      // Handle successful response
      setError("");
      setSuccess(response.data.message || "✅ Password reset successful!");
      message.success(response.data.message || "Password reset successful!"); // Antd message
      form.resetFields();
      setTimeout(() => {
        navigate('/student-login'); // Redirect to login page after a delay
      }, 3000); // 3-second delay

    } catch (err) {
      // Handle error response
      const errorMessage = err.response?.data?.message || "❌ Error resetting password.";
      setError(errorMessage);
      setSuccess("");
      message.error(errorMessage); // Antd message
    } finally {
      setLoading(false); // Set loading to false
    }
  };

  return (
    <div className="login-container">
      <LoginCard>
        <Title level={1} style={{ textAlign: 'center', color: 'var(--text-dark)' }}>Reset Password</Title> {/* Changed title */}
        <Text style={{ textAlign: 'center', display: 'block', marginBottom: '24px', color: 'var(--text-light)' }}>Please enter your new password below.</Text>
        <Text style={{ textAlign: 'center', display: 'block', marginBottom: '24px', color: 'var(--text-light)', fontSize: '0.85em' }}>Password must be at least 6 characters long.</Text>

        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item
            name="newPassword"
            rules={[{ required: true, message: 'Please input your new password!' }]}
          >
            <Input.Password placeholder="Enter new password" />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            rules={[{ required: true, message: 'Please confirm your new password!' }]}
          >
            <Input.Password placeholder="Confirm new password" />
          </Form.Item>

          {error && <p style={{ color: 'var(--error-red)' }}>{error}</p>}
          {success && <p style={{ color: 'var(--success-green)' }}>{success}</p>}

          <Form.Item shouldUpdate>
            {() => (
              <Button
                type="primary"
                htmlType="submit"
                block
                disabled={
                  loading ||
                  !form.isFieldsTouched(['newPassword', 'confirmPassword'], true) ||
                  !!form.getFieldsError().filter(({ errors }) => errors.length).length
                }
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </Button>
            )}
          </Form.Item>
        </Form>
      </LoginCard>
    </div>
  );
}

export default ResetPassword;