import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../api/client';

import { Button } from 'react-bootstrap';
import { Eye, EyeSlash } from 'react-bootstrap-icons';
import './StudentLogin.css'; // Enhanced CSS below

const StudentLogin = () => {
  
  const [loading, setLoading] = useState(false);
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [btnText, setBtnText] = useState('Sign In');
  const [btnStyle, setBtnStyle] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const onFinish = async (event) => {
    event.preventDefault();
    setLoading(true);
    setBtnText('Signing In...');
    setBtnStyle('bg-gradient-to-r from-green-500 to-emerald-600 shadow-lg transform hover:-translate-y-1');
    

    try {
      const response = await api.post('/api/auth/login', {
        role: 'student',
        studentId,
        password,
      }, {
        headers: { 'X-Skip-Interceptor': true }
      });

      const { token } = response.data;
      if (!token) {
        throw new Error('No token received from server');
      }

      login(token);
      setBtnText('✓ Success!');
      setBtnStyle('bg-gradient-to-r from-emerald-500 to-teal-600 ring-4 ring-emerald-200 shadow-2xl');
      

      setTimeout(() => {
        navigate('/student');
      }, 1500);
    } catch (error) {
      console.error('Login error:', error);
      
      setBtnText('Sign In');
      setBtnStyle('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Left Section - Enhanced Login Card */}
      <div className="w-full md:w-2/5 flex items-center justify-center p-8 md:p-12 login-card">
        <div className="w-full max-w-md">
          {/* Enhanced Header */}
          <div className="mb-8 text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-2xl ring-4 ring-indigo-200/50">
                
              
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-3 drop-shadow-lg">
              Student Login
            </h1>
            <p className="text-xl font-medium text-gray-600 bg-gradient-to-r from-gray-500 to-gray-400 bg-clip-text">
              Welcome back, Student
            </p>
          </div>

          {/* Enhanced Form */}
          <form onSubmit={onFinish} className="space-y-6">
            {/* Student ID - Enhanced Input */}
            <div>
              <label 
                className="block text-sm font-semibold text-gray-700 mb-3 tracking-wide" 
                htmlFor="studentId"
              >
                Student ID
              </label>
              <div className="relative group">
                <input
                  id="studentId"
                  type="text"
                  className="input-field w-full px-5 py-4 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/20 transition-all duration-300 peer"
                  placeholder="Enter your student ID"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  required
                />
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500/5 to-purple-500/5 -z-10 scale-95 group-hover:scale-100 transition-all duration-300 opacity-0 group-hover:opacity-100" />
              </div>
            </div>

            {/* Password - Enhanced Input */}
            <div>
              <label 
                className="block text-sm font-semibold text-gray-700 mb-3 tracking-wide" 
                htmlFor="password"
              >
                Password
              </label>
              <div className="relative password-input-container group">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="input-field w-full px-5 py-4 rounded-xl focus:outline-none pr-14 peer transition-all duration-300"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="eye-icon absolute right-4 top-11 z-10 p-1 hover:bg-white/50 rounded-full transition-all duration-200 hover:scale-110"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
                </button>
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 -z-10 scale-95 group-hover:scale-100 transition-all duration-300 opacity-0 group-hover:opacity-100" />
              </div>
            </div>

            {/* Enhanced Remember & Forgot */}
            <div className="flex items-center justify-between text-sm links">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="checkbox-custom w-6 h-6 shadow-sm"></div>
                <span className="text-gray-600 font-medium group-hover:text-gray-800 transition-colors">Remember me</span>
              </label>
              <Link 
                to="/forgot-password" 
                className="link-hover font-semibold bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent hover:scale-105 transition-all duration-200"
              >
                Forgot Password?
              </Link>
            </div>

            {/* Premium Login Button */}
            <button
              type="submit"
              disabled={loading}
              className={`btn-login w-full py-4 rounded-2xl text-white font-black text-lg shadow-2xl transition-all duration-300 overflow-hidden relative ${
                loading 
                  ? 'opacity-70 cursor-not-allowed' 
                  : 'hover:-translate-y-2 hover:shadow-3xl active:translate-y-0 active:shadow-xl'
              } ${btnStyle}`}
            >
              <span className="relative z-10">{btnText}</span>
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-500 opacity-0 hover:opacity-20 transition-opacity duration-300 -z-10" />
            </button>
          </form>

          {/* Enhanced Divider */}

        </div>
      </div>

      {/* Right Section - Premium Illustration */}
      <div className="hidden md:flex w-3/5 bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 items-center justify-center p-12 relative overflow-hidden illustration-section">
        {/* Enhanced Background Elements */}
        <div 
          className="absolute top-12 right-12 w-48 h-48 bg-gradient-to-br from-purple-300 to-pink-300 rounded-3xl mix-blend-multiply filter blur-3xl opacity-30 floating-element glow-effect" 
          style={{ animationDelay: '0s' }}
        />
        <div 
          className="absolute bottom-12 left-12 w-48 h-48 bg-gradient-to-br from-indigo-300 to-blue-300 rounded-3xl mix-blend-multiply filter blur-3xl opacity-30 floating-element glow-effect" 
          style={{ animationDelay: '1s' }}
        />

        {/* Premium Illustration Area */}
        <div className="relative z-20 w-full h-96 flex items-center justify-center">
          <div className="text-center">
            <div className="w-32 h-32 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-3xl flex items-center justify-center shadow-2xl mx-auto mb-8 hologram">
              <svg className="w-20 h-20 text-white drop-shadow-2xl" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7v10c0 2.21 1.79 4 4 4h12c2.21 0 4-1.79 4-4V7L12 2zM12 15l-4-4h8l-4 4z"/>
              </svg>
            </div>
            <h3 className="text-3xl font-black text-white mb-4">
              GEN C
            </h3>
            <p className="text-xl text-white font-semibold max-w-md mx-auto leading-relaxed">
              Access your academic dashboard, library passes, and campus resources instantly
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentLogin;
