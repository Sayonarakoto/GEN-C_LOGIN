import React, { useState, useEffect } from "react";
import "./Frontpage.css";
import axios from "axios";

function Forgetpass() {
  // State variables
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Use a useEffect hook to get the email and token from the URL
  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const emailFromUrl = queryParams.get("email");
    const tokenFromUrl = queryParams.get("token");

    if (emailFromUrl && tokenFromUrl) {
      setEmail(emailFromUrl);
      setToken(tokenFromUrl);
    } else {
      // Handle the case where the link is invalid or missing info
      setError("❌ Invalid or expired password reset link.");
    }
  }, []); // The empty array ensures this runs only once when the component mounts

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      setSuccess("");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      setSuccess("");
      return;
    }

    // Check if email and token are present before making the request
    if (!email || !token) {
        setError("❌ Invalid or missing email/token.");
        return;
    }
    
    // If validation passes, make the API call
    try {
      const response = await axios.post('http://localhost:3001/auth/forget', {
        email,
        token,
        newPassword
      });

      // Handle successful response
      setError("");
      setSuccess(response.data.message || "✅ Password reset successful!");
      
      // Clear the form fields
      setNewPassword("");
      setConfirmPassword("");
      
    } catch (err) {
      // Handle error response
      setError(err.response?.data?.message || "❌ Error resetting password.");
      setSuccess("");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1 className="auth-title">Forgot Password</h1>
        <p className="auth-sub">Please enter your new password below.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter new password"
            required
          />

          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            required
          />

          {error && <p className="error-msg">{error}</p>}
          {success && <p className="success-msg">{success}</p>}

          <button
            type="submit"
            className="btn reset-btn"
            disabled={!newPassword || !confirmPassword}
          >
            Reset Password
          </button>
        </form>
      </div>
    </div>
  );
}

export default Forgetpass;