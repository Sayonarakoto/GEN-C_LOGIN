import React, { useState, useEffect } from "react";
import api from '../api/client';
import { Form, Button, Alert, Spinner } from 'react-bootstrap'; // Import Bootstrap components
import LoginCard from '../components/common/LoginCard';
import { useParams, useNavigate } from 'react-router-dom'; // Import useParams and useNavigate
import useToastService from '../hooks/useToastService'; // Import ToastService

function ResetPassword() { // Renamed from Forgetpass to ResetPassword
  const { token } = useParams(); // Get token from URL params
  const navigate = useNavigate(); // For navigation after reset
  const toast = useToastService(); // Initialize toast service

  // State variables
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false); // Added loading state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Use a useEffect hook to get the email and token from the URL (token is now from useParams)
  useEffect(() => {
    // No need to get email from URL here, as it's not used in this component's logic
    // The token is directly from useParams
    if (!token) {
      setError("❌ Invalid or expired password reset link.");
      toast.error("❌ Invalid or expired password reset link.");
    }
  }, [token, toast]); // Depend on token and toast

  const handleSubmit = async (event) => {
    event.preventDefault(); // Prevent default form submission

    // Basic validation
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

    // Check if token is present before making the request
    if (!token) {
        setError("❌ Invalid or missing token.");
        toast.error("❌ Invalid or missing token.");
        return;
    }

    setLoading(true); // Set loading to true
    // If validation passes, make the API call
    try {
      // Use the correct API endpoint for reset password
      const response = await api.post(`/api/reset-password/${encodeURIComponent(token)}`, {
        newPassword: newPassword
      });

      // Handle successful response
      setError("");
      setSuccess(response.data.message || "✅ Password reset successful!");
      toast.success(response.data.message || "Password reset successful!"); // Toast message
      // form.resetFields(); // This would be handled manually now
      setTimeout(() => {
        navigate('/'); // Redirect to home page after a delay
      }, 3000); // 3-second delay

    } catch (err) {
      // Handle error response
      const errorMessage = err.response?.data?.message || "❌ Error resetting password.";
      setError(errorMessage);
      setSuccess("");
      toast.error(errorMessage); // Toast message
    } finally {
      setLoading(false); // Set loading to false
    }
  };

  return (
    <div className="login-container">
      <LoginCard>
        <h1 style={{ textAlign: 'center', color: 'var(--text-dark)' }}>Reset Password</h1> {/* Changed title */}
        <p style={{ textAlign: 'center', display: 'block', marginBottom: '24px', color: 'var(--text-light)' }}>Please enter your new password below.</p>
        <p style={{ textAlign: 'center', display: 'block', marginBottom: '24px', color: 'var(--text-light)', fontSize: '0.85em' }}>Password must be at least 6 characters long.</p>

        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3" controlId="formNewPassword">
            <Form.Label>New Password</Form.Label>
            <Form.Control
              type="password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="formConfirmPassword">
            <Form.Label>Confirm New Password</Form.Label>
            <Form.Control
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </Form.Group>

          {error && (
            <Alert
              variant="danger"
              className="mb-3"
            >
              {error}
            </Alert>
          )}
          {success && (
            <Alert
              variant="success"
              className="mb-3"
            >
              {success}
            </Alert>
          )}

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
      </LoginCard>
    </div>
  );
}

export default ResetPassword;
