import React, { useState } from "react";
import api from "../api/client";
import { Form, Alert } from "react-bootstrap";
import useToastService from '../hooks/useToastService';
import '../Pages/Auth.css';
import AuthShell from '../components/common/AuthShell';
import AuthField from '../components/common/AuthField';
import AuthSubmitButton from '../components/common/AuthSubmitButton';

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
      await api.post('/forgot-password', {
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
    <AuthShell
      title="Forgot Password?"
      subtitle="Enter your email and we’ll send you a link to reset your password."
      sideTitle="Recover your access"
      sideDescription="Reset your password securely and return to your campus workspace."
    >
      {!submitted ? (
        <Form onSubmit={handleSubmit}>
          <AuthField
            id="formEmail"
            label="Email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <AuthSubmitButton loading={loading} disabled={!email}>
            Send Reset Link
          </AuthSubmitButton>
        </Form>
      ) : (
        <>
          <Alert variant="success" className="mb-3">
            ✅ Check your email: If an account with this email exists, you’ll receive a password reset link shortly.
          </Alert>
          <AuthSubmitButton loading={loading} className="mt-4" onClick={handleResendEmail}>
            Resend Email
          </AuthSubmitButton>
        </>
      )}
    </AuthShell>
  );
};

export default ForgotPassword;