import React, { useState } from 'react';
import { Form, InputGroup } from 'react-bootstrap';
import api from '../api/client';
import useToastService from '../hooks/useToastService';
import '../Pages/Auth.css';
import AuthShell from '../components/common/AuthShell';
import AuthField from '../components/common/AuthField';
import AuthSubmitButton from '../components/common/AuthSubmitButton';

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
    <AuthShell
      title="Student Register"
      subtitle="Create your account to access campus services."
      sideTitle="Start your campus journey"
      sideDescription="Register once and unlock student workflows with secure access."
    >
      <Form onSubmit={onFinish}>
        <AuthField id="studentId" label="Student ID" type="text" value={studentId} onChange={(e) => setStudentId(e.target.value)} required />
        <AuthField id="fullName" label="Full Name" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        <AuthField id="email" label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <AuthField
          id="department"
          label="Department"
          as="select"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          required
          options={[
            { value: '', label: 'Select Department' },
            { value: 'ct', label: 'CT' },
            { value: 'mech-a', label: 'Mechanical-A' },
            { value: 'mech-b', label: 'Mechanical-B' },
            { value: 'eee', label: 'Electrical' },
            { value: 'ce', label: 'Civil' },
            { value: 'fs', label: 'FS' },
            { value: 'auto', label: 'AUTOMOBILE' },
          ]}
        />
        <AuthField
          id="year"
          label="Year"
          as="select"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          required
          options={[
            { value: '', label: 'Select Year' },
            { value: '1', label: '1st Year' },
            { value: '2', label: '2nd Year' },
            { value: '3', label: '3rd Year' },
          ]}
        />
        <AuthField
          id="password"
          label="Password"
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
        >
          <InputGroup.Text onClick={togglePasswordVisibility} className="cursor-pointer">
            <i className={showPassword ? 'bx bx-hide' : 'bx bx-show'}></i>
          </InputGroup.Text>
        </AuthField>
        <AuthField
          id="confirmPassword"
          label="Confirm Password"
          type={showConfirmPassword ? 'text' : 'password'}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm Password"
          required
        >
          <InputGroup.Text onClick={toggleConfirmPasswordVisibility} className="cursor-pointer">
            <i className={showConfirmPassword ? 'bx bx-hide' : 'bx bx-show'}></i>
          </InputGroup.Text>
        </AuthField>
        <AuthSubmitButton loading={loading}>Register</AuthSubmitButton>
      </Form>
    </AuthShell>
  );
};

export default StudentRegister;
