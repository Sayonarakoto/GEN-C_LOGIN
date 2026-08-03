import React, { useState, useEffect } from "react";
import api from '../api/client';
import { Form, Alert, InputGroup } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import useToastService from '../hooks/useToastService';
import '../Pages/Auth.css';
import AuthShell from '../components/common/AuthShell';
import AuthField from '../components/common/AuthField';
import AuthSubmitButton from '../components/common/AuthSubmitButton';

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
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const toggleNewPasswordVisibility = () => {
    setShowNewPassword(!showNewPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

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
      const response = await api.post(`/reset-password/${encodeURIComponent(token)}`, {
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
    <AuthShell
      title="Reset Password"
      subtitle="Please enter your new password below. Password must be at least 6 characters long."
      sideTitle="Secure your account"
      sideDescription="Choose a strong new password to keep your campus account protected."
    >
      <Form onSubmit={handleSubmit}>
        <AuthField
          id="formNewPassword"
          label="New Password"
          type={showNewPassword ? 'text' : 'password'}
          placeholder="Enter new password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        >
          <InputGroup.Text onClick={toggleNewPasswordVisibility} className="cursor-pointer">
            <i className={showNewPassword ? 'bx bx-hide' : 'bx bx-show'}></i>
          </InputGroup.Text>
        </AuthField>

        <AuthField
          id="formConfirmPassword"
          label="Confirm New Password"
          type={showConfirmPassword ? 'text' : 'password'}
          placeholder="Confirm new password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        >
          <InputGroup.Text onClick={toggleConfirmPasswordVisibility} className="cursor-pointer">
            <i className={showConfirmPassword ? 'bx bx-hide' : 'bx bx-show'}></i>
          </InputGroup.Text>
        </AuthField>

        {error && <Alert variant="danger" className="mb-3">{error}</Alert>}
        {success && <Alert variant="success" className="mb-3">{success}</Alert>}

        <AuthSubmitButton loading={loading} disabled={!newPassword || !confirmPassword}>
          Reset Password
        </AuthSubmitButton>
      </Form>
    </AuthShell>
  );
}

export default ResetPassword;
