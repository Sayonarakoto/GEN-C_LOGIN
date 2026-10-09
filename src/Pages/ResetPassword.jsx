import React, { useState, useEffect, useCallback } from "react";
import api from '../api/client';
import { Form, Button, Alert, Spinner, InputGroup, Badge } from 'react-bootstrap';

import { useParams, useNavigate } from 'react-router-dom';
import useToastService from '../hooks/useToastService';
import '../Pages/Auth.css';

function ResetPassword() {
  const { token } = useParams(); // The OTP travels in the reset link
  const navigate = useNavigate();
  const toast = useToastService();

  const [otpStatus, setOtpStatus] = useState('checking'); // checking | valid | invalid
  const [linkMessage, setLinkMessage] = useState('');
  const [copied, setCopied] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Auto-verify the code from the link; the form only appears when it is valid
  const verifyOtp = useCallback(async () => {
    if (!token) {
      setOtpStatus('invalid');
      setLinkMessage('❌ This reset link is missing its code. Please request a new one.');
      return;
    }
    setOtpStatus('checking');
    try {
      await api.post('/auth/verify-reset-otp', { otp: token });
      setOtpStatus('valid');
      setLinkMessage('');
    } catch (err) {
      setOtpStatus('invalid');
      setLinkMessage(err.response?.data?.message || '❌ This reset code is invalid or has expired.');
    }
  }, [token]);

  useEffect(() => {
    verifyOtp();
  }, [verifyOtp]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy the code. Please select and copy it manually.');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      toast.error("Password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      toast.error("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/reset-password', {
        otp: token,
        newPassword,
      });

      setError("");
      setSuccess(response.data.message || "✅ Password reset successful!");
      toast.success(response.data.message || "Password reset successful!");
      setTimeout(() => navigate('/'), 3000);
    } catch (err) {
      const errorMessage = err.response?.data?.message || "❌ Error resetting password.";
      setError(errorMessage);
      setSuccess("");
      toast.error(errorMessage);
      // A used/expired code on submit means the link is dead now
      if (['OTP_INVALID', 'OTP_EXPIRED', 'OTP_ATTEMPTS_EXCEEDED'].includes(err.response?.data?.code)) {
        setOtpStatus('invalid');
        setLinkMessage(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-container">
        <h1 style={{ textAlign: 'center', color: 'var(--text-dark)' }}>Reset Password</h1>

        {otpStatus === 'checking' && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spinner animation="border" />
            <p style={{ marginTop: 16, color: 'var(--text-light)' }}>Checking your code…</p>
          </div>
        )}

        {otpStatus === 'invalid' && (
          <>
            <Alert variant="danger" className="mb-3">{linkMessage}</Alert>
            <Button variant="primary" className="w-100" size="lg" onClick={() => navigate('/forgot-password')}>
              Request a new code
            </Button>
          </>
        )}

        {otpStatus === 'valid' && (
          <>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <p style={{ color: 'var(--text-light)', marginBottom: '8px' }}>Your reset code</p>
              <div className="d-inline-flex align-items-center gap-2">
                <Badge bg="light" text="dark" style={{ fontSize: '1.5rem', letterSpacing: '8px', padding: '10px 16px', border: '1px solid #ccc' }}>
                  {token}
                </Badge>
                <Button variant="outline-secondary" size="sm" onClick={handleCopy}>
                  {copied ? 'Copied!' : 'Copy'}
                </Button>
              </div>
            </div>

            <p style={{ textAlign: 'center', display: 'block', marginBottom: '24px', color: 'var(--text-light)' }}>
              Enter your new password below. It must be at least 6 characters long.
            </p>

            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3" controlId="formNewPassword">
                <Form.Label>New Password</Form.Label>
                <InputGroup>
                  <Form.Control
                    type={showNewPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                  <InputGroup.Text onClick={() => setShowNewPassword(!showNewPassword)} className="input-toggle">
                    <i className={showNewPassword ? "bx bx-hide" : "bx bx-show"}></i>
                  </InputGroup.Text>
                </InputGroup>
              </Form.Group>

              <Form.Group className="mb-3" controlId="formConfirmPassword">
                <Form.Label>Confirm New Password</Form.Label>
                <InputGroup>
                  <Form.Control
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <InputGroup.Text onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="input-toggle">
                    <i className={showConfirmPassword ? "bx bx-hide" : "bx bx-show"}></i>
                  </InputGroup.Text>
                </InputGroup>
              </Form.Group>

              {error && <Alert variant="danger" className="mb-3">{error}</Alert>}
              {success && <Alert variant="success" className="mb-3">{success}</Alert>}

              <Button
                variant="primary"
                type="submit"
                className="w-100"
                disabled={loading || !newPassword || !confirmPassword}
              >
                {loading ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" /> Resetting...
                  </>
                ) : (
                  'Reset Password'
                )}
              </Button>
            </Form>
          </>
        )}
      </div>
    </div>
  );
}

export default ResetPassword;
