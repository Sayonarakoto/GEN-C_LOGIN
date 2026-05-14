import React, { useState } from 'react';
import { Form, Button, InputGroup } from 'react-bootstrap';
import api from '../api/client';
import useToastService from '../hooks/useToastService';
import '../Pages/Auth.css';

const SecurityRegister = () => {
  const toast = useToastService();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [securityId, setSecurityId] = useState('');
  const [passkey, setPasskey] = useState('');
  const [showPasskey, setShowPasskey] = useState(false);

  const togglePasskeyVisibility = () => {
    setShowPasskey(!showPasskey);
  };

  const onFinish = async (event) => {
    event.preventDefault();
    if (passkey.length !== 6 || isNaN(passkey)) {
      toast.error("Passkey must be exactly 6 digits!");
      return;
    }

    try {
      setLoading(true);
      const response = await api.post('/auth/register/security', {
        name,
        securityId,
        passkey
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
      <div className="auth-container" style={{ maxWidth: '400px', width: '90%' }}>
        <h2 className="text-center mb-4">Security Register</h2>
        <Form onSubmit={onFinish}>
          <Form.Group className="mb-3">
            <Form.Label>Name</Form.Label>
            <Form.Control type="text" value={name} onChange={(e) => setName(e.target.value)} required />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Security ID</Form.Label>
            <Form.Control type="text" value={securityId} onChange={(e) => setSecurityId(e.target.value)} required />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Passkey (6 digits)</Form.Label>
            <InputGroup>
              <Form.Control 
                type={showPasskey ? "text" : "password"} 
                value={passkey} 
                onChange={(e) => setPasskey(e.target.value)} 
                required 
                maxLength="6" 
              />
              <InputGroup.Text onClick={togglePasskeyVisibility} className="cursor-pointer">
                <i className={showPasskey ? "bx bx-hide" : "bx bx-show"}></i>
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

export default SecurityRegister;
