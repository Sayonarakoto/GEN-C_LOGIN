import React, { useState } from 'react';
import { Form, Button, InputGroup } from 'react-bootstrap';
import api from '../api/client';
import useToastService from '../hooks/useToastService';
import '../Pages/Auth.css';

const StudentRegister = () => {
  const toast = useToastService();
  const [loading, setLoading] = useState(false);
  const [studentId, setStudentId] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('');
  const [year, setYear] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const onFinish = async (event) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }

    try {
      setLoading(true);
      const response = await api.post('/auth/register/student', {
        studentId,
        fullName,
        email,
        department,
        year,
        password
      });

      if (response.data.success) {
        toast.success('Registration successful!');
      } else {
        throw new Error(response.data.message || 'Registration failed');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-container">
        <h2 className="text-center mb-4">Student Register</h2>
        <Form onSubmit={onFinish}>
          <Form.Group className="mb-3">
            <Form.Label>Student ID</Form.Label>
            <Form.Control type="text" value={studentId} onChange={(e) => setStudentId(e.target.value)} required />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Full Name</Form.Label>
            <Form.Control type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Department</Form.Label>
            <Form.Control type="text" value={department} onChange={(e) => setDepartment(e.target.value)} required />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Year</Form.Label>
            <Form.Control type="text" value={year} onChange={(e) => setYear(e.target.value)} required />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Password</Form.Label>
            <InputGroup>
              <Form.Control
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <InputGroup.Text onClick={togglePasswordVisibility} className="cursor-pointer">
                <i className={showPassword ? "bx bx-hide" : "bx bx-show"}></i>
              </InputGroup.Text>
            </InputGroup>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Confirm Password</Form.Label>
            <InputGroup>
              <Form.Control
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <InputGroup.Text onClick={toggleConfirmPasswordVisibility} className="cursor-pointer">
                <i className={showConfirmPassword ? "bx bx-hide" : "bx bx-show"}></i>
              </InputGroup.Text>
            </InputGroup>
          </Form.Group>
          <Button variant="primary" type="submit" className="w-100" disabled={loading}>
            {loading ? 'Registering...' : 'Register'}
          </Button>
        </Form>
      </div>
    </div>
  );
};

export default StudentRegister;
