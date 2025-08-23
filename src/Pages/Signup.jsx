import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './Frontpage.css';
import axios from 'axios';

function Signup() {
  const [uid, setuid] = useState("");
  const [password, setpass] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    axios.post('http://localhost:3001/auth/signin', { uid, password })
      .then(result => {
        console.log(result.data);
        alert(result.data.message);
      })
      .catch(err => {
        console.error(err);
        alert("❌ Signup failed");
      });
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1 className="auth-title">Sign Up</h1>
        <p className="auth-sub">Create your account to continue</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <input
            type="text"
            placeholder="User ID"
            value={uid}
            onChange={(e) => setuid(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setpass(e.target.value)}
            required
          />

          <button type="submit" className="btn login-btn">
            Sign Up
          </button>
        </form>

        <p className="auth-sub">
          <Link to="/forget">Forgot Password?</Link>
        </p>
      </div>
    </div>
  );
}

export default Signup;
