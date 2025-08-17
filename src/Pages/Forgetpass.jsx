import React from "react";
import "./Frontpage.css"
function Forgetpass() {
  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1 className="auth-title">Forgot Password</h1>
        <p className="auth-sub">Please enter your new password below.</p>

        <form className="auth-form">
          <input
            type="password"
            id="newPassword"
            placeholder="Enter new password"
            required
          />

          <input
            type="password"
            id="confirmPassword"
            placeholder="Confirm new password"
            required
          />

          <button type="submit" className="btn reset-btn">
            Reset Password
          </button>
        </form>
      </div>
    </div>
  );
}

export default Forgetpass;
