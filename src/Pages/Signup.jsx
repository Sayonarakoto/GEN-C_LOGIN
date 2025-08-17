import React from 'react';
import { Link } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useState } from 'react';
import './Frontpage.css'
import axios from 'axios'
function Signup() {
    const [uid, setuid] = useState()
    const [password, setpass] = useState()
    const handleSubmit = (e) => {
        e.preventDefault()
        axios.post('http://localhost:3001/signin', { uid, password })
            .then(result => console.log(result))
            .catch(err => console.log(err))
    }
    return (
        
    <div className="auth-container">
      <div className="auth-box">
        <h1 className="auth-title">Login</h1>
        <p className="auth-sub">Enter your credentials to continue</p>

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
            Login
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
