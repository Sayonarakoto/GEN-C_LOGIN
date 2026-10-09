import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import { Form, Button, Spinner, Alert } from "react-bootstrap"; // Import Bootstrap components

import useToastService from '../hooks/useToastService'; // Import ToastService
import '../Pages/Auth.css'; // Import Auth.css

// 'faculty' covers HODs too - they log in from the Faculty table.
const ROLE_OPTIONS = [
  { value: 'student', label: 'Student' },
  { value: 'faculty', label: 'Faculty / HOD' },
  { value: 'librarian', label: 'Librarian' },
  { value: 'admin', label: 'Admin' },
];

const ForgotPassword = () => {
  const toast = useToastService(); // Initialize toast service
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('student');
  const [devOtp, setDevOtp] = useState('');

  const sendResetLink = async (emailToSend) => {
    if (!isValidEmail(emailToSend)) {
      toast.error("Please enter a valid email!");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/forgot-password', {
        email: emailToSend,
        role,
      });
      setSubmitted(true);
      // Non-production responses include the code so you can test without an inbox
      if (response.data?.otp) setDevOtp(response.data.otp);
      toast.success("✅ If that email is registered, a reset code is on its way!");
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
          Choose your account type, enter your email and we'll send you a reset code and a link to reset your password.
        </p>

        {!submitted ? (
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="formRole">
              <Form.Label>I am a</Form.Label>
              <Form.Select
                size="lg"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                disabled={loading}
              >
                {ROLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </Form.Select>
            </Form.Group>

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
              ✅ Check your email: if an account with this email exists, you'll receive a reset code and link shortly.
            </Alert>
            {devOtp && (
              <Alert variant="warning" className="mb-3">
                <strong>Test mode</strong> - your code is{' '}
                <span style={{ letterSpacing: '4px', fontWeight: 700 }}>{devOtp}</span>
                <div className="mt-2">
                  <Button size="sm" variant="dark" onClick={() => navigate(`/reset-password/${devOtp}`)}>
                    Open reset page
                  </Button>
                </div>
              </Alert>
            )}
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