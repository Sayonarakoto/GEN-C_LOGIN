import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../api/client';
import { Eye, EyeSlash } from 'react-bootstrap-icons';
import { Form, InputGroup } from 'react-bootstrap';
import AuthShell from '../components/common/AuthShell';
import AuthField from '../components/common/AuthField';
import AuthSubmitButton from '../components/common/AuthSubmitButton';
import './FacultyLogin.css';

const FacultyLogin = () => {
  const [loading, setLoading] = useState(false);
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState('idle');
  const navigate = useNavigate();
  const { login } = useAuth();

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const handleLoginSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setStatus('processing');
    try {
      const response = await api.post('/auth/login', {
        role: 'faculty',
        employeeId,
        password,
      }, {
        headers: { 'X-Skip-Interceptor': true }
      });
      
      const { token, user } = response.data;
      if (!token) throw new Error('No token received');
      
      login(token, user);
      setStatus('completed');
      
      setTimeout(() => {
        const finalRole = user.designation.toUpperCase();
        navigate(finalRole === 'HOD' || finalRole === 'FACULTY' ? '/faculty/' : '/');
      }, 900);
    } catch (error) {
      console.error('Login error:', error);
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Faculty Access"
      subtitle="Sign in to manage your academic department."
      sideTitle="Manage your department"
      sideDescription="Streamline workflows, manage gate passes, and monitor academic progress."
    >
      <div className="task-badge">
        <span className={`status-dot ${status}`} />
        <span>
          {status === 'idle' && 'Awaiting input'}
          {status === 'processing' && 'Processing credentials'}
          {status === 'completed' && 'Access granted'}
          {status === 'error' && 'Authentication failed'}
        </span>
      </div>

      <Form onSubmit={handleLoginSubmit} className="space-y-5">
        <AuthField
          id="employeeId"
          label="Employee ID"
          type="text"
          value={employeeId}
          onChange={(e) => setEmployeeId(e.target.value)}
          placeholder="Enter your employee ID"
          required
          inputClassName="glass-input w-full"
        />

        <AuthField
          id="password"
          label="Password"
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          inputClassName="glass-input w-full pr-14"
        >
          <InputGroup.Text onClick={togglePasswordVisibility} className="eye-icon">
            {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
          </InputGroup.Text>
        </AuthField>

        <div className="flex items-center justify-between text-sm">
          <Link to="/forgot-password" className="forgot-link">Forgot Password?</Link>
        </div>

        <AuthSubmitButton loading={loading}>{loading ? 'Signing In...' : 'Sign In'}</AuthSubmitButton>
      </Form>
    </AuthShell>
  );
};

export default FacultyLogin;
