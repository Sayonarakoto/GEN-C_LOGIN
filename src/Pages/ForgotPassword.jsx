import React, { useState } from "react";
import api from "../api/client";
import { Form, Button, Spinner, Alert } from "react-bootstrap"; // Import Bootstrap components

import useToastService from '../hooks/useToastService'; // Import ToastService
import '../Pages/Auth.css'; // Import Auth.css

const ForgotPassword = () => {
  const toast = useToastService(); // Initialize toast service
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [email, setEmail] = useState('');

  const sendResetLink = async (emailToSend) => {
    if (!isValidEmail(emailToSend)) {
      toast.error("Please enter a valid email!");
      return;
    }

    setLoading(true);
    try {
      await api.post('/api/forgot-password', {
        email: emailToSend,
      });
      setSubmitted(true);
      toast.success("✅ A new password reset email has been sent!");
    } catch (err) {
      console.error(err);
      const errorMessage = err.response?.data?.message || "❌ Something went wrong. Please try again later.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault(); // Prevent default form submission
    await sendResetLink(email);
  };

  const handleResendEmail = async () => {
    await sendResetLink(email);
  };

  // Basic email regex
  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  return (
    <div className="auth-page-wrapper">
      <div className="auth-container">
        <h3 style={{ textAlign: 'center', marginBottom: '16px', color: 'var(--text-dark)' }}>
          Forgot Password?
        </h3>
        <p style={{ display: 'block', textAlign: 'center', marginBottom: '24px', color: 'var(--text-light)' }}>
          Enter your email and we’ll send you a link to reset your password.
        </p>

        {!submitted ? (
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="formEmail">
              <Form.Control
                type="email"
                placeholder="Enter your email"
                size="lg"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </Form.Group>

            <Button
              variant="primary"
              type="submit"
              disabled={loading || !email}
              className="w-100"
              size="lg"
            >
              {loading ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" /> Sending...
                </>
              ) : (
                "Send Reset Link"
              )}
            </Button>
          </Form>
        ) : (
          <>
            <Alert
              variant="success"
              className="mb-3"
            >
              ✅ Check your email: If an account with this email exists, you’ll receive a password reset link shortly.
            </Alert>
            <Button
              style={{ marginTop: '24px' }}
              variant="secondary"
              onClick={handleResendEmail}
              disabled={loading}
              className="w-100"
              size="lg"
            >
              {loading ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" /> Resending...
                </>
              ) : (
                "Resend Email"
              )}
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;