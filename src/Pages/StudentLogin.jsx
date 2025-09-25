import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../api/client'; // Import api client
import LoginCard from '../components/common/LoginCard';
import { Form, Button,  } from 'react-bootstrap'; // Import Bootstrap components
import useToastService from '../hooks/useToastService'; // Import ToastService

const StudentLogin = () => {
  const toast = useToastService(); // Initialize toast service
  const [loading, setLoading] = useState(false);
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const onFinish = async (event) => {
    event.preventDefault(); // Prevent default form submission
    setLoading(true);
    toast.info('Logging in...'); // Show info toast
    try {
      const response = await api.post('/auth/login', {
        role: 'student',
        studentId: studentId,
        password: password,
      });

      const { token } = response.data;

      if (!token) {
        throw new Error('No token received from server');
      }

      login(token);
      toast.success(response.data.message || 'Login successful!');
      navigate('/student');
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.response?.data?.msg || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <LoginCard>
        <h2 style={{ textAlign: 'center', marginBottom: '40px', color: 'var(--text-dark)' }}>Sign in</h2>
        <Form onSubmit={onFinish}>
          <Form.Group className="mb-3" controlId="formStudentId">
            <Form.Label>Student ID</Form.Label>
            <Form.Control
              type="text"
              placeholder="Student ID"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="formPassword">
            <Form.Label>Password</Form.Label>
            <Form.Control
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </Form.Group>

          <div className="links">
            <Link to="/forgot-password" style={{ color: 'var(--text-light)' }}>Forgot Password</Link>
          </div>
          <div style={{ marginTop: '30px' }}>
            <Button variant="primary" type="submit" disabled={loading} className="w-100">
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </div>
        </Form>
      </LoginCard>
    </div>
  );
};

export default StudentLogin;
