import React from "react";
import { useState } from "react";
import "./Frontpage.css"
function Forgetpass() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = (e) => {
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

    // If valid
    setError("");
    setSuccess("✅ Password reset successful!");
    setNewPassword("");
    setConfirmPassword("");
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