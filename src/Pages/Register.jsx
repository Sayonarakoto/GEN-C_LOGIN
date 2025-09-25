import React, { useState } from 'react';
import { Form, Button } from 'react-bootstrap'; // Import Bootstrap components
import api from '../api/client';
import LoginCard from '../components/common/LoginCard';
import useToastService from '../hooks/useToastService'; // Import ToastService
const Register = () => {
  const toast = useToastService(); // Initialize toast service
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [department, setDepartment] = useState('');
  const [designation, setDesignation] = useState('');
  const [profilePhoto, setProfilePhoto] = useState(null);

  const onFinish = async (event) => {
    event.preventDefault(); // Prevent default form submission
    try {
      // Password match check
      if (password !== confirmPassword) {
        toast.error("Passwords do not match!");
        return;
      }

      setLoading(true);

      const formData = new FormData();
      formData.append('fullName', fullName);
      formData.append('email', email);
      formData.append('employeeId', employeeId);
      formData.append('department', department);
      formData.append('designation', designation);
      formData.append('password', password);

      // Check file size before upload
      if (profilePhoto) {
        const file = profilePhoto;
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
          throw new Error('Profile photo must be smaller than 5MB');
        }
        formData.append('profilePhoto', file);
      }

      const response = await api.post('/api/register', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        toast.success('Registration successful!');
        // Optional: Clear form or redirect
      } else {
        throw new Error(response.data.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      const errorMessage = 
        error.response?.data?.message || 
        error.message || 
        'Registration failed! Please try again.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Profile photo must be smaller than 5MB!');
        setProfilePhoto(null);
        return;
      }
      if (!['image/jpeg', 'image/png'].includes(file.type)) {
        toast.error('Only JPG/PNG files are allowed!');
        setProfilePhoto(null);
        return;
      }
      setProfilePhoto(file);
    } else {
      setProfilePhoto(null);
    }
  };

  return (
    <div className="login-container">
      <LoginCard>
        <h2 style={{ textAlign: 'center', marginBottom: '24px', color: 'var(--text-dark)' }}>Register</h2>
        <Form onSubmit={onFinish}>
          <Form.Group className="mb-3" controlId="formFullName">
            <Form.Label>Full Name</Form.Label>
            <Form.Control
              type="text"
              placeholder="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="formEmail">
            <Form.Label>Email Address</Form.Label>
            <Form.Control
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="formEmployeeId">
            <Form.Label>Faculty ID</Form.Label>
            <Form.Control
              type="text"
              placeholder="Faculty ID"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
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

          <Form.Group className="mb-3" controlId="formConfirmPassword">
            <Form.Label>Confirm Password</Form.Label>
            <Form.Control
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="formDepartment">
            <Form.Label>Department</Form.Label>
            <Form.Select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              required
            >
              <option value="">Select Department</option>
              <option value="ct">CT</option>
              <option value="mech-a">Mechanical-A</option>
              <option value="mech-b">Mechanical-B</option>
              <option value="eee">Electrical</option>
              <option value="ce">Civil</option>
              <option value="fs">FS</option>
              <option value="auto">AUTOMOBILE</option>
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3" controlId="formDesignation">
            <Form.Label>Designation/Role</Form.Label>
            <Form.Select
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              required
            >
              <option value="">Select Role</option>
              <option value="hod">HOD</option>
              <option value="faculty">FACULTY</option>
            </Form.Select>
          </Form.Group>

          <Form.Group controlId="formProfilePhoto" className="mb-3">
            <Form.Label>Profile Photo</Form.Label>
            <Form.Control
              type="file"
              accept=".jpg,.jpeg,.png"
              onChange={handleFileChange}
            />
            {profilePhoto && <div className="mt-2">Selected file: {profilePhoto.name}</div>}
          </Form.Group>

          <Button variant="primary" type="submit" className="w-100" disabled={loading}>
            {loading ? 'Registering...' : 'Register'}
          </Button>
        </Form>
      </LoginCard>
    </div>
  );
};

export default Register;
