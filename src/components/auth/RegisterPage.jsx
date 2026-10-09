import React, { useState } from 'react';
import { Form, Button, InputGroup } from 'react-bootstrap';
import api from '../../api/client';
import useToastService from '../../hooks/useToastService';
import '../../Pages/Auth.css';

const RegisterPage = ({ config }) => {
  const toast = useToastService();
  const [loading, setLoading] = useState(false);
  const [values, setValues] = useState(() => {
    const initial = {};
    config.fields.forEach((f) => { initial[f.name] = ''; });
    if (config.file) initial[config.file.name] = null;
    return initial;
  });
  const [revealed, setRevealed] = useState({});

  const setValue = (name, value) => setValues((prev) => ({ ...prev, [name]: value }));
  const toggleReveal = (name) => setRevealed((prev) => ({ ...prev, [name]: !prev[name] }));

  const handleFileChange = (field, file) => {
    if (!file) {
      setValue(field.name, null);
      return;
    }
    if (field.maxSizeMB && file.size > field.maxSizeMB * 1024 * 1024) {
      toast.warning(field.sizeError || `${field.label} must be smaller than ${field.maxSizeMB}MB!`);
      return;
    }
    if (field.mimeTypes && !field.mimeTypes.includes(file.type)) {
      toast.warning(field.typeError || 'Invalid file type!');
      return;
    }
    setValue(field.name, file);
  };

  const validate = () => {
    for (const field of config.fields) {
      const value = values[field.name] ?? '';
      if (field.required !== false && !String(value).trim()) {
        return `${field.label} is required.`;
      }
      if (field.validate) {
        const message = field.validate(value, values);
        if (message) return message;
      }
      if (field.matchWith && value !== values[field.matchWith]) {
        return 'Passwords do not match!';
      }
    }
    if (config.validate) {
      const message = config.validate(values);
      if (message) return message;
    }
    return null;
  };

  const onFinish = async (event) => {
    event.preventDefault();

    const validationError = validate();
    if (validationError) {
      toast.warning(validationError);
      return;
    }

    try {
      setLoading(true);

      const payload = {};
      config.fields.forEach((f) => {
        if (!f.matchWith) payload[f.name] = values[f.name];
      });

      if (config.file) {
        const field = config.file;
        const file = values[field.name];
        let fileUrl = null;

        if (file) {
          if (field.maxSizeMB && file.size > field.maxSizeMB * 1024 * 1024) {
            throw new Error(field.sizeError || `${field.label} must be smaller than ${field.maxSizeMB}MB!`);
          }

          const formData = new FormData();
          formData.append('image', file);

          const uploadResponse = await api.post('/blob/profile-picture-upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });

          if (uploadResponse.data?.url) {
            fileUrl = uploadResponse.data.url;
          } else {
            throw new Error(`Failed to upload ${field.label.toLowerCase()}`);
          }
        }

        payload[field.name] = fileUrl;
      }

      const response = await api.post(config.endpoint, payload);

      if (response.data.success) {
        toast.success(config.successMessage || 'Registration successful!');
      } else {
        throw new Error(response.data.message || 'Registration failed');
      }
    } catch (error) {
      if (error.response) {
        toast.error(error.response.data?.message || 'Registration failed! Please try again.');
      } else {
        toast.warning(
          error.message || config.errorMessage || 'Registration failed! Please try again.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const renderField = (field) => {
    const value = values[field.name] ?? '';

    if (field.type === 'select') {
      return (
        <Form.Group className="mb-3" key={field.name}>
          <Form.Label>{field.label}</Form.Label>
          <Form.Select
            value={value}
            onChange={(e) => setValue(field.name, e.target.value)}
            required={field.required !== false}
          >
            <option value="">{field.placeholder || `Select ${field.label}`}</option>
            {(field.options || []).map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </Form.Select>
        </Form.Group>
      );
    }

    const isPassword = field.type === 'password';
    const input = (
      <Form.Control
        type={isPassword && revealed[field.name] ? 'text' : field.type}
        placeholder={field.placeholder}
        value={value}
        maxLength={field.maxLength}
        onChange={(e) => setValue(field.name, e.target.value)}
        required={field.required !== false}
      />
    );

    return (
      <Form.Group className="mb-3" key={field.name}>
        <Form.Label>{field.label}</Form.Label>
        {isPassword ? (
          <InputGroup>
            {input}
            <InputGroup.Text onClick={() => toggleReveal(field.name)} className="input-toggle">
              <i className={revealed[field.name] ? 'bx bx-hide' : 'bx bx-show'} />
            </InputGroup.Text>
          </InputGroup>
        ) : input}
      </Form.Group>
    );
  };

  return (
    <div className="auth-page-wrapper">
      <div
        className="auth-container"
        style={config.narrow ? { maxWidth: '400px', width: '90%' } : undefined}
      >
        <h2 className="text-center mb-4">{config.title}</h2>

        <Form onSubmit={onFinish}>
          {config.fields.map(renderField)}

          {config.file && (
            <Form.Group className="mb-3">
              <Form.Label>{config.file.label}</Form.Label>
              <Form.Control
                type="file"
                accept={config.file.accept}
                onChange={(e) => handleFileChange(config.file, e.target.files[0] || null)}
              />
              {values[config.file.name] && (
                <div className="mt-2">Selected file: {values[config.file.name].name}</div>
              )}
            </Form.Group>
          )}

          <Button variant="primary" type="submit" className="w-100" disabled={loading}>
            {loading ? (config.loadingLabel || 'Registering...') : (config.submitLabel || 'Register')}
          </Button>
        </Form>
      </div>
    </div>
  );
};

export default RegisterPage;
