import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Form, Button, InputGroup } from 'react-bootstrap'; // Import Bootstrap components
import useToastService from '../hooks/useToastService'; // Import ToastService
import api from '../api/client'; // Import API client
import '../Pages/Auth.css'; // Import Auth.css

const LibrarianRegister = () => {
    const navigate = useNavigate();
    const toast = useToastService(); // Initialize toast service
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        facultyId: '',
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '', // Added confirmPassword
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const toggleConfirmPasswordVisibility = () => {
        setShowConfirmPassword(!showConfirmPassword);
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Password match check
            if (formData.password !== formData.confirmPassword) {
                toast.error("Passwords do not match!");
                return;
            }

            setLoading(true);

            const response = await api.post('/auth/librarian-register', {
                facultyId: formData.facultyId,
                fullName: formData.fullName,
                email: formData.email,
                password: formData.password,
            });

            if (response.data.success) {
                toast.success('Registration successful!');
                navigate('/librarian-login');
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

    return (
        <div className="auth-page-wrapper">
            <div className="auth-container">
                <div className="auth-box">
                    <h2 className="auth-box">Librarian Register</h2>
                    <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-3" controlId="formFacultyId">
                            <Form.Label>Librarian ID</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Librarian ID"
                                name="facultyId"
                                value={formData.facultyId}
                                onChange={handleChange}
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-3" controlId="formFullName">
                            <Form.Label>Full Name</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Full Name"
                                name="fullName"
                                value={formData.fullName}
                                onChange={handleChange}
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-3" controlId="formEmail">
                            <Form.Label>Email Address</Form.Label>
                            <Form.Control
                                type="email"
                                placeholder="Email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-3" controlId="formPassword">
                            <Form.Label>Password</Form.Label>
                            <InputGroup>
                                <Form.Control
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                />
                                <InputGroup.Text onClick={togglePasswordVisibility} className="cursor-pointer">
                                    <i className={showPassword ? "bx bx-hide" : "bx bx-show"}></i>
                                </InputGroup.Text>
                            </InputGroup>
                        </Form.Group>

                        <Form.Group className="mb-3" controlId="formConfirmPassword">
                            <Form.Label>Confirm Password</Form.Label>
                            <InputGroup>
                                <Form.Control
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder="Confirm Password"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
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
        </div>
    );
};

export default LibrarianRegister;
